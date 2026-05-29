import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { Submission } from "../types";
import { SlideshowCard } from "./SlideshowCard";

interface Props {
  submission: Submission;
  index: number;
  onCardClick: (submissionId: string, slideshowId: string) => void;
  onDelete: (submissionId: string, slideshowId: string) => void;
  onRemix: (imageUrl: string, blurb: string) => void;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export function SubmissionRow({ submission, index, onCardClick, onDelete, onRemix }: Props) {
  return (
    <motion.div
      className="submission-row"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="submission-label">
        <img
          src={submission.productImageUrl}
          alt="Product"
          className="submission-thumb"
        />
        <p className="submission-blurb">
          {submission.brandBlurb.length > 100
            ? submission.brandBlurb.slice(0, 100) + "..."
            : submission.brandBlurb}
        </p>
        <button
          className="remix-btn"
          onClick={() => onRemix(submission.productImageUrl, submission.brandBlurb)}
        >
          <RotateCcw size={12} />
          Remix
        </button>
      </div>

      <div className="submission-cards">
        {submission.slideshows.map((sw) => (
          <motion.div key={sw.id} variants={cardVariants}>
            <SlideshowCard
              slideshow={sw}
              onClick={() => onCardClick(submission.id, sw.id)}
              onDelete={() => onDelete(submission.id, sw.id)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
