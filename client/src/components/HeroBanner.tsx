import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchHeroImages } from "../services/api";

export function HeroBanner({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchHeroImages().then((imgs) => {
      if (imgs.length > 0) setImages(imgs);
    });
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="hero-banner">
      {/* Background image slideshow */}
      <div className="hero-bg-slideshow">
        <AnimatePresence mode="popLayout">
          {images.length > 0 && (
            <motion.img
              key={images[currentIndex]}
              src={images[currentIndex]}
              alt=""
              className="hero-bg-image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Dark overlay for readability */}
      <div className="hero-overlay" />

      {/* Content */}
      <div className="hero-content">{children}</div>
    </div>
  );
}
