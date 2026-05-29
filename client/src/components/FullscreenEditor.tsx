import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, Plus, Download } from "lucide-react";
import { toPng, toJpeg } from "html-to-image";
import type { Slideshow, Slide, TextOverlay as TextOverlayType } from "../types";
import { TextOverlay } from "./TextOverlay";
import { v4 } from "../utils/uid";

interface Props {
  slideshow: Slideshow;
  submissionId: string;
  blurb: string;
  onClose: () => void;
  onRegenerate: (slideIndex: 0 | 1, imagePrompt: string) => void;
  onUpdateOverlays: (slideIndex: 0 | 1, overlays: TextOverlayType[]) => void;
}

export function FullscreenEditor({
  slideshow,
  submissionId,
  blurb,
  onClose,
  onRegenerate,
  onUpdateOverlays,
}: Props) {
  const slide1Ref = useRef<HTMLDivElement>(null);
  const slide2Ref = useRef<HTMLDivElement>(null);
  const [regenerating, setRegenerating] = useState<number | null>(null);

  const handleOverlayUpdate = useCallback(
    (slideIndex: 0 | 1, updated: TextOverlayType) => {
      const slide = slideshow.slides[slideIndex];
      const newOverlays = slide.textOverlays.map((o) =>
        o.id === updated.id ? updated : o
      );
      onUpdateOverlays(slideIndex, newOverlays);
    },
    [slideshow, onUpdateOverlays]
  );

  const handleOverlayDelete = useCallback(
    (slideIndex: 0 | 1, overlayId: string) => {
      const slide = slideshow.slides[slideIndex];
      const newOverlays = slide.textOverlays.filter((o) => o.id !== overlayId);
      onUpdateOverlays(slideIndex, newOverlays);
    },
    [slideshow, onUpdateOverlays]
  );

  const handleAddText = useCallback(
    (slideIndex: 0 | 1) => {
      const slide = slideshow.slides[slideIndex];
      const newOverlay: TextOverlayType = {
        id: v4(),
        text: "Your text here",
        x: 50,
        y: 50,
        fontSize: 36,
        visible: true,
      };
      onUpdateOverlays(slideIndex, [...slide.textOverlays, newOverlay]);
    },
    [slideshow, onUpdateOverlays]
  );

  const handleRegenerate = useCallback(
    async (slideIndex: 0 | 1) => {
      setRegenerating(slideIndex);
      try {
        await onRegenerate(slideIndex, slideshow.slides[slideIndex].imagePrompt);
      } finally {
        setRegenerating(null);
      }
    },
    [slideshow, onRegenerate]
  );

  const handleExport = useCallback(
    async (slideIndex: 0 | 1, format: "png" | "jpg") => {
      const ref = slideIndex === 0 ? slide1Ref : slide2Ref;
      const node = ref.current;
      if (!node) return;

      try {
        const fn = format === "png" ? toPng : toJpeg;
        const dataUrl = await fn(node, {
          quality: 0.95,
          pixelRatio: 2,
        });
        const link = document.createElement("a");
        link.download = `slide-${slideIndex + 1}.${format}`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Export failed:", err);
      }
    },
    []
  );

  const renderSlide = (slide: Slide, slideIndex: 0 | 1) => {
    const ref = slideIndex === 0 ? slide1Ref : slide2Ref;
    const isRegenerating = regenerating === slideIndex;

    return (
      <div className="editor-slide-wrapper">
        <div className="editor-slide-header">
          <span className="slide-label">
            {slideIndex === 0 ? "Slide 1 — Hook" : "Slide 2 — Product"}
          </span>
          <div className="slide-actions">
            <button
              className="action-btn"
              onClick={() => handleRegenerate(slideIndex)}
              disabled={isRegenerating}
              title="Regenerate image"
            >
              <RefreshCw size={16} className={isRegenerating ? "spin" : ""} />
            </button>
            <button
              className="action-btn"
              onClick={() => handleAddText(slideIndex)}
              title="Add text overlay"
            >
              <Plus size={16} />
            </button>
            <button
              className="action-btn export"
              onClick={() => handleExport(slideIndex, "png")}
              title="Export as PNG"
            >
              <Download size={14} /> PNG
            </button>
            <button
              className="action-btn export"
              onClick={() => handleExport(slideIndex, "jpg")}
              title="Export as JPG"
            >
              <Download size={14} /> JPG
            </button>
          </div>
        </div>

        <div className="editor-slide" ref={ref}>
          {isRegenerating && (
            <div className="slide-regenerating">
              <div className="spinner small" />
            </div>
          )}
          <img src={slide.imageUrl} alt="" className="editor-slide-image" />
          {slide.textOverlays
            .filter((o) => o.visible)
            .map((overlay) => (
              <TextOverlay
                key={overlay.id}
                overlay={overlay}
                containerRef={ref}
                onUpdate={(updated) => handleOverlayUpdate(slideIndex, updated)}
                onDelete={(id) => handleOverlayDelete(slideIndex, id)}
              />
            ))}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fullscreen-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="fullscreen-editor"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="editor-header">
            <div className="editor-hook-info">
              <span className="hook-type-badge">{slideshow.hook.type}</span>
              <span className="hook-brief">{slideshow.hook.brief}</span>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="editor-slides">
            {renderSlide(slideshow.slides[0], 0)}
            {renderSlide(slideshow.slides[1], 1)}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
