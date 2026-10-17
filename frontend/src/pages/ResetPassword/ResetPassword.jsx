/**
 * ResetPassword: opened from the emailed link (/reset-password?token=...).
 * Validates the new password, submits it to the backend, and redirects
 * the user to sign in after a successful password reset.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import AuthShell from "../../components/AuthShell/AuthShell";
import { authService } from "../../services/auth/auth.service.js";
import styles from "../Auth/Auth.module.css";

/**
 * Validates the new password using the same rules as the backend.
 */
function getPasswordError(password) {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one capital letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character (e.g. !@#$%).";
  }

  return null;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read the raw reset token from the emailed URL.
  const token = searchParams.get("token");

  // Form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  /**
   * Redirect to the sign-in page two seconds after a successful reset.
   * useEffect belongs at the component's top level, not inside handleSubmit.
   */
  useEffect(() => {
    if (!done) return;

    const timer = setTimeout(() => {
      navigate("/auth", { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [done, navigate]);

  /**
   * Handles the password-reset form submission.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Make sure the reset link contains a token.
    if (!token) {
      setError(
        "This reset link is missing its token. Please request a new one.",
      );
      return;
    }

    // Validate the new password.
    const passwordError = getPasswordError(newPassword);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Confirm both password fields match.
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Send the token and new password to the backend.
      await authService.resetPassword({ token, newPassword });

      // Display success; useEffect handles the redirect.
      setDone(true);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Display this screen after the backend confirms success.
  if (done) {
    return (
      <AuthShell
        title="Password updated"
        subtitle="You can now sign in with your new password."
      >
        <div className={styles.auth__form}>
          <div className={styles.auth__success}>
            Password reset successful. Redirecting you to sign in...
          </div>
        </div>
      </AuthShell>
    );
  }

  // Show/hide password control.
  const toggle = (
    <button
      type="button"
      className={styles.auth__passwordToggle}
      onClick={() => setShowPassword((value) => !value)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      aria-pressed={showPassword}
    >
      {showPassword ? (
        <EyeOff size={18} aria-hidden />
      ) : (
        <Eye size={18} aria-hidden />
      )}
    </button>
  );

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password you have not used here before."
    >
      <form className={styles.auth__form} onSubmit={handleSubmit}>
        {/* New password field */}
        <div className={styles.auth__inputGroup}>
          <label htmlFor="newPassword" className={styles.auth__label}>
            New Password
          </label>

          <p className={styles.auth__passwordHint}>
            Must be at least 8 characters and include a capital letter, a
            lowercase letter, a number, and a special character.
          </p>

          <div className={styles.auth__passwordWrap}>
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new password"
              className={`${styles.auth__input} ${styles.auth__inputPassword}`}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />

            {toggle}
          </div>
        </div>

        {/* Confirm password field */}
        <div className={styles.auth__inputGroup}>
          <label htmlFor="confirmPassword" className={styles.auth__label}>
            Confirm New Password
          </label>

          <div className={styles.auth__passwordWrap}>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your new password"
              className={`${styles.auth__input} ${styles.auth__inputPassword}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Display validation or server errors */}
        {error && <div className={styles.auth__error}>{error}</div>}

        {/* Submit button */}
        <div className={styles.auth__buttonContainer}>
          <button
            type="submit"
            className={`${styles.auth__button} ${styles["auth__button--primary"]}`}
            disabled={loading}
          >
            {loading ? "Updating..." : "Reset password"}

            {!loading && (
              <ArrowRight size={16} className={styles.auth__buttonIcon} />
            )}
          </button>
        </div>
      </form>

      {/* Return to sign in */}
      <footer className={styles.auth__formFooter}>
        <p className={styles.auth__formFooterText}>
          <Link to="/auth" className={styles.auth__formFooterLink}>
            Back to sign in
          </Link>
        </p>
      </footer>
    </AuthShell>
  );
}
