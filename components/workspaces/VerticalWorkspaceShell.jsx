"use client";

import React from "react";
import {
  UtensilsCrossed,
  BedDouble,
  Store,
  Receipt,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  Users,
  Plus,
} from "lucide-react";
import { getBusinessVerticalConfig } from "@/lib/business-verticals";
import { formatAmount, getCurrencySymbol, calculateInvoiceTotals } from "@/lib/mock-data";

/**
 * Espace métier dédié pour les verticales Restauration (Phase 8A), Hôtellerie (Phase 8B)
 * et Petit Commerce POS (Phase 9) — avec Gestion de Facturation immédiatement active à la fin.
 */
export default function VerticalWorkspaceShell({
  verticalId = "restaurant",
  companyInfo = {},
  invoices = [],
  clients = [],
  payments = [],
  onOpenCreateInvoice,
  onNavigateTab,
}) {
  const config = getBusinessVerticalConfig(verticalId);
  const curr = companyInfo?.defaultCurrency || companyInfo?.currencySymbol || "FC";
  const currSym = getCurrencySymbol(curr);

  const IconComp =
    verticalId === "restaurant"
      ? UtensilsCrossed
      : verticalId === "hotel"
      ? BedDouble
      : Store;

  const totalBilled = invoices.reduce((acc, inv) => {
    const { total } = calculateInvoiceTotals(inv.items, inv.vatRate ?? 0.16);
    return acc + total;
  }, 0);
  const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* En-tête Verticale */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border mb-2 ${config.accentBg} ${config.accentText} ${config.accentBorder}`}
          >
            <IconComp className="w-3.5 h-3.5" />
            <span>Workspace {config.shortLabel}</span>
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {config.label} — Opérations &amp; Gestion de Facturation
          </h1>
          <p className="text-sm text-slate-500 mt-1">{config.description}</p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateInvoice}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Facture / Ticket</span>
        </button>
      </div>

      {/* KPIs de Facturation & Trésorerie actifs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Facturé
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatAmount(totalBilled, currSym)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{invoices.length} facture(s) émise(s)</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Encaissé
          </p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">
            {formatAmount(totalCollected, currSym)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{payments.length} règlement(s)</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Clients Enregistrés
          </p>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{clients.length}</p>
          <p className="text-xs text-slate-400 mt-1">Base CRM &amp; reçus</p>
        </div>
      </div>

      {/* Chaîne métier obligatoire se terminant par Gestion de Facturation */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Parcours {config.shortLabel} → Gestion de Facturation intégrée à la fin
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              La facturation normalisée DGI, les quittances et la TVA sont déjà opérationnelles dès maintenant.
            </p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            Facturation &amp; Encaissement Actifs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {config.workflowSteps.map((stepLabel, idx) => {
            const isBillingStep = idx === config.workflowSteps.length - 1;
            return (
              <div
                key={stepLabel}
                onClick={() => isBillingStep && onNavigateTab && onNavigateTab("invoices")}
                className={`p-4 rounded-2xl border transition-all ${
                  isBillingStep
                    ? "bg-blue-50/90 border-blue-300 cursor-pointer hover:border-blue-500"
                    : "bg-slate-50 border-slate-200/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isBillingStep
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    Étape {idx + 1}
                  </span>
                  {isBillingStep && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs font-extrabold text-slate-900">{stepLabel}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isBillingStep
                    ? "Prêt maintenant — Ouvrir les factures & tickets DGI"
                    : "Module opérationnel dédié planifié dans la roadmap"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accès rapides Gestion de Facturation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            tab: "invoices",
            title: "Gestion de Facturation",
            desc: "Factures normalisées DGI, PDF & Email",
            icon: Receipt,
          },
          {
            tab: "payments",
            title: "Encaissements & Quittances",
            desc: "Cash, Mobile Money, Reçus officiels",
            icon: CreditCard,
          },
          {
            tab: "clients",
            title: "Répertoire Clients",
            desc: "Fiches clients & historiques",
            icon: Users,
          },
          {
            tab: "reports",
            title: "Rapports & TVA",
            desc: "Journaux comptables OHADA / DGI",
            icon: FileSpreadsheet,
          },
        ].map((card) => {
          const CardIcon = card.icon;
          return (
            <button
              key={card.tab}
              type="button"
              onClick={() => onNavigateTab && onNavigateTab(card.tab)}
              className="bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-100 hover:border-blue-300 shadow-sm p-4 text-left transition-all cursor-pointer flex items-start justify-between gap-3"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                  <CardIcon className="w-4 h-4" />
                </div>
                <p className="text-xs font-extrabold text-slate-900">{card.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{card.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

