// A modal built on the native <dialog>, which handles focus trapping and Escape.
import { useEffect, useRef } from "react";

export default function Dialog({ open, onClose, title, children, actions }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal?.();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="dialog-body">
        <h2 id="dialog-title">{title}</h2>
        {children}
        <div className="dialog-actions">{actions}</div>
      </div>
    </dialog>
  );
}
