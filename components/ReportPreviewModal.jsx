"use client";

import React, { useRef, useState } from "react";
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  QrCode,
  Users,
  CreditCard,
  FileSpreadsheet,
  FileDown,
  MessageCircle,
  Mail,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Send,
} from "lucide-react";
import { formatAmount, getCurrencySymbol, calculateInvoiceTotals } from "@/lib/mock-data";
import { generateReportPdf } from "@/lib/pdf-generator";

export default function ReportPreviewModal({
  isOpen,
  onClose,
  reportType = "overdue", // "all" | "overdue" | "pending" | "prospects" | "fiscal"
  reportTitle = "État Financier Officiel",
  companyInfo = {},
  userProfile = {},
  data = [],
  currency = "FC",
  onExportXLSX,
}) {
  const printAreaRef = useRef(null);

  // États pour le téléchargement PDF et le partage
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Formulaires de partage
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const compName = companyInfo.name || "HORIZON GROUPE";
  const compRccm = companyInfo.rccm || "CD/KIN/RCCM/24-B-01420";
  const compIdNat = companyInfo.idNat || "01-G4701-B89201";
  const compNif = companyInfo.nif || companyInfo.ninea || "A2408912Z";
  const compPhone = companyInfo.phone || "+243 81 000 40 50";
  const compEmail = companyInfo.email || "contact@facturx.cd";
  const compAddress = companyInfo.address || "Boulevard du 30 Juin, Gombe, Kinshasa";
  const printDate = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const auditId = `AUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const totalConsolidated = data.reduce(
    (acc, row) => acc + (row.totalAmount || row.total || 0),
    0
  );

  // Action d'impression native (A4)
  const handlePrint = () => {
    window.print();
  };

  // 1. Action : Téléchargement PDF Direct
  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    try {
      const ok = generateReportPdf({
        title: reportTitle,
        reportType,
        companyInfo,
        userProfile,
        data,
        currency,
        auditId,
        printDate,
      });
      if (ok) {
        setDownloadSuccess(true);
      }
    } catch (err) {
      console.error("Erreur lors de la génération du PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Action : Message WhatsApp pré-formaté
  const getWhatsAppMessage = () => {
    return `📊 *RAPPORT OFFICIEL FACTURX — CERTIFIÉ OHADA / DGI*
🏢 *Entreprise :* ${compName}
📋 *Intitulé :* ${reportTitle}
🔢 *Réf. Audit :* ${auditId}
📅 *Date :* ${printDate}
👥 *Lignes analysées :* ${data.length} enregistrements
💰 *Total consolidé :* ${formatAmount(totalConsolidated, currency)}

✅ *Statut :* Document conforme et validé par l'Administration FacturX.
📄 Le rapport PDF officiel haute fidélité a été généré et peut être transmis en pièce jointe.

_Généré via FacturX SaaS — Système de Gestion & Facturation OHADA_`;
  };

  const handleOpenWhatsApp = () => {
    const text = getWhatsAppMessage();
    const cleanPhone = whatsappPhone.replace(/[^0-9]/g, "");
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(getWhatsAppMessage());
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  // 3. Action : Email pré-formaté
  const defaultEmailSubject = `[FacturX] Rapport Officiel : ${reportTitle} (Réf: ${auditId})`;
  const getEmailBody = () => {
    return `Bonjour,

Veuillez trouver ci-dessous la synthèse officielle du rapport généré depuis la plateforme FacturX :

RÉSUMÉ EXÉCUTIF DU RAPPORT :
---------------------------------------------
• Document : ${reportTitle}
• Émetteur : ${compName}
• Réf. d'Audit Unique : ${auditId}
• Date d'émission : ${printDate}
• Volume d'enregistrements : ${data.length}
• Total financier consolidé : ${formatAmount(totalConsolidated, currency)}
• Certification légale : Conforme aux normes OHADA / Direction Générale des Impôts (DGI)

Le document officiel au format PDF haute fidélité a été généré. Veuillez trouver le fichier correspondant joint à cet envoi pour vos archives et obligations fiscales.

Restant à votre disposition pour toute information complémentaire.

Cordialement,
${userProfile.name || "Administration FacturX"}
${compName} — Service Financier & Recouvrement
Tél : ${compPhone} • Email : ${compEmail}`;
  };

  const handleOpenEmail = () => {
    const subject = emailSubject.trim() || defaultEmailSubject;
    const body = getEmailBody();
    const recipient = emailRecipient.trim();
    const mailto = recipient
      ? `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`
      : `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(getEmailBody());
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* En-tête de la Modale (Non imprimé) */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                Aperçu du Rapport Imprimable
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Certifié OHADA / DGI
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Document haute fidélité prêt à l&apos;impression, téléchargement ou transfert
              </p>
            </div>
          </div>

          {/* Boutons d'actions principaux : PDF, WhatsApp, Email, Excel, Imprimer */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* 1. Bouton Télécharger PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-sm shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Télécharger directement le rapport en format PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGeneratingPdf ? "Génération..." : "Télécharger PDF"}</span>
            </button>

            {/* 2. Bouton Transférer via WhatsApp */}
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-sm shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Transférer la synthèse du rapport via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            {/* 3. Bouton Transférer par Email */}
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Transférer le rapport par email"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>

            {/* Télécharger Excel si callback fourni */}
            {onExportXLSX && (
              <button
                onClick={onExportXLSX}
                className="hidden lg:flex px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200/80 transition-all items-center gap-1.5 cursor-pointer"
                title="Exporter les données en tableur Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            )}

            {/* Imprimer A4 */}
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Imprimer ou enregistrer au format A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>

            {/* Fermer */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              aria-label="Fermer l'aperçu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bannière d'incitation au transfert après téléchargement PDF */}
        {downloadSuccess && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Rapport PDF téléchargé avec succès !
                </p>
                <p className="text-[11px] text-emerald-700">
                  Souhaitez-vous maintenant transférer ce document officiel ?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/20"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Transférer sur WhatsApp</span>
              </button>
              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-500/20"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Envoyer par Email</span>
              </button>
              <button
                onClick={() => setDownloadSuccess(false)}
                className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-100/60 cursor-pointer ml-1"
                title="Masquer cette notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Corps Imprimable (Format A4 institutionnel) */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 print:p-0 print:overflow-visible">
          <div
            ref={printAreaRef}
            className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm print:border-none print:shadow-none print:p-0"
          >
            {/* 1. En-tête Société Officielle */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-slate-200 pb-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  {companyInfo.logoUrl ? (
                    <img
                      src={companyInfo.logoUrl}
                      alt={compName}
                      className="w-12 h-12 rounded-xl object-contain border border-slate-200 bg-white"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                      {compName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {compName}
                    </h1>
                    <p className="text-xs font-semibold text-blue-600">
                      {companyInfo.subtitle || "Solutions Digitales & Facturation Certifiée"}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                  <p>{compAddress}</p>
                  <p>
                    RCCM : <span className="font-mono text-slate-700">{compRccm}</span> | Id. Nat :{" "}
                    <span className="font-mono text-slate-700">{compIdNat}</span> | NIF :{" "}
                    <span className="font-mono text-slate-700">{compNif}</span>
                  </p>
                  <p>
                    Tél : {compPhone} • Email : {compEmail}
                  </p>
                </div>
              </div>

              {/* Bloc Référence & Date */}
              <div className="sm:text-right space-y-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none w-full sm:w-auto border sm:border-none border-slate-100">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>CONFORME DGI / OHADA</span>
                </div>
                <p className="text-xs font-bold text-slate-900 pt-1">
                  RÉF AUDIT : <span className="font-mono text-blue-600">{auditId}</span>
                </p>
                <p className="text-[11px] text-slate-500">Date d&apos;émission : {printDate}</p>
                <p className="text-[11px] text-slate-500">
                  Opérateur : {userProfile.name || "Administration FacturX"}
                </p>
              </div>
            </div>

            {/* 2. Titre Solennel du Rapport */}
            <div className="text-center py-2 bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 rounded-xl border border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">
                {reportTitle}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                État d&apos;inventaire consolidé extrait du grand livre FacturX
              </p>
            </div>

            {/* 3. Tableau des données */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">Réf / Id</th>
                    <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">Client / Débiteur</th>
                    <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">Contact & Ville</th>
                    <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">Échéance</th>
                    <th className="py-2.5 px-3 uppercase tracking-wider text-[11px] text-right">Montant TTC</th>
                    <th className="py-2.5 px-3 uppercase tracking-wider text-[11px] text-center">Situation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data && data.length > 0 ? (
                    data.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {item.id || item.ref || `DOC-${idx + 1}`}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.clientName || item.name || "Client"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.contactPerson || item.phone || item.location || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.dueDate || item.validUntil || item.issueDate || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 text-right">
                          {formatAmount(item.totalAmount || item.total || 0, currency)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === "payee"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "en_attente"
                                ? "bg-rose-100 text-rose-800"
                                : item.status === "envoyee"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {item.statusLabel || item.status || "En cours"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Aucune ligne de données enregistrée pour ce rapport.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 4. Bloc de Totalisation Financière */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  Nombre total d&apos;enregistrements :{" "}
                  <strong className="text-slate-900">{data.length}</strong>
                </p>
                <p>
                  Certification : Conforme à l&apos;Acte Uniforme OHADA relatif au droit commercial
                  général.
                </p>
              </div>

              <div className="text-right space-y-1 w-full sm:w-auto">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Total Consolidé du Rapport
                </p>
                <p className="text-2xl font-extrabold text-blue-700 tracking-tight">
                  {formatAmount(
                    data.reduce((acc, row) => acc + (row.totalAmount || row.total || 0), 0),
                    currency
                  )}
                </p>
              </div>
            </div>

            {/* 5. Bas de page certifié (Cachet & Signature) */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mentions Légales & Fiscales
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Le présent état financier est édité conformément aux normes comptables OHADA. Les
                  montants mentionnés font foi pour les déclarations auprès des directions des
                  impôts (DGI).
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    SECURE-HASH-OHADA-{auditId}
                  </span>
                </div>
              </div>

              <div className="sm:text-right space-y-1">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pour la Direction Financière
                </p>
                <div className="h-16 flex items-center justify-start sm:justify-end">
                  <div className="px-4 py-2 border border-dashed border-blue-300 rounded-xl bg-blue-50/40 text-blue-800 text-xs font-semibold italic">
                    [ Cachet Électronique & Signature FacturX ]
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  {companyInfo.name || "HORIZON GROUPE"} — Service Recouvrement
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modale */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <span className="text-xs text-slate-500">
            Astuce : Téléchargez en format <strong className="text-slate-800">PDF</strong> pour archiver, ou utilisez la combinaison <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">Ctrl + P</kbd>.
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Télécharger PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              Fermer l&apos;Aperçu
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SOUS-MODALE 1 : TRANSFERT DU RAPPORT VIA WHATSAPP                        */}
      {/* ========================================================================= */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header WhatsApp */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Transférer via WhatsApp</h3>
                  <p className="text-xs text-emerald-100">
                    Synthèse certifiée OHADA & statut FacturX
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Numéro WhatsApp du destinataire (facultatif)
                </label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="+243 81 000 00 00 ou +221 77 000 00 00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Laissez vide pour sélectionner librement un contact ou groupe dans WhatsApp.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Aperçu du message formaté
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Prêt à l&apos;envoi
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-sans text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  {getWhatsAppMessage()}
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  <strong>Astuce pièce jointe :</strong> Une fois la discussion WhatsApp ouverte,
                  glissez-déposez le fichier PDF téléchargé pour transmettre le document complet.
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={handleCopyWhatsApp}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedWhatsApp ? (
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800 font-semibold text-xs rounded-xl"
                >
                  Annuler
                </button>
                <button
                  onClick={handleOpenWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ouvrir WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SOUS-MODALE 2 : TRANSFERT DU RAPPORT PAR EMAIL                           */}
      {/* ========================================================================= */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Email */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Transférer par Email</h3>
                  <p className="text-xs text-indigo-100">
                    Courrier officiel avec synthèse & référence d&apos;audit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 rounded-lg text-indigo-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Adresse email du destinataire
                </label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="directeur.financier@entreprise.cd, contact@client.com..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Objet du message
                </label>
                <input
                  type="text"
                  value={emailSubject || defaultEmailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Corps de l&apos;email officiel
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Pré-rédigé
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-mono text-slate-700 whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
                  {getEmailBody()}
                </div>
              </div>

              <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  <strong>Pensez à joindre le PDF :</strong> Téléchargez le PDF du rapport via le
                  bouton rouge avant de cliquer sur ouvrir pour pouvoir l&apos;attacher à votre
                  email.
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={handleCopyEmail}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedEmail ? (
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800 font-semibold text-xs rounded-xl"
                >
                  Annuler
                </button>
                <button
                  onClick={handleOpenEmail}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Ouvrir dans ma messagerie</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

