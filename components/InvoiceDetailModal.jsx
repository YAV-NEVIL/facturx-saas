"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Receipt,
  Building,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  CreditCard,
  Phone,
  Send,
  MessageCircle,
  FileEdit,
  QrCode,
  Copy,
  Check,
  Paperclip,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { calculateInvoiceTotals, defaultCompanyInfo, formatFCFA } from "@/lib/mock-data";
import { generateInvoicePdf, generateInvoicePdfBase64 } from "@/lib/pdf-generator";
import {
  ensureInvoiceDgiCertification,
  generateDgiQrMatrix,
} from "@/lib/dgi-service";

export default function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onMarkAsPaid,
  onOpenReminder,
  onEditInvoice,
  companyInfo = defaultCompanyInfo,
  onToast = null,
  initialOpenEmail = false,
}) {
  const [copiedCodeDef, setCopiedCodeDef] = useState(false);
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(Boolean(initialOpenEmail));
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [attachPdf, setAttachPdf] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusFeedback, setEmailStatusFeedback] = useState(null);

  const __cur = companyInfo?.defaultCurrency || companyInfo?.currencySymbol || "FC";

  useEffect(() => {
    if (!isOpen || !invoice) return;
    const comp = invoice.company || companyInfo || defaultCompanyInfo;
    const { total: calcTotal } = calculateInvoiceTotals(invoice.items, invoice.vatRate);
    const cert = ensureInvoiceDgiCertification(
      { ...invoice, total: calcTotal },
      comp
    );
    const coName = comp.name || "Notre entreprise";
    setEmailTo(invoice.clientEmail || "");
    setEmailSubject(`Facture normalisée ${invoice.id} — ${coName}`);
    setEmailBody(
      `Bonjour ${invoice.contactPerson || invoice.clientName || ""},\n\nVeuillez trouver ci-joint votre facture normalisée ${invoice.id} d'un montant total TTC de ${formatFCFA(
        calcTotal,
        comp?.defaultCurrency || comp?.currencySymbol || "FC"
      )} (échéance le ${invoice.dueDate}).\n\nCode de certification DGI (DEF) : ${cert.dgiCodeDef}\n\nCordialement,\n${coName}`
    );
    setAttachPdf(true);
    setEmailStatusFeedback(null);
    setIsEmailComposerOpen(Boolean(initialOpenEmail));
  }, [isOpen, invoice?.id, initialOpenEmail]);

  if (!isOpen || !invoice) return null;

  const effectiveCompany = invoice.company || companyInfo || defaultCompanyInfo;

  const { subtotal, vatAmount, total } = calculateInvoiceTotals(
    invoice.items,
    invoice.vatRate
  );

  const dgiCert = ensureInvoiceDgiCertification(
    { ...invoice, subtotal, vatAmount, total },
    effectiveCompany
  );
  const qrMatrix = generateDgiQrMatrix(dgiCert.dgiQrPayload);
  const effectiveVatPct = Math.round(
    (invoice.vatRate !== undefined ? Number(invoice.vatRate) : 0.16) * 100
  );

  const handleCopyCodeDef = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(dgiCert.dgiCodeDef);
      setCopiedCodeDef(true);
      setTimeout(() => setCopiedCodeDef(false), 2000);
    }
  };

  const handleSendInvoiceEmail = async (e) => {
    e.preventDefault();
    if (!emailTo || !emailTo.includes("@")) {
      setEmailStatusFeedback({
        type: "error",
        message: "Veuillez saisir une adresse email client valide.",
      });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatusFeedback(null);
    try {
      let pdfAttachment = null;
      if (attachPdf) {
        const pdfResult = generateInvoicePdfBase64(invoice, effectiveCompany);
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
          type: "invoice_pdf",
          to: emailTo.trim(),
          toName: invoice.clientName,
          subject: emailSubject,
          message: emailBody,
          replyTo: effectiveCompany?.email || "",
          companyInfo: effectiveCompany,
          invoice: {
            id: invoice.id,
            clientName: invoice.clientName,
            dueDate: invoice.dueDate,
            totalFormatted: formatFCFA(total, __cur),
            dgiCodeDef: dgiCert.dgiCodeDef,
          },
          attachment: pdfAttachment,
        }),
      });

      const data = await res.json();

      if (res.ok && data.sentAutomatically) {
        const msg = `Facture ${invoice.id}${attachPdf ? " (avec PDF joint)" : ""} envoyée par email à ${emailTo} !`;
        setEmailStatusFeedback({
          type: "success",
          message: msg,
          provider: data.providerUsed,
        });
        if (onToast) onToast(msg, "success");
      } else {
        setEmailStatusFeedback({
          type: "warning",
          message:
            data.error ||
            "Aucune passerelle SMTP/Resend/Brevo configurée sur le serveur. Utilisez le bouton ci-dessous pour ouvrir votre messagerie.",
          mailtoUrl: data.mailtoUrl,
        });
        if (onToast) {
          onToast("Passerelle SMTP non configurée : ouverture de l'email préparé.", "info");
        }
      }
    } catch (err) {
      console.error("Erreur envoi facture email:", err);
      setEmailStatusFeedback({
        type: "error",
        message: "Impossible de joindre le serveur d'envoi d'emails.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "payee":
        return {
          label: "PAYÉE",
          classes: "bg-emerald-100 text-emerald-800 border-emerald-300",
          desc: "Facture entièrement soldée",
        };
      case "envoyee":
        return {
          label: "ENVOYÉE",
          classes: "bg-orange-100 text-orange-800 border-orange-300",
          desc: "En attente de paiement du client",
        };
      case "en_attente":
        return {
          label: "EN RETARD",
          classes: "bg-rose-100 text-rose-800 border-rose-300",
          desc: "Échéance dépassée - relance requise",
        };
      case "brouillon":
      default:
        return {
          label: "BROUILLON",
          classes: "bg-slate-100 text-slate-800 border-slate-300",
          desc: "Non encore émise au client",
        };
    }
  };

  const statusInfo = getStatusDisplay(invoice.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 my-8 overflow-hidden">
        {/* Top Action Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-extrabold text-base tracking-wide text-white">
              Facture {invoice.id}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.classes}`}
            >
              {statusInfo.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <ShieldCheck className="w-3 h-3" />
              NORMALISÉE DGI • {dgiCert.dgiInvoiceType} • GR. {dgiCert.dgiTaxGroup}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onEditInvoice && (
              <button
                onClick={() => onEditInvoice(invoice)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-white/15"
              >
                <FileEdit className="w-3.5 h-3.5 text-blue-400" />
                <span>Modifier</span>
              </button>
            )}

            {invoice.status !== "payee" && onOpenReminder && (
              <button
                onClick={() => onOpenReminder(invoice)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Relancer le client</span>
              </button>
            )}

            {invoice.status !== "payee" && (
              <button
                onClick={() => onMarkAsPaid(invoice.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marquer payée</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={() => generateInvoicePdf(invoice, effectiveCompany)}
              className="px-3 py-1.5 bg-[#2D60FF] hover:bg-[#1E4FE8] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEmailComposerOpen((prev) => !prev)}
              className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm ${
                isEmailComposerOpen
                  ? "bg-emerald-700 ring-2 ring-emerald-300"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Envoyer par Email</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Panneau d'envoi réel d'email avec PDF joint */}
        {isEmailComposerOpen && (
          <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 animate-in fade-in duration-150">
            <form onSubmit={handleSendInvoiceEmail} className="space-y-3.5 max-w-3xl mx-auto">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Envoyer la facture {invoice.id} par email avec PDF officiel
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Transmission directe au client avec le document normalisé DGI en pièce jointe
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmailComposerOpen(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-200/70"
                >
                  Fermer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email du client destinataire
                  </label>
                  <input
                    type="email"
                    required
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="comptabilite@client.cd"
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
                  rows={3}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#183BB0]"
                />
              </div>

              {emailStatusFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    emailStatusFeedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : emailStatusFeedback.type === "warning"
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {emailStatusFeedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{emailStatusFeedback.message}</span>
                  </div>
                  {emailStatusFeedback.mailtoUrl && (
                    <a
                      href={emailStatusFeedback.mailtoUrl}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Ouvrir dans la messagerie</span>
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachPdf}
                    onChange={(e) => setAttachPdf(e.target.checked)}
                    className="w-4 h-4 text-[#183BB0] rounded"
                  />
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span>Joindre la facture normalisée PDF</span>
                </label>

                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSendingEmail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isSendingEmail
                      ? "Envoi en cours..."
                      : "Envoyer la facture par email"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Printable Invoice Sheet */}
        <div className="p-8 sm:p-12 max-h-[80vh] overflow-y-auto bg-white">
          {/* Company Branding & Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                {effectiveCompany.logoUrl ? (
                  <img
                    src={effectiveCompany.logoUrl}
                    alt={effectiveCompany.name}
                    className="w-12 h-12 rounded-xl object-contain border border-slate-200 bg-white p-1 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#183BB0] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                    {effectiveCompany.initials || "HG"}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                    {effectiveCompany.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {effectiveCompany.subtitle || "Solutions Digitales & Facturation UEMOA"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                {effectiveCompany.address}
                <br />
                {effectiveCompany.bp ? `${effectiveCompany.bp} ` : ""}{effectiveCompany.city}, {effectiveCompany.country}
                <br />
                RCCM : {effectiveCompany.rccm || "CD/KIN/RCCM/24-B-01420"} • Id. Nat : {effectiveCompany.idNat || "01-G4701-B89201"} • N° Impôt : {effectiveCompany.nif || effectiveCompany.ninea || "A2408912Z"}
                <br />
                Email : {effectiveCompany.email} • Tél : {effectiveCompany.phone}
              </p>
            </div>

            <div className="sm:text-right">
              <h1 className="text-2xl font-black text-[#183BB0] tracking-tight">
                FACTURE
              </h1>
              <p className="text-sm font-bold text-slate-800 mt-1">{invoice.id}</p>
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>
                  <span className="text-slate-400">Date d&apos;émission :</span>{" "}
                  <span className="font-semibold text-slate-800">{invoice.issueDate}</span>
                </p>
                <p>
                  <span className="text-slate-400">Date d&apos;échéance :</span>{" "}
                  <span className="font-semibold text-slate-800">{invoice.dueDate}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Client Destination Info */}
          <div className="my-8 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Facturé à (Coordonnées Client) :
              </span>
              <h4 className="font-extrabold text-slate-900 text-base">
                {invoice.clientName}
              </h4>
              {invoice.contactPerson && (
                <p className="text-xs font-semibold text-slate-700">
                  <span className="text-slate-400">Interlocuteur :</span> {invoice.contactPerson}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={`mailto:${invoice.clientEmail}`}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  {invoice.clientEmail}
                </a>
                <a
                  href={`tel:${(invoice.clientPhone || "").replace(/[^0-9]/g, "")}`}
                  className="text-xs font-bold text-slate-800 hover:text-blue-600 flex items-center gap-1.5 font-mono"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  {invoice.clientPhone || "+221 77 492 10 20"}
                </a>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                {invoice.address ? `${invoice.address}, ` : ""}{invoice.location}
              </p>
              {invoice.taxId && (
                <p className="text-[11px] text-slate-400 font-mono">
                  Identifiant fiscal : {invoice.taxId}
                </p>
              )}
            </div>

            <div className="sm:text-right flex flex-col justify-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                État du paiement :
              </span>
              <div className="inline-block sm:ml-auto">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black border ${statusInfo.classes}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{statusInfo.desc}</p>
              {invoice.status !== "payee" && onOpenReminder && (
                <div className="mt-3 sm:ml-auto">
                  <button
                    onClick={() => onOpenReminder(invoice)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs"
                  >
                    <Send className="w-3 h-3 text-amber-600" />
                    <span>Relancer ce client maintenant</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto my-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF4FD] text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Désignation</th>
                  <th className="py-3 px-4 text-center">Quantité</th>
                  <th className="py-3 px-4 text-right">Prix Unitaire HT</th>
                  <th className="py-3 px-4 text-right">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {formatFCFA(item.unitPrice, __cur)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatFCFA(item.quantity * item.unitPrice, __cur)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations & Bank Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-200">
            {/* Payment & Bank instructions */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Modalités de Règlement
              </h5>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1">
                <p>
                  <strong>Banque :</strong> {effectiveCompany.bankName || "Rawbank"}
                </p>
                <p>
                  <strong>Compte / IBAN :</strong> {effectiveCompany.iban || "CD00 RAWB 0100 1000 0123 4567 89"}
                </p>
                {(effectiveCompany.airtelMoneyNumber || effectiveCompany.waveNumber) && (
                  <p>
                    <strong>Airtel Money Pro :</strong> {effectiveCompany.airtelMoneyNumber || effectiveCompany.waveNumber}
                  </p>
                )}
                {effectiveCompany.orangeMoneyNumber && (
                  <p>
                    <strong>Orange Money Pro RDC :</strong> {effectiveCompany.orangeMoneyNumber}
                  </p>
                )}
                <p className="text-[11px] text-slate-500 pt-1">
                  Mentionner impérativement le numéro <strong>{invoice.id}</strong> en motif de virement.
                </p>
              </div>

              {invoice.notes && (
                <p className="text-xs text-slate-500 italic">
                  Note : {invoice.notes}
                </p>
              )}
            </div>

            {/* Totals Summary */}
            <div className="space-y-2 bg-[#EEF4FD]/50 p-5 rounded-2xl border border-blue-100">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Sous-total HT :</span>
                <span className="font-semibold text-slate-800">
                  {formatFCFA(subtotal, __cur)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>
                  TVA ({effectiveVatPct}% • Gr. {dgiCert.dgiTaxGroup}) :
                </span>
                <span className="font-semibold text-slate-800">
                  {formatFCFA(vatAmount, __cur)}
                </span>
              </div>

              <div className="pt-3 border-t border-blue-200/60 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span className="text-slate-800">TOTAL TTC À PAYER :</span>
                <span className="text-lg text-[#183BB0] font-black">
                  {formatFCFA(total, __cur)}
                </span>
              </div>
            </div>
          </div>

          {/* Cartouche Officiel de Sécurité DGI RDC (SFE / DEF / e-MCF) */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* QR Code Officiel 21x21 Vectoriel */}
              <div className="shrink-0 flex flex-col items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <svg
                  viewBox="0 0 21 21"
                  className="w-24 h-24 text-slate-900"
                  shapeRendering="crispEdges"
                  aria-label="QR Code de vérification DGI SFE"
                >
                  <rect width="21" height="21" fill="#FFFFFF" />
                  {qrMatrix.map((row, rIdx) =>
                    row.map((cell, cIdx) =>
                      cell ? (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx}
                          y={rIdx}
                          width="1"
                          height="1"
                          fill="#0F172A"
                        />
                      ) : null
                    )
                  )}
                </svg>
                <span className="mt-1.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <QrCode className="w-2.5 h-2.5 text-blue-600" />
                  Vérification SFE
                </span>
              </div>

              {/* Métadonnées de Certification DGI */}
              <div className="flex-1 w-full space-y-2.5 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2 pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Facture Normalisée DGI RDC — SFE / e-MCF
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    {dgiCert.dgiMode === "production"
                      ? "Certifié e-MCF Production"
                      : "Certifié SFE Homologation"}
                  </span>
                </div>

                {/* Code DEF / DGI */}
                <div className="bg-slate-900 text-white rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">
                      CODE DEF / DGI (Signature Électronique)
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-extrabold tracking-wider text-emerald-400">
                      {dgiCert.dgiCodeDef}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCodeDef}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white flex items-center gap-1 transition-colors"
                  >
                    {copiedCodeDef ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-300" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Grille NIM / ISF / Compteurs / Groupe Fiscal */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-left">
                  <div className="bg-white rounded-lg p-2 border border-slate-200/70">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      NIM (Machine SFE)
                    </span>
                    <span className="font-mono text-[11px] font-extrabold text-slate-800">
                      {dgiCert.dgiNim}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-200/70">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      ISF (Système)
                    </span>
                    <span className="font-mono text-[11px] font-extrabold text-slate-800">
                      {dgiCert.dgiIsf}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-200/70">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      Compteurs DGI
                    </span>
                    <span className="font-mono text-[11px] font-extrabold text-slate-800">
                      {dgiCert.dgiCounters}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-200/70">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      Régime Fiscal
                    </span>
                    <span className="text-[11px] font-extrabold text-blue-700">
                      {dgiCert.dgiTaxGroupLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Stamp Footer */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Facture normalisée conforme au Système de Facturation Électronique (SFE - DGI RDC & OHADA)
            </span>
            <span>FacturX SFE v2.0 • Page 1/1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
