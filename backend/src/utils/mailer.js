
/**
 * Sends password-reset emails through Gmail SMTP using Nodemailer.
 *
 * Required environment variables:
 * EMAIL_USER
 * EMAIL_APP_PASSWORD
 *
 * The backend can start without these variables.
 * They are checked only when an email needs to be sent.
 */

import nodemailer from "nodemailer";

/**
 * Sends a password-reset email containing a time-limited link.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient's email address
 * @param {string} params.resetUrl - Full frontend reset URL
 */
export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailAppPassword = process.env.EMAIL_APP_PASSWORD;

  // Check credentials only when an email is requested.
  if (!emailUser || !emailAppPassword) {
    throw new Error(
      "Email service is not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD."
    );
  }

  // Create the transporter when needed.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailAppPassword,
    },
  });

  // Send the password-reset email.
  await transporter.sendMail({
    from: `"Evangadi Forum" <${emailUser}>`,
    to,
    subject: "Reset your Evangadi Forum password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Reset your password</h2>

        <p>
          We received a request to reset your Evangadi Forum password.
          This link expires in 30 minutes.
        </p>

        <p>
          <a
            href="${resetUrl}"
            style="background:#ea580c;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;"
          >
            Reset Password
          </a>
        </p>

        <p>
          If you didn't request this, you can safely ignore this email.
          Your password will not change unless the reset link is used.
        </p>

        <p style="color:#6b7280;font-size:12px;">
          If the button doesn't work, copy this link:
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `,
  });
};
