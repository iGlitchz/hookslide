import { useState, useRef, useEffect, useImperativeHandle, forwardRef, type DragEvent } from "react";
import { motion } from "framer-motion";
import { Upload, ArrowRight, Image, X } from "lucide-react";

export interface InputFormHandle {
  remix: (imageUrl: string, blurb: string) => void;
}

interface Props {
  onSubmit: (imageFile: File, blurb: string) => void;
  loading: boolean;
  hasSubmissions: boolean;
}

export const InputForm = forwardRef<InputFormHandle, Props>(
  function InputForm({ onSubmit, loading, hasSubmissions }, ref) {
  const [blurb, setBlurb] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  useImperativeHandle(ref, () => ({
    remix: async (imageUrl: string, blurbText: string) => {
      setBlurb(blurbText);
      setPreview(imageUrl);
      // Convert the imageUrl (base64 data URL) to a File object
      try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const file = new File([blob], "remix-image.jpg", { type: blob.type });
        setImageFile(file);
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
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !blurb.trim() || loading) return;
    onSubmit(imageFile, blurb.trim());
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
            title="Upload product reference image"
          >
            {preview ? (
              <img src={preview} alt="Ref" className="image-pill-preview" />
            ) : (
              <Image size={18} />
            )}
            <span className="image-pill-label">
              {preview ? "Ref" : "Picture Reference"}
            </span>
            {preview && (
              <button
                type="button"
                className="image-pill-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageFile(null);
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
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
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
            disabled={!imageFile || !blurb.trim() || loading}
          >
            {loading ? (
              <div className="spinner small" />
            ) : (
              <ArrowRight size={20} />
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
});
