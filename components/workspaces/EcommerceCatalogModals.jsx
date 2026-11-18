"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  Barcode,
  Printer,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { formatAmount } from "@/lib/mock-data";
import {
  downloadEcommerceCatalogTemplateXLSX,
  parseEcommerceCatalogFile,
} from "@/lib/export-utils";

// Table officielle d'encodage Code 39 (n = barre/espace étroit, w = large)
const CODE39_MAP = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  "$": "nwnwnwnnn",
  "/": "nwnwnnnwn",
  "+": "nwnnnwnwn",
  "%": "nnnwnwnwn",
  "*": "nwnnwnwnn",
};

export function Code39BarcodeSvg({ code = "SKU-0001", height = 42 }) {
  const sanitized = useMemo(() => {
    const upper = String(code || "SKU-0001")
      .toUpperCase()
      .replace(/[^0-9A-Z\-. $/+%]/g, "-");
    return upper.length > 0 ? upper : "SKU-0001";
  }, [code]);

  const bars = useMemo(() => {
    const full = `*${sanitized}*`;
    const narrow = 1.6;
    const wide = 3.8;
    const gap = 1.6;
    const rects = [];
    let x = 4;

    for (let cIdx = 0; cIdx < full.length; cIdx++) {
      const pattern = CODE39_MAP[full[cIdx]] || CODE39_MAP["-"];
      for (let i = 0; i < pattern.length; i++) {
        const w = pattern[i] === "w" ? wide : narrow;
        if (i % 2 === 0) {
          rects.push({ x, w });
        }
        x += w;
      }
      x += gap;
    }
    return { rects, width: Math.ceil(x + 4) };
  }, [sanitized]);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${bars.width} ${height}`}
        className="w-full max-w-[200px] h-11 bg-white"
        preserveAspectRatio="none"
      >
        {bars.rects.map((r, idx) => (
          <rect key={idx} x={r.x} y={2} width={r.w} height={height - 4} fill="#0F172A" />
        ))}
      </svg>
      <span className="text-[10px] font-mono font-bold tracking-widest text-slate-800 mt-0.5">
        {sanitized}
      </span>
    </div>
  );
}

/**
 * Modale d'impression d'étiquettes Code-Barres / SKU
 */
export function BarcodeLabelModal({
  isOpen,
  onClose,
  products = [],
  companyName = "Ma Boutique",
  currSym = "FC",
}) {
  const [copiesPerProduct, setCopiesPerProduct] = useState(2);
  const [showPrice, setShowPrice] = useState(true);
  const [showStoreName, setShowStoreName] = useState(true);
  const printAreaRef = useRef(null);

  if (!isOpen) return null;

  const targetProducts = products.slice(0, 30);
  const labels = [];
  for (const p of targetProducts) {
    for (let i = 0; i < copiesPerProduct; i++) {
      labels.push({ product: p, copyIdx: i });
    }
  }

  const handlePrintLabels = () => {
    if (!printAreaRef.current || typeof window === "undefined") return;
    const printWin = window.open("", "_blank", "width=880,height=700");
    if (!printWin) {
      window.print();
      return;
    }
    printWin.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Étiquettes Code-Barres — ${companyName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 16px; color: #0f172a; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .label { border: 1px dashed #cbd5e1; border-radius: 10px; padding: 10px; text-align: center; page-break-inside: avoid; }
            .store { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 2px; }
            .name { font-size: 11px; font-weight: 800; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .price { font-size: 12px; font-weight: 800; color: #183BB0; margin-top: 4px; }
            .old { font-size: 10px; text-decoration: line-through; color: #94a3b8; margin-right: 4px; }
            svg { max-width: 180px; height: 40px; }
            @media print { body { margin: 8px; } }
          </style>
        </head>
        <body>
          <div class="grid">${printAreaRef.current.innerHTML}</div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-3xl w-full max-h-[92dvh] flex flex-col border border-slate-100 shadow-2xl overflow-hidden">
        <div className="shrink-0 px-5 py-4 bg-gradient-to-r from-[#1A44B8] to-[#183BB0] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5" />
            <div>
              <h3 className="text-sm sm:text-base font-extrabold">
                Étiquettes Code-Barres &amp; SKU ({labels.length})
              </h3>
              <p className="text-[11px] text-blue-100">
                Code-39 vectoriel prêt pour imprimante thermique ou feuille A4
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-100 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options d'étiquetage */}
        <div className="shrink-0 px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 font-bold text-slate-700">
              <span>Copies / produit :</span>
              <select
                value={copiesPerProduct}
                onChange={(e) => setCopiesPerProduct(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold"
              >
                {[1, 2, 4, 6, 8, 12].map((n) => (
                  <option key={n} value={n}>
                    {n}×
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Afficher prix</span>
            </label>

            <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showStoreName}
                onChange={(e) => setShowStoreName(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Nom boutique</span>
            </label>
          </div>

          <span className="text-[11px] font-semibold text-slate-500">
            {targetProducts.length} produit(s) sélectionné(s)
          </span>
        </div>

        {/* Aperçu des étiquettes */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5">
          {labels.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-10">
              Aucun produit à étiqueter.
            </p>
          ) : (
            <div
              ref={printAreaRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {labels.map(({ product, copyIdx }) => {
                const priceNum = Number(product.price || 0);
                const promoNum = Number(product.promoPrice || 0);
                const hasPromo = promoNum > 0 && promoNum < priceNum;
                return (
                  <div
                    key={`${product.id}-${copyIdx}`}
                    className="label p-3 rounded-xl border border-dashed border-slate-300 bg-white text-center space-y-1"
                  >
                    {showStoreName && (
                      <p className="store text-[9px] font-bold uppercase tracking-wider text-slate-500 truncate">
                        {companyName}
                      </p>
                    )}
                    <p className="name text-xs font-extrabold text-slate-900 truncate">
                      {product.name}
                    </p>
                    <Code39BarcodeSvg code={product.sku || product.id || "SKU-0001"} />
                    {showPrice && (
                      <p className="price text-xs font-extrabold text-[#183BB0]">
                        {hasPromo ? (
                          <>
                            <span className="old line-through text-slate-400 font-semibold mr-1.5">
                              {formatAmount(priceNum, currSym)}
                            </span>
                            <span>{formatAmount(promoNum, currSym)}</span>
                          </>
                        ) : (
                          <span>{formatAmount(priceNum, currSym)}</span>
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handlePrintLabels}
            disabled={labels.length === 0}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer {labels.length} étiquette(s)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modale d'import en masse Excel (.xlsx/.xls) & CSV
 */
export function BulkCatalogImportModal({
  isOpen,
  onClose,
  currSym = "FC",
  onImportProducts,
  onToast,
}) {
  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setFileName(file.name);
    try {
      const items = await parseEcommerceCatalogFile(file);
      if (items.length === 0) {
        setParseError(
          "Aucun produit valide détecté. Vérifiez que votre fichier contient au moins une colonne « Nom du Produit » et « Prix Vente »."
        );
      }
      setParsedRows(items);
    } catch (err) {
      setParseError(err.message || "Impossible de lire ce fichier Excel/CSV.");
      setParsedRows([]);
    }
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0 || !onImportProducts) return;
    setIsImporting(true);
    try {
      const created = await onImportProducts(parsedRows);
      if (onToast) {
        onToast(`${created.length} produit(s) importé(s) avec succès !`, "success");
      }
      setParsedRows([]);
      setFileName("");
      onClose();
    } catch (err) {
      setParseError(err.message || "Erreur lors de l'import vers la base de données.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92dvh] flex flex-col border border-slate-100 shadow-2xl overflow-hidden">
        <div className="shrink-0 px-5 py-4 bg-gradient-to-r from-[#1A44B8] to-[#183BB0] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            <div>
              <h3 className="text-sm sm:text-base font-extrabold">
                Import en Masse (Excel / CSV)
              </h3>
              <p className="text-[11px] text-blue-100">
                Importez des dizaines de produits, prix promo, stocks et variantes en 1 clic
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-100 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4 text-xs">
          {/* Étape 1 : Modèle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-extrabold text-slate-900">1. Télécharger le modèle Excel</p>
              <p className="text-slate-500 mt-0.5">
                Colonnes supportées : Nom, SKU, Catégorie, Prix Vente, Prix Promo, Prix Achat, Stock, Variantes (`Taille:Stock`).
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadEcommerceCatalogTemplateXLSX(currSym)}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger le modèle</span>
            </button>
          </div>

          {/* Étape 2 : Charger fichier */}
          <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white text-center space-y-2 transition-colors">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Choisir un fichier (.xlsx, .xls, .csv)</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {fileName && (
              <p className="text-[11px] font-semibold text-slate-600">
                Fichier chargé : <span className="font-mono text-slate-900">{fileName}</span>
              </p>
            )}
          </div>

          {parseError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Aperçu avant import */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-extrabold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{parsedRows.length} produit(s) prêt(s) à être importé(s)</span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-56">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="py-2 px-3">Nom</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3 text-right">Prix</th>
                      <th className="py-2 px-3 text-right">Promo</th>
                      <th className="py-2 px-3 text-center">Stock</th>
                      <th className="py-2 px-3">Variantes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 30).map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-bold text-slate-900">{r.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{r.sku}</td>
                        <td className="py-2 px-3 text-right font-bold">
                          {formatAmount(r.price, currSym)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-bold">
                          {r.promoPrice ? formatAmount(r.promoPrice, currSym) : "—"}
                        </td>
                        <td className="py-2 px-3 text-center font-bold">{r.stock}</td>
                        <td className="py-2 px-3 text-slate-500">
                          {r.variants?.length > 0 ? `${r.variants.length} var.` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={isImporting || parsedRows.length === 0}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {isImporting
              ? "Importation en cours..."
              : `Importer ${parsedRows.length} produit(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}

