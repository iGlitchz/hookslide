import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthModalProps {
  onAuth: (email: string, password: string, mode: "signin" | "signup") => Promise<{ error: string | null }>;
  loading?: boolean;
  onClose?: () => void;
  initialMode?: "signin" | "signup";
  source?: "default" | "tiktok";
}

export function AuthModal({
  onAuth,
  loading,
  onClose,
  initialMode = "signin",
  source = "default",
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const isTikTokSignup = source === "tiktok" && mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await onAuth(email, password, mode);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === "signup") {
      setSignupSuccess(true);
    } else {
      onClose?.();
    }
  };

  if (signupSuccess) {
    return (
      <div className="auth-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
        <div className="auth-modal">
          {onClose && <button className="auth-close-btn" onClick={onClose}>✕</button>}
          <h2>Check your email</h2>
          <p>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.</p>
          <button className="auth-btn-secondary" onClick={() => { setSignupSuccess(false); setMode("signin"); }}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <motion.div
        className="auth-modal"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="auth-logo">
          {onClose && <button className="auth-close-btn" onClick={onClose}>✕</button>}
          <span className="auth-logo-icon">✦</span>
          <span>Hook Slide</span>
        </div>

        <h2>{mode === "signin" ? "Welcome back" : isTikTokSignup ? "Sign up with TikTok" : "Create account"}</h2>
        <p className="auth-subtitle">
          {mode === "signin"
            ? "Sign in to access your slideshow library."
            : isTikTokSignup
              ? "Use your email or username and a password to create your account."
              : "Start creating scroll-stopping hook slides."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            {isTikTokSignup ? "Email or username" : "Email"}
            <input
              type={isTikTokSignup ? "text" : "email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isTikTokSignup ? "you@example.com or @username" : "you@example.com"}
              required
              autoFocus
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              minLength={mode === "signup" ? 8 : undefined}
              required
            />
          </label>

          <AnimatePresence>
            {error && (
              <motion.p
                className="auth-error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={submitting || loading}
          >
            {submitting ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            className="auth-toggle-btn"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
