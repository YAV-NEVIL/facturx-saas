"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { formatAmount } from "@/lib/mock-data";

export default function EditPaymentModal({
  isOpen,
  onClose,
  payment,
  onUpdatePayment,
  onDeletePayment,
}) {
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentTime, setPaymentTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankName, setBankName] = useState("");
  const [note, setNote] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [revertInvoice, setRevertInvoice] = useState(true);

  useEffect(() => {
    if (payment) {
      setTransactionRef(payment.transactionRef || "");
      setPaymentDate(payment.paymentDate || "");
      setPaymentTime(payment.paymentTime || "");
      setPaymentMethod(payment.paymentMethod || "Virement Bancaire");
      setBankName(payment.bankName || "Rawbank");
      setNote(payment.note || "");
      setIsDeleting(false);
    }
  }, [payment]);

  if (!isOpen || !payment) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onUpdatePayment({
      ...payment,
      transactionRef,
      paymentDate,
      paymentTime,
      paymentMethod,
      bankName,
      note,
    });
    onClose();
  };

  const handleDeleteConfirm = () => {
    onDeletePayment(payment.id, payment.invoiceId, revertInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">
                Modifier le Règlement
              </h2>
              <p className="text-xs text-slate-400">
                {payment.receiptNumber || payment.id} • {payment.clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isDeleting ? (
          <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
            {/* Montant & Facture (Lecture seule) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Facture & Montant Réglé
                </span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {payment.invoiceId}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  {payment.clientName}
                </span>
              </div>
              <div className="text-right">
                <span className="font-black text-emerald-600 text-base">
                  {formatAmount(payment.amount, payment.currency || "FC")}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-[11px]">
                Mode de Paiement & Banque
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex : Virement Bancaire"
                  required
                />
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex : Rawbank / Orange Money"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-[11px]">
                Référence Transaction / Bordereau
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-blue-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-[11px]">
                  Date de Paiement
                </label>
                <input
                  type="text"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-[11px]">
                  Heure
                </label>
                <input
                  type="text"
                  value={paymentTime}
                  onChange={(e) => setPaymentTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-[11px]">
                Note / Justificatif
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1.5 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer ce règlement</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md shadow-blue-500/20"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Confirmer la suppression du règlement</p>
                <p className="mt-1 text-rose-700">
                  Voulez-vous vraiment annuler l&apos;enregistrement de ce versement de{" "}
                  <span className="font-bold">{formatAmount(payment.amount, payment.currency || "FC")}</span> pour {payment.clientName} ?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2.5">
              <input
                type="checkbox"
                id="revertInv"
                checked={revertInvoice}
                onChange={(e) => setRevertInvoice(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="revertInv" className="font-bold text-slate-700 cursor-pointer">
                Rétablir automatiquement la facture {payment.invoiceId} au statut « Envoyée / En attente »
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsDeleting(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-rose-500/20"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
