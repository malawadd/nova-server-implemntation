"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "danger";
}

export default function Modal({ open, onClose, title, children, variant = "default" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        className="hybrid-surface w-full max-w-md p-6 flex flex-col gap-4 slide-up"
        style={{
          borderColor: variant === "danger" ? "var(--danger)" : undefined,
          boxShadow:
            variant === "danger"
              ? "8px 8px 0 var(--danger)"
              : undefined,
        }}
      >
        <div className="flex items-center justify-between">
          <h3
            style={{
              color: variant === "danger" ? "var(--danger)" : undefined,
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="neobrutalism-btn"
            style={{ padding: "4px 12px", fontSize: 18, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
