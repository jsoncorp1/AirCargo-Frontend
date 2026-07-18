"use client";

import React, { useEffect } from "react";
import { CheckCircleIcon, CloseLineIcon, AlertIcon } from "@/icons";

export type ToastType = "success" | "error" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircleIcon className="size-5 text-success-500" />,
  error: <CloseLineIcon className="size-5 text-error-500" />,
  warning: <AlertIcon className="size-5 text-warning-500" />,
};

const BG: Record<ToastType, string> = {
  success: "border-success-200 bg-success-50 dark:border-success-500/20 dark:bg-success-500/10",
  error: "border-error-200 bg-error-50 dark:border-error-500/20 dark:bg-error-500/10",
  warning: "border-warning-200 bg-warning-50 dark:border-warning-500/20 dark:bg-warning-500/10",
};

const TITLE_COLOR: Record<ToastType, string> = {
  success: "text-success-700 dark:text-success-400",
  error: "text-error-700 dark:text-error-400",
  warning: "text-warning-700 dark:text-warning-400",
};

const AUTO_DISMISS_MS = 4000;

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-md backdrop-blur-sm transition-all duration-300 animate-slide-in ${BG[toast.type]}`}
      role="alert"
    >
      <span className="mt-0.5 shrink-0">{ICONS[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${TITLE_COLOR[toast.type]}`}>{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        aria-label="Cerrar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            fillRule="evenodd" clipRule="evenodd"
            d="M6.04 16.54a1 1 0 001.42 1.42L12 13.42l4.54 4.54a1 1 0 001.42-1.42L13.42 12l4.54-4.54a1 1 0 00-1.42-1.42L12 10.58 7.46 6.04a1 1 0 00-1.42 1.42L10.58 12l-4.54 4.54z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
