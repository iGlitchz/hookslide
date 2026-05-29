import type { Slide } from "../types";

interface Props {
  slide: Slide;
  compact?: boolean;
}

export function SlidePreview({ slide, compact }: Props) {
  return (
    <div className={`slide-preview ${compact ? "compact" : ""}`}>
      <img src={slide.imageUrl} alt="" className="slide-image" />
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
