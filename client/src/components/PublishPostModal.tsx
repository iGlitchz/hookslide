import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Instagram, Plus, Send } from "lucide-react";
import type { PublishPlatform, Slide, Slideshow, TextOverlay as TextOverlayType } from "../types";
import { getTikTokStatus, postToTikTok, startTikTokConnect, type TikTokStatus } from "../services/api";
import { TextOverlay } from "./TextOverlay";
import { v4 } from "../utils/uid";
import { resolveImageUrl } from "../utils/resolveImageUrl";

interface Props {
  slideshow: Slideshow;
  platform: PublishPlatform;
  onClose: () => void;
}

const PLATFORM_META: Record<PublishPlatform, { badge: string; title: string; subtitle: string; action: string; icon: ReactNode }> = {
  tiktok: {
    badge: "TikTok",
    title: "Prepare TikTok post",
    subtitle: "Refine the caption, edit slide text, and send the carousel when you are ready.",
    action: "Post to TikTok",
    icon: <Send size={14} />,
  },
  instagram: {
    badge: "Instagram",
    title: "Prepare Instagram post",
    subtitle: "Adjust the caption and overlays before you hand the carousel off to Instagram.",
    action: "Save Instagram draft",
    icon: <Instagram size={14} />,
  },
  schedule: {
    badge: "Schedule",
    title: "Schedule this carousel",
    subtitle: "Pick a send time, refine the copy, and review each slide before it goes live.",
    action: "Save schedule",
    icon: <Calendar size={14} />,
  },
};

function cloneSlides(sourceSlides: Slideshow["slides"]): Slide[] {
  return sourceSlides.map((slide) => ({
    ...slide,
    textOverlays: slide.textOverlays.map((overlay) => ({ ...overlay })),
  }));
}

function toLocalDatetimeValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatScheduleLabel(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PublishPostModal({ slideshow, platform, onClose }: Props) {
  const meta = PLATFORM_META[platform];
  const [caption, setCaption] = useState(slideshow.hook.text);
  const [firstComment, setFirstComment] = useState("");
  const [scheduleAt, setScheduleAt] = useState(toLocalDatetimeValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [slides, setSlides] = useState<Slide[]>(() => cloneSlides(slideshow.slides));
  const [status, setStatus] = useState<TikTokStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const slideRailRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const canConnectTikTok = platform === "tiktok";
  const canSchedule = platform === "schedule";

  useEffect(() => {
    setCaption(slideshow.hook.text);
    setFirstComment("");
    setScheduleAt(toLocalDatetimeValue(new Date(Date.now() + 60 * 60 * 1000)));
    setSlides(cloneSlides(slideshow.slides));
    setStatus(null);
    setMessage(null);
    setLoading(false);
  }, [slideshow, platform]);

  useEffect(() => {
    if (!canConnectTikTok) return;
    getTikTokStatus()
      .then(setStatus)
      .catch(() => setStatus({ connected: false, available: false, reason: "Status unavailable" }));
  }, [canConnectTikTok]);

  const updateSlide = useCallback((index: number, updater: (slide: Slide) => Slide) => {
    setSlides((current) => current.map((slide, slideIndex) => (slideIndex === index ? updater(slide) : slide)));
  }, []);

  const handleAddText = useCallback(
    (index: number) => {
      updateSlide(index, (slide) => ({
        ...slide,
        textOverlays: [
          ...slide.textOverlays,
          {
            id: v4(),
            text: "Your text here",
            x: 50,
            y: 50,
            fontSize: 36,
            visible: true,
          },
        ],
      }));
    },
    [updateSlide]
  );

  const handleUpdateOverlay = useCallback(
    (slideIndex: number, overlay: TextOverlayType) => {
      updateSlide(slideIndex, (slide) => ({
        ...slide,
        textOverlays: slide.textOverlays.map((item) => (item.id === overlay.id ? overlay : item)),
      }));
    },
    [updateSlide]
  );

  const handleDeleteOverlay = useCallback(
    (slideIndex: number, overlayId: string) => {
      updateSlide(slideIndex, (slide) => ({
        ...slide,
        textOverlays: slide.textOverlays.filter((item) => item.id !== overlayId),
      }));
    },
    [updateSlide]
  );

  const scrollSlides = useCallback((direction: -1 | 1) => {
    const rail = slideRailRef.current;
    if (!rail) return;
    rail.scrollBy({ left: rail.clientWidth * direction, behavior: "smooth" });
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
      if (platform === "tiktok") {
        if (!status?.available) {
          setMessage(status?.reason || "TikTok posting is not available yet.");
          return;
        }

        if (!status.connected) {
          const data = await startTikTokConnect();
          window.location.href = data.url;
          return;
        }

        const data = await postToTikTok({
          caption,
          platform,
          firstComment,
          scheduleAt: canSchedule ? scheduleAt : undefined,
          slides: slides.map((slide) => ({ imageUrl: slide.imageUrl })),
        });
        setMessage(data.message || "Post queued.");
        return;
      }

      if (platform === "instagram") {
        setMessage("Instagram draft ready. Publishing integration can be connected later.");
        return;
      }

      if (!scheduleAt) {
        setMessage("Choose a schedule time first.");
        return;
      }

      setMessage(`Schedule saved for ${formatScheduleLabel(scheduleAt)}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Publish action failed");
    } finally {
      setLoading(false);
    }
  };

  const primaryDisabled = loading || (platform === "tiktok" && (!status?.available || !status.connected));

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <motion.div
        className="auth-modal paywall-modal publish-modal"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="paywall-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="publish-badge-row">
          <div className="paywall-badge">{meta.badge}</div>
          <div className="publish-icon">{meta.icon}</div>
        </div>
        <h2>{meta.title}</h2>
        <p className="auth-subtitle">{meta.subtitle}</p>

        {canConnectTikTok && status && !status.available && (
          <p className="auth-error">{status.reason || "TikTok posting is not available yet."}</p>
        )}

        <div className="publish-form">
          <label className="publish-field">
            <span>Caption</span>
            <textarea
              className="publish-textarea"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption"
              rows={4}
            />
          </label>

          <div className="publish-row">
            <label className="publish-field grow">
              <span>First comment / hashtags</span>
              <textarea
                className="publish-textarea compact"
                value={firstComment}
                onChange={(e) => setFirstComment(e.target.value)}
                placeholder="Add a first comment or hashtag block"
                rows={2}
              />
            </label>

            {canSchedule && (
              <label className="publish-field narrow">
                <span>Schedule time</span>
                <input
                  className="publish-input"
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                />
              </label>
            )}
          </div>
        </div>

        <div className="publish-preview-shell">
          <div className="publish-preview-toolbar">
            <div>
              <p className="publish-preview-title">Carousel preview</p>
              <p className="publish-preview-subtitle">Scroll sideways to move through slides. Double-click text to edit it.</p>
            </div>
            <div className="publish-preview-controls">
              <button className="card-action-btn" onClick={() => scrollSlides(-1)} title="Previous slide">
                <ChevronLeft size={14} />
              </button>
              <button className="card-action-btn" onClick={() => scrollSlides(1)} title="Next slide">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="publish-rail" ref={slideRailRef}>
            {slides.map((slide, slideIndex) => (
              <div className="publish-slide-card" key={slide.id}>
                <div className="editor-slide-header publish-slide-header">
                  <span className="slide-label">Slide {slideIndex + 1} of {slides.length}</span>
                  <div className="slide-actions">
                    <button className="action-btn" onClick={() => handleAddText(slideIndex)} title="Add text overlay">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div
                  className="publish-slide"
                  ref={(node) => {
                    slideRefs.current[slideIndex] = node;
                  }}
                >
                  <img src={resolveImageUrl(slide.imageUrl)} alt="" className="publish-slide-image" />
                  {slide.textOverlays
                    .filter((overlay) => overlay.visible)
                    .map((overlay) => (
                      <TextOverlay
                        key={overlay.id}
                        overlay={overlay}
                        containerRef={{ current: slideRefs.current[slideIndex] }}
                        onUpdate={(updated) => handleUpdateOverlay(slideIndex, updated)}
                        onDelete={(id) => handleDeleteOverlay(slideIndex, id)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {message && <p className="auth-error">{message}</p>}

        <div className="publish-actions">
          {canConnectTikTok ? (
            <button className="auth-btn-primary" onClick={handleConnect} disabled={loading || !status?.available}>
              {loading ? "Working..." : status?.connected ? "Reconnect TikTok" : "Connect TikTok"}
            </button>
          ) : (
            <button className="auth-btn-secondary" onClick={onClose} disabled={loading}>
              Close
            </button>
          )}

          <button
            className="auth-btn-primary paywall-btn"
            onClick={handlePost}
            disabled={primaryDisabled || (canSchedule && !scheduleAt)}
          >
            {loading ? "Saving..." : meta.action}
          </button>
        </div>
      </motion.div>
    </div>
  );
}