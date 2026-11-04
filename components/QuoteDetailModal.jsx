"use client";

import React from "react";
import {
  X,
  Printer,
  FileText,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Download,
  Share2,
} from "lucide-react";
import { calculateInvoiceTotals, defaultCompanyInfo, formatAmount } from "@/lib/mock-data";

export default function QuoteDetailModal({
  quote,
  isOpen,
  onClose,
  onConvertToInvoice,
  onUpdateStatus,
  companyInfo = defaultCompanyInfo,
}) {
  if (!isOpen || !quote) return null;

  const activeCompany = companyInfo || defaultCompanyInfo;
  const { subtotal, vat, total } = calculateInvoiceTotals(quote.items, quote.vatRate);

  const cleanPhone = (quote.clientPhone || "").replace(/[^0-9]/g, "");
  const whatsappMessage = `Bonjour ${quote.contactPerson || quote.clientName}, voici notre proposition chiffrée N° ${
    quote.id
  } émise par ${activeCompany.name} d'un montant de ${formatAmount(
    total,
    activeCompany.defaultCurrency
  )}. L'offre est valable jusqu'au ${quote.validUntil}. Restant à votre disposition pour toute question.`;
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepte":
        return {
          label: "DEVIS ACCEPTÉ / VALIDÉ",
          classes: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        };
      case "en_attente":
        return {
          label: "EN NÉGOCIATION",
          classes: "bg-amber-100 text-amber-800 border-amber-300",
          icon: <Clock className="w-4 h-4 text-amber-600" />,
        };
      case "refuse":
        return {
          label: "OFFRE REFUSÉE",
          classes: "bg-rose-100 text-rose-800 border-rose-300",
          icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
        };
      case "expire":
      default:
        return {
          label: "VALIDITÉ DÉPASSÉE",
          classes: "bg-slate-100 text-slate-700 border-slate-300",
          icon: <Clock className="w-4 h-4 text-slate-500" />,
        };
    }
  };

  const statusInfo = getStatusBadge(quote.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Fond obscurci */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Conteneur Modale */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full my-8 overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Barre d'actions supérieure */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-blue-200">
                  {quote.id}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusInfo.classes}`}
                >
                  {statusInfo.icon}
                  <span>{statusInfo.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Client : <strong>{quote.clientName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bouton Conversion Facture en 1 clic */}
            {quote.status !== "refuse" && (
              <button
                type="button"
                onClick={() => onConvertToInvoice(quote)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                title="Transformer ce devis en facture officielle"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Convertir en Facture</span>
              </button>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Partager le devis par WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Imprimer / Enregistrer en PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Officiel du Devis (Format Feuille A4 élégant) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-white text-slate-800">
          {/* Entête du Devis : Émetteur & Date */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                {activeCompany.logoUrl ? (
                  <img
                    src={activeCompany.logoUrl}
                    alt={activeCompany.name}
                    className="h-12 w-auto object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-white flex items-center justify-center font-extrabold text-base shadow-md">
                    {activeCompany.initials || "HG"}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {activeCompany.name}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    {activeCompany.tagline || activeCompany.subtitle}
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-2">
                <p>{activeCompany.address}</p>
                <p>
                  {activeCompany.city}, {activeCompany.country}
                </p>
                <p className="font-mono text-[10px]">
                  RCCM : {activeCompany.rccm} • NIF : {activeCompany.nif}
                </p>
                <p>
                  Tél : {activeCompany.phone} • Email : {activeCompany.email}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[240px]">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">
                Proposition Commerciale
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {quote.id}
              </h2>
              <div className="text-xs text-slate-600 space-y-1 pt-1">
                <p className="flex justify-between sm:justify-end gap-3">
                  <span className="text-slate-400">Date d&apos;émission :</span>
                  <strong>{quote.issueDate}</strong>
                </p>
                <p className="flex justify-between sm:justify-end gap-3">
                  <span className="text-slate-400">Offre valable jusqu&apos;au :</span>
                  <strong className="text-amber-700">{quote.validUntil}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Boîte Client Destinataire */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 rounded-2xl border border-blue-100 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Destinataire de l&apos;offre :
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                {quote.clientName}
              </h3>
              {quote.contactPerson && (
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  À l&apos;attention de : {quote.contactPerson}
                </p>
              )}
              <div className="text-xs text-slate-600 space-y-0.5 mt-2">
                {quote.address && <p>{quote.address}</p>}
                <p>{quote.location}</p>
                {quote.taxId && (
                  <p className="font-mono text-[11px] text-slate-500">
                    Fiscal : {quote.taxId}
                  </p>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1 sm:text-right">
              {quote.clientPhone && (
                <p className="flex items-center sm:justify-end gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-mono font-semibold">{quote.clientPhone}</span>
                </p>
              )}
              {quote.clientEmail && (
                <p className="flex items-center sm:justify-end gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>{quote.clientEmail}</span>
                </p>
              )}
            </div>
          </div>

          {/* Tableau des Prestations */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700">
                  <th className="py-3 px-4">Désignation des prestations / articles</th>
                  <th className="py-3 px-3 text-center w-16">Qté</th>
                  <th className="py-3 px-4 text-right w-36">Prix Unitaire HT</th>
                  <th className="py-3 px-4 text-right w-40">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.items.map((item, index) => {
                  const lineTotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
                  return (
                    <tr key={index} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatAmount(item.unitPrice, activeCompany.defaultCurrency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatAmount(lineTotal, activeCompany.defaultCurrency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totaux & Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Conditions et mentions */}
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                <span className="font-bold text-slate-700 block">
                  Modalités & Conditions de l&apos;offre :
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {quote.notes ||
                    "Cette offre est valable 30 jours à compter de sa date d'émission. Passé ce délai, les tarifs et disponibilités sont susceptibles de révision."}
                </p>
              </div>

              {/* Bloc Signature / Bon pour accord */}
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-[11px] text-slate-500 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-slate-700">
                    Bon pour Accord & Commande
                  </span>
                  <span className="text-[10px] text-slate-400">Date et Signature :</span>
                </div>
                <div className="h-8 border-b border-slate-300"></div>
                <p className="text-[10px] text-slate-400 text-center italic">
                  Mention manuscrite « Bon pour accord » précédée de la date et signature autorisée
                </p>
              </div>
            </div>

            {/* Récapitulatif Chiffré */}
            <div className="space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Total Hors Taxes (HT) :</span>
                <span className="font-bold font-mono">
                  {formatAmount(subtotal, activeCompany.defaultCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>TVA légale ({Math.round(quote.vatRate * 100)}%) :</span>
                <span className="font-bold font-mono">
                  {formatAmount(vat, activeCompany.defaultCurrency)}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-extrabold text-sm text-slate-900">
                  Total Devis (TTC) :
                </span>
                <span className="font-black text-xl text-[#183BB0] font-mono">
                  {formatAmount(total, activeCompany.defaultCurrency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de Modale avec Boutons de Changement d'État */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Statut du devis :</span>
            {quote.status !== "accepte" && (
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(quote.id, "accepte");
                  onClose();
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Marquer Accepté</span>
              </button>
            )}
            {quote.status !== "refuse" && (
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(quote.id, "refuse");
                  onClose();
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Marquer Refusé</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Fermer
            </button>
            <button
              onClick={() => onConvertToInvoice(quote)}
              className="px-5 py-2.5 bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Générer la Facture</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
