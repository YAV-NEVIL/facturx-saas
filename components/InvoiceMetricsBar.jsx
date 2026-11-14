"use client";

import React from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  Calculator,
  Percent,
  Sparkles,
  Layers,
} from "lucide-react";
import { formatFCFA, calculateInvoiceTotals } from "@/lib/mock-data";

export default function InvoiceMetricsBar({
  invoices = [],
  companyInfo = null,
  activeFilter = "all",
  onSelectFilter = null,
}) {
  const __cur = companyInfo?.defaultCurrency || companyInfo?.currencySymbol || "FC";
  // Calculs statistiques opérationnels propres à la facturation
  let totalBilled = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let countPaid = 0;
  let countPending = 0;
  let countDraft = 0;

  invoices.forEach((inv) => {
    const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
    totalBilled += total;

    if (inv.status === "payee") {
      totalPaid += total;
      countPaid += 1;
    } else if (inv.status === "en_attente" || inv.status === "envoyee") {
      totalPending += total;
      countPending += 1;
    } else if (inv.status === "brouillon") {
      countDraft += 1;
    }
  });

  const totalInvoices = invoices.length;
  const averageInvoiceAmount = totalInvoices > 0 ? Math.round(totalBilled / totalInvoices) : 0;
  const paidRatio = totalInvoices > 0 ? Math.round((countPaid / totalInvoices) * 100) : 0;

  const cards = [
    {
      id: "volume",
      filterKey: "all",
      label: "Total Pièces Émises",
      value: `${totalInvoices} Facture${totalInvoices > 1 ? "s" : ""}`,
      subtitle: `Volume cumulé : ${formatFCFA(totalBilled, __cur)}`,
      icon: Layers,
      iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
      accent: "hover:border-blue-300",
      activeClass: "border-blue-400 ring-2 ring-blue-500/15",
    },
    {
      id: "paid",
      filterKey: "payee",
      label: "Factures Soldées (Réglées)",
      value: `${countPaid} Payée${countPaid > 1 ? "s" : ""}`,
      subtitle: `${paidRatio}% du portefeuille • ${formatFCFA(totalPaid, __cur)}`,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      accent: "hover:border-emerald-300",
      activeClass: "border-emerald-400 ring-2 ring-emerald-500/15",
    },
    {
      id: "pending",
      filterKey: "envoyee",
      label: "Factures Ouvertes (En cours)",
      value: `${countPending} En cours`,
      subtitle: `Reste à percevoir : ${formatFCFA(totalPending, __cur)}`,
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-600 border border-amber-100",
      accent: "hover:border-amber-300",
      activeClass: "border-amber-400 ring-2 ring-amber-500/15",
    },
    {
      id: "average",
      filterKey: "all",
      label: "Panier Moyen Facturé",
      value: formatFCFA(averageInvoiceAmount, __cur),
      subtitle: `TVA légale appliquée (${countDraft} brouillon)`,
      icon: Calculator,
      iconBg: "bg-purple-50 text-purple-600 border border-purple-100",
      accent: "hover:border-purple-300",
      activeClass: "border-purple-400 ring-2 ring-purple-500/15",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = activeFilter === c.filterKey && c.id !== "average";
        return (
          <div
            key={c.id}
            onClick={() => onSelectFilter && onSelectFilter(c.filterKey)}
            className={`bg-white rounded-2xl p-5 border shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 flex items-center gap-3.5 group cursor-pointer active:scale-[0.99] ${
              isSelected ? c.activeClass : `border-slate-100 ${c.accent}`
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg} shadow-xs transition-transform group-hover:scale-105`}
            >
              <Icon className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                {c.label}
              </p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
                {c.value}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {c.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
