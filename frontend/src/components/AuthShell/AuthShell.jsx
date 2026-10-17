/**
 * AuthShell: the same two-column layout as the sign-in page (brand panel on
 * the left, form card on the right), reused by the forgot-password and
 * reset-password pages so they look identical to the login screen.
 * It borrows the class names from Auth.module.css instead of duplicating CSS.
 */
import { useNavigate } from "react-router-dom";
import { Sparkles, Code, MessageSquare } from "lucide-react";
import styles from "../../pages/Auth/Auth.module.css";

export default function AuthShell({ title, subtitle, children }) {
  const navigate = useNavigate();

  return (
    <div className={styles.auth}>
      {/* Left: brand panel (same content as the Auth page) */}
      <section className={styles.auth__info}>
        <div className={styles.auth__infoContent}>
          <header className={styles.auth__infoHeader}>
            <div
              className={styles.auth__infoBranding}
              onClick={() => navigate("/")}
              title="Go to Home"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate("/");
                }
              }}
            >
              <div className={styles.auth__infoLogo} aria-hidden>
                <MessageSquare className={styles.auth__infoLogoIcon} size={22} />
              </div>
              <div className={styles.auth__infoBrandCopy}>
                <p className={styles.auth__infoTitle}>Evangadi Forum</p>
                <p className={styles.auth__infoTagline}>
                  Learn together. Ask with context.
                </p>
              </div>
            </div>
            <p className={styles.auth__infoDescription}>
              Locked out? It happens. We will email you a secure, time-limited
              link so you can choose a new password and get back to your
              threads.
            </p>
          </header>

          <div className={styles.auth__features}>
            <div className={styles.auth__feature}>
              <div className={styles.auth__featureIcon}>
                <Sparkles size={20} />
              </div>
              <div className={styles.auth__featureContent}>
                <h3 className={styles.auth__featureTitle}>Secure by design</h3>
                <p className={styles.auth__featureDescription}>
                  Reset links expire after 30 minutes and work only once.
                </p>
              </div>
            </div>
            <div className={styles.auth__feature}>
              <div className={styles.auth__featureIcon}>
                <Code size={20} />
              </div>
              <div className={styles.auth__featureContent}>
                <h3 className={styles.auth__featureTitle}>Back in seconds</h3>
                <p className={styles.auth__featureDescription}>
                  Pick a new password and sign straight back in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right: form card supplied by the page */}
      <section className={styles.auth__formSection}>
        <div className={styles.auth__formContainer}>
          <div className={styles.auth__formHeader}>
            <h2 className={styles.auth__formTitle}>{title}</h2>
            {subtitle && <p className={styles.auth__formSubtitle}>{subtitle}</p>}
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
