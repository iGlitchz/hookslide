import { useState, useCallback, useRef, useEffect, type DragEvent } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Image as ImageIcon,
  Send,
  Upload,
  Plus,
  X,
  Trash2,
  Link2,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import type { TikTokStatus } from "../services/api";
import { getTikTokStatus, startTikTokConnect } from "../services/api";
import type { UserProfileData } from "../hooks/useUserProfile";

interface Props {
  onClose: () => void;
  userEmail?: string;
  profile: UserProfileData;
  onSetLastImage: (dataUrl: string | null) => void;
  onAddMoodboard: (dataUrl: string) => void;
  onRemoveMoodboard: (index: number) => void;
  onToggleLastImage: () => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DashboardPage({
  onClose,
  userEmail,
  profile,
  onSetLastImage,
  onAddMoodboard,
  onRemoveMoodboard,
  onToggleLastImage,
}: Props) {
  const [tiktokStatus, setTiktokStatus] = useState<TikTokStatus | null>(null);
  const [tiktokLoading, setTiktokLoading] = useState(false);
  const [lastImageDragOver, setLastImageDragOver] = useState(false);
  const [moodboardDragOver, setMoodboardDragOver] = useState(false);
  const lastImageInputRef = useRef<HTMLInputElement>(null);
  const moodboardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTikTokStatus()
      .then(setTiktokStatus)
      .catch(() => setTiktokStatus({ connected: false, available: false }));
  }, []);

  // Push /dashboard to history on mount, pop on close
  useEffect(() => {
    window.history.pushState({ dashboard: true }, "", "/dashboard");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onClose]);

  const handleConnectTikTok = useCallback(async () => {
    setTiktokLoading(true);
    try {
      const { url } = await startTikTokConnect();
      window.location.href = url;
    } catch {
      setTiktokLoading(false);
    }
  }, []);

  const handleLastImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const dataUrl = await readFileAsDataUrl(file);
      onSetLastImage(dataUrl);
    },
    [onSetLastImage]
  );

  const handleMoodboardFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const dataUrl = await readFileAsDataUrl(file);
      onAddMoodboard(dataUrl);
    },
    [onAddMoodboard]
  );

  const handleLastImageDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setLastImageDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleLastImageFile(file);
    },
    [handleLastImageFile]
  );

  const handleMoodboardDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setMoodboardDragOver(false);
      Array.from(e.dataTransfer.files).forEach(handleMoodboardFile);
    },
    [handleMoodboardFile]
  );

  const initials = userEmail ? userEmail[0].toUpperCase() : "U";

  return (
    <motion.div
      className="dash-page"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 280 }}
    >
      {/* Sticky top bar */}
      <header className="dash-topbar">
        <button className="dash-back" onClick={onClose}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <span className="dash-topbar-title">Dashboard</span>
        <div style={{ width: 80 }} />
      </header>

      <div className="dash-scroll">
        {/* ── Profile Hero ── */}
        <section className="dash-hero">
          <div className="dash-hero-gradient" />
          <div className="dash-hero-inner">
            <div className="dash-avatar">{initials}</div>
            <div className="dash-hero-meta">
              <h1 className="dash-hero-name">{userEmail || "Guest"}</h1>
              <span className="dash-hero-plan">
                Hook→Slide Beta
              </span>
            </div>
          </div>
        </section>

        {/* ── Stats Row ── */}
        <section className="dash-section">
          <div className="dash-stats-row">
            <div className="dash-kpi">
              <div className="dash-kpi-icon purple">
                <ImageIcon size={20} />
              </div>
              <div className="dash-kpi-data">
                <span className="dash-kpi-num">{profile.totalGenerated}</span>
                <span className="dash-kpi-label">Generated</span>
              </div>
            </div>
            <div className="dash-kpi">
              <div className="dash-kpi-icon green">
                <Send size={20} />
              </div>
              <div className="dash-kpi-data">
                <span className="dash-kpi-num">{profile.totalPosted}</span>
                <span className="dash-kpi-label">Published</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Connected Accounts ── */}
        <section className="dash-section">
          <h2 className="dash-heading">Connected Accounts</h2>
          <div className="dash-card dash-tiktok-row">
            <div className="dash-tiktok-left">
              <div className={`dash-tt-badge ${tiktokStatus?.connected ? "on" : ""}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.76a8.28 8.28 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.17z" />
                </svg>
              </div>
              <div className="dash-tt-info">
                <span className="dash-tt-name">TikTok</span>
                <span className="dash-tt-status">
                  {tiktokStatus === null
                    ? "Checking…"
                    : tiktokStatus.connected
                    ? "Connected"
                    : tiktokStatus.available
                    ? "Not connected"
                    : tiktokStatus.reason || "Unavailable"}
                </span>
              </div>
            </div>
            <button
              className={`dash-tt-btn ${tiktokStatus?.connected ? "linked" : ""}`}
              onClick={handleConnectTikTok}
              disabled={tiktokLoading || !tiktokStatus?.available}
            >
              {tiktokStatus?.connected ? (
                <><CheckCircle size={14} /> Linked</>
              ) : (
                <><Link2 size={14} /> Connect</>
              )}
            </button>
          </div>
        </section>

        {/* ── Last Slide Image ── */}
        <section className="dash-section">
          <div className="dash-heading-row">
            <h2 className="dash-heading">Last Slide Image</h2>
            <label className="dash-toggle-label">
              <span>Auto-append</span>
              <button
                type="button"
                className={`dash-toggle ${profile.useLastImage ? "on" : ""}`}
                onClick={onToggleLastImage}
                disabled={!profile.lastCarouselImage}
              >
                <span className="dash-toggle-knob" />
              </button>
            </label>
          </div>
          <p className="dash-desc">
            This image will be appended as the final slide of every carousel you generate.
          </p>

          <div
            className={`dash-dropzone ${lastImageDragOver ? "over" : ""} ${profile.lastCarouselImage ? "filled" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setLastImageDragOver(true); }}
            onDragLeave={() => setLastImageDragOver(false)}
            onDrop={handleLastImageDrop}
            onClick={() => lastImageInputRef.current?.click()}
          >
            {profile.lastCarouselImage ? (
              <div className="dash-drop-preview">
                <img src={profile.lastCarouselImage} alt="Last slide" />
                <button
                  className="dash-drop-remove"
                  onClick={(e) => { e.stopPropagation(); onSetLastImage(null); }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="dash-drop-empty">
                <Upload size={24} />
                <span>Drop an image or click to upload</span>
              </div>
            )}
            <input
              ref={lastImageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLastImageFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </section>

        {/* ── Moodboard ── */}
        <section className="dash-section">
          <h2 className="dash-heading">Visual Moodboard</h2>
          <p className="dash-desc">
            Reference images to guide your brand aesthetic. Up to 12.
          </p>

          <div className="dash-mood-grid">
            {profile.moodboardImages.map((img, idx) => (
              <motion.div
                key={idx}
                className="dash-mood-tile"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
              >
                <img src={img} alt={`Mood ${idx + 1}`} />
                <button className="dash-mood-rm" onClick={() => onRemoveMoodboard(idx)}>
                  <X size={11} />
                </button>
              </motion.div>
            ))}

            {profile.moodboardImages.length < 12 && (
              <div
                className={`dash-mood-add ${moodboardDragOver ? "over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setMoodboardDragOver(true); }}
                onDragLeave={() => setMoodboardDragOver(false)}
                onDrop={handleMoodboardDrop}
                onClick={() => moodboardInputRef.current?.click()}
              >
                <Plus size={18} />
              </div>
            )}
          </div>
          <input
            ref={moodboardInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              Array.from(e.target.files || []).forEach(handleMoodboardFile);
              e.target.value = "";
            }}
          />
        </section>

        {/* ── Settings ── */}
        <section className="dash-section dash-last-section">
          <h2 className="dash-heading">Settings</h2>
          <div className="dash-settings-list">
            <div className="dash-setting">
              <span className="dash-setting-label">Account</span>
              <span className="dash-setting-value">{userEmail || "Not signed in"}</span>
            </div>
            <div className="dash-setting">
              <span className="dash-setting-label">Version</span>
              <span className="dash-setting-value">Hook→Slide v1.0 Beta</span>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
