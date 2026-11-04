"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  Receipt,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  User,
  ArrowUpRight,
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Edit2,
  Trash2,
  RefreshCw,
  Smartphone,
  Banknote,
  DollarSign,
  Layers,
  ChevronRight,
  ShieldCheck,
  Printer,
} from "lucide-react";
import {
  formatAmount,
  calculateInvoiceTotals,
  defaultCompanyInfo,
} from "@/lib/mock-data";
import { exportPaymentsToXLSX } from "@/lib/export-utils";
import PaymentReceiptModal from "@/components/PaymentReceiptModal";
import RecordPaymentModal from "@/components/RecordPaymentModal";
import EditPaymentModal from "@/components/EditPaymentModal";

export default function PaymentsView({
  payments = [],
  invoices = [],
  clients = [],
  companyInfo = defaultCompanyInfo,
  onSavePayment,
  onUpdatePayment,
  onDeletePayment,
  onOpenInvoice,
  onOpenClientProfile,
  onNavigateToInvoices,
}) {
  // Filtres locaux
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all"); // 'all', 'virement', 'mobile', 'other'
  const [periodFilter, setPeriodFilter] = useState("all"); // 'all', 'month', 'quarter', 'year'
  const [copiedTxnId, setCopiedTxnId] = useState(null);

  // Modales
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [preselectedInvoiceId, setPreselectedInvoiceId] = useState(null);

  // 1. Calcul des Métriques Globales et KPIs Financiers
  const metrics = useMemo(() => {
    // Total Encaissé (Somme de tous les règlements)
    const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Reste à recouvrer (Somme des factures non payées)
    let totalPending = 0;
    let pendingCount = 0;
    invoices.forEach((inv) => {
      if (inv.status !== "payee") {
        const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
        totalPending += total;
        pendingCount += 1;
      }
    });

    const totalExpected = totalPaid + totalPending;
    const recoveryRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 1000) / 10 : 0;

    // Ventilation par canaux
    let virementAmount = 0;
    let mobileAmount = 0;
    let otherAmount = 0;

    payments.forEach((p) => {
      const ch = p.channel || "";
      if (ch === "virement" || (p.paymentMethod && p.paymentMethod.toLowerCase().includes("virement"))) {
        virementAmount += p.amount || 0;
      } else if (ch.startsWith("mobile_") || (p.paymentMethod && p.paymentMethod.toLowerCase().includes("money"))) {
        mobileAmount += p.amount || 0;
      } else {
        otherAmount += p.amount || 0;
      }
    });

    const virementPercent = totalPaid > 0 ? Math.round((virementAmount / totalPaid) * 100) : 0;
    const mobilePercent = totalPaid > 0 ? Math.round((mobileAmount / totalPaid) * 100) : 0;
    const otherPercent = totalPaid > 0 ? Math.max(0, 100 - virementPercent - mobilePercent) : 0;

    return {
      totalPaid,
      totalPending,
      pendingCount,
      recoveryRate,
      virementAmount,
      virementPercent,
      mobileAmount,
      mobilePercent,
      otherAmount,
      otherPercent,
      countPaid: payments.length,
    };
  }, [payments, invoices]);

  // 2. Filtrage des règlements
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Filtre Recherche
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchClient = (payment.clientName || "").toLowerCase().includes(query);
        const matchContact = (payment.contactPerson || "").toLowerCase().includes(query);
        const matchInvoice = (payment.invoiceId || "").toLowerCase().includes(query);
        const matchReceipt = (payment.receiptNumber || payment.id || "").toLowerCase().includes(query);
        const matchTxn = (payment.transactionRef || "").toLowerCase().includes(query);
        const matchBank = (payment.bankName || "").toLowerCase().includes(query);
        if (!matchClient && !matchContact && !matchInvoice && !matchReceipt && !matchTxn && !matchBank) {
          return false;
        }
      }

      // Filtre Canal
      if (channelFilter === "virement") {
        const isVir = payment.channel === "virement" || (payment.paymentMethod || "").toLowerCase().includes("virement");
        if (!isVir) return false;
      } else if (channelFilter === "mobile") {
        const isMob = (payment.channel || "").startsWith("mobile_") || (payment.paymentMethod || "").toLowerCase().includes("money");
        if (!isMob) return false;
      } else if (channelFilter === "other") {
        const isOther = ["cheque", "especes"].includes(payment.channel) || (payment.paymentMethod || "").toLowerCase().includes("chèque");
        if (!isOther) return false;
      }

      // Filtre Période (Mois d'octobre 2026 par défaut dans le mock)
      if (periodFilter === "month") {
        if (!payment.paymentDate?.includes("/10/2026")) return false;
      }

      return true;
    });
  }, [payments, searchQuery, channelFilter, periodFilter]);

  // Copier le numéro de transaction
  const handleCopyTxn = (txnRef, id) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(txnRef);
      setCopiedTxnId(id);
      setTimeout(() => setCopiedTxnId(null), 2000);
    }
  };

  // Exporter en fichier Excel XLSX
  const handleExportJournal = () => {
    try {
      exportPaymentsToXLSX(filteredPayments, `Journal_Encaissements_FacturX_${Date.now()}.xlsx`);
    } catch (err) {
      console.error("Erreur export journal:", err);
    }
  };

  // Gestion de la sauvegarde d'un nouveau versement
  const handleRecordPaymentSubmit = (newPayment, options = {}) => {
    onSavePayment(newPayment);
    if (options.autoOpenReceipt) {
      setSelectedPaymentForReceipt(newPayment);
    }
  };

  // Helper pour trouver les infos du client
  const getClientObject = (clientName) => {
    return clients.find(
      (c) => c.name && c.name.toLowerCase() === (clientName || "").toLowerCase()
    );
  };

  // Badge et Icône du Canal
  const renderChannelBadge = (payment) => {
    const method = (payment.paymentMethod || "").toLowerCase();
    const bank = (payment.bankName || "").toLowerCase();
    const channel = payment.channel || "";

    if (channel === "virement" || method.includes("virement")) {
      const isRawbank = bank.includes("rawbank");
      const isEquity = bank.includes("equity") || bank.includes("bcdc");
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
            isRawbank
              ? "bg-blue-50 text-blue-800 border-blue-200"
              : isEquity
              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
              : "bg-slate-100 text-slate-800 border-slate-200"
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{payment.bankName || "Virement Bancaire"}</span>
        </span>
      );
    }

    if (channel.startsWith("mobile_") || method.includes("money") || method.includes("m-pesa") || method.includes("wave")) {
      let badgeStyle = "bg-orange-50 text-orange-800 border-orange-200";
      let dotColor = "bg-orange-500";

      if (channel === "mobile_airtel" || method.includes("airtel")) {
        badgeStyle = "bg-rose-50 text-rose-800 border-rose-200";
        dotColor = "bg-rose-500";
      } else if (channel === "mobile_mpesa" || method.includes("m-pesa")) {
        badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
        dotColor = "bg-emerald-500";
      } else if (channel === "mobile_wave" || method.includes("wave")) {
        badgeStyle = "bg-cyan-50 text-cyan-800 border-cyan-200";
        dotColor = "bg-cyan-500";
      }

      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeStyle}`}>
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span>{payment.paymentMethod || payment.bankName || "Mobile Money"}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Banknote className="w-3.5 h-3.5 text-amber-600" />
        <span>{payment.paymentMethod || "Autre règlement"}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. EN-TÊTE PRINCIPAL & ACTIONS MAJEURES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Règlements & Encaissements
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/60 hidden sm:inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Direct DGI / OHADA
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Suivi en temps réel de tous les versements clients, rapprochement des flux bancaires (Rawbank, Equity BCDC) et Mobile Money pour <span className="font-semibold text-slate-700">{companyInfo.name}</span>.
          </p>
        </div>

        {/* Boutons d'Action Header */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportJournal}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 transition-all hover:border-slate-300 active:scale-95"
            title="Exporter l'historique complet des versements en format Excel"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Exporter Journal</span>
            <span className="sm:hidden">Export</span>
          </button>

          <button
            onClick={() => {
              setPreselectedInvoiceId(null);
              setIsRecordModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-2xl shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer un règlement</span>
          </button>
        </div>
      </div>

      {/* 2. RANGÉE DES 4 CARTES STATISTIQUES (KPIS FINANCIERS HAUTE FIDÉLITÉ) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* KPI 1 : Total Encaissé */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Encaissé
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 mt-2">
            {formatAmount(metrics.totalPaid, "FC")}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              +18.4%
            </span>
            <span>{metrics.countPaid} versements validés</span>
          </div>
        </div>

        {/* KPI 2 : Reste à Recouvrer */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Reste à Recouvrer
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-600 mt-2">
            {formatAmount(metrics.totalPending, "FC")}
          </p>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-slate-500 font-medium">
              {metrics.pendingCount} factures en attente
            </span>
            {onNavigateToInvoices && (
              <button
                onClick={onNavigateToInvoices}
                className="text-rose-600 hover:text-rose-800 font-bold text-[11px] hover:underline"
              >
                Voir factures →
              </button>
            )}
          </div>
        </div>

        {/* KPI 3 : Taux de Recouvrement */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taux de Recouvrement
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {metrics.recoveryRate}%
            </p>
            <span className="text-xs text-slate-500 font-medium">encaissés</span>
          </div>
          {/* Mini barre de progression */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.recoveryRate)}%` }}
            />
          </div>
        </div>

        {/* KPI 4 : Répartition des Canaux */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Canal Principal
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 mt-2 truncate">
            Virement ({metrics.virementPercent}%)
          </p>
          <div className="flex items-center gap-2 mt-2.5 text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
              Rawbank {metrics.virementPercent}%
            </span>
            <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700">
              Mobile {metrics.mobilePercent}%
            </span>
          </div>
        </div>

      </div>

      {/* 3. BARRE DE VENTILATION DES CANAUX DE RÈGLEMENT */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="font-extrabold text-slate-900">
              Répartition des Encaissements par Voie de Règlement
            </h3>
          </div>
          <span className="text-slate-500">
            Total des liquidités lettrées : <strong className="text-slate-900 font-extrabold">{formatAmount(metrics.totalPaid, "FC")}</strong>
          </span>
        </div>

        {/* Barre segmentée avec dégradés */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
          <div
            className="bg-blue-600 h-full transition-all duration-500"
            style={{ width: `${metrics.virementPercent}%` }}
            title={`Virement Bancaire : ${formatAmount(metrics.virementAmount, "FC")} (${metrics.virementPercent}%)`}
          />
          <div
            className="bg-orange-500 h-full transition-all duration-500"
            style={{ width: `${metrics.mobilePercent}%` }}
            title={`Mobile Money : ${formatAmount(metrics.mobileAmount, "FC")} (${metrics.mobilePercent}%)`}
          />
          <div
            className="bg-amber-500 h-full transition-all duration-500"
            style={{ width: `${metrics.otherPercent}%` }}
            title={`Chèques / Espèces : ${formatAmount(metrics.otherAmount, "FC")} (${metrics.otherPercent}%)`}
          />
        </div>

        {/* Puces interactives cliquables pour filtrer */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <button
            onClick={() => setChannelFilter("virement")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all ${
              channelFilter === "virement"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-blue-50/60 hover:bg-blue-100/70 text-blue-900 border-blue-100"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white" />
            <span>Virement Bancaire : {metrics.virementPercent}% ({formatAmount(metrics.virementAmount, "FC")})</span>
          </button>

          <button
            onClick={() => setChannelFilter("mobile")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all ${
              channelFilter === "mobile"
                ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                : "bg-orange-50/60 hover:bg-orange-100/70 text-orange-900 border-orange-100"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white" />
            <span>Mobile Money : {metrics.mobilePercent}% ({formatAmount(metrics.mobileAmount, "FC")})</span>
          </button>

          <button
            onClick={() => setChannelFilter("other")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all ${
              channelFilter === "other"
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 border-amber-100"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
            <span>Chèques & Caisse : {metrics.otherPercent}% ({formatAmount(metrics.otherAmount, "FC")})</span>
          </button>

          {channelFilter !== "all" && (
            <button
              onClick={() => setChannelFilter("all")}
              className="text-slate-500 hover:text-slate-800 font-bold underline ml-auto text-[11px]"
            >
              Réinitialiser le filtre
            </button>
          )}
        </div>
      </div>

      {/* 4. BARRE D'OUTILS : RECHERCHE & FILTRES RAPIDES */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Champ de recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par client, réf facture, N° quittance, transaction..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtres par boutons onglets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setChannelFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                channelFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tous ({payments.length})
            </button>
            <button
              onClick={() => setChannelFilter("virement")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                channelFilter === "virement"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Virements
            </button>
            <button
              onClick={() => setChannelFilter("mobile")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                channelFilter === "mobile"
                  ? "bg-white text-orange-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mobile Money
            </button>
            <button
              onClick={() => setChannelFilter("other")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                channelFilter === "other"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Chèques
            </button>
          </div>

          {/* Filtre Période */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes les périodes</option>
            <option value="month">Ce mois-ci (Octobre)</option>
          </select>
        </div>
      </div>

      {/* 5. TABLEAU PRINCIPAL DES ENCAISSEMENTS & HISTORIQUE DES DÉBITEURS */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Entête du tableau */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Registre Intégral des Versements
              </h3>
              <p className="text-xs text-slate-400">
                {filteredPayments.length} règlement(s) affiché(s) sur {payments.length}
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-500 hidden sm:block">
            Certifié Conforme Grand Livre OHADA
          </div>
        </div>

        {/* Contenu du Tableau */}
        {filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Débiteur & Client</th>
                  <th className="py-3.5 px-4">Facture Liée</th>
                  <th className="py-3.5 px-4">Canal & Mode</th>
                  <th className="py-3.5 px-4">Réf. Transaction</th>
                  <th className="py-3.5 px-4">Date de Règlement</th>
                  <th className="py-3.5 px-4 text-right">Montant Encaissé</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPayments.map((p) => {
                  const clientObj = getClientObject(p.clientName);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Débiteur & Client avec initiales et lien profil */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {p.clientName ? p.clientName.substring(0, 2).toUpperCase() : "CL"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {p.clientName}
                              </span>
                              {onOpenClientProfile && clientObj && (
                                <button
                                  onClick={() => onOpenClientProfile(clientObj)}
                                  className="text-slate-400 hover:text-blue-600 p-0.5"
                                  title="Ouvrir la fiche client"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {p.contactPerson || p.clientTaxId || "Client Partenaire"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Facture Liée (Cliquable pour ouvrir la facture) */}
                      <td className="py-4 px-4">
                        {onOpenInvoice ? (
                          <button
                            onClick={() => onOpenInvoice(p.invoiceId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-xs transition-colors border border-blue-200/60"
                            title="Consulter la facture d'origine"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>{p.invoiceId}</span>
                          </button>
                        ) : (
                          <span className="font-extrabold text-slate-700">
                            {p.invoiceId}
                          </span>
                        )}
                      </td>

                      {/* 3. Canal & Banque */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {renderChannelBadge(p)}
                      </td>

                      {/* 4. Référence Transaction avec Copie Rapide */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {p.transactionRef || "N/A"}
                          </span>
                          {p.transactionRef && (
                            <button
                              onClick={() => handleCopyTxn(p.transactionRef, p.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                              title="Copier la référence de télécompensation"
                            >
                              {copiedTxnId === p.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 5. Date de Règlement */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {p.paymentDate}
                        </div>
                        {p.paymentTime && (
                          <span className="text-[11px] text-slate-400">
                            à {p.paymentTime}
                          </span>
                        )}
                      </td>

                      {/* 6. Montant Encaissé */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <span className="font-black text-sm sm:text-base text-emerald-600">
                          {formatAmount(p.amount, p.currency || "FC")}
                        </span>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">
                          TTC Lettré
                        </span>
                      </td>

                      {/* 7. Statut */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Validé</span>
                        </span>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Bouton Quittance / Reçu */}
                          <button
                            onClick={() => setSelectedPaymentForReceipt(p)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-xl transition-colors flex items-center gap-1 text-[11px] border border-blue-200/80 shadow-2xs"
                            title="Afficher et imprimer la quittance officielle"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Quittance</span>
                          </button>

                          {/* Bouton Modifier */}
                          <button
                            onClick={() => setSelectedPaymentForEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                            title="Modifier ou annuler ce versement"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">
              Aucun versement ne correspond aux critères
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Essayez de réinitialiser la recherche ou changez les filtres de canal de paiement.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setChannelFilter("all");
                setPeriodFilter("all");
              }}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Afficher tous les règlements
            </button>
          </div>
        )}

      </div>

      {/* 6. MODALES INTERACTIVES */}
      {/* Modale Quittance de Paiement */}
      <PaymentReceiptModal
        isOpen={!!selectedPaymentForReceipt}
        onClose={() => setSelectedPaymentForReceipt(null)}
        payment={selectedPaymentForReceipt}
        companyInfo={companyInfo}
        onOpenInvoice={onOpenInvoice}
        onOpenClientProfile={onOpenClientProfile}
      />

      {/* Modale d'enregistrement d'un nouveau versement */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setPreselectedInvoiceId(null);
        }}
        invoices={invoices}
        clients={clients}
        companyInfo={companyInfo}
        onSavePayment={handleRecordPaymentSubmit}
        preselectedInvoiceId={preselectedInvoiceId}
        payments={payments}
      />

      {/* Modale de modification / suppression */}
      <EditPaymentModal
        isOpen={!!selectedPaymentForEdit}
        onClose={() => setSelectedPaymentForEdit(null)}
        payment={selectedPaymentForEdit}
        onUpdatePayment={onUpdatePayment}
        onDeletePayment={onDeletePayment}
      />

    </div>
  );
}
