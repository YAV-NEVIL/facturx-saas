"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  Send,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

/**
 * Panneau réutilisable d'envoi d'email transactionnel avec pièce jointe PDF
 * (Devis, Quittances de paiement, Rapports OHADA/DGI, Factures).
 */
export default function DocumentEmailComposer({
  title,
  subtitle = "Envoi direct via la passerelle email avec le PDF officiel en pièce jointe",
  defaultTo = "",
  toName = "",
  defaultSubject = "",
  defaultMessage = "",
  attachmentLabel = "Joindre le document PDF officiel",
  emailType = "custom",
  companyInfo = null,
  extraPayload = {},
  buildPdfAttachment,
  successToastPrefix = "Document envoyé par email",
  onClose,
  onToast,
  showCopyButton = false,
  recipientPlaceholder = "contact@client.cd",
}) {
  const [emailTo, setEmailTo] = useState(defaultTo || "");
  const [emailSubject, setEmailSubject] = useState(defaultSubject || "");
  const [emailBody, setEmailBody] = useState(defaultMessage || "");
  const [attachPdf, setAttachPdf] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEmailTo(defaultTo || "");
    setEmailSubject(defaultSubject || "");
    setEmailBody(defaultMessage || "");
    setFeedback(null);
  }, [defaultTo, defaultSubject, defaultMessage]);

  const handleCopyText = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(emailBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailTo || !emailTo.includes("@")) {
      setFeedback({
        type: "error",
        message: "Veuillez saisir une adresse email destinataire valide.",
      });
      return;
    }

    setIsSending(true);
    setFeedback(null);
    try {
      let pdfAttachment = null;
      if (attachPdf && typeof buildPdfAttachment === "function") {
        const pdfResult = buildPdfAttachment();
        if (pdfResult && pdfResult.base64) {
          pdfAttachment = {
            filename: pdfResult.filename,
            base64: pdfResult.base64,
          };
        }
      }

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: emailType,
          to: emailTo.trim(),
          toName: toName || emailTo.trim(),
          subject: emailSubject,
          message: emailBody,
          replyTo: companyInfo?.email || "",
          companyInfo,
          ...extraPayload,
          attachment: pdfAttachment,
        }),
      });

      const data = await res.json();

      if (res.ok && data.sentAutomatically) {
        const msg = `${successToastPrefix}${attachPdf ? " (avec PDF joint)" : ""} à ${emailTo.trim()} !`;
        setFeedback({
          type: "success",
          message: msg,
          provider: data.providerUsed,
        });
        if (onToast) onToast(msg, "success");
      } else {
        setFeedback({
          type: "warning",
          message:
            data.error ||
            "Passerelle SMTP/Brevo indisponible. Utilisez le bouton ci-dessous pour ouvrir votre messagerie.",
          mailtoUrl: data.mailtoUrl,
        });
        if (onToast) {
          onToast("Passerelle email indisponible : brouillon mailto préparé.", "info");
        }
      }
    } catch (err) {
      console.error("Erreur envoi email document:", err);
      setFeedback({
        type: "error",
        message: "Impossible de joindre le serveur d'envoi d'emails.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{title}</h4>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-200/70 cursor-pointer"
          >
            Fermer
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Email du destinataire
          </label>
          <input
            type="email"
            required
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            placeholder={recipientPlaceholder}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#183BB0]"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Objet de l&apos;email
          </label>
          <input
            type="text"
            required
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#183BB0]"
          />
        </div>
      </div>

      <div className="text-xs">
        <label className="block font-bold text-slate-700 mb-1">
          Message d&apos;accompagnement
        </label>
        <textarea
          rows={4}
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#183BB0]"
        />
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : feedback.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-start gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
          {feedback.mailtoUrl && (
            <a
              href={feedback.mailtoUrl}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Ouvrir dans la messagerie</span>
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={attachPdf}
            onChange={(e) => setAttachPdf(e.target.checked)}
            className="w-4 h-4 text-[#183BB0] rounded"
          />
          <Paperclip className="w-3.5 h-3.5 text-blue-600" />
          <span>{attachmentLabel}</span>
        </label>

        <div className="flex items-center gap-2 ml-auto">
          {showCopyButton && (
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le texte</span>
                </>
              )}
            </button>
          )}
          <button
            type="submit"
            disabled={isSending}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isSending ? "Envoi en cours..." : "Envoyer maintenant"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

