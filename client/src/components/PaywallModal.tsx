import { useState } from "react";
import { motion } from "framer-motion";

interface PaywallModalProps {
  onClose: () => void;
  userEmail?: string;
}

export function PaywallModal({ onClose, userEmail }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getToken()}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout session");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <motion.div
        className="auth-modal paywall-modal"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="paywall-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="paywall-badge">PRO</div>
        <h2>Unlock Hook Slide Pro</h2>
        <p className="auth-subtitle">
          Generate unlimited AI-powered hook slideshows for your products.
        </p>

        <ul className="paywall-features">
          <li>✦ Unlimited slideshow generations</li>
          <li>✦ AI-curated stock + generated images</li>
          <li>✦ Fullscreen editor with drag &amp; drop text</li>
          <li>✦ Export as PNG / JPEG</li>
        </ul>

        <div className="paywall-price">
          <span className="paywall-price-amount">$9.99</span>
          <span className="paywall-price-period">/month</span>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button
          className="auth-btn-primary paywall-btn"
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? "Redirecting to checkout…" : "Upgrade now"}
        </button>

        <p className="paywall-cancel-note">Cancel anytime. No hidden fees.</p>

        {userEmail && (
          <p className="paywall-account-note">Signed in as {userEmail}</p>
        )}
      </motion.div>
    </div>
  );
}

// Pull the Supabase session token for the checkout request
async function getToken(): Promise<string> {
  const { supabase } = await import("../services/supabaseClient");
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}
