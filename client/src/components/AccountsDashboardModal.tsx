import { useState, useCallback, useRef, useEffect, type DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BarChart3,
  Send,
  Image as ImageIcon,
  Palette,
  Settings,
  Link2,
  Link2Off,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
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
}

type Tab = "overview" | "moodboard" | "settings";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AccountsDashboardModal({
  onClose,
  userEmail,
  profile,
  onSetLastImage,
  onAddMoodboard,
  onRemoveMoodboard,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={15} /> },
    { id: "moodboard", label: "Visual Assets", icon: <Palette size={15} /> },
    { id: "settings", label: "Settings", icon: <Settings size={15} /> },
  ];

  return (
    <div className="dashboard-overlay" onClick={onClose}>
      <motion.div
        className="dashboard-modal"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <div className="dashboard-avatar">
              {userEmail ? userEmail[0].toUpperCase() : "U"}
            </div>
            <div className="dashboard-header-info">
              <h2 className="dashboard-title">My Profile</h2>
              <span className="dashboard-email">{userEmail || "Guest"}</span>
            </div>
          </div>
          <button className="dashboard-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`dashboard-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="dashboard-content">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="dashboard-tab-panel"
              >
                {/* Stats Cards */}
                <div className="dashboard-stats-grid">
                  <div className="dashboard-stat-card">
                    <div className="stat-icon generated">
                      <ImageIcon size={18} />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value">{profile.totalGenerated}</span>
                      <span className="stat-label">Carousels Generated</span>
                    </div>
                  </div>
                  <div className="dashboard-stat-card">
                    <div className="stat-icon posted">
                      <Send size={18} />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value">{profile.totalPosted}</span>
                      <span className="stat-label">Posts Published</span>
                    </div>
                  </div>
                </div>

                {/* TikTok Connection */}
                <div className="dashboard-section">
                  <h3 className="dashboard-section-title">Connected Accounts</h3>
                  <div className="dashboard-tiktok-card">
                    <div className="tiktok-card-left">
                      <div className={`tiktok-icon-badge ${tiktokStatus?.connected ? "connected" : ""}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.76a8.28 8.28 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.17z" />
                        </svg>
                      </div>
                      <div className="tiktok-card-info">
                        <span className="tiktok-card-name">TikTok</span>
                        <span className="tiktok-card-status">
                          {tiktokStatus === null
                            ? "Checking..."
                            : tiktokStatus.connected
                            ? "Connected"
                            : tiktokStatus.available
                            ? "Not connected"
                            : tiktokStatus.reason || "Unavailable"}
                        </span>
                      </div>
                    </div>
                    <button
                      className={`tiktok-connect-btn ${tiktokStatus?.connected ? "connected" : ""}`}
                      onClick={handleConnectTikTok}
                      disabled={tiktokLoading || !tiktokStatus?.available}
                    >
                      {tiktokStatus?.connected ? (
                        <>
                          <CheckCircle size={14} /> Linked
                        </>
                      ) : (
                        <>
                          <Link2 size={14} /> Connect
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Last Carousel Image (quick view) */}
                <div className="dashboard-section">
                  <h3 className="dashboard-section-title">Last Slide Image</h3>
                  <p className="dashboard-section-desc">
                    This image will be appended as the final slide in every carousel when enabled.
                  </p>
                  <div
                    className={`last-image-dropzone ${lastImageDragOver ? "drag-over" : ""} ${profile.lastCarouselImage ? "has-image" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setLastImageDragOver(true); }}
                    onDragLeave={() => setLastImageDragOver(false)}
                    onDrop={handleLastImageDrop}
                    onClick={() => lastImageInputRef.current?.click()}
                  >
                    {profile.lastCarouselImage ? (
                      <div className="last-image-preview-wrap">
                        <img src={profile.lastCarouselImage} alt="Last slide" className="last-image-preview" />
                        <button
                          className="last-image-remove"
                          onClick={(e) => { e.stopPropagation(); onSetLastImage(null); }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="dropzone-placeholder">
                        <Upload size={22} />
                        <span>Drop image or click to upload</span>
                      </div>
                    )}
                    <input
                      ref={lastImageInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLastImageFile(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "moodboard" && (
              <motion.div
                key="moodboard"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="dashboard-tab-panel"
              >
                <div className="dashboard-section">
                  <h3 className="dashboard-section-title">Visual Moodboard</h3>
                  <p className="dashboard-section-desc">
                    Add reference images to guide your brand aesthetic. Up to 12 images.
                  </p>

                  <div className="moodboard-grid">
                    {profile.moodboardImages.map((img, idx) => (
                      <motion.div
                        key={idx}
                        className="moodboard-tile"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.04 }}
                      >
                        <img src={img} alt={`Mood ${idx + 1}`} />
                        <button
                          className="moodboard-tile-remove"
                          onClick={() => onRemoveMoodboard(idx)}
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))}

                    {profile.moodboardImages.length < 12 && (
                      <div
                        className={`moodboard-add-tile ${moodboardDragOver ? "drag-over" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setMoodboardDragOver(true); }}
                        onDragLeave={() => setMoodboardDragOver(false)}
                        onDrop={handleMoodboardDrop}
                        onClick={() => moodboardInputRef.current?.click()}
                      >
                        <Plus size={20} />
                        <span>Add</span>
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
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="dashboard-tab-panel"
              >
                <div className="dashboard-section">
                  <h3 className="dashboard-section-title">Preferences</h3>
                  <div className="settings-list">
                    <div className="settings-item">
                      <div className="settings-item-info">
                        <span className="settings-item-label">Auto-append last slide image</span>
                        <span className="settings-item-desc">
                          Automatically add your last slide image to every generated carousel.
                        </span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={profile.useLastImage}
                          onChange={() =>
                            onSetLastImage === undefined
                              ? undefined
                              : (() => {
                                  /* toggled via parent */
                                })()
                          }
                          readOnly
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    <div className="settings-item">
                      <div className="settings-item-info">
                        <span className="settings-item-label">Account email</span>
                        <span className="settings-item-desc">{userEmail || "Not signed in"}</span>
                      </div>
                    </div>

                    <div className="settings-item">
                      <div className="settings-item-info">
                        <span className="settings-item-label">Version</span>
                        <span className="settings-item-desc">Hook→Slide v1.0 Beta</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
