import { motion } from "framer-motion";

interface Props {
  onClose: () => void;
}

export function AccountsDashboardModal({ onClose }: Props) {
  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <motion.div
        className="auth-modal paywall-modal"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="paywall-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="paywall-badge">BETA</div>
        <h2>Accounts Dashboard</h2>
        <p className="auth-subtitle">Coming soon</p>

        <ul className="paywall-features">
          <li>✦ Connected social accounts</li>
          <li>✦ Posting history and analytics</li>
          <li>✦ Billing and subscription controls</li>
          <li>✦ Team permissions</li>
        </ul>
      </motion.div>
    </div>
  );
}
