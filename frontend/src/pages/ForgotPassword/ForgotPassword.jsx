/**
 * ForgotPassword: asks for an email and requests a reset link.
 * Always shows the same confirmation, whether or not the email exists, so the
 * page cannot be used to discover which emails are registered.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AuthShell from "../../components/AuthShell/AuthShell";
import { authService } from "../../services/auth/auth.service.js";
import styles from "../Auth/Auth.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(normalizedEmail);
      setSent(true);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="If that email is registered, a reset link is on its way."
      >
        <div className={styles.auth__form}>
          <div className={styles.auth__success}>
             If that email is registered, reset instructions will be sent to{" "} <strong>{email.trim().toLowerCase()}</strong>.
            The link expires in 30 minutes. If you do not see it, check your
            spam folder.
          </div>
        </div>
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

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email address and we will send you a reset link."
    >
      <form className={styles.auth__form} onSubmit={handleSubmit}>
        <div className={styles.auth__inputGroup}>
          <label htmlFor="email" className={styles.auth__label}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email address"
            className={styles.auth__input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && <div className={styles.auth__error}>{error}</div>}

        <div className={styles.auth__buttonContainer}>
          <button
            type="submit"
            className={`${styles.auth__button} ${styles["auth__button--primary"]}`}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send reset link"}
            {!loading && (
              <ArrowRight size={16} className={styles.auth__buttonIcon} />
            )}
          </button>
        </div>
      </form>

      <footer className={styles.auth__formFooter}>
        <p className={styles.auth__formFooterText}>
          Remembered it?{" "}
          <Link to="/auth" className={styles.auth__formFooterLink}>
            Back to sign in
          </Link>
        </p>
      </footer>
    </AuthShell>
  );
}
