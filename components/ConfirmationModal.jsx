"use client";

import React from "react";
import { AlertTriangle, HelpCircle, X, Trash2, Edit3, Check } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmation requise",
  message = "Êtes-vous sûr de vouloir continuer ?",
  subtitle = "",
  confirmLabel = "Oui",
  cancelLabel = "Non",
  type = "primary", // "primary" | "danger"
  icon = null,
  zIndex = "z-[60]",
}) {
  if (!isOpen) return null;

  const isDanger = type === "danger";

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150`}>
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 text-center space-y-4">
          {/* Icon Badge */}
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg ${
              isDanger
                ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-rose-500/10"
                : type === "dark"
                ? "bg-slate-900 text-white border border-slate-800 shadow-slate-900/20"
                : "bg-blue-50 text-blue-600 border border-blue-200 shadow-blue-500/10"
            }`}
          >
            {icon ? (
              icon
            ) : isDanger ? (
              <Trash2 className="w-7 h-7" />
            ) : (
              <Edit3 className="w-7 h-7" />
            )}
          </div>

          {/* Title & Message */}
          <div className="space-y-1.5">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-sm font-semibold text-slate-700 leading-relaxed px-2">
              {message}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium px-4">
                {subtitle}
              </p>
            )}
          </div>

          {/* Action Buttons: Non / Oui */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={() => {
                onConfirm();
              }}
              className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer ${
                isDanger
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  : type === "dark"
                  ? "bg-black hover:bg-slate-800 shadow-slate-900/25"
                  : "bg-[#183BB0] hover:bg-[#122F8C] shadow-blue-900/20"
              }`}
            >
              {isDanger ? <Trash2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
