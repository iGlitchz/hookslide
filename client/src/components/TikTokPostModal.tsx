import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Slideshow } from "../types";
import { getTikTokStatus, postToTikTok, startTikTokConnect, type TikTokStatus } from "../services/api";

interface Props {
  slideshow: Slideshow;
  onClose: () => void;
}

export function TikTokPostModal({ slideshow, onClose }: Props) {
  const [caption, setCaption] = useState(slideshow.hook.text);
  const [status, setStatus] = useState<TikTokStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getTikTokStatus().then(setStatus);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await startTikTokConnect();
      window.location.href = data.url;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "TikTok connect failed");
      setLoading(false);
    }
  };

  const handlePost = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await postToTikTok({
        caption,
        slides: slideshow.slides.map((slide) => ({ imageUrl: slide.imageUrl })),
      });
      setMessage(data.message || "Post queued.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "TikTok post failed");
    } finally {
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
        <button className="paywall-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="paywall-badge">TikTok</div>
        <h2>Post Slideshow</h2>
        <p className="auth-subtitle">Publish directly from your slides library.</p>

        {status && !status.available && (
          <p className="auth-error">{status.reason || "TikTok posting is not available yet."}</p>
        )}

        <textarea
          className="search-input"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption"
          rows={3}
        />

        {message && <p className="auth-error">{message}</p>}

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="auth-btn-primary" onClick={handleConnect} disabled={loading || !status?.available}>
            {loading ? "Working..." : status?.connected ? "Reconnect TikTok" : "Connect TikTok"}
          </button>
          <button
            className="auth-btn-primary paywall-btn"
            onClick={handlePost}
            disabled={loading || !status?.connected || !status?.available}
          >
            {loading ? "Posting..." : "Post Now"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
