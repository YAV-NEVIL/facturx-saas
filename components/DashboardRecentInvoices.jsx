"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  MoreVertical,
  Download,
  Check,
  ExternalLink,
} from "lucide-react";
import { calculateInvoiceTotals, formatFCFA } from "@/lib/mock-data";
import { generateInvoicePdf } from "@/lib/pdf-generator";

export default function DashboardRecentInvoices({
  invoices = [],
  onSelectInvoice,
  onNavigateToInvoices,
  onOpenCreateInvoice,
  onMarkAsPaid,
  onOpenReminder,
  companyInfo = null,
  onToast,
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Fermer le menu lors de l'appui sur Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setActiveMenuId(null);
    };
    if (activeMenuId) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMenuId]);

  // Sélectionner uniquement les 4 factures les plus récentes pour le Tableau de bord
  const recentInvoices = [...invoices].slice(0, 4);

  const getStatusBadge = (status) => {
    switch (status) {
      case "payee":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
            PAYÉE
          </span>
        );
      case "envoyee":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]"></span>
            ENVOYÉE
          </span>
        );
      case "en_attente":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]"></span>
            EN RETARD
          </span>
        );
      case "brouillon":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]"></span>
            BROUILLON
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-visible relative">
      {/* Header compact de la section Récente */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#183BB0] flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Dernières Factures Récentes
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Aperçu des 4 pièces émises les plus récentes pour l&apos;entreprise
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToInvoices}
          className="self-start sm:self-auto px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#183BB0] text-xs font-bold rounded-xl transition-all flex items-center gap-2 group hover:scale-[1.02]"
        >
          <span>Voir le registre complet ({invoices.length})</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Table compacte pour le Dashboard */}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 sm:px-6">N° Facture</th>
              <th className="py-3 px-4">Client Émetteur</th>
              <th className="py-3 px-4">Date Émission</th>
              <th className="py-3 px-4">Échéance</th>
              <th className="py-3 px-4">Montant TTC</th>
              <th className="py-3 px-4">Statut</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Aucune facture enregistrée pour le moment</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                      Votre espace d&apos;entreprise est prêt. Créez votre premier client ou émettez votre première facture en 1 clic.
                    </p>
                    <button
                      type="button"
                      onClick={onOpenCreateInvoice}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Émettre ma 1ère facture</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              recentInvoices.map((inv, idx) => {
              const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
              const isNearBottom = idx >= Math.max(1, recentInvoices.length - 2);

              return (
                <tr
                  key={inv.id}
                  className={`hover:bg-slate-50/80 transition-colors group ${
                    activeMenuId === inv.id ? "relative z-30" : ""
                  }`}
                >
                  <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-[#183BB0]">
                    <button
                      onClick={() => onSelectInvoice && onSelectInvoice(inv)}
                      className="hover:underline text-left focus:outline-none"
                    >
                      {inv.id}
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {inv.clientName}
                    </p>
                    <p className="text-[11px] text-slate-400">{inv.location}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {inv.issueDate}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {inv.dueDate}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    {formatFCFA(total)}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(inv.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right relative">
                    {/* Backdrop invisible pour fermeture immédiate au clic n'importe où */}
                    {activeMenuId === inv.id && (
                      <div
                        className="fixed inset-0 z-30 bg-transparent cursor-default"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(null);
                        }}
                      />
                    )}

                    <div className="inline-block text-left relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === inv.id ? null : inv.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors relative z-30 ${
                          activeMenuId === inv.id
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        }`}
                        title="Actions de la facture"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Menu contextuel intelligent - orienté vers le haut pour les dernières lignes */}
                      {activeMenuId === inv.id && (
                        <div
                          className={`absolute right-0 w-52 bg-white border border-slate-100 rounded-2xl shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 text-left ring-1 ring-slate-900/10 ${
                            isNearBottom
                              ? "bottom-full mb-2 origin-bottom-right"
                              : "top-full mt-2 origin-top-right"
                          }`}
                        >
                          <button
                            onClick={() => {
                              onSelectInvoice && onSelectInvoice(inv);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Voir détail complet</span>
                          </button>

                          {inv.status !== "payee" && onMarkAsPaid && (
                            <button
                              onClick={() => {
                                onMarkAsPaid(inv.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Marquer comme payée</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              generateInvoicePdf(inv, companyInfo);
                              if (onToast) onToast(`Téléchargement du PDF de ${inv.id}...`, "success");
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>Télécharger reçu / PDF</span>
                          </button>

                          {onOpenReminder && (
                            <button
                              onClick={() => {
                                onOpenReminder(inv);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                            >
                              <Send className="w-3.5 h-3.5 text-amber-600" />
                              <span>Relancer le client</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Footer incitatif vers la page Factures */}
      <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p className="text-slate-500 text-center sm:text-left">
          Vous consultez une synthèse de <strong>4 factures</strong> sur un total de{" "}
          <strong>{invoices.length} factures</strong> enregistrées.
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateInvoice}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-white rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Nouvelle Facture</span>
          </button>

          <button
            onClick={onNavigateToInvoices}
            className="px-4 py-1.5 bg-[#183BB0] hover:bg-[#122F8C] text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs hover:scale-[1.02]"
          >
            <span>Ouvrir la gestion des factures</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
