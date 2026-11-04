"use client";

import React from "react";
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
} from "lucide-react";
import { calculateInvoiceTotals, defaultCompanyInfo, formatFCFA } from "@/lib/mock-data";
import { generateInvoicePdf } from "@/lib/pdf-generator";

export default function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onMarkAsPaid,
  onOpenReminder,
  onEditInvoice,
  companyInfo = defaultCompanyInfo,
}) {
  if (!isOpen || !invoice) return null;

  const effectiveCompany = invoice.company || companyInfo || defaultCompanyInfo;

  const { subtotal, vatAmount, total } = calculateInvoiceTotals(
    invoice.items,
    invoice.vatRate
  );

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
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-base tracking-wide text-white">
              Facture {invoice.id}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.classes}`}
            >
              {statusInfo.label}
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
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

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
                      {formatFCFA(item.unitPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatFCFA(item.quantity * item.unitPrice)}
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
                  {formatFCFA(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>TVA (18%) :</span>
                <span className="font-semibold text-slate-800">
                  {formatFCFA(vatAmount)}
                </span>
              </div>

              <div className="pt-3 border-t border-blue-200/60 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span className="text-slate-800">TOTAL TTC À PAYER :</span>
                <span className="text-lg text-[#183BB0] font-black">
                  {formatFCFA(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Legal Stamp Footer */}
          <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Document généré électroniquement conforme aux dispositions fiscales régionales
            </span>
            <span>FacturX v1.0 • Page 1/1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
