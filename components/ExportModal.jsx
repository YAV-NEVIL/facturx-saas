"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
} from "lucide-react";
import { exportToXLSX, exportToCSV } from "@/lib/export-utils";

export default function ExportModal({
  isOpen,
  onClose,
  allInvoices = [],
  filteredInvoices = [],
  onToast,
}) {
  const [scope, setScope] = useState("all"); // "all" ou "filtered"
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  if (!isOpen) return null;

  const targetInvoices = scope === "filtered" ? filteredInvoices : allInvoices;

  const handleDownload = (format) => {
    try {
      setDownloadingFormat(format);
      const today = new Date().toISOString().slice(0, 10);

      if (format === "xlsx") {
        const fileName = `Factures_FacturX_${today}.xlsx`;
        exportToXLSX(targetInvoices, fileName);
        if (onToast) {
          onToast(`Téléchargement de "${fileName}" lancé avec succès !`, "success");
        }
      } else if (format === "csv") {
        const fileName = `Factures_FacturX_${today}.csv`;
        exportToCSV(targetInvoices, fileName);
        if (onToast) {
          onToast(`Téléchargement de "${fileName}" lancé avec succès !`, "success");
        }
      }

      setTimeout(() => {
        setDownloadingFormat(null);
        onClose();
      }, 700);
    } catch (error) {
      console.error("Erreur lors de l'exportation:", error);
      setDownloadingFormat(null);
      if (onToast) {
        onToast("Erreur lors de la génération du fichier.", "error");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300 border border-white/10">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-lg font-extrabold tracking-tight">
                Exporter vos Factures
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Téléchargez vos données comptables en local
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label="Fermer la modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Périmètre d'exportation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Périmètre des factures à exporter
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  scope === "all"
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <Layers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold">Toutes les factures</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {allInvoices.length} facture(s) au total
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope("filtered")}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  scope === "filtered"
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <Filter className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold">Vue filtrée active</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {filteredInvoices.length} facture(s) visible(s)
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Question centrale : Choix du format */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Choisissez le format de fichier :
            </label>

            <div className="space-y-3">
              {/* Option 1: Excel (.xlsx) */}
              <div
                onClick={() => handleDownload("xlsx")}
                className="group relative p-4 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 bg-gradient-to-br from-emerald-50/50 to-white hover:bg-emerald-50/80 cursor-pointer transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">
                          Fichier Excel (.xlsx)
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                          Recommandé
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Classeur Microsoft Excel natif avec colonnes formatées, devises FCFA et détails complets des prestations.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={downloadingFormat === "xlsx"}
                    className="shrink-0 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all group-hover:translate-x-0.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {downloadingFormat === "xlsx" ? "Téléchargement..." : "Télécharger"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Option 2: Excel CSV (.csv) */}
              <div
                onClick={() => handleDownload("csv")}
                className="group relative p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-gradient-to-br from-slate-50/60 to-white hover:bg-blue-50/40 cursor-pointer transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">
                          Fichier Excel CSV (.csv)
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                          Universel
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Tableau délimité (point-virgule) encodé en UTF-8 BOM pour une ouverture directe et sans problème d&apos;accents dans Excel.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={downloadingFormat === "csv"}
                    className="shrink-0 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all group-hover:translate-x-0.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {downloadingFormat === "csv" ? "Téléchargement..." : "Télécharger"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Information téléchargement navigateur */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Le fichier sera immédiatement envoyé vers les <strong>téléchargements</strong> de votre navigateur.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
