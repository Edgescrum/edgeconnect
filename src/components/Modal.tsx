"use client";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  /** "center" always centers; "bottom" shows bottom-sheet on mobile, centered on sm+ */
  position?: "center" | "bottom";
  /** Custom padding for the inner card (default "p-6") */
  padding?: string;
}

export function Modal({ open, onClose, children, maxWidth = "max-w-sm", position = "center", padding = "p-6" }: ModalProps) {
  if (!open) return null;

  const positionClass = position === "bottom"
    ? "items-end justify-center sm:items-center"
    : "items-center justify-center";

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-black/40 p-4 ${positionClass}`}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl bg-card ${padding} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
