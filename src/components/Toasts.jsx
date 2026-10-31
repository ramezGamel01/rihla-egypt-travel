import { CircleCheck } from "lucide-react";
import { useApp } from "../state/app.jsx";

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <CircleCheck size={18} aria-hidden="true" />
          {toast.text}
        </div>
      ))}
    </div>
  );
}
