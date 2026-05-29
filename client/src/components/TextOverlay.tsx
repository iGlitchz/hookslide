import { useRef, useState, useCallback, useEffect, type PointerEvent } from "react";
import { X } from "lucide-react";
import type { TextOverlay as TextOverlayType } from "../types";

interface Props {
  overlay: TextOverlayType;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (updated: TextOverlayType) => void;
  onDelete: (id: string) => void;
}

export function TextOverlay({ overlay, containerRef, onUpdate, onDelete }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (editing) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        ox: overlay.x,
        oy: overlay.y,
      };
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [editing, overlay.x, overlay.y, containerRef]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100;
      const newX = Math.max(5, Math.min(95, dragStart.current.ox + dx));
      const newY = Math.max(5, Math.min(95, dragStart.current.oy + dy));
      onUpdate({ ...overlay, x: newX, y: newY });
    },
    [dragging, overlay, containerRef, onUpdate]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => {
      elRef.current?.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      if (elRef.current) {
        range.selectNodeContents(elRef.current);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  };

  const handleBlur = () => {
    setEditing(false);
    const text = elRef.current?.innerText?.trim() || overlay.text;
    if (text !== overlay.text) {
      onUpdate({ ...overlay, text });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      elRef.current?.blur();
    }
    if (e.key === "Escape") {
      elRef.current?.blur();
    }
  };

  return (
    <div
      className={`text-overlay-editable ${dragging ? "dragging" : ""} ${editing ? "editing" : ""}`}
      style={{
        left: `${overlay.x}%`,
        top: `${overlay.y}%`,
        fontSize: `${overlay.fontSize}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <div
        ref={elRef}
        className="overlay-text-content"
        contentEditable={editing}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        {overlay.text}
      </div>

      <button
        className="overlay-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(overlay.id);
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
