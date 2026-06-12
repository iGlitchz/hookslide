import type { Slide } from "../types";
import { resolveImageUrl } from "../utils/resolveImageUrl";

interface Props {
  slide: Slide;
  compact?: boolean;
}

export function SlidePreview({ slide, compact }: Props) {
  const resolvedImageUrl = resolveImageUrl(slide.imageUrl);

  return (
    <div className={`slide-preview ${compact ? "compact" : ""}`}>
      <img
        src={resolvedImageUrl}
        alt=""
        className="slide-image"
        onError={(e) => {
          const target = e.currentTarget;
          target.onerror = null;
          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='533'%3E%3Crect width='100%25' height='100%25' fill='%2317172a'/%3E%3Ctext x='50%25' y='50%25' fill='%23a1a1aa' font-size='14' text-anchor='middle' dominant-baseline='middle'%3EImage unavailable%3C/text%3E%3C/svg%3E";
        }}
      />
      {slide.textOverlays
        .filter((o) => o.visible)
        .map((overlay) => (
          <div
            key={overlay.id}
            className="slide-text-overlay"
            style={{
              left: `${overlay.x}%`,
              top: `${overlay.y}%`,
              fontSize: compact
                ? `${overlay.fontSize * 0.35}px`
                : `${overlay.fontSize}px`,
            }}
          >
            {overlay.text}
          </div>
        ))}
    </div>
  );
}
