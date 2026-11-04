"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  Calendar,
  Wallet,
  CheckCircle2,
  Plus,
  Users,
  Building2,
  FileText,
  Sparkles,
  Zap,
  Info,
} from "lucide-react";
import { formatFCFA, calculateInvoiceTotals } from "@/lib/mock-data";

export default function DashboardForecast({
  invoices = [],
  metrics,
  onNavigateToInvoices,
  onOpenCreateInvoice,
  onOpenCreateClient,
  onOpenReminder,
}) {
  // Horizon temporel sélectionné pour la simulation (7j, 15j, 30j, Trimestre)
  const [forecastHorizon, setForecastHorizon] = useState("30j");
  // Segment survolé (null | 'paid' | 'pending' | 'other')
  const [hoveredSegment, setHoveredSegment] = useState(null);
  // Position du curseur pour le tooltip dynamique
  const [cursorPos, setCursorPos] = useState(null);

  // Factures en retard ou nécessitant une attention urgente (status: en_attente ou échéance dépassée)
  const overdueInvoices = invoices.filter(
    (inv) => inv.status === "en_attente" || inv.status === "envoyee"
  );

  // Calculs proportionnels
  const totalBilled = metrics.totalBilled || 1;
  const paidPercent = Math.min(100, Math.round(((metrics.totalPaid || 0) / totalBilled) * 100));
  const pendingPercent = Math.min(
    100 - paidPercent,
    Math.round(((metrics.totalPending || 0) / totalBilled) * 100)
  );
  const remainingPercent = Math.max(0, 100 - paidPercent - pendingPercent);

  // Projections dynamiques selon l'horizon sélectionné
  const horizonData = {
    "7j": {
      label: "7 Jours",
      expectedInflow: Math.round(metrics.totalPending * 0.35),
      confidence: "95% (Échéances fermes)",
      dso: "14 jours",
      statusText: "3 virements confirmés en fin de semaine",
    },
    "15j": {
      label: "15 Jours",
      expectedInflow: Math.round(metrics.totalPending * 0.65),
      confidence: "88% (Accords clients)",
      dso: "16 jours",
      statusText: "Relances transmises avec RIB joint",
    },
    "30j": {
      label: "30 Jours",
      expectedInflow: metrics.totalPending,
      confidence: "82% (Flux régulier)",
      dso: "18 jours",
      statusText: "Cycle mensuel normal des règlements",
    },
    "90j": {
      label: "Trimestre",
      expectedInflow: Math.round(metrics.totalBilled * 1.4),
      confidence: "Prévisionnelle",
      dso: "21 jours",
      statusText: "Croissance projetée du chiffre d'affaires",
    },
  };

  const currentProjection = horizonData[forecastHorizon] || horizonData["30j"];

  // Gestion du survol avec la souris pour le curseur dynamique
  const handleBarMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width)) * 100;
    setCursorPos({ x, ratio });

    if (ratio <= paidPercent) {
      setHoveredSegment("paid");
    } else if (ratio <= paidPercent + pendingPercent) {
      setHoveredSegment("pending");
    } else {
      setHoveredSegment("other");
    }
  };

  const handleBarMouseLeave = () => {
    setCursorPos(null);
    setHoveredSegment(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. Widget Prévision de Trésorerie & Encaissements Interactif (2 colonnes) */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
        <div>
          {/* Header avec switch d'horizons interactifs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#183BB0] to-[#2D60FF] text-white flex items-center justify-center font-bold shadow-md shadow-blue-900/15 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Prévisions & Trésorerie Prévisionnelle
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Temps Réel
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Simulation des encaissements attendus en FCFA pour FacturX
                </p>
              </div>
            </div>

            {/* Sélecteur interactif d'horizon */}
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl self-start sm:self-auto border border-slate-200/80">
              {["7j", "15j", "30j", "90j"].map((h) => (
                <button
                  key={h}
                  onClick={() => setForecastHorizon(h)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    forecastHorizon === h
                      ? "bg-white text-[#183BB0] shadow-xs scale-102"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {horizonData[h].label}
                </button>
              ))}
            </div>
          </div>

          {/* Bannière de projection dynamique selon horizon */}
          <div className="mt-4 p-3.5 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 rounded-2xl border border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950 transition-all">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold">
                  Projection à {currentProjection.label} :{" "}
                  <span className="text-emerald-700 font-extrabold text-sm">
                    +{formatFCFA(currentProjection.expectedInflow)}
                  </span>
                </p>
                <p className="text-[11px] text-blue-800/80 mt-0.5">
                  {currentProjection.statusText} • Fiabilité :{" "}
                  <span className="font-semibold">{currentProjection.confidence}</span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                DSO moyen
              </span>
              <span className="text-xs font-black text-slate-900">
                {currentProjection.dso}
              </span>
            </div>
          </div>

          {/* Section Barre de Répartition avec interaction dynamique au survol */}
          <div className="mt-5 space-y-2 relative">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span>Portefeuille Global</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Survolez la barre pour inspecter les flux)
                </span>
              </span>
              <span className="text-slate-900 font-black text-sm">
                {formatFCFA(metrics.totalBilled)}
              </span>
            </div>

            {/* Conteneur de la barre avec capture de curseur */}
            <div
              className="relative h-6 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner cursor-crosshair group/bar p-0.5"
              onMouseMove={handleBarMouseMove}
              onMouseLeave={handleBarMouseLeave}
            >
              {/* Segment Encaissé */}
              <div
                style={{ width: `${paidPercent}%` }}
                className={`bg-emerald-500 rounded-l-full transition-all duration-300 relative flex items-center justify-center text-[10px] font-bold text-white ${
                  hoveredSegment === "paid"
                    ? "brightness-110 shadow-lg shadow-emerald-500/40 scale-y-110"
                    : "opacity-95"
                }`}
              >
                {paidPercent >= 15 && <span>{paidPercent}%</span>}
              </div>

              {/* Segment En cours / À échoir */}
              <div
                style={{ width: `${pendingPercent}%` }}
                className={`bg-blue-600 transition-all duration-300 relative flex items-center justify-center text-[10px] font-bold text-white ${
                  hoveredSegment === "pending"
                    ? "brightness-110 shadow-lg shadow-blue-500/40 scale-y-110"
                    : "opacity-95"
                }`}
              >
                {pendingPercent >= 15 && <span>{pendingPercent}%</span>}
              </div>

              {/* Segment Reste / Non échu */}
              {remainingPercent > 0 && (
                <div
                  style={{ width: `${remainingPercent}%` }}
                  className={`bg-slate-300 rounded-r-full transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-slate-600 ${
                    hoveredSegment === "other" ? "brightness-105 scale-y-110" : ""
                  }`}
                >
                  {remainingPercent >= 10 && <span>{remainingPercent}%</span>}
                </div>
              )}

              {/* Curseur vertical suiveur */}
              {cursorPos && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none transition-all z-20"
                  style={{ left: `${cursorPos.x}px` }}
                />
              )}
            </div>

            {/* Tooltip dynamique qui suit le curseur */}
            {cursorPos && (
              <div
                className="absolute -top-10 z-30 pointer-events-none transform -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-slate-700 animate-in fade-in duration-100 flex items-center gap-2"
                style={{ left: `${cursorPos.ratio}%` }}
              >
                {hoveredSegment === "paid" && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Encaissé (Payé) :</span>
                    <span className="text-emerald-300 font-extrabold">
                      {formatFCFA(metrics.totalPaid)} ({paidPercent}%)
                    </span>
                  </>
                )}
                {hoveredSegment === "pending" && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span>À Échoir / En cours :</span>
                    <span className="text-blue-300 font-extrabold">
                      {formatFCFA(metrics.totalPending)} ({pendingPercent}%)
                    </span>
                  </>
                )}
                {hoveredSegment === "other" && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>Autres créances :</span>
                    <span className="text-slate-300 font-extrabold">
                      {remainingPercent}% du portefeuille
                    </span>
                  </>
                )}
              </div>
            )}

            {/* 3 Cartes interactives détaillées au survol */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div
                onMouseEnter={() => setHoveredSegment("paid")}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  hoveredSegment === "paid"
                    ? "bg-emerald-50 border-emerald-300 shadow-md -translate-y-0.5"
                    : "bg-emerald-50/50 border-emerald-100/80 hover:bg-emerald-50"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Encaissé (Soldé)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/70 text-emerald-900">
                    {paidPercent}%
                  </span>
                </div>
                <p className="font-black text-base text-slate-900 mt-1 truncate">
                  {formatFCFA(metrics.totalPaid)}
                </p>
                <p className="text-[10px] text-emerald-700/80 mt-0.5">
                  Sécurisé sur les comptes bancaires
                </p>
              </div>

              <div
                onMouseEnter={() => setHoveredSegment("pending")}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  hoveredSegment === "pending"
                    ? "bg-blue-50 border-blue-300 shadow-md -translate-y-0.5"
                    : "bg-blue-50/50 border-blue-100/80 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    À Échoir (En cours)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-200/70 text-blue-900">
                    {pendingPercent}%
                  </span>
                </div>
                <p className="font-black text-base text-slate-900 mt-1 truncate">
                  {formatFCFA(metrics.totalPending)}
                </p>
                <p className="text-[10px] text-blue-700/80 mt-0.5">
                  Prochaines entrées de trésorerie
                </p>
              </div>

              <div
                onMouseEnter={() => setHoveredSegment("other")}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  hoveredSegment === "other"
                    ? "bg-purple-50 border-purple-300 shadow-md -translate-y-0.5"
                    : "bg-purple-50/50 border-purple-100/80 hover:bg-purple-50"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-800 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-purple-600" />
                    Taux d&apos;Encaissement
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-200/70 text-purple-900">
                    Ratio
                  </span>
                </div>
                <p className="font-black text-base text-slate-900 mt-1">
                  {metrics.recoveryRate}%
                </p>
                <p className="text-[10px] text-purple-700/80 mt-0.5">
                  Performance globale de recouvrement
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de carte avec lien interactif */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Calculs certifiés conformes avec <strong>TVA 18% UEMOA</strong>
            </span>
          </div>

          <button
            onClick={onNavigateToInvoices}
            className="text-xs font-bold text-[#183BB0] hover:text-blue-800 flex items-center gap-1 group transition-colors"
          >
            <span>Ouvrir l&apos;échéancier complet</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* 2. Widget Alertes & Risques de Recouvrement Interactif (1 colonne) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Alertes Recouvrement
                </h3>
                <p className="text-[10px] text-slate-400">Actions prioritaires</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
              {overdueInvoices.length} à traiter
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mt-2.5">
            Créances nécessitant une relance pour garantir l&apos;encaissement à date.
          </p>

          {/* Liste interactive des factures à relancer en priorité avec hover micro-animé */}
          <div className="mt-4 space-y-2.5">
            {overdueInvoices.slice(0, 3).map((inv) => {
              const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
              return (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-rose-50/60 border border-slate-200/70 hover:border-rose-200/80 transition-all duration-200 flex items-center justify-between gap-2.5 group/item hover:translate-x-1 hover:shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-500">
                        {inv.id}
                      </span>
                      {inv.status === "en_attente" && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                          Échéance dépassée
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate mt-0.5 group-hover/item:text-rose-900 transition-colors">
                      {inv.clientName}
                    </p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Échéance : <strong>{inv.dueDate}</strong>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-900">{formatFCFA(total)}</p>
                    <button
                      onClick={() => onOpenReminder && onOpenReminder(inv)}
                      className="mt-1.5 px-3 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 ml-auto active:scale-95 group-hover/item:shadow-rose-500/20"
                    >
                      <Send className="w-3 h-3" />
                      <span>Relancer</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {overdueInvoices.length === 0 && (
              <div className="p-6 text-center text-slate-400 space-y-2 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  Toutes les créances sont saines !
                </p>
                <p className="text-[11px] text-slate-400">
                  Aucun retard d&apos;échéance constaté actuellement.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bouton pour aller sur le registre */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={onNavigateToInvoices}
            className="w-full py-2.5 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Voir toutes les factures en cours</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
