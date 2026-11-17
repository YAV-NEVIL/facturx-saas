"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  RotateCcw,
  Clock,
  Sparkles,
} from "lucide-react";

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function CalendarDropdown({
  selectedPeriod = "Ce mois-ci",
  onSelectPeriod,
  selectedDate = "21/10/2026",
  onSelectDate,
  invoiceDates = ["21/10/2026", "19/10/2026", "14/10/2026", "12/10/2026", "08/10/2026", "05/10/2026", "01/10/2026", "28/09/2026"],
  buttonClassName = "",
  align = "right", // "left" | "right"
  useLiveDates = false,
  dotLabel = "Factures enregistrées",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const nowRef = useLiveDates ? new Date() : new Date(2026, 9, 21);
  const todayDay = nowRef.getDate();
  const todayMonth = nowRef.getMonth();
  const todayYear = nowRef.getFullYear();

  const fmtDateObj = (dObj) => {
    const dd = String(dObj.getDate()).padStart(2, "0");
    const mm = String(dObj.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${dObj.getFullYear()}`;
  };
  const fmtReadableObj = (dObj) =>
    `${dObj.getDate()} ${MONTH_NAMES[dObj.getMonth()]} ${dObj.getFullYear()}`;

  const todayStr = fmtDateObj(nowRef);
  const yesterdayObj = new Date(todayYear, todayMonth, todayDay - 1);
  const yesterdayStr = fmtDateObj(yesterdayObj);
  const dayBeforeObj = new Date(todayYear, todayMonth, todayDay - 2);
  const dayBeforeStr = fmtDateObj(dayBeforeObj);
  const tomorrowObj = new Date(todayYear, todayMonth, todayDay + 1);
  const tomorrowStr = fmtDateObj(tomorrowObj);

  // Vue actuelle du calendrier (mois et année affichés)
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Mois précédent
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  // Mois suivant
  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calcul des jours du calendrier
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    // En JS 0 = Dimanche. On convertit pour Lun = 0, Dim = 6
    return day === 0 ? 6 : day - 1;
  };

  const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayIndex = getFirstDayOfMonth(viewYear, viewMonth);

  // Jours du mois précédent pour combler la première semaine
  const daysInPrevMonth = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1
  );

  // Formatage JJ/MM/AAAA
  const formatDateString = (d, m, y) => {
    const dd = String(d).padStart(2, "0");
    const mm = String(m + 1).padStart(2, "0");
    return `${dd}/${mm}/${y}`;
  };

  // Sélection d'un jour précis
  const handleDayClick = (day, month, year) => {
    const formatted = formatDateString(day, month, year);
    if (onSelectDate) onSelectDate(formatted);
    if (onSelectPeriod) onSelectPeriod(`${day} ${MONTH_NAMES[month]} ${year}`);
    setIsOpen(false);
  };

  // Sélection d'un preset rapide
  const handlePresetClick = (presetLabel) => {
    if (onSelectPeriod) onSelectPeriod(presetLabel);
    if (presetLabel === "Aujourd'hui") {
      setViewYear(todayYear);
      setViewMonth(todayMonth);
      if (onSelectDate) onSelectDate(todayStr);
    } else if (presetLabel === "Hier") {
      setViewYear(yesterdayObj.getFullYear());
      setViewMonth(yesterdayObj.getMonth());
      if (onSelectDate) onSelectDate(yesterdayStr);
    } else if (presetLabel === "Avant-hier") {
      setViewYear(dayBeforeObj.getFullYear());
      setViewMonth(dayBeforeObj.getMonth());
      if (onSelectDate) onSelectDate(dayBeforeStr);
    } else if (presetLabel === "Demain") {
      setViewYear(tomorrowObj.getFullYear());
      setViewMonth(tomorrowObj.getMonth());
      if (onSelectDate) onSelectDate(tomorrowStr);
    } else if (presetLabel === "Mois précédent") {
      const prevM = todayMonth === 0 ? 11 : todayMonth - 1;
      const prevY = todayMonth === 0 ? todayYear - 1 : todayYear;
      setViewYear(prevY);
      setViewMonth(prevM);
      if (onSelectDate) onSelectDate(`${MONTH_NAMES[prevM]} ${prevY}`);
    } else {
      if (onSelectDate) onSelectDate(null); // Réinitialiser le filtre jour pour voir la période globale
    }
    setIsOpen(false);
  };

  const prevMonthIdx = todayMonth === 0 ? 11 : todayMonth - 1;
  const prevMonthYear = todayMonth === 0 ? todayYear - 1 : todayYear;

  const presets = [
    { label: "Aujourd'hui", desc: fmtReadableObj(nowRef) },
    { label: "Hier", desc: fmtReadableObj(yesterdayObj) },
    ...(useLiveDates
      ? [{ label: "Demain", desc: fmtReadableObj(tomorrowObj) }]
      : [{ label: "Avant-hier", desc: fmtReadableObj(dayBeforeObj) }]),
    { label: "Cette semaine", desc: useLiveDates ? "7 derniers jours" : "Du 19 au 25 Oct 2026" },
    { label: "Ce mois-ci", desc: `${MONTH_NAMES[todayMonth]} ${todayYear}` },
    { label: "Mois précédent", desc: `${MONTH_NAMES[prevMonthIdx]} ${prevMonthYear}` },
    { label: "Toutes les dates", desc: "Historique complet" },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          buttonClassName ||
          "flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer transition-all hover:border-blue-400"
        }
        aria-expanded={isOpen}
      >
        <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="truncate max-w-[170px] sm:max-w-none">
          {selectedDate || selectedPeriod || "21 Octobre 2026"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {/* Popover Calendrier Interactif (100% centré sur mobile, aligné sur desktop) */}
      {isOpen && (
        <>
          {/* Fond semi-transparent sur mobile pour fermer au toucher et mettre en évidence le calendrier centré */}
          <div
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-[1px] z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`fixed inset-x-3 top-20 mx-auto w-[calc(100vw-1.5rem)] max-w-[355px] max-h-[82vh] overflow-y-auto z-50 sm:absolute sm:inset-auto sm:top-auto sm:mx-0 sm:max-h-none sm:overflow-hidden ${
              align === "left" ? "sm:left-0" : "sm:right-0"
            } sm:mt-2 sm:w-[480px] sm:max-w-none bg-white rounded-2xl shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200`}
          >
            {/* Header du Popover */}
            <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-[#1A44B8] to-[#183BB0] text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-white/15 shrink-0">
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold tracking-tight truncate">
                    Historique & Filtre par Date
                  </h4>
                  <p className="text-[10px] text-blue-200 truncate">
                    Sélectionnez un jour ou une période
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePresetClick("Toutes les dates")}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white/15 hover:bg-white/25 rounded-lg transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Tout réinitialiser</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row">
              {/* Colonne latérale des raccourcis de période (grille compacte 2 colonnes sur mobile) */}
              <div className="w-full sm:w-44 p-3 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1 sm:px-2 mb-1.5 text-center sm:text-left">
                  Périodes rapides
                </span>
                <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1.5 sm:gap-1">
                  {presets.map((preset) => {
                    const isActive =
                      selectedPeriod === preset.label ||
                      (preset.label === "Aujourd'hui" && selectedDate === todayStr) ||
                      (preset.label === "Hier" && selectedDate === yesterdayStr) ||
                      (preset.label === "Avant-hier" && selectedDate === dayBeforeStr) ||
                      (preset.label === "Demain" && selectedDate === tomorrowStr);

                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handlePresetClick(preset.label)}
                        className={`w-full text-center sm:text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex flex-col items-center sm:items-start justify-center ${
                          preset.label === "Toutes les dates" ? "col-span-2 sm:col-span-1" : ""
                        } ${
                          isActive
                            ? "bg-[#183BB0] text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-200/60"
                        }`}
                      >
                        <span className="truncate max-w-full">{preset.label}</span>
                        <span
                          className={`text-[9px] font-normal truncate max-w-full ${
                            isActive ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          {preset.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grille du Calendrier interactif avec dates antérieures et futures */}
              <div className="flex-1 p-3.5 sm:p-4">
              {/* Navigateur Mois / Année */}
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  aria-label="Mois précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <span className="font-extrabold text-sm text-slate-900">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  aria-label="Mois suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5 text-[11px] font-bold text-slate-400">
                {DAY_NAMES.map((name) => (
                  <div key={name} className="py-1">
                    {name}
                  </div>
                ))}
              </div>

              {/* Grille des cellules du mois */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {/* 1. Jours du mois précédent (antérieurs) */}
                {Array.from({ length: firstDayIndex }).map((_, i) => {
                  const dayNum = daysInPrevMonth - firstDayIndex + i + 1;
                  const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
                  const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
                  return (
                    <button
                      key={`prev-${i}`}
                      type="button"
                      onClick={() => handleDayClick(dayNum, prevMonth, prevYear)}
                      className="py-1.5 rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      {dayNum}
                    </button>
                  );
                })}

                {/* 2. Jours du mois courant */}
                {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = formatDateString(dayNum, viewMonth, viewYear);
                  const isSelected = selectedDate === dateStr;
                  const isToday =
                    dayNum === todayDay && viewMonth === todayMonth && viewYear === todayYear;
                  const hasInvoices = invoiceDates.includes(dateStr);

                  return (
                    <button
                      key={`curr-${dayNum}`}
                      type="button"
                      onClick={() => handleDayClick(dayNum, viewMonth, viewYear)}
                      className={`relative py-1.5 rounded-xl font-bold transition-all flex flex-col items-center justify-center group ${
                        isSelected
                          ? "bg-[#183BB0] text-white shadow-md shadow-blue-900/30 scale-105"
                          : isToday
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{dayNum}</span>

                      {/* Pastille indiquant qu'il y a des factures émises ce jour-là */}
                      {hasInvoices && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                            isSelected ? "bg-white" : "bg-emerald-500"
                          }`}
                          title="Facture présente"
                        />
                      )}
                    </button>
                  );
                })}

                {/* 3. Jours du mois suivant (futurs) pour compléter la grille */}
                {Array.from({
                  length:
                    (7 - ((firstDayIndex + daysInCurrentMonth) % 7)) % 7,
                }).map((_, i) => {
                  const dayNum = i + 1;
                  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
                  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
                  return (
                    <button
                      key={`next-${i}`}
                      type="button"
                      onClick={() => handleDayClick(dayNum, nextMonth, nextYear)}
                      className="py-1.5 rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>

              {/* Légende en bas du calendrier */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{dotLabel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>Aujourd&apos;hui ({todayDay} {MONTH_NAMES[todayMonth].slice(0, 4)})</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
