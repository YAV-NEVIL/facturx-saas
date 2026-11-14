"use client";

import React from "react";
import { formatFCFA } from "@/lib/mock-data";

export default function StatsCards({ metrics, companyInfo = null }) {
  const currency =
    companyInfo?.defaultCurrency || companyInfo?.currencySymbol || "FC";

  const totalBilled = Number(metrics?.totalBilled) || 0;
  const totalPaid = Number(metrics?.totalPaid) || 0;
  const totalPending = Number(metrics?.totalPending) || 0;
  const recoveryRate = Number(metrics?.recoveryRate) || 0;

  const cards = [
    {
      id: "total",
      label: "Total facturé",
      value: formatFCFA(totalBilled, currency),
      change:
        totalBilled > 0
          ? "+12% vs semaine passée"
          : "0% vs semaine passée",
      tone: totalBilled > 0 ? "positive" : "neutral",
    },
    {
      id: "paid",
      label: "Montant encaissé",
      value: formatFCFA(totalPaid, currency),
      change:
        totalPaid > 0
          ? "+18% vs semaine passée"
          : "0% vs semaine passée",
      tone: totalPaid > 0 ? "positive" : "neutral",
    },
    {
      id: "pending",
      label: "En attente et retard",
      value: formatFCFA(totalPending, currency),
      change:
        totalPending > 0
          ? "-5% vs semaine passée"
          : "Aucune créance échue",
      tone: totalPending > 0 ? "negative" : "neutral",
    },
    {
      id: "net",
      label: "Taux de recouvrement",
      value: `${recoveryRate}%`,
      change:
        recoveryRate > 0
          ? "+7.4% vs moyenne"
          : "0% vs moyenne",
      tone: recoveryRate > 0 ? "positive" : "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="bg-white rounded-[14px] p-5 border border-slate-100 flex flex-col justify-between transition-colors duration-150"
        >
          <p className="text-[13px] text-slate-600 leading-5 truncate">
            {card.label}
          </p>

          <p className="text-[28px] sm:text-[30px] font-medium text-slate-900 leading-none tabular-nums mt-3 truncate">
            {card.value}
          </p>

          <p
            className={`text-xs font-mono tabular-nums mt-3 truncate ${
              card.tone === "positive"
                ? "text-emerald-600"
                : card.tone === "negative"
                ? "text-rose-600"
                : "text-slate-400"
            }`}
          >
            {card.change}
          </p>
        </div>
      ))}
    </div>
  );
}
