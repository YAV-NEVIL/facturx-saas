"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { COUNTRIES } from "@/lib/mock-data";

export default function PhoneCountryInput({
  label,
  countryCode = "+243",
  onCountryCodeChange,
  digits = "",
  onDigitsChange,
  placeholder = "99 820 40 50",
  required = false,
  helpText = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  // Trouver le pays correspondant à l'indicatif actuel
  const currentCountry =
    COUNTRIES.find((c) => c.dialCode === countryCode) ||
    COUNTRIES[0]; // RDC par défaut

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-slate-700 font-bold mb-1 text-xs">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        {/* Sélecteur d'indicatif pays */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100/90 hover:bg-slate-200/80 border-r border-slate-200 rounded-l-xl text-xs font-bold text-slate-800 transition-colors shrink-0"
            title={`${currentCountry.name} (${currentCountry.dialCode})`}
          >
            <span className="text-base leading-none">{currentCountry.flag}</span>
            <span className="font-mono text-xs">{currentCountry.dialCode}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Menu déroulant de choix du pays */}
          {isOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="px-2.5 pb-2 border-b border-slate-100 sticky top-0 bg-white">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrer par pays ou indicatif..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    autoFocus
                  />
                </div>
              </div>

              <div className="py-1">
                {filteredCountries.map((c) => {
                  const isSelected = c.dialCode === countryCode;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        onCountryCodeChange(c.dialCode);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-blue-50/70 transition-colors ${
                        isSelected ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{c.flag}</span>
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="font-mono text-slate-500 text-[11px] font-semibold">
                          {c.dialCode}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                    </button>
                  );
                })}
                {filteredCountries.length === 0 && (
                  <p className="px-3 py-2 text-xs text-slate-400 text-center">
                    Aucun pays trouvé
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Saisie des chiffres du numéro */}
        <input
          type="tel"
          required={required}
          value={digits}
          onChange={(e) => {
            // Nettoyage pour garder chiffres et espaces
            const val = e.target.value.replace(/[^0-9\s-]/g, "");
            onDigitsChange(val);
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-transparent font-mono text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {helpText && <p className="text-[10px] text-slate-400 mt-1">{helpText}</p>}
    </div>
  );
}
