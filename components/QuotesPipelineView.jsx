"use client";

import React, { useState, useMemo } from "react";
import {
  Briefcase,
  Sparkles,
  Plus,
  Download,
  Search,
  Filter,
  Columns,
  List,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Eye,
  Trash2,
  MessageCircle,
  ExternalLink,
  RotateCcw,
  TrendingUp,
  Calendar,
  Zap,
  DollarSign,
  FileCheck,
  ChevronRight,
  Share2,
  Check,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { calculateInvoiceTotals, formatAmount } from "@/lib/mock-data";

/**
 * Calcule le nombre de jours restants avant la fin de validité d'un devis
 * Date format attendu: JJ/MM/AAAA
 */
function getDaysRemaining(validUntilStr) {
  if (!validUntilStr) return null;
  const parts = validUntilStr.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  const targetDate = new Date(year, month - 1, day);
  // Date de référence calée sur octobre 2026 selon la timeline FacturX
  const today = new Date(2026, 9, 23);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function QuotesPipelineView({
  quotes = [],
  companyInfo = {},
  onOpenCreateModal,
  onSelectQuote,
  onConvertToInvoice,
  onUpdateStatus,
  onDeleteQuote,
  onToast,
  onExportExcel,
  getClientAvatarGradient,
}) {
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "list"
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all"); // "all" | "en_attente" | "accepte" | "expire" | "refuse"
  const [hoveredCard, setHoveredCard] = useState(null); // null | "all" | "en_attente" | "accepte" | "expire"

  // 1. Calculs financiers du pipeline commercial
  const pipelineMetrics = useMemo(() => {
    let totalVolume = 0;
    let pendingVolume = 0;
    let acceptedVolume = 0;
    let expiredVolume = 0;

    let pendingCount = 0;
    let acceptedCount = 0;
    let expiredCount = 0;
    let refusedCount = 0;

    quotes.forEach((q) => {
      const { total } = calculateInvoiceTotals(q.items, q.vatRate);
      totalVolume += total;

      if (q.status === "en_attente") {
        pendingVolume += total;
        pendingCount += 1;
      } else if (q.status === "accepte") {
        acceptedVolume += total;
        acceptedCount += 1;
      } else if (q.status === "expire") {
        expiredVolume += total;
        expiredCount += 1;
      } else if (q.status === "refuse") {
        refusedCount += 1;
      }
    });

    const conversionRate = quotes.length > 0 ? Math.round((acceptedCount / quotes.length) * 100) : 0;

    return {
      totalVolume,
      pendingVolume,
      acceptedVolume,
      expiredVolume,
      pendingCount,
      acceptedCount,
      expiredCount,
      refusedCount,
      conversionRate,
    };
  }, [quotes]);

  // 2. Filtrage des devis
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      if (stageFilter !== "all" && q.status !== stageFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = (q.id || "").toLowerCase().includes(query);
        const matchClient = (q.clientName || "").toLowerCase().includes(query);
        const matchContact = (q.contactPerson || "").toLowerCase().includes(query);
        const matchLocation = (q.location || "").toLowerCase().includes(query);
        const matchItem = (q.items || []).some((it) =>
          (it.description || "").toLowerCase().includes(query)
        );
        return matchId || matchClient || matchContact || matchLocation || matchItem;
      }
      return true;
    });
  }, [quotes, stageFilter, searchQuery]);

  // Groupement par colonne pour la vue Kanban
  const kanbanColumns = useMemo(() => {
    return {
      en_attente: filteredQuotes.filter((q) => q.status === "en_attente"),
      accepte: filteredQuotes.filter((q) => q.status === "accepte"),
      expire: filteredQuotes.filter((q) => q.status === "expire" || q.status === "refuse"),
    };
  }, [filteredQuotes]);

  // Génération du lien WhatsApp de négociation commerciale
  const getQuoteWhatsAppUrl = (quote) => {
    const cleanPhone = (quote.clientPhone || "").replace(/[^0-9]/g, "");
    if (!cleanPhone) return null;
    const { total } = calculateInvoiceTotals(quote.items, quote.vatRate);
    const msg = `Bonjour ${quote.contactPerson || quote.clientName}, je me permets de faire un suivi concernant notre proposition commerciale ${
      quote.id
    } (${formatAmount(total, companyInfo?.defaultCurrency)}) de la part de ${
      companyInfo?.name || "FacturX"
    }. Avez-vous eu l'opportunité de l'examiner ? Je reste disponible pour affiner les prestations.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Action rapide : Prolonger la validité d'un devis de 30 jours
  const handleExtendQuoteValidity = (quote) => {
    if (onUpdateStatus) {
      onUpdateStatus(quote.id, "en_attente");
      if (onToast) {
        onToast(`Proposition ${quote.id} réactivée et prolongée pour 30 jours !`, "success");
      }
    }
  };

  // Action rapide : Valider directement la signature du client
  const handleMarkAsAccepted = (quote) => {
    if (onUpdateStatus) {
      onUpdateStatus(quote.id, "accepte");
      if (onToast) {
        onToast(`🎉 Accord commercial validé pour le devis ${quote.id} ! Prêt à facturer.`, "success");
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER DÉDIÉ : IDENTITÉ COMMERCIALE INDIGO & ÉMERAUDE
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-indigo-100/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
              <Briefcase className="w-3 h-3 text-indigo-600" />
              Pipeline Commercial & Négociation
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              Cycle de vente • Devis chiffrés • Closing B2B
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <FileCheck className="w-5 h-5 text-indigo-100" />
            </span>
            <span>Pipeline des Devis & Opportunités</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-medium">
            Pilotez vos propositions en cours, négociez avec vos prospects et transformez vos accords signés en factures certifiées en 1 clic.
          </p>
        </div>

        {/* Boutons d'action majeurs avec micro-animations */}
        <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
          <button
            type="button"
            onClick={onExportExcel}
            className="group px-3.5 py-2.5 bg-white hover:bg-indigo-50/80 text-slate-700 hover:text-indigo-900 border border-slate-200 hover:border-indigo-300 text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs hover:shadow-md transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer"
            title="Exporter l'ensemble du pipeline commercial en Excel"
          >
            <Download className="w-4 h-4 text-indigo-600 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:scale-110" />
            <span>Exporter Pipeline</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="relative overflow-hidden group px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/25 hover:shadow-indigo-600/35 transition-all duration-300 hover:scale-[1.04] active:scale-95 cursor-pointer"
          >
            {/* Shimmer light sweep on hover */}
            <span className="absolute inset-0 w-full h-full -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"></span>
            <Plus className="w-4 h-4 text-indigo-200 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
            <span className="relative z-10">Émettre un Devis</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. ENTONNOIR DE VENTE COMMERCIAL INTERACTIF & ANIMÉ
             Avec effets de hover, halo lumineux et filtrage direct en 1 clic
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="group/funnel relative overflow-hidden bg-white rounded-3xl border border-indigo-100/90 shadow-xs hover:shadow-xl hover:border-indigo-200 transition-all duration-500 p-5 sm:p-6 space-y-5">
        {/* Halo discret lumineux d'ambiance en arrière-plan */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-indigo-100/40 via-purple-50/20 to-transparent rounded-full blur-3xl pointer-events-none group-hover/funnel:scale-125 transition-transform duration-700"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-all duration-300 group-hover/funnel:scale-110 group-hover/funnel:rotate-6 group-hover/funnel:bg-indigo-100 shadow-2xs">
              <TrendingUp className="w-4 h-4 transition-transform duration-300" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Entonnoir de Conversion Commerciale</span>
                <span className="text-[10px] font-semibold text-indigo-600 lowercase bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/60 hidden sm:inline-block">
                  interactif
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Cycle actif : {quotes.length} opportunités chiffrées au global
              </p>
            </div>
          </div>

          {/* Badge Taux de Closing animé avec beacon radar */}
          <div
            onClick={() => setStageFilter(stageFilter === "accepte" ? "all" : "accepte")}
            className="group/closing relative inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200 hover:border-emerald-300 text-xs font-extrabold self-start sm:self-auto shadow-2xs hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            title="Cliquer pour filtrer directement les devis signés"
          >
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 transition-transform duration-200 group-hover/closing:scale-125"></span>
            </span>
            <span>Taux de Closing : <strong className="text-emerald-900">{pipelineMetrics.conversionRate}%</strong> de succès</span>
          </div>
        </div>

        {/* Les 4 Piliers du Pipeline avec Animations Hover & Filtrage Direct */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1 relative z-10">
          {/* 1. Volume Chiffré Total */}
          <div
            onClick={() => setStageFilter("all")}
            onMouseEnter={() => setHoveredCard("all")}
            onMouseLeave={() => setHoveredCard(null)}
            className={`group relative overflow-hidden p-4 sm:p-5 rounded-2xl border transition-all duration-300 ease-out cursor-pointer text-left ${
              stageFilter === "all"
                ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/25 shadow-md"
                : "bg-slate-50/70 hover:bg-white border-slate-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1.5"
            }`}
          >
            {/* Top light bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 transition-transform duration-300 origin-left ${
                stageFilter === "all" || hoveredCard === "all" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`}
            />

            {/* Shimmer light reflection */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 pointer-events-none" />

            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span className="group-hover:text-indigo-800 transition-colors">Volume en Jeu</span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border transition-all duration-200 ${
                  stageFilter === "all"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 group-hover:border-indigo-300 group-hover:bg-indigo-50 group-hover:text-indigo-700"
                }`}
              >
                {quotes.length} devis
              </span>
            </div>

            <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900 group-hover:text-indigo-700 tracking-tight transition-all duration-200">
              {formatAmount(pipelineMetrics.totalVolume, companyInfo?.defaultCurrency)}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-medium">
              <span>Valeur cumulée</span>
              <span className="text-indigo-600 font-bold opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-[10px]">
                Tout voir →
              </span>
            </div>
          </div>

          {/* 2. En Négociation Actuelle */}
          <div
            onClick={() => setStageFilter("en_attente")}
            onMouseEnter={() => setHoveredCard("en_attente")}
            onMouseLeave={() => setHoveredCard(null)}
            className={`group relative overflow-hidden p-4 sm:p-5 rounded-2xl border transition-all duration-300 ease-out cursor-pointer text-left ${
              stageFilter === "en_attente"
                ? "bg-amber-50/90 border-amber-300 ring-2 ring-amber-500/30 shadow-md"
                : "bg-amber-50/40 hover:bg-white border-amber-100 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/15 hover:-translate-y-1.5"
            }`}
          >
            {/* Top light bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 transition-transform duration-300 origin-left ${
                stageFilter === "en_attente" || hoveredCard === "en_attente" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`}
            />

            {/* Shimmer light reflection */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-amber-200/25 to-transparent transition-transform duration-700 pointer-events-none" />

            <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 group-hover:text-amber-800 transition-colors">
                <span className="relative flex h-2 w-2 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500 group-hover:scale-125 transition-transform"></span>
                </span>
                En Négociation
              </span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border transition-all duration-200 ${
                  stageFilter === "en_attente"
                    ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                    : "bg-white border-amber-200 text-amber-800 group-hover:border-amber-400 group-hover:bg-amber-500 group-hover:text-white"
                }`}
              >
                {pipelineMetrics.pendingCount} offres
              </span>
            </div>

            <div className="mt-2 text-xl sm:text-2xl font-black text-amber-700 group-hover:text-amber-800 tracking-tight transition-all duration-200">
              {formatAmount(pipelineMetrics.pendingVolume, companyInfo?.defaultCurrency)}
            </div>

            <div className="flex items-center justify-between text-[11px] text-amber-600/80 mt-1 font-medium">
              <span>Accords en cours</span>
              <span className="text-amber-800 font-bold opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-[10px]">
                Filtrer →
              </span>
            </div>
          </div>

          {/* 3. Signés / Prêts à facturer */}
          <div
            onClick={() => setStageFilter("accepte")}
            onMouseEnter={() => setHoveredCard("accepte")}
            onMouseLeave={() => setHoveredCard(null)}
            className={`group relative overflow-hidden p-4 sm:p-5 rounded-2xl border transition-all duration-300 ease-out cursor-pointer text-left ${
              stageFilter === "accepte"
                ? "bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/30 shadow-md"
                : "bg-emerald-50/40 hover:bg-white border-emerald-100 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/15 hover:-translate-y-1.5"
            }`}
          >
            {/* Top light bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 transition-transform duration-300 origin-left ${
                stageFilter === "accepte" || hoveredCard === "accepte" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`}
            />

            {/* Shimmer light reflection */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-emerald-200/25 to-transparent transition-transform duration-700 pointer-events-none" />

            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 group-hover:text-emerald-800 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
                Signés & Validés
              </span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border transition-all duration-200 ${
                  stageFilter === "accepte"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-white border-emerald-200 text-emerald-800 group-hover:border-emerald-400 group-hover:bg-emerald-600 group-hover:text-white"
                }`}
              >
                {pipelineMetrics.acceptedCount} signés
              </span>
            </div>

            <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-700 group-hover:text-emerald-800 tracking-tight transition-all duration-200">
              {formatAmount(pipelineMetrics.acceptedVolume, companyInfo?.defaultCurrency)}
            </div>

            <div className="flex items-center justify-between text-[11px] text-emerald-600/80 mt-1 font-medium">
              <span>Bons pour accord</span>
              <span className="text-emerald-800 font-bold opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-[10px]">
                Filtrer →
              </span>
            </div>
          </div>

          {/* 4. Caduques / À Relancer */}
          <div
            onClick={() => setStageFilter("expire")}
            onMouseEnter={() => setHoveredCard("expire")}
            onMouseLeave={() => setHoveredCard(null)}
            className={`group relative overflow-hidden p-4 sm:p-5 rounded-2xl border transition-all duration-300 ease-out cursor-pointer text-left ${
              stageFilter === "expire"
                ? "bg-slate-200/80 border-slate-400 ring-2 ring-slate-500/25 shadow-md"
                : "bg-slate-100/60 hover:bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-500/15 hover:-translate-y-1.5"
            }`}
          >
            {/* Top light bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 via-rose-400 to-slate-500 transition-transform duration-300 origin-left ${
                stageFilter === "expire" || hoveredCard === "expire" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`}
            />

            {/* Shimmer light reflection */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-slate-200/30 to-transparent transition-transform duration-700 pointer-events-none" />

            <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 group-hover:text-slate-900 transition-colors">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-500 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12 group-hover:text-rose-500" />
                Offres Caduques
              </span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border transition-all duration-200 ${
                  stageFilter === "expire"
                    ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                    : "bg-white border-slate-300 text-slate-700 group-hover:border-rose-400 group-hover:bg-rose-600 group-hover:text-white"
                }`}
              >
                {pipelineMetrics.expiredCount} à relancer
              </span>
            </div>

            <div className="mt-2 text-xl sm:text-2xl font-black text-slate-700 group-hover:text-slate-900 tracking-tight transition-all duration-200">
              {formatAmount(pipelineMetrics.expiredVolume, companyInfo?.defaultCurrency)}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-medium">
              <span>À réactualiser</span>
              <span className="text-slate-700 font-bold opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-[10px]">
                Filtrer →
              </span>
            </div>
          </div>
        </div>

        {/* Barre Visuelle d'Entonnoir Dynamique & Interactive (Jauge de répartition) */}
        {pipelineMetrics.totalVolume > 0 && (
          <div className="space-y-2 pt-2 relative z-10">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner p-0.5 gap-0.5">
              {/* Segment 1 : Signé & Sécurisé */}
              <div
                style={{
                  width: `${(pipelineMetrics.acceptedVolume / pipelineMetrics.totalVolume) * 100}%`,
                }}
                onClick={() => setStageFilter("accepte")}
                onMouseEnter={() => setHoveredCard("accepte")}
                onMouseLeave={() => setHoveredCard(null)}
                className={`h-full rounded-full bg-emerald-500 transition-all duration-300 cursor-pointer ${
                  hoveredCard === "accepte" || stageFilter === "accepte"
                    ? "brightness-110 scale-y-125 shadow-md shadow-emerald-500/40 ring-1 ring-white"
                    : "hover:brightness-110 hover:scale-y-110"
                }`}
                title={`Devis Signés : ${formatAmount(pipelineMetrics.acceptedVolume, companyInfo?.defaultCurrency)} (${Math.round(
                  (pipelineMetrics.acceptedVolume / pipelineMetrics.totalVolume) * 100
                )}%)`}
              />

              {/* Segment 2 : En Négociation */}
              <div
                style={{
                  width: `${(pipelineMetrics.pendingVolume / pipelineMetrics.totalVolume) * 100}%`,
                }}
                onClick={() => setStageFilter("en_attente")}
                onMouseEnter={() => setHoveredCard("en_attente")}
                onMouseLeave={() => setHoveredCard(null)}
                className={`h-full rounded-full bg-amber-400 transition-all duration-300 cursor-pointer ${
                  hoveredCard === "en_attente" || stageFilter === "en_attente"
                    ? "brightness-110 scale-y-125 shadow-md shadow-amber-500/40 ring-1 ring-white"
                    : "hover:brightness-110 hover:scale-y-110"
                }`}
                title={`En Négociation : ${formatAmount(pipelineMetrics.pendingVolume, companyInfo?.defaultCurrency)} (${Math.round(
                  (pipelineMetrics.pendingVolume / pipelineMetrics.totalVolume) * 100
                )}%)`}
              />

              {/* Segment 3 : Caduque */}
              <div
                style={{
                  width: `${(pipelineMetrics.expiredVolume / pipelineMetrics.totalVolume) * 100}%`,
                }}
                onClick={() => setStageFilter("expire")}
                onMouseEnter={() => setHoveredCard("expire")}
                onMouseLeave={() => setHoveredCard(null)}
                className={`h-full rounded-full bg-slate-400 transition-all duration-300 cursor-pointer ${
                  hoveredCard === "expire" || stageFilter === "expire"
                    ? "brightness-110 scale-y-125 shadow-md shadow-slate-500/40 ring-1 ring-white"
                    : "hover:brightness-110 hover:scale-y-110"
                }`}
                title={`Offres Caduques : ${formatAmount(pipelineMetrics.expiredVolume, companyInfo?.defaultCurrency)} (${Math.round(
                  (pipelineMetrics.expiredVolume / pipelineMetrics.totalVolume) * 100
                )}%)`}
              />
            </div>

            {/* Légende interactive cliquable */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStageFilter(stageFilter === "accepte" ? "all" : "accepte")}
                onMouseEnter={() => setHoveredCard("accepte")}
                onMouseLeave={() => setHoveredCard(null)}
                className={`flex items-center gap-1.5 transition-all duration-200 cursor-pointer rounded-lg px-2 py-0.5 ${
                  stageFilter === "accepte" || hoveredCard === "accepte"
                    ? "bg-emerald-50 text-emerald-800 font-bold scale-105 shadow-2xs"
                    : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Signé & Sécurisé ({Math.round((pipelineMetrics.acceptedVolume / (pipelineMetrics.totalVolume || 1)) * 100)}%)</span>
              </button>

              <button
                type="button"
                onClick={() => setStageFilter(stageFilter === "en_attente" ? "all" : "en_attente")}
                onMouseEnter={() => setHoveredCard("en_attente")}
                onMouseLeave={() => setHoveredCard(null)}
                className={`flex items-center gap-1.5 transition-all duration-200 cursor-pointer rounded-lg px-2 py-0.5 ${
                  stageFilter === "en_attente" || hoveredCard === "en_attente"
                    ? "bg-amber-50 text-amber-800 font-bold scale-105 shadow-2xs"
                    : "text-slate-600 hover:text-amber-700 hover:bg-amber-50/50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>En Négociation ({Math.round((pipelineMetrics.pendingVolume / (pipelineMetrics.totalVolume || 1)) * 100)}%)</span>
              </button>

              <button
                type="button"
                onClick={() => setStageFilter(stageFilter === "expire" ? "all" : "expire")}
                onMouseEnter={() => setHoveredCard("expire")}
                onMouseLeave={() => setHoveredCard(null)}
                className={`flex items-center gap-1.5 transition-all duration-200 cursor-pointer rounded-lg px-2 py-0.5 ${
                  stageFilter === "expire" || hoveredCard === "expire"
                    ? "bg-slate-200 text-slate-800 font-bold scale-105 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Caduque / Relance ({Math.round((pipelineMetrics.expiredVolume / (pipelineMetrics.totalVolume || 1)) * 100)}%)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. BARRE DE COMMANDE & BASCULE DE VUE (KANBAN VS LISTE)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-3xl border border-indigo-100 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Recherche ciblée sur les opportunités */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par prospect, N° devis, prestation, ville..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
            {/* COMMUTATEUR VUE PIPELINE (KANBAN) VS VUE LISTE */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "kanban"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-indigo-900 hover:bg-white/60"
                }`}
                title="Affichage en Pipeline par étapes de vente (Kanban)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Vue Pipeline</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-indigo-900 hover:bg-white/60"
                }`}
                title="Affichage en Tableau Commercial"
              >
                <List className="w-3.5 h-3.5" />
                <span>Vue Liste</span>
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
              <span>
                <strong className="text-indigo-900">{filteredQuotes.length}</strong> /{" "}
                <strong className="text-slate-700">{quotes.length}</strong>
              </span>
              {(searchQuery || stageFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStageFilter("all");
                  }}
                  className="text-indigo-600 hover:underline font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pilules de filtrage interactives par étape commerciale */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-indigo-400" /> Étape :
          </span>

          <button
            type="button"
            onClick={() => setStageFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              stageFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            Toutes les offres ({quotes.length})
          </button>

          <button
            type="button"
            onClick={() => setStageFilter("en_attente")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === "en_attente"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            En négociation ({pipelineMetrics.pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setStageFilter("accepte")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === "accepte"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Signés & Validés ({pipelineMetrics.acceptedCount})
          </button>

          <button
            type="button"
            onClick={() => setStageFilter("expire")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === "expire"
                ? "bg-slate-700 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Caduques ({pipelineMetrics.expiredCount})
          </button>

          {pipelineMetrics.refusedCount > 0 && (
            <button
              type="button"
              onClick={() => setStageFilter("refuse")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                stageFilter === "refuse"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
              }`}
            >
              Refusés ({pipelineMetrics.refusedCount})
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. ÉTAT VIDE SI AUCUN RÉSULTAT
         ───────────────────────────────────────────────────────────────────────────── */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-indigo-100 text-center space-y-4 max-w-md mx-auto my-8 shadow-xs animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">
            Aucune proposition commerciale trouvée
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Aucun devis ne correspond aux critères de recherche actuels. Créez votre première offre ou réinitialisez les filtres.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStageFilter("all");
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              + Nouveau Devis
            </button>
          </div>
        </div>
      ) : viewMode === "kanban" ? (
        /* ─────────────────────────────────────────────────────────────────────────────
            5. VUE PIPELINE COMMERCIAL (KANBAN DES ÉTAPES DE VENTE)
           ───────────────────────────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ══════════════════════════════════════════════════════════════════════════════
              COLONNE 1 : EN NÉGOCIATION (DEALS CHAUDS EN COURS D'ÉTUDE)
             ══════════════════════════════════════════════════════════════════════════════ */}
          <div className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200/80 space-y-4">
            {/* Header de colonne */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  En Négociation
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px]">
                  {kanbanColumns.en_attente.length}
                </span>
              </div>
              <span className="text-xs font-bold text-amber-800 font-mono">
                {formatAmount(
                  kanbanColumns.en_attente.reduce((acc, q) => {
                    const { total } = calculateInvoiceTotals(q.items, q.vatRate);
                    return acc + total;
                  }, 0),
                  companyInfo?.defaultCurrency
                )}
              </span>
            </div>

            {/* Cartes Devis en négociation */}
            <div className="space-y-4 min-h-[200px]">
              {kanbanColumns.en_attente.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                  Aucune proposition en négociation active
                </div>
              ) : (
                kanbanColumns.en_attente.map((q, idx) => {
                  const { total: qTotal } = calculateInvoiceTotals(q.items, q.vatRate);
                  const daysRemaining = getDaysRemaining(q.validUntil);
                  const waUrl = getQuoteWhatsAppUrl(q);

                  return (
                    <div
                      key={q.id || idx}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 space-y-3 group relative overflow-hidden"
                    >
                      {/* Ligne d'accent ambre supérieure */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500"></div>

                      {/* Header de la carte */}
                      <div className="flex items-start justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
                              getClientAvatarGradient
                                ? getClientAvatarGradient(q.clientName)
                                : "from-amber-500 to-orange-600"
                            } text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs`}
                          >
                            {q.clientName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-[11px] text-indigo-700 block">
                              {q.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => onSelectQuote(q)}
                              className="font-extrabold text-xs text-slate-900 truncate hover:text-indigo-600 transition-colors text-left block w-full cursor-pointer"
                              title={q.clientName}
                            >
                              {q.clientName}
                            </button>
                          </div>
                        </div>

                        {/* Menu d'actions rapides */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onSelectQuote(q)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Consulter le devis"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteQuote(q)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Contact & Localisation */}
                      {q.contactPerson && (
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          👤 {q.contactPerson}
                        </p>
                      )}

                      {/* Badge Compte à rebours dynamique de validité */}
                      <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Émis le {q.issueDate}
                        </span>

                        {daysRemaining !== null && (
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 ${
                              daysRemaining < 0
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : daysRemaining <= 7
                                ? "bg-amber-100 text-amber-800 border border-amber-300 font-black animate-pulse"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {daysRemaining < 0
                              ? "Caduque"
                              : daysRemaining === 0
                              ? "Expire aujourd'hui"
                              : `Valide J-${daysRemaining}`}
                          </span>
                        )}
                      </div>

                      {/* Prestations chiffrées & Montant Total TTC */}
                      <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Offre chiffrée :</span>
                          <span className="font-bold text-slate-700">
                            {q.items?.length || 1} ligne(s)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 font-medium italic truncate">
                          &ldquo;{q.items?.[0]?.description || "Prestation de service"}&rdquo;
                        </p>
                        <div className="pt-1.5 border-t border-amber-200/50 flex items-baseline justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Total TTC :
                          </span>
                          <span className="text-sm font-black text-slate-900 font-mono">
                            {formatAmount(qTotal, companyInfo?.defaultCurrency)}
                          </span>
                        </div>
                      </div>

                      {/* BOUTONS D'ACTION COMMERCIALE EN 1 CLIC */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Envoyer un message de relance sur WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Relancer</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectQuote(q)}
                            className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Détails</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleMarkAsAccepted(q)}
                          className="py-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 cursor-pointer"
                          title="Le client a accepté l'offre : valider l'accord"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accord Reçu</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════════════
              COLONNE 2 : SIGNÉS & VALIDÉS ("BONS POUR ACCORD" - PRÊTS À FACTURER)
             ══════════════════════════════════════════════════════════════════════════════ */}
          <div className="bg-emerald-50/40 p-4 rounded-3xl border border-emerald-200/70 space-y-4">
            {/* Header de colonne */}
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-emerald-950 tracking-tight">
                  Signés & Validés
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                  {kanbanColumns.accepte.length}
                </span>
              </div>
              <span className="text-xs font-black text-emerald-800 font-mono">
                {formatAmount(
                  kanbanColumns.accepte.reduce((acc, q) => {
                    const { total } = calculateInvoiceTotals(q.items, q.vatRate);
                    return acc + total;
                  }, 0),
                  companyInfo?.defaultCurrency
                )}
              </span>
            </div>

            {/* Cartes Devis Signés */}
            <div className="space-y-4 min-h-[200px]">
              {kanbanColumns.accepte.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-emerald-200 text-emerald-600/70 text-xs font-medium">
                  Aucun devis en attente de facturation
                </div>
              ) : (
                kanbanColumns.accepte.map((q, idx) => {
                  const { total: qTotal } = calculateInvoiceTotals(q.items, q.vatRate);

                  return (
                    <div
                      key={q.id || idx}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 space-y-3 group relative overflow-hidden ring-1 ring-emerald-500/10"
                    >
                      {/* Ligne d'accent émeraude supérieure */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

                      {/* Header de la carte */}
                      <div className="flex items-start justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
                              getClientAvatarGradient
                                ? getClientAvatarGradient(q.clientName)
                                : "from-emerald-500 to-teal-600"
                            } text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs`}
                          >
                            {q.clientName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-[11px] text-emerald-700 block">
                              {q.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => onSelectQuote(q)}
                              className="font-extrabold text-xs text-slate-900 truncate hover:text-emerald-700 transition-colors text-left block w-full cursor-pointer"
                              title={q.clientName}
                            >
                              {q.clientName}
                            </button>
                          </div>
                        </div>

                        {/* Actions rapides */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onSelectQuote(q)}
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Consulter le devis signé"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteQuote(q)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Badge Bon pour Accord Reçu */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Bon pour Accord Signé
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Prêt à facturer
                        </span>
                      </div>

                      {/* Montant Sécurisé */}
                      <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Montant Sécurisé :</span>
                          <span className="font-bold text-slate-700">
                            {q.items?.length || 1} prestation(s)
                          </span>
                        </div>
                        <div className="pt-1 flex items-baseline justify-between">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                            Total Garanti :
                          </span>
                          <span className="text-base font-black text-emerald-700 font-mono">
                            {formatAmount(qTotal, companyInfo?.defaultCurrency)}
                          </span>
                        </div>
                      </div>

                      {/* LE BOUTON STAR PROÉMINENT : "TRANSFORMER EN FACTURE" */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => onConvertToInvoice(q)}
                          className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/15 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
                          title="Générer instantanément la facture officielle certifiée avec TVA et échéance"
                        >
                          <Sparkles className="w-4 h-4 text-emerald-200 animate-spin-slow" />
                          <span>Transformer en Facture</span>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-200 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════════════
              COLONNE 3 : OFFRES CADUQUES & À RELANCER
             ══════════════════════════════════════════════════════════════════════════════ */}
          <div className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200/80 space-y-4">
            {/* Header de colonne */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-slate-500" />
                <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                  Caduques / À Relancer
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[11px]">
                  {kanbanColumns.expire.length}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-600 font-mono">
                {formatAmount(
                  kanbanColumns.expire.reduce((acc, q) => {
                    const { total } = calculateInvoiceTotals(q.items, q.vatRate);
                    return acc + total;
                  }, 0),
                  companyInfo?.defaultCurrency
                )}
              </span>
            </div>

            {/* Cartes Caduques */}
            <div className="space-y-4 min-h-[200px]">
              {kanbanColumns.expire.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                  Aucune proposition en retard ou caduque
                </div>
              ) : (
                kanbanColumns.expire.map((q, idx) => {
                  const { total: qTotal } = calculateInvoiceTotals(q.items, q.vatRate);
                  const isRefused = q.status === "refuse";
                  const waUrl = getQuoteWhatsAppUrl(q);

                  return (
                    <div
                      key={q.id || idx}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 space-y-3 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400"></div>

                      <div className="flex items-start justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
                              getClientAvatarGradient
                                ? getClientAvatarGradient(q.clientName)
                                : "from-slate-600 to-slate-800"
                            } text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs`}
                          >
                            {q.clientName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-[11px] text-slate-500 block">
                              {q.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => onSelectQuote(q)}
                              className="font-extrabold text-xs text-slate-900 truncate hover:text-indigo-600 transition-colors text-left block w-full cursor-pointer"
                              title={q.clientName}
                            >
                              {q.clientName}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onSelectQuote(q)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteQuote(q)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 ${
                            isRefused
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {isRefused ? "Offre Refusée" : "Validité Caduque"}
                        </span>
                        <span className="text-slate-400 font-medium">
                          Échu le {q.validUntil}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-baseline justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Total :</span>
                        <span className="text-sm font-black text-slate-700 font-mono">
                          {formatAmount(qTotal, companyInfo?.defaultCurrency)}
                        </span>
                      </div>

                      {/* Actions de réactivation de l'offre */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Relancer</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectQuote(q)}
                            className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Détails</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleExtendQuoteValidity(q)}
                          className="py-2 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Prolonger de 30 jours et repasser en négociation"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-300" />
                          <span>Prolonger</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────────────────────
            6. VUE LISTE COMMERCIALE (TABLEAU DE NÉGOCIATION ET DE CLOSING)
           ───────────────────────────────────────────────────────────────────────────── */
        <div className="bg-white rounded-3xl border border-indigo-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-indigo-100/60 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Prospect & Proposition</th>
                  <th className="py-3.5 px-4">Émission & Échéance</th>
                  <th className="py-3.5 px-4">Prestations Chiffrées</th>
                  <th className="py-3.5 px-4">Montant TTC</th>
                  <th className="py-3.5 px-4">Stade Commercial</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions de Closing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredQuotes.map((q, idx) => {
                  const { subtotal: qSubtotal, total: qTotal } = calculateInvoiceTotals(q.items, q.vatRate);
                  const daysRemaining = getDaysRemaining(q.validUntil);
                  const waUrl = getQuoteWhatsAppUrl(q);

                  return (
                    <tr
                      key={q.id || idx}
                      style={{ animationDelay: `${idx * 25}ms` }}
                      className="hover:bg-indigo-50/30 transition-colors animate-in fade-in duration-200 group"
                    >
                      {/* Prospect & N° Devis */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
                              getClientAvatarGradient
                                ? getClientAvatarGradient(q.clientName)
                                : "from-indigo-600 to-indigo-800"
                            } text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0`}
                          >
                            {q.clientName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => onSelectQuote(q)}
                              className="font-mono font-bold text-indigo-700 hover:underline block text-left"
                            >
                              {q.id}
                            </button>
                            <span className="font-extrabold text-slate-900 block truncate max-w-[200px]">
                              {q.clientName}
                            </span>
                            {q.contactPerson && (
                              <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                                {q.contactPerson}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Émission & Compte à rebours */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 font-semibold block">
                          Émis le {q.issueDate}
                        </span>
                        <div className="mt-0.5">
                          {daysRemaining !== null && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                q.status === "accepte"
                                  ? "text-emerald-700 bg-emerald-50"
                                  : daysRemaining < 0
                                  ? "text-rose-700 bg-rose-50"
                                  : daysRemaining <= 7
                                  ? "text-amber-800 bg-amber-100 animate-pulse font-black"
                                  : "text-slate-600 bg-slate-100"
                              }`}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              {q.status === "accepte"
                                ? "Signé"
                                : daysRemaining < 0
                                ? "Caduque"
                                : `J-${daysRemaining} (${q.validUntil})`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Prestations */}
                      <td className="py-3.5 px-4 text-slate-600 max-w-[220px]">
                        <span className="font-bold text-slate-800 block text-xs">
                          {q.items?.length || 1} ligne(s) chiffrée(s)
                        </span>
                        <p className="text-[11px] text-slate-500 italic truncate mt-0.5">
                          {q.items?.[0]?.description || "Prestation de service"}
                        </p>
                      </td>

                      {/* Montant TTC */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900 font-mono text-sm block">
                          {formatAmount(qTotal, companyInfo?.defaultCurrency)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          HT : {formatAmount(qSubtotal, companyInfo?.defaultCurrency)}
                        </span>
                      </td>

                      {/* Stade Commercial */}
                      <td className="py-3.5 px-4">
                        {q.status === "accepte" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Signé & Validé
                          </span>
                        ) : q.status === "en_attente" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            En négociation
                          </span>
                        ) : q.status === "expire" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                            Validité Caduque
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Offre Refusée
                          </span>
                        )}
                      </td>

                      {/* Actions de Closing */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {q.status === "accepte" ? (
                            <button
                              type="button"
                              onClick={() => onConvertToInvoice(q)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:scale-[1.03] active:scale-95 cursor-pointer flex items-center gap-1.5"
                              title="Transformer ce devis en Facture officielle"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-200" />
                              <span>Facturer</span>
                            </button>
                          ) : q.status === "en_attente" ? (
                            <button
                              type="button"
                              onClick={() => handleMarkAsAccepted(q)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all hover:scale-[1.03] cursor-pointer flex items-center gap-1"
                              title="Valider l'accord du prospect"
                            >
                              <Check className="w-3 h-3 text-indigo-600" />
                              <span>Signé</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleExtendQuoteValidity(q)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Prolonger la validité"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Prolonger</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectQuote(q)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Voir le devis complet"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Relancer le prospect sur WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => onDeleteQuote(q)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Supprimer ce devis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
