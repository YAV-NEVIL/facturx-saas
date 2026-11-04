"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, Globe } from "lucide-react";
import { COUNTRIES } from "@/lib/mock-data";

export default function CountrySelect({
  label = "Pays",
  value = "République Démocratique du Congo",
  onChange,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const selectedCountry =
    COUNTRIES.find(
      (c) => c.name.toLowerCase() === (value || "").toLowerCase()
    ) || COUNTRIES[0];

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
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full relative" ref={dropdownRef}>
      {label && (
        <label className="block text-slate-700 font-bold mb-1 text-xs">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-left"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="truncate">{selectedCountry.name}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95">
          <div className="px-3 pb-2 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un pays d'Afrique ou du monde..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                autoFocus
              />
            </div>
          </div>

          <div className="py-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Priorité Afrique & International
            </div>
            {filteredCountries.map((c) => {
              const isSelected =
                c.name.toLowerCase() === (value || "").toLowerCase();
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onChange(c.name, c.dialCode);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs hover:bg-blue-50/70 transition-colors text-left ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
