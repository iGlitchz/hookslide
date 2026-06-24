import {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  type DragEvent,
  type ClipboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Image, X } from "lucide-react";
import type { GenerationOptions, PostFormat } from "../types";

export interface InputFormHandle {
  remix: (imageUrl: string, blurb: string) => void;
}

interface Props {
  onSubmit: (options: GenerationOptions) => void;
  loading: boolean;
  hasSubmissions: boolean;
}

export const InputForm = forwardRef<InputFormHandle, Props>(
  function InputForm({ onSubmit, loading, hasSubmissions }, ref) {
  const [blurb, setBlurb] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [postFormat, setPostFormat] = useState<PostFormat>("carousel");
  const [slideCount, setSlideCount] = useState<number>(6);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = attachments.length > 0 && blurb.trim().length > 0 && !loading;

  const isAllowedFile = (file: File) => {
    if (file.type.startsWith("image/")) return true;
    const lowerName = file.name.toLowerCase();
    return (
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".ppt") ||
      lowerName.endsWith(".pptx")
    );
  };

  const syncPreview = (files: File[]) => {
    const firstImage = files.find((file) => file.type.startsWith("image/"));
    if (!firstImage) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(firstImage);
  };

  const mergeAttachments = (incoming: File[]) => {
    if (incoming.length === 0) return;
    setAttachments((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        const alreadyAdded = next.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified
        );
        if (!alreadyAdded) next.push(file);
      }
      syncPreview(next);
      return next;
    });
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const valid = Array.from(fileList).filter(isAllowedFile);
    mergeAttachments(valid);
  };

  useImperativeHandle(ref, () => ({
    remix: async (imageUrl: string, blurbText: string) => {
      setBlurb(blurbText);
      setPostFormat("carousel");
      setSlideCount(6);
      setPreview(imageUrl);
      // Convert the imageUrl (base64 data URL) to a File object
      try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const file = new File([blob], "remix-image.jpg", { type: blob.type });
        setAttachments([file]);
      } catch {
        // If conversion fails, just set the preview
      }
      // Scroll up to the hero
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  }));

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handlePaste = (e: ClipboardEvent<HTMLFormElement>) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      handleFiles(files);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      blurb: blurb.trim(),
      postFormat,
      slideCount: postFormat === "carousel" ? slideCount : 1,
      attachments,
    });
  };

  return (
    <div className="search-section">
      <motion.h1
        className="brand-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Hook<span className="brand-arrow">→</span>Slide
      </motion.h1>
      <motion.p
        className="brand-tagline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        Generate scroll-stopping social slideshows with AI
      </motion.p>

      <motion.form
        onSubmit={handleSubmit}
        onPaste={handlePaste}
        className="search-bar-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div
          className={`search-bar ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Image reference pill */}
          <div
            className={`image-pill ${preview ? "has-image" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            title="Attach product reference files"
          >
            {preview ? (
              <img src={preview} alt="Ref" className="image-pill-preview" />
            ) : (
              <Image size={18} />
            )}
            <span className="image-pill-label">
              {attachments.length > 0 ? `${attachments.length} files` : "Attach Files"}
            </span>
            {attachments.length > 0 && (
              <button
                type="button"
                className="image-pill-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  setAttachments([]);
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                title="Remove image"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.docx,.ppt,.pptx"
            multiple
            hidden
            onChange={(e) => {
              handleFiles(e.target.files);
            }}
          />

          {/* Text input */}
          <input
            type="text"
            className="search-input"
            placeholder="Describe your brand and product..."
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
          />

          {/* Submit button */}
          <button
            type="submit"
            className="search-submit-btn"
            disabled={!canSubmit}
          >
            {loading ? (
              <div className="spinner small" />
            ) : (
              <ArrowRight size={20} />
            )}
          </button>
        </div>

        <div className="post-format-controls">
          <div
            role="button"
            tabIndex={0}
            className={`post-format-btn carousel-chip ${postFormat === "carousel" ? "active" : ""}`}
            onClick={() => setPostFormat("carousel")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPostFormat("carousel");
              }
            }}
            aria-label="Carousel format"
          >
            <AnimatePresence mode="wait" initial={false}>
              {postFormat === "carousel" ? (
                <motion.div
                  key="carousel-active"
                  className="carousel-inline-stepper"
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <span className="carousel-inline-label">Carousel</span>
                  <button
                    type="button"
                    className="slide-step-btn inline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlideCount((prev) => Math.max(1, prev - 1));
                    }}
                    disabled={slideCount <= 1}
                    aria-label="Decrease slide count"
                  >
                    -
                  </button>
                  <span className="carousel-inline-count" aria-live="polite">
                    {slideCount}
                  </span>
                  <button
                    type="button"
                    className="slide-step-btn inline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlideCount((prev) => Math.min(6, prev + 1));
                    }}
                    disabled={slideCount >= 6}
                    aria-label="Increase slide count"
                  >
                    +
                  </button>
                </motion.div>
              ) : (
                <motion.span
                  key="carousel-inactive"
                  className="carousel-chip-label"
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  Carousel
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            className={`post-format-btn ${postFormat === "infographic" ? "active" : ""}`}
            onClick={() => setPostFormat("infographic")}
          >
            Infographic
          </button>
          <button
            type="button"
            className={`post-format-btn ${postFormat === "poster" ? "active" : ""}`}
            onClick={() => setPostFormat("poster")}
          >
            Poster
          </button>
        </div>

        <p className="attachment-hint">
          Paste images with Ctrl+V, or attach multiple images, PDF, DOCX, PPT, and PPTX files.
        </p>
      </motion.form>
    </div>
  );
});
