import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { safeExecute } from "../../../../db/config.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from "../../../utils/errors/index.js";
import {
  generateResetToken,
  hashResetToken,
} from "../../../utils/reset-token.js";
import { sendPasswordResetEmail } from "../../../utils/mailer.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const RESET_TOKEN_TTL_MINUTES = 30;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const normalizeEmail = (email) => email.trim().toLowerCase();

/**
 * Checks if a user exists by email.
 *
 * @param {string} email - The email to check.
 * @returns {Promise<boolean>} True if the user exists, false otherwise.
 */
export const checkUserExists = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const sql = "SELECT user_id FROM users WHERE email = ? LIMIT 1";
  const rows = await safeExecute(sql, [normalizedEmail]);
  return rows.length > 0;
};

/**
 * Registers a new user in the database.
 *
 * @param {Object} userData - The user data.
 * @param {string} userData.firstName - The first name.
 * @param {string} userData.lastName - The last name.
 * @param {string} userData.email - The email address.
 * @param {string} userData.password - The plain text password.
 * @returns {Promise<Object>} The created user object (without password).
 */
export const registerService = async ({
  firstName,
  lastName,
  email,
  password,
}) => {
  const normalizedEmail = normalizeEmail(email);
  const userExists = await checkUserExists(normalizedEmail);
  if (userExists) {
    throw new BadRequestError("User already exists with this email.");
  }

  // every time we call bcrypt.genSalt, it generates a new random salt string.
  const salt = await bcrypt.genSalt(10); // generates a unique random salt each call
  const hashedPassword = await bcrypt.hash(password, salt);
  const sql =
    "INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)";
  let result;
  try {
    result = await safeExecute(sql, [
      firstName,
      lastName,
      normalizedEmail,
      hashedPassword,
    ]);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      throw new BadRequestError("User already exists with this email.");
    }
    throw error;
  }

  return {
    id: result.insertId,
    firstName,
    lastName,
    email: normalizedEmail,
  };
};

/**
 * Authenticates a user and generates a JWT token.
 *
 * @param {Object} credentials - The login credentials.
 * @param {string} credentials.email - The user's email.
 * @param {string} credentials.password - The user's plain text password.
 * @returns {Promise<Object>} An object containing the user and token.
 * @throws {UnauthenticatedError} If authentication fails.
 */
export const loginService = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const sql =
    "SELECT user_id, first_name, last_name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1";
  const rows = await safeExecute(sql, [normalizedEmail]);

  if (rows.length === 0) {
    throw new UnauthenticatedError("Invalid email or password");
  }

  const user = rows[0];

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new UnauthenticatedError("Invalid email or password");
  }

  const payload = {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    user: {
      id: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Returns the current user's live record (fresh role/status from the DB)
 * so a promoted owner/admin does not need to log out to see their powers.
 *
 * @param {number} userId - The authenticated user's id.
 * @returns {Promise<Object>} The current user object (without password).
 * @throws {UnauthenticatedError} When the account no longer exists.
 */
export const getCurrentUserService = async (userId) => {
  const sql =
    "SELECT user_id, first_name, last_name, email, role, is_active FROM users WHERE user_id = ? LIMIT 1";
  const rows = await safeExecute(sql, [Number(userId)]);

  if (rows.length === 0) {
    throw new UnauthenticatedError("Account not found");
  }

  const user = rows[0];
  if (Number(user.is_active) !== 1) {
    throw new UnauthenticatedError(
      "Your account has been deactivated. Contact an administrator.",
    );
  }
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new UnauthenticatedError("Invalid email or password");
  }

  return {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
  };
};

/**
 * Starts a password reset. If the email belongs to a registered user,
 * generates a token, stores its hash + an expiry, and emails a reset
 * link. Resolves the same way whether or not the email exists, so
 * this endpoint can't be used to discover which emails are registered
 * on the forum (a common security requirement for this feature).
 *
 * @param {string} email
 * @returns {Promise<void>}
 */
export const requestPasswordResetService = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const sql = "SELECT user_id FROM users WHERE email = ? LIMIT 1";
  const rows = await safeExecute(sql, [normalizedEmail]);

  // Deliberately silent no-op if there's no matching user -- this is
  // what prevents the endpoint from leaking which emails have accounts.
  if (rows.length === 0) return;

  const { rawToken, tokenHash } = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await safeExecute(
    "UPDATE users SET reset_token_hash = ?, reset_token_expires = ? WHERE user_id = ?",
    [tokenHash, expiresAt, rows[0].user_id],
  );

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail({ to: normalizedEmail, resetUrl });
};

/**
 * Completes a password reset: verifies the token by comparing its hash
 * and checking expiry, sets the new password, and clears the token so
 * the same link can never be used twice.
 *
 * @param {Object} params
 * @param {string} params.token - the raw token from the emailed link
 * @param {string} params.newPassword
 * @returns {Promise<void>}
 * @throws {BadRequestError} If the token is invalid, already used, or expired.
 */
export const resetPasswordService = async ({ token, newPassword }) => {
  const tokenHash = hashResetToken(token);

  const sql =
    "SELECT user_id, reset_token_expires FROM users WHERE reset_token_hash = ? LIMIT 1";
  const rows = await safeExecute(sql, [tokenHash]);

  if (rows.length === 0) {
    throw new BadRequestError(
      "This reset link is invalid or has already been used.",
    );
  }

  const user = rows[0];
  const expiresAt = new Date(user.reset_token_expires);

  if (
    !user.reset_token_expires ||
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt <= new Date()
  ) {
    throw new BadRequestError(
      "This reset link is invalid or has expired. Please request a new one.",
    );
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Clear the token in the SAME update that sets the password, so the
  // link is invalidated the instant it's used -- even if it's reused
  // a second later.
  await safeExecute(
    "UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE user_id = ?",
    [hashedPassword, user.user_id],
  );
};
