import { apiClient } from "../core/api.client.js";

/**
 * Registers a new user.
 * @param {Object} userData - User details for registration.
 */
async function register(userData) {
  try {
    const response = await apiClient.post("/api/auth/register", userData);
    return { user: response.data.user };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs in an existing user and stores their session in localStorage.
 * @param {Object} credentials - User login credentials.
 */
async function login(credentials) {
  try {
    const response = await apiClient.post("/api/auth/login", credentials);
    const { user, token } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return { user, token };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs out the current user by clearing localStorage.
 */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

/**
 * Retrieves the stored JWT token from localStorage.
 */
function getStoredToken() {
  return localStorage.getItem("token");
}

/**
 * Retrieves the stored user object from localStorage.
 */
function getStoredUser() {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    // If JSON parsing fails, clear invalid data
    localStorage.removeItem("user");
    return null;
  }
}

/**
 * Checks if the user is currently authenticated based on local storage.
 */
function isAuthenticated() {
  return !!getStoredToken();
}

/**
 * Fetches the live user record from the backend and refreshes the stored
 * session. Used on app load so a promoted owner/admin gets their new role
 * (and admin powers) without having to log out and back in.
 * @returns {Promise<Object|null>} The fresh user object, or null when no
 *          session exists / the request fails.
 */
async function refreshMe() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await apiClient.get("/api/auth/me");
    const freshUser = response.data?.user;
    if (freshUser) {
      localStorage.setItem("user", JSON.stringify(freshUser));
    }
    return freshUser || null;
  } catch {
    return null;
  }
}

/**
 * Asks the backend to email a password-reset link.
 * The backend always answers with the same success message, whether or not
 * the email is registered, so the UI must not hint at which case happened.
 * @param {string} email - The email address entered on the forgot-password form.
 * @returns {Promise<string>} The generic confirmation message.
 */
async function forgotPassword(email) {
  try {
    const response = await apiClient.post("/api/auth/forgot-password", {
      email,
    });
    return (
      response.data?.message ||
      "If that email is registered, a reset link has been sent."
    );
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Completes a password reset using the token from the emailed link.
 * @param {Object} params
 * @param {string} params.token - Raw token from the `?token=` query param.
 * @param {string} params.newPassword - The new plain-text password.
 * @returns {Promise<string>} The success message from the backend.
 */
async function resetPassword({ token, newPassword }) {
  try {
    const response = await apiClient.post("/api/auth/reset-password", {
      token,
      newPassword,
    });
    return response.data?.message || "Password reset successful.";
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Centralized error handler for auth service requests.
 */
function handleAuthError(error) {
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return new Error("Request timed out. Please try again.");
    }
    return new Error(
      "Unable to connect to server. Please check your internet connection.",
    );
  }

  const status = error.response.status;
  const backendMessage =
    error.response.data?.msg || error.response.data?.message;

  switch (status) {
    case 400:
      return new Error(backendMessage || "Invalid input data.");
    case 401:
      return new Error(backendMessage || "Invalid email or password.");
    case 500:
      return new Error(
        "Something went wrong on our end. Please try again later.",
      );
    default:
      return new Error(backendMessage || "An unexpected error occurred.");
  }
}

/**
 * Service for handling auth-related requests.
 */
export const authService = {
  register,
  login,
  logout,
  getStoredToken,
  getStoredUser,
  isAuthenticated,
  refreshMe,
  forgotPassword,
  resetPassword,
};
