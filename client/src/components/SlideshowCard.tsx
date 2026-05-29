import { useState } from "react";
import {
  RefreshCw,
  Trash2,
  Download,
  Send,
  Instagram,
  Calendar,
} from "lucide-react";
import type { Slideshow } from "../types";
import { SlidePreview } from "./SlidePreview";

interface Props {
  slideshow: Slideshow;
  onClick: () => void;
  onDelete: () => void;
}

export function SlideshowCard({ slideshow, onClick, onDelete }: Props) {
  const [hovered, setHovered] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [slide1, slide2] = slideshow.slides;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const mockAction = (label: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    showToast(`${label} — Coming Soon`);
  };

  return (
    <div className="slideshow-card-wrapper">
      <div
        className={`slideshow-card ${hovered ? "spread" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
      >
        <div className="card-hook-label">{slideshow.hook.type}</div>

        <div className="card-stack">
          <div className={`card-layer card-back ${hovered ? "spread-back" : ""}`}>
            <SlidePreview slide={slide2} compact />
          </div>
          <div className={`card-layer card-front ${hovered ? "spread-front" : ""}`}>
            <SlidePreview slide={slide1} compact />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="card-actions">
        <button
          className="card-action-btn delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
        <button
          className="card-action-btn"
          onClick={mockAction("Download ZIP")}
          title="Download as ZIP"
        >
          <Download size={14} />
        </button>
        <button
          className="card-action-btn"
          onClick={mockAction("Post to TikTok")}
          title="Post to TikTok"
        >
          <Send size={14} />
        </button>
        <button
          className="card-action-btn"
          onClick={mockAction("Post to Instagram")}
          title="Post to Instagram"
        >
          <Instagram size={14} />
        </button>
        <button
          className="card-action-btn"
          onClick={mockAction("Schedule Post")}
          title="Schedule Post"
        >
          <Calendar size={14} />
        </button>
      </div>

      {/* Toast */}
      {toast && <div className="card-toast">{toast}</div>}
    </div>
  );
}
