"use client";

import React, { useRef } from "react";
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Receipt,
  Building2,
  Calendar,
  CreditCard,
  ShieldCheck,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { formatAmount, numberToFrenchWords, defaultCompanyInfo } from "@/lib/mock-data";
import { generateReceiptPdf } from "@/lib/pdf-generator";

export default function PaymentReceiptModal({
  isOpen,
  onClose,
  payment,
  companyInfo = defaultCompanyInfo,
  onOpenInvoice,
  onOpenClientProfile,
}) {
  const printRef = useRef(null);

  if (!isOpen || !payment) return null;

  const effectiveCompany = companyInfo || defaultCompanyInfo;
  const currencySymbol = payment.currency || "FC";

  // Impression native de la quittance
  const handlePrint = () => {
    window.print();
  };

  const amountInWords = numberToFrenchWords(payment.amount);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Barre d'outils supérieure (masquée à l'impression) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-white">
                  Quittance Officielle d&apos;Encaissement
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PAYÉ & CERTIFIÉ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Réf : {payment.receiptNumber || payment.id} • Conforme normes OHADA / DGI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateReceiptPdf(payment, effectiveCompany)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
              title="Télécharger la quittance au format PDF vectoriel officiel"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps du Document Quittance (Prêt pour Impression et PDF) */}
        <div
          ref={printRef}
          className="p-6 sm:p-10 overflow-y-auto space-y-6 bg-white text-slate-900 print:p-8"
        >
          {/* En-tête officiel de l'Entreprise Émettrice */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-100">
            <div className="flex items-start gap-4">
              {effectiveCompany.logoUrl ? (
                <img
                  src={effectiveCompany.logoUrl}
                  alt={effectiveCompany.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1A44B8] to-[#112F85] text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                  {effectiveCompany.initials || "HG"}
                </div>
              )}
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  {effectiveCompany.name}
                </h1>
                <p className="text-xs font-semibold text-blue-600">
                  {effectiveCompany.subtitle || "Solutions Digitales & Facturation B2B"}
                </p>
                <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-500">
                  <p>{effectiveCompany.address} • {effectiveCompany.city}</p>
                  <p>
                    RCCM : <span className="font-medium text-slate-700">{effectiveCompany.rccm}</span> • 
                    NIF : <span className="font-medium text-slate-700">{effectiveCompany.nif || effectiveCompany.ninea}</span>
                  </p>
                  <p>Tél : {effectiveCompany.phone} • Email : {effectiveCompany.email}</p>
                </div>
              </div>
            </div>

            <div className="sm:text-right bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:min-w-[220px]">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2.5 py-0.5 rounded-full mb-1">
                QUITTANCE DE RÈGLEMENT
              </span>
              <p className="text-base font-extrabold text-slate-900">
                {payment.receiptNumber || payment.id}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Date : <span className="font-bold text-slate-800">{payment.paymentDate}</span>
                {payment.paymentTime && ` à ${payment.paymentTime}`}
              </p>
            </div>
          </div>

          {/* Cartouches Débiteur & Facture Liée */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Débiteur / Payeur */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                Reçu de (Débiteur)
              </span>
              <h3 className="text-sm font-extrabold text-slate-900">
                {payment.clientName}
              </h3>
              {payment.contactPerson && (
                <p className="text-xs text-slate-600 mt-0.5">
                  Représenté par : <span className="font-semibold">{payment.contactPerson}</span>
                </p>
              )}
              {payment.clientTaxId && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Identifiant : {payment.clientTaxId}
                </p>
              )}
              {payment.clientPhone && (
                <p className="text-[11px] text-slate-500">
                  Contact : {payment.clientPhone}
                </p>
              )}
            </div>

            {/* Facture soldée & Référence comptable */}
            <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
              <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block mb-2">
                En Règlement de la Facture
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-blue-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>{payment.invoiceId}</span>
                  </h4>
                  <p className="text-xs text-blue-800/80 mt-0.5">
                    {payment.note || "Prestations de services et fournitures certifiées"}
                  </p>
                </div>
                {onOpenInvoice && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenInvoice(payment.invoiceId);
                    }}
                    className="p-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 print:hidden transition-colors flex items-center gap-1"
                    title="Voir la facture d'origine"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-2 text-[11px] text-blue-900/70">
                Statut pièce : <span className="font-bold text-emerald-700">Entièrement Acquittée</span>
              </div>
            </div>
          </div>

          {/* Grand Cadre du Montant */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-teal-50/30 rounded-3xl p-6 border-2 border-emerald-500/20 text-center relative overflow-hidden">
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
              Montant Total Encaissé (TTC)
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight my-2">
              {formatAmount(payment.amount, currencySymbol)}
            </div>
            {amountInWords && (
              <p className="text-xs font-semibold text-emerald-900 italic max-w-xl mx-auto capitalize">
                « {amountInWords} Francs Congolais »
              </p>
            )}
          </div>

          {/* Détails du Paiement & Modalités Bancaires */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 border-b border-slate-200 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Modalités et Données de Télécompensation</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
              <div className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Mode de règlement :</span>
                  <span className="font-bold text-slate-900">{payment.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Banque / Émetteur :</span>
                  <span className="font-bold text-slate-900">{payment.bankName || "Rawbank"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Réf. Transaction / Bordereau :</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {payment.transactionRef || "N/A"}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Compte récepteur :</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {payment.beneficiaryAccount || effectiveCompany.iban}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Enregistré par :</span>
                  <span className="font-bold text-slate-800">{payment.recordedBy || "Direction Financière"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Rapprochement bancaire :</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Lettré et Rapproché
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tampon officiel et Signature */}
          <div className="pt-4 flex flex-col sm:flex-row justify-between items-end gap-6">
            <div className="space-y-1 text-[11px] text-slate-400 max-w-sm">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Certification OHADA / RDC</span>
              </div>
              <p>
                Cette quittance atteste le paiement libératoire définitif de la somme indiquée ci-dessus. Document certifié conforme aux écritures du grand livre de {effectiveCompany.name}.
              </p>
            </div>

            <div className="text-center sm:text-right border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50 min-w-[220px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Visa Direction Financière
              </span>
              <div className="h-14 flex items-center justify-center sm:justify-end">
                <div className="w-24 h-12 border-2 border-emerald-600 text-emerald-700 rounded-xl flex flex-col items-center justify-center rotate-[-4deg] opacity-90 shadow-sm font-black text-[9px] uppercase tracking-wider bg-emerald-50/60 p-1">
                  <span>PAYÉ & ENCAISSÉ</span>
                  <span className="text-[7px] font-bold text-emerald-800">QUITTANCE CERTIFIÉE</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-700 mt-1">
                Pour {effectiveCompany.name}
              </p>
            </div>
          </div>

        </div>

        {/* Pied de modale interactif */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500">
            Quittance horodatée électroniquement le {payment.paymentDate}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer la Quittance</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
