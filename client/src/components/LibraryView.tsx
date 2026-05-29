import { motion } from "framer-motion";
import type { Submission, TextOverlay } from "../types";
import { SubmissionRow } from "./SubmissionRow";

interface Props {
  submissions: Submission[];
  onCardClick: (
    submissionId: string,
    slideshowId: string
  ) => void;
  onRegenerate: (
    submissionId: string,
    slideshowId: string,
    slideIndex: 0 | 1,
    imagePrompt: string,
    blurb: string
  ) => void;
  onUpdateOverlays: (
    submissionId: string,
    slideshowId: string,
    slideIndex: 0 | 1,
    overlays: TextOverlay[]
  ) => void;
  onDelete: (submissionId: string, slideshowId: string) => void;
  onRemix: (imageUrl: string, blurb: string) => void;
}

export function LibraryView({
  submissions,
  onCardClick,
  onRegenerate,
  onUpdateOverlays,
  onDelete,
  onRemix,
}: Props) {
  if (submissions.length === 0) return null;

  return (
    <motion.div
      className="library-view"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="library-title">Your Slideshows</h2>
      {submissions.map((sub, i) => (
        <SubmissionRow
          key={sub.id}
          submission={sub}
          index={i}
          onCardClick={onCardClick}
          onDelete={onDelete}
          onRemix={onRemix}
        />
      ))}
    </motion.div>
  );
}
