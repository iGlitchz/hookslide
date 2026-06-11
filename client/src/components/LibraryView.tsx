import { motion } from "framer-motion";
import type { Submission } from "../types";
import { SubmissionRow } from "./SubmissionRow";

interface Props {
  submissions: Submission[];
  onCardClick: (
    submissionId: string,
    slideshowId: string
  ) => void;
  onDelete: (submissionId: string, slideshowId: string) => void;
  onRemix: (imageUrl: string, blurb: string) => void;
  onPostTikTok: (submissionId: string, slideshowId: string) => void;
}

export function LibraryView({
  submissions,
  onCardClick,
  onDelete,
  onRemix,
  onPostTikTok,
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
          onPostTikTok={onPostTikTok}
        />
      ))}
    </motion.div>
  );
}
