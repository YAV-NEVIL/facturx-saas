"use client";

import React from "react";
import { formatFCFA, calculateInvoiceTotals } from "@/lib/mock-data";

export default function InvoiceMetricsBar({ invoices = [], companyInfo = null }) {
  const __cur =
    companyInfo?.defaultCurrency || companyInfo?.currencySymbol || "FC";

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
  const averageInvoiceAmount =
    totalInvoices > 0 ? Math.round(totalBilled / totalInvoices) : 0;
  const paidRatio =
    totalInvoices > 0 ? Math.round((countPaid / totalInvoices) * 100) : 0;

  const cards = [
    {
      id: "volume",
      label: "Total pièces émises",
      value: `${totalInvoices}`,
      subtitle: `Cumul : ${formatFCFA(totalBilled, __cur)}`,
      tone: "neutral",
    },
    {
      id: "paid",
      label: "Factures soldées",
      value: `${countPaid}`,
      subtitle: `${paidRatio}% réglé • ${formatFCFA(totalPaid, __cur)}`,
      tone: countPaid > 0 ? "positive" : "neutral",
    },
    {
      id: "pending",
      label: "Factures ouvertes",
      value: `${countPending}`,
      subtitle: `À percevoir : ${formatFCFA(totalPending, __cur)}`,
      tone: countPending > 0 ? "negative" : "neutral",
    },
    {
      id: "average",
      label: "Panier moyen facturé",
      value: formatFCFA(averageInvoiceAmount, __cur),
      subtitle: `TVA appliquée (${countDraft} brouillon)`,
      tone: "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.id}
          className="bg-white rounded-[14px] p-5 border border-slate-100 flex flex-col justify-between transition-colors duration-150"
        >
          <p className="text-[13px] text-slate-600 leading-5 truncate">
            {c.label}
          </p>
          <p className="text-[28px] sm:text-[30px] font-medium text-slate-900 leading-none tabular-nums mt-3 truncate">
            {c.value}
          </p>
          <p
            className={`text-xs font-mono tabular-nums mt-3 truncate ${
              c.tone === "positive"
                ? "text-emerald-600"
                : c.tone === "negative"
                ? "text-amber-600"
                : "text-slate-400"
            }`}
          >
            {c.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}
