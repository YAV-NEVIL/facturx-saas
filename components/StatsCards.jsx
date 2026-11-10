"use client";

import React, { useState } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  Wallet,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { formatFCFA, formatAmount, getCurrencySymbol } from "@/lib/mock-data";

// Composant de mini-diagramme interactif avec curseur dynamique et tooltip au survol / toucher mobile
function InteractiveSparkline({
  points = [],
  color = "#2563EB",
  gradientId = "grad-blue",
  isPositive = true,
  unit = "FC",
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  // Dimensions SVG
  const width = 160;
  const height = 46;
  const paddingY = 8;
  const paddingX = 6;

  // Calcul des coordonnées x, y normalisées
  const values = points.map((p) => p.val);
  const minVal = Math.min(...values) * 0.9;
  const maxVal = Math.max(...values) * 1.05;
  const range = maxVal - minVal || 1;

  const coords = points.map((p, idx) => {
    const x = paddingX + (idx / (points.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((p.val - minVal) / range) * (height - 2 * paddingY);
    return { x, y, ...p };
  });

  // Construction d'une courbe de Bézier lisse (Catmull-Rom vers Bézier)
  const buildSmoothPath = (pts) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const linePath = buildSmoothPath(coords);
  const areaPath = `${linePath} L ${coords[coords.length - 1].x},${height} L ${coords[0].x},${height} Z`;

  // Gestion du survol avec la souris ou du toucher sur mobile
  const updateHoverFromClientX = (clientX, currentTarget) => {
    const rect = currentTarget.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    const closestIdx = Math.round(ratio * (points.length - 1));
    setHoverIndex(closestIdx);
  };

  const handleMouseMove = (e) => {
    updateHoverFromClientX(e.clientX, e.currentTarget);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      updateHoverFromClientX(e.touches[0].clientX, e.currentTarget);
    }
  };

  const activeCoord = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <div
      className="relative w-32 sm:w-36 h-12 cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIndex(null)}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setTimeout(() => setHoverIndex(null), 1500)}
    >
      {/* Tooltip flottant au survol */}
      {activeCoord && (
        <div
          className="absolute -top-9 z-30 pointer-events-none transform -translate-x-1/2 bg-slate-900/95 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap border border-slate-700/80 animate-in fade-in duration-150 flex items-center gap-1.5"
          style={{
            left: `${(activeCoord.x / width) * 100}%`,
          }}
        >
          <span className="text-slate-300 font-normal">{activeCoord.label} :</span>
          <span style={{ color }}>{activeCoord.formatted}</span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Dégradé doux sous la courbe */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={hoverIndex !== null ? "0.35" : "0.20"} />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>

          {/* Filtre de lueur néon */}
          <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={color} floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Remplissage de l'aire sous la courbe */}
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
          className="transition-all duration-300"
        />

        {/* Ligne de courbe principale */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={hoverIndex !== null ? "2.6" : "2.2"}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${gradientId})`}
          className="transition-all duration-200"
        />

        {/* Points interactifs de données */}
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={hoverIndex === i ? "4" : "2"}
            fill={hoverIndex === i ? color : "#ffffff"}
            stroke={color}
            strokeWidth={hoverIndex === i ? "2" : "1.5"}
            className="transition-all duration-150"
          />
        ))}

        {/* Repère vertical et point actif vibrant au survol */}
        {activeCoord && (
          <g className="animate-in fade-in duration-100">
            {/* Ligne guide verticale */}
            <line
              x1={activeCoord.x}
              y1={paddingY}
              x2={activeCoord.x}
              y2={height}
              stroke={color}
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.6"
            />
            {/* Halo pulsant */}
            <circle
              cx={activeCoord.x}
              cy={activeCoord.y}
              r="7"
              fill={color}
              opacity="0.25"
              className="animate-ping"
            />
            {/* Point blanc au centre */}
            <circle
              cx={activeCoord.x}
              cy={activeCoord.y}
              r="4.5"
              fill="#ffffff"
              stroke={color}
              strokeWidth="2.5"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

export default function StatsCards({ metrics, companyInfo = null }) {
  const currency = companyInfo?.defaultCurrency || companyInfo?.currencySymbol || "FC";
  const sym = getCurrencySymbol(currency);

  const totalBilled = Number(metrics?.totalBilled) || 0;
  const totalPaid = Number(metrics?.totalPaid) || 0;
  const totalPending = Number(metrics?.totalPending) || 0;
  const recoveryRate = Number(metrics?.recoveryRate) || 0;

  const buildWeeklyAmountPoints = (finalVal) => {
    if (!finalVal || finalVal <= 0) {
      return [
        { label: "Sem 1", val: 0, formatted: formatAmount(0, currency) },
        { label: "Sem 2", val: 0, formatted: formatAmount(0, currency) },
        { label: "Sem 3", val: 0, formatted: formatAmount(0, currency) },
        { label: "Sem 4", val: 0, formatted: formatAmount(0, currency) },
      ];
    }
    const w1 = Math.round(finalVal * 0.25);
    const w2 = Math.round(finalVal * 0.52);
    const w3 = Math.round(finalVal * 0.78);
    return [
      { label: "Sem 1", val: w1, formatted: formatAmount(w1, currency) },
      { label: "Sem 2", val: w2, formatted: formatAmount(w2, currency) },
      { label: "Sem 3", val: w3, formatted: formatAmount(w3, currency) },
      { label: "Sem 4", val: finalVal, formatted: formatAmount(finalVal, currency) },
    ];
  };

  const buildWeeklyRatePoints = (finalRate) => {
    if (!finalRate || finalRate <= 0) {
      return [
        { label: "Sem 1", val: 0, formatted: "0%" },
        { label: "Sem 2", val: 0, formatted: "0%" },
        { label: "Sem 3", val: 0, formatted: "0%" },
        { label: "Sem 4", val: 0, formatted: "0%" },
      ];
    }
    const r1 = Math.round(finalRate * 0.65 * 10) / 10;
    const r2 = Math.round(finalRate * 0.8 * 10) / 10;
    const r3 = Math.round(finalRate * 0.92 * 10) / 10;
    return [
      { label: "Sem 1", val: r1, formatted: `${r1}%` },
      { label: "Sem 2", val: r2, formatted: `${r2}%` },
      { label: "Sem 3", val: r3, formatted: `${r3}%` },
      { label: "Sem 4", val: finalRate, formatted: `${finalRate}%` },
    ];
  };

  const cards = [
    {
      id: "total",
      label: "Total Facturé",
      value: formatFCFA(totalBilled, currency),
      change: totalBilled > 0 ? "12% vs semaine passée" : "0% vs semaine passée",
      isPositive: true,
      icon: FileText,
      iconBg: "bg-blue-50 text-blue-600 border border-blue-100/60",
      color: "#2563EB",
      gradientId: "grad-blue-interactive",
      accentHover: "hover:border-blue-300 hover:shadow-blue-500/10",
      points: buildWeeklyAmountPoints(totalBilled),
    },
    {
      id: "paid",
      label: "Montant Encaissé (Payé)",
      value: formatFCFA(totalPaid, currency),
      change: totalPaid > 0 ? "18% vs semaine passée" : "0% vs semaine passée",
      isPositive: true,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100/60",
      color: "#10B981",
      gradientId: "grad-emerald-interactive",
      accentHover: "hover:border-emerald-300 hover:shadow-emerald-500/10",
      points: buildWeeklyAmountPoints(totalPaid),
    },
    {
      id: "pending",
      label: "En Attente & Retard",
      value: formatFCFA(totalPending, currency),
      change: totalPending > 0 ? "5% vs semaine passée" : "0% vs semaine passée",
      isPositive: totalPending === 0,
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-600 border border-amber-100/60",
      color: "#F59E0B",
      gradientId: "grad-amber-interactive",
      accentHover: "hover:border-amber-300 hover:shadow-amber-500/10",
      points: buildWeeklyAmountPoints(totalPending),
    },
    {
      id: "net",
      label: "Taux de Recouvrement",
      value: `${recoveryRate}%`,
      change: recoveryRate > 0 ? "7.4% vs moyenne" : "0% vs moyenne",
      isPositive: true,
      icon: Wallet,
      iconBg: "bg-purple-50 text-purple-600 border border-purple-100/60",
      color: "#8B5CF6",
      gradientId: "grad-purple-interactive",
      accentHover: "hover:border-purple-300 hover:shadow-purple-500/10",
      points: buildWeeklyRatePoints(recoveryRate),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group ${card.accentHover} hover:-translate-y-0.5`}
          >
            {/* Rangée supérieure : Icône à gauche, Libellé & Grand Montant à droite */}
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} shadow-xs transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1`}
              >
                <Icon className="w-6 h-6 stroke-[2.2]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 truncate tracking-wide">
                  {card.label}
                </p>
                <h3 className="text-xl lg:text-[22px] font-black text-slate-900 tracking-tight leading-tight mt-0.5 truncate">
                  {card.value}
                </h3>
              </div>
            </div>

            {/* Rangée inférieure : Indicateur de tendance à gauche + Mini-diagramme interactif animé au survol */}
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
              <div
                className={`flex items-center gap-1 text-xs font-bold whitespace-nowrap ${card.isPositive ? "text-emerald-600" : "text-rose-600"
                  }`}
              >
                {card.isPositive ? (
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>{card.change}</span>
              </div>

              {/* Diagramme animé interactif avec points, lueur et tooltip dynamique au survol */}
              <InteractiveSparkline
                points={card.points}
                color={card.color}
                gradientId={card.gradientId}
                isPositive={card.isPositive}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
