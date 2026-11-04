"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Banknote,
  Clock,
} from "lucide-react";
import {
  calculateInvoiceTotals,
  formatAmount,
  defaultCompanyInfo,
} from "@/lib/mock-data";

export default function RecordPaymentModal({
  isOpen,
  onClose,
  invoices = [],
  clients = [],
  companyInfo = defaultCompanyInfo,
  onSavePayment,
  preselectedInvoiceId = null,
  payments = [],
}) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentTime, setPaymentTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Virement Bancaire");
  const [bankName, setBankName] = useState("Rawbank");
  const [transactionRef, setTransactionRef] = useState("");
  const [beneficiaryAccount, setBeneficiaryAccount] = useState("");
  const [note, setNote] = useState("");
  const [autoOpenReceipt, setAutoOpenReceipt] = useState(true);
  const [formError, setFormError] = useState("");

  const currentInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  // Calcul dynamique du solde déjà réglé et du solde restant dû
  const alreadyPaid = React.useMemo(() => {
    if (!selectedInvoiceId) return 0;
    return (payments || [])
      .filter((p) => p.invoiceId === selectedInvoiceId)
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [selectedInvoiceId, payments]);

  const invoiceTotal = React.useMemo(() => {
    if (!currentInvoice) return 0;
    return calculateInvoiceTotals(currentInvoice.items, currentInvoice.vatRate).total;
  }, [currentInvoice]);

  const remainingBalance = Math.max(0, invoiceTotal - alreadyPaid);

  // Méthodes de paiement prédéfinies adaptées RDC et Afrique
  const paymentMethodsList = [
    { label: "Virement Rawbank", method: "Virement Bancaire", bank: "Rawbank", channel: "virement", icon: "🏛️" },
    { label: "Virement Equity BCDC", method: "Virement Bancaire", bank: "Equity BCDC", channel: "virement", icon: "🏦" },
    { label: "Virement TMB (Trust Merchant Bank)", method: "Virement Bancaire", bank: "TMB (Trust Merchant Bank)", channel: "virement", icon: "🏛️" },
    { label: "Mobile Money - Airtel Money Pro", method: "Mobile Money - Airtel Money", bank: "Airtel Money Pro", channel: "mobile_airtel", icon: "🔴" },
    { label: "Mobile Money - Orange Money RDC", method: "Mobile Money - Orange Money", bank: "Orange Money RDC", channel: "mobile_orange", icon: "📱" },
    { label: "Mobile Money - Vodacom M-Pesa", method: "Mobile Money - M-Pesa", bank: "Vodacom M-Pesa", channel: "mobile_mpesa", icon: "🟢" },
    { label: "Mobile Money - Wave Digital", method: "Mobile Money - Wave", bank: "Wave Digital", channel: "mobile_wave", icon: "🌊" },
    { label: "Chèque Bancaire Certifié", method: "Chèque Bancaire", bank: "Rawbank", channel: "cheque", icon: "📜" },
    { label: "Règlement en Espèces / Caisse", method: "Espèces / Caisse", bank: "Caisse Centrale", channel: "especes", icon: "💵" },
  ];

  // Initialisation à l'ouverture de la modale
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      setPaymentDate(`${dd}/${mm}/${yyyy}`);
      
      const hh = String(today.getHours()).padStart(2, "0");
      const min = String(today.getMinutes()).padStart(2, "0");
      setPaymentTime(`${hh}:${min}`);

      setBeneficiaryAccount(
        companyInfo?.iban
          ? `Rawbank CDF (${companyInfo.iban})`
          : "Rawbank Compte Principal CDF - 0100 1000 0123 4567 89"
      );

      // Si une facture est présélectionnée
      const targetId = preselectedInvoiceId || (invoices.find((i) => i.status !== "payee")?.id || "");
      setSelectedInvoiceId(targetId);

      if (targetId) {
        const found = invoices.find((i) => i.id === targetId);
        if (found) {
          const { total } = calculateInvoiceTotals(found.items, found.vatRate);
          const prevPaid = (payments || [])
            .filter((p) => p.invoiceId === targetId)
            .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
          const initialDue = Math.max(0, total - prevPaid);
          setAmount((initialDue > 0 ? initialDue : total).toString());
          setTransactionRef(`VIR-RAW-${Math.floor(100000 + Math.random() * 900000)}`);
          setNote(`Règlement de la facture ${found.id} - ${found.clientName}`);
        }
      }
      setFormError("");
    }
  }, [isOpen, preselectedInvoiceId, invoices, companyInfo, payments]);

  // Quand l'utilisateur change de facture dans la liste
  const handleSelectInvoice = (invId) => {
    setSelectedInvoiceId(invId);
    const found = invoices.find((i) => i.id === invId);
    if (found) {
      const { total } = calculateInvoiceTotals(found.items, found.vatRate);
      const prevPaid = (payments || [])
        .filter((p) => p.invoiceId === invId)
        .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const due = Math.max(0, total - prevPaid);
      setAmount((due > 0 ? due : total).toString());
      setNote(`Règlement de la facture ${found.id}`);
      if (!transactionRef) {
        setTransactionRef(`VIR-RAW-${Math.floor(100000 + Math.random() * 900000)}`);
      }
    }
  };

  const handleSelectPaymentPreset = (preset) => {
    setPaymentMethod(preset.method);
    setBankName(preset.bank);
    if (preset.channel.startsWith("mobile_")) {
      const prefix = preset.channel === "mobile_airtel" ? "AT" : preset.channel === "mobile_orange" ? "OM" : preset.channel === "mobile_mpesa" ? "MP" : "WAV";
      setTransactionRef(`${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`);
    } else if (preset.channel === "cheque") {
      setTransactionRef(`CHQ-${Math.floor(100000 + Math.random() * 900000)}`);
    } else {
      setTransactionRef(`VIR-${preset.bank.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      setFormError("Veuillez sélectionner la facture à solder.");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Veuillez indiquer un montant valide supérieur à 0.");
      return;
    }

    const receiptNum = `REC-${selectedInvoiceId.replace("FAC-", "")}`;
    const paymentId = `PAY-${selectedInvoiceId.replace("FAC-", "")}-${Date.now().toString().slice(-4)}`;

    const selectedPreset = paymentMethodsList.find(
      (p) => p.method === paymentMethod && p.bank === bankName
    ) || paymentMethodsList[0];

    const newPayment = {
      id: paymentId,
      receiptNumber: receiptNum,
      invoiceId: selectedInvoiceId,
      clientName: currentInvoice?.clientName || "Client Professionnel",
      contactPerson: currentInvoice?.contactPerson || "",
      clientEmail: currentInvoice?.clientEmail || "",
      clientPhone: currentInvoice?.clientPhone || "",
      clientTaxId: currentInvoice?.taxId || "",
      amount: parsedAmount,
      currency: "FC",
      paymentDate: paymentDate || "Aujourd'hui",
      paymentTime: paymentTime || "12:00",
      paymentMethod: paymentMethod,
      channel: selectedPreset.channel,
      bankName: bankName,
      transactionRef: transactionRef || `TXN-${Date.now().toString().slice(-6)}`,
      beneficiaryAccount: beneficiaryAccount,
      status: "valide",
      note: note || `Encaissement facture ${selectedInvoiceId}`,
      recordedBy: "Koyinsola Adeyemi (Directeur Administratif)",
    };

    onSavePayment(newPayment, { autoOpenReceipt });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Entête de la Modale */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-white">
                Enregistrer un Règlement
              </h2>
              <p className="text-xs text-blue-100">
                Imputation comptable & émission de quittance certifiée
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-100 hover:text-white hover:bg-white/15 rounded-xl transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Sélection de la Facture à solder */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Facture Concernée & Client Débiteur *
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleSelectInvoice(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">Sélectionnez la facture...</option>
              <optgroup label="Factures en attente / en retard (Prioritaires)">
                {invoices
                  .filter((inv) => inv.status !== "payee")
                  .map((inv) => {
                    const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.id} — {inv.clientName} ({formatAmount(total, "FC")}) • Échéance {inv.dueDate}
                      </option>
                    );
                  })}
              </optgroup>
              <optgroup label="Factures déjà soldées (Régularisation ou ré-encaissement)">
                {invoices
                  .filter((inv) => inv.status === "payee")
                  .map((inv) => {
                    const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
                    return (
                      <option key={inv.id} value={inv.id}>
                        [Déjà Payée] {inv.id} — {inv.clientName} ({formatAmount(total, "FC")})
                      </option>
                    );
                  })}
              </optgroup>
            </select>

            {currentInvoice && (
              <div className="mt-3 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-blue-950 block">
                      {currentInvoice.clientName}
                    </span>
                    <span className="text-blue-700/80 text-[11px]">
                      {currentInvoice.contactPerson || "Direction Financière"} • {currentInvoice.clientPhone}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-blue-600 uppercase block">
                      Statut actuel
                    </span>
                    <span className={`font-extrabold uppercase px-2 py-0.5 rounded-full text-[10px] ${
                      currentInvoice.status === "payee"
                        ? "bg-emerald-100 text-emerald-800"
                        : currentInvoice.status === "en_attente"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-orange-100 text-orange-800"
                    }`}>
                      {currentInvoice.status === "payee" ? "Soldée" : currentInvoice.status === "en_attente" ? "En retard" : "Envoyée"}
                    </span>
                  </div>
                </div>

                {/* Synthèse financière de la facture */}
                <div className="pt-2 border-t border-blue-200/50 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white/70 rounded-xl border border-blue-100/60">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Facture</span>
                    <span className="font-extrabold text-slate-900 font-mono text-xs">
                      {formatAmount(invoiceTotal, "FC")}
                    </span>
                  </div>
                  <div className="p-2 bg-white/70 rounded-xl border border-blue-100/60">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Déjà Réglé</span>
                    <span className="font-extrabold text-emerald-700 font-mono text-xs">
                      {formatAmount(alreadyPaid, "FC")}
                    </span>
                  </div>
                  <div className="p-2 bg-blue-100/60 rounded-xl border border-blue-200">
                    <span className="text-[10px] text-blue-800 font-bold block uppercase">Solde Restant Dû</span>
                    <span className="font-extrabold text-blue-950 font-mono text-xs">
                      {formatAmount(remainingBalance, "FC")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Montant et Devise */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Montant Encaissé (TTC) *
                </label>
                {currentInvoice && (
                  <button
                    type="button"
                    onClick={() => {
                      setAmount(remainingBalance > 0 ? remainingBalance.toString() : invoiceTotal.toString());
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Solde dû ({formatAmount(remainingBalance > 0 ? remainingBalance : invoiceTotal, "FC")})
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-14"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-extrabold text-xs text-slate-500 bg-slate-200/80 px-2 py-1 rounded-lg">
                  FC
                </span>
              </div>

              {/* Indicateur de bascule de statut en temps réel */}
              {currentInvoice && amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                <div className="mt-1.5">
                  {parseFloat(amount) >= remainingBalance - 0.01 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Ce versement soldera la facture (Statut ➔ Payée)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Règlement partiel (Reste dû : {formatAmount(Math.max(0, remainingBalance - parseFloat(amount)), "FC")})
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Date & Heure d&apos;Encaissement *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  placeholder="JJ/MM/AAAA"
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
                <input
                  type="text"
                  value={paymentTime}
                  onChange={(e) => setPaymentTime(e.target.value)}
                  placeholder="HH:MM"
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 3. Canaux de paiement rapides (Boutons Puces) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Canal de Paiement Prédéfini
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {paymentMethodsList.map((preset, index) => {
                const isSelected = paymentMethod === preset.method && bankName === preset.bank;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectPaymentPreset(preset)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-[1.02]"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span className="text-sm">{preset.icon}</span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Réf Transaction & Compte Récepteur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Réf. Transaction / Bordereau *
                </label>
                <button
                  type="button"
                  onClick={() => setTransactionRef(`TXN-CD-${Math.floor(100000 + Math.random() * 900000)}`)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                >
                  Générer Réf
                </button>
              </div>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Ex : VIR-RAW-884920 ou OM-892109"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Compte Récepteur
              </label>
              <input
                type="text"
                value={beneficiaryAccount}
                onChange={(e) => setBeneficiaryAccount(e.target.value)}
                placeholder="Ex : Rawbank Compte Courant CDF"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* 5. Note interne */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Note & Justificatif Comptable (Optionnel)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex : Bordereau de versement n° 4412 reçu par email."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Checkbox auto-quittance */}
          <div className="flex items-center gap-3 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
            <input
              type="checkbox"
              id="autoReceipt"
              checked={autoOpenReceipt}
              onChange={(e) => setAutoOpenReceipt(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="autoReceipt" className="text-xs font-bold text-emerald-950 cursor-pointer">
              Afficher et imprimer la quittance officielle d&apos;encaissement dès validation
            </label>
          </div>

          {/* Boutons d'Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider l&apos;Encaissement</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
