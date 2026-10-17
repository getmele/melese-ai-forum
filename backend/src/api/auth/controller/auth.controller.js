import { StatusCodes } from "http-status-codes";
import {
  registerService,
  loginService,
  getCurrentUserService,
  requestPasswordResetService,
  resetPasswordService,
} from "../service/auth.service.js";

/**
 * Handles user registration requests.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const registerController = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const newUser = await registerService({
      firstName,
      lastName,
      email,
      password,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User registered successfully.",
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user login requests.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const authResult = await loginService({ email, password });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Login successful.",
      user: authResult.user,
      token: authResult.token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles "who am I" requests that refresh the session user from the DB.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const getCurrentUserController = async (req, res, next) => {
  try {
    const user = await getCurrentUserService(req.user.id);
    res.status(StatusCodes.OK).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles "forgot password" requests -- kicks off the reset-token +
 * email flow. Always responds with the same generic message, whether
 * or not the email is registered (prevents user-enumeration).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;
    await requestPasswordResetService(email);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles the final step: verifies the token and sets the new password.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const resetPasswordController = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await resetPasswordService({ token, newPassword });

    res.status(StatusCodes.OK).json({
      success: true,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};