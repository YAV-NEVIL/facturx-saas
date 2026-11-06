"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Filter,
  Download,
  Plus,
  MoreVertical,
  MapPin,
  CheckCircle2,
  Clock,
  Send,
  FileEdit,
  Trash2,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Phone,
  Mail,
} from "lucide-react";
import { calculateInvoiceTotals, formatFCFA } from "@/lib/mock-data";
import { generateInvoicePdf } from "@/lib/pdf-generator";
import ExportModal from "@/components/ExportModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import EditInvoiceModal from "@/components/EditInvoiceModal";

export default function InvoiceTable({
  invoices = [],
  clients = [],
  onSelectInvoice,
  onOpenCreateModal,
  onMarkAsPaid,
  onUpdateInvoice,
  onDeleteInvoice,
  onOpenReminder,
  searchQuery = "",
  onToast,
  companyInfo = null,
  title = "Registre Complet des Factures",
  subtitle = "Historique intégral et gestion de toutes les pièces comptables émises",
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Fermer le menu lors de l'appui sur Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveMenuId(null);
        setIsFilterDropdownOpen(false);
      }
    };
    if (activeMenuId || isFilterDropdownOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMenuId, isFilterDropdownOpen]);

  // Modals de confirmation et de modification
  const [invoiceToEditConfirm, setInvoiceToEditConfirm] = useState(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);
  const [invoiceToDeleteConfirm, setInvoiceToDeleteConfirm] = useState(null);

  // Status mapping and badges
  const getStatusBadge = (status) => {
    switch (status) {
      case "payee":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
            PAYÉE
          </span>
        );
      case "envoyee":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
            <span className="w-2 h-2 rounded-full bg-[#EA580C]"></span>
            ENVOYÉE
          </span>
        );
      case "en_attente":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3]">
            <span className="w-2 h-2 rounded-full bg-[#E11D48]"></span>
            EN RETARD
          </span>
        );
      case "brouillon":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
            <span className="w-2 h-2 rounded-full bg-[#64748B]"></span>
            BROUILLON
          </span>
        );
    }
  };

  // Date parser utility for "JJ/MM/AAAA"
  const parseDateString = (dStr) => {
    if (!dStr) return 0;
    const parts = dStr.split("/");
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
    }
    return new Date(dStr).getTime() || 0;
  };

  // Filter logic
  const filteredInvoices = invoices.filter((inv) => {
    // Status filter
    if (statusFilter !== "all" && inv.status !== statusFilter) {
      return false;
    }

    // Search query filter (Invoice ID, Client Name, Location)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = inv.id.toLowerCase().includes(q);
      const matchClient = inv.clientName.toLowerCase().includes(q);
      const matchLocation = inv.location.toLowerCase().includes(q);
      if (!matchId && !matchClient && !matchLocation) return false;
    }

    return true;
  });

  // Sort logic (live and dynamic)
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (sortBy === "date_desc") {
      return parseDateString(b.issueDate) - parseDateString(a.issueDate);
    }
    if (sortBy === "date_asc") {
      return parseDateString(a.issueDate) - parseDateString(b.issueDate);
    }
    if (sortBy === "amount_desc") {
      const totalA = calculateInvoiceTotals(a.items, a.vatRate).total;
      const totalB = calculateInvoiceTotals(b.items, b.vatRate).total;
      return totalB - totalA;
    }
    if (sortBy === "amount_asc") {
      const totalA = calculateInvoiceTotals(a.items, a.vatRate).total;
      const totalB = calculateInvoiceTotals(b.items, b.vatRate).total;
      return totalA - totalB;
    }
    if (sortBy === "due_date") {
      return parseDateString(a.dueDate) - parseDateString(b.dueDate);
    }
    if (sortBy === "client_asc") {
      return (a.clientName || "").localeCompare(b.clientName || "");
    }
    return 0;
  });

  // Pagination logic
  const totalItems = sortedInvoices.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentInvoices = sortedInvoices.slice(startIndex, endIndex);

  const sortOptions = [
    { id: "date_desc", label: "Date : Plus récente d'abord" },
    { id: "date_asc", label: "Date : Plus ancienne d'abord" },
    { id: "amount_desc", label: "Montant : Plus élevé d'abord" },
    { id: "amount_asc", label: "Montant : Moins élevé d'abord" },
    { id: "due_date", label: "Échéance la plus urgente" },
    { id: "client_asc", label: "Nom du client (A → Z)" },
  ];

  const handleSelectSort = (optionId) => {
    setSortBy(optionId);
    setCurrentPage(1);
    setIsFilterDropdownOpen(false);
    if (onToast) {
      const selected = sortOptions.find((o) => o.id === optionId);
      onToast(`Tri appliqué : ${selected?.label || optionId}`, "info");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Top Header of Table Card matching screenshot */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Title + Status Filter Tabs */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "Toutes", count: invoices.length },
              {
                id: "payee",
                label: "Payées",
                count: invoices.filter((i) => i.status === "payee").length,
              },
              {
                id: "envoyee",
                label: "Envoyées",
                count: invoices.filter((i) => i.status === "envoyee").length,
              },
              {
                id: "en_attente",
                label: "En attente / Retard",
                count: invoices.filter((i) => i.status === "en_attente").length,
              },
              {
                id: "brouillon",
                label: "Brouillons",
                count: invoices.filter((i) => i.status === "brouillon").length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-[#183BB0] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className={`px-3.5 py-2 border text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
                sortBy !== "date_desc"
                  ? "bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              <Filter className={`w-3.5 h-3.5 ${sortBy !== "date_desc" ? "text-blue-600" : "text-slate-500"}`} />
              <span>
                {sortBy === "date_desc"
                  ? "Filtrer"
                  : sortOptions.find((o) => o.id === sortBy)?.label || "Filtré"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Quick Filter Menu */}
            {isFilterDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsFilterDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-50 mb-1">
                    <span>Trier / Filtrer par</span>
                    {sortBy !== "date_desc" && (
                      <button
                        onClick={() => handleSelectSort("date_desc")}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        Par défaut
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {sortOptions.map((opt) => {
                      const isActive = sortBy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectSort(opt.id)}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                            isActive
                              ? "bg-blue-50 font-bold text-blue-800"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export Button matching screenshot */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 bg-[#2D60FF] hover:bg-[#2050E0] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter</span>
          </button>

          {/* New Invoice Button */}
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-900/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Facture</span>
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Header Row matching screenshot light blue-gray bar (#EEF4FD) */}
          <thead>
            <tr className="bg-[#EEF4FD] text-slate-600 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              <th className="py-3 px-3.5 sm:px-6 whitespace-nowrap">N° Facture</th>
              <th className="py-3 px-3.5 sm:px-6 whitespace-nowrap">Client</th>
              <th className="py-3 px-3.5 sm:px-6 whitespace-nowrap">Localisation</th>
              <th className="py-3 px-3.5 sm:px-6 whitespace-nowrap">Date Émission</th>
              <th className="py-3 px-3.5 sm:px-6 whitespace-nowrap">Échéance</th>
              <th className="py-3 px-3.5 sm:px-6 whitespace-nowrap">Montant Total</th>
              <th className="py-3 px-3.5 sm:px-6 whitespace-nowrap">Statut</th>
              <th className="py-3 px-3.5 sm:px-6 text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm">
            {currentInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">Aucune facture trouvée</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Modifiez vos critères de recherche ou créez une nouvelle facture.
                  </p>
                </td>
              </tr>
            ) : (
              currentInvoices.map((inv, idx) => {
                const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
                const isNearBottom = idx >= Math.max(1, currentInvoices.length - 2);

                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/80 transition-colors group ${
                      activeMenuId === inv.id ? "relative z-30" : ""
                    }`}
                  >
                    {/* Invoice ID */}
                    <td className="py-3 sm:py-4 px-3.5 sm:px-6 whitespace-nowrap font-bold text-blue-600">
                      <button
                        onClick={() => onSelectInvoice(inv)}
                        className="hover:underline flex items-center gap-1.5 focus:outline-none"
                      >
                        {inv.id}
                      </button>
                    </td>

                    {/* Client Name & Coordinates */}
                    <td className="py-3 sm:py-4 px-3.5 sm:px-6 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{inv.clientName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{inv.clientEmail}</span>
                      </div>
                      {inv.clientPhone && (
                        <div className="text-xs text-blue-700 font-semibold flex items-center gap-1.5 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{inv.clientPhone}</span>
                        </div>
                      )}
                    </td>

                    {/* Location with Pin */}
                    <td className="py-3 sm:py-4 px-3.5 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{inv.location}</span>
                      </div>
                    </td>

                    {/* Issue Date JJ/MM/AAAA */}
                    <td className="py-3 sm:py-4 px-3.5 sm:px-6 whitespace-nowrap text-xs font-medium text-slate-600">
                      {inv.issueDate}
                    </td>

                    {/* Due Date JJ/MM/AAAA */}
                    <td className="py-3 sm:py-4 px-3.5 sm:px-6 whitespace-nowrap text-xs font-medium text-slate-600">
                      {inv.dueDate}
                    </td>

                    {/* Total Amount in FCFA */}
                    <td className="py-3 sm:py-4 px-3.5 sm:px-6 whitespace-nowrap font-extrabold text-slate-900">
                      {formatFCFA(total)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 sm:py-4 px-3.5 sm:px-6 whitespace-nowrap">
                      {getStatusBadge(inv.status)}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 sm:py-4 px-3.5 sm:px-6 whitespace-nowrap text-center relative">
                      {/* Backdrop invisible couvrant tout l'écran pour fermer dès un clic n'importe où */}
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
                          aria-label="Actions de la facture"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu - positionné en haut si en bas de page, en bas sinon */}
                        {activeMenuId === inv.id && (
                          <div
                            data-invoice-menu
                            className={`absolute right-0 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-40 animate-in fade-in zoom-in-95 text-left ring-1 ring-slate-900/10 ${
                              isNearBottom
                                ? "bottom-full mb-2 origin-bottom-right"
                                : "top-full mt-2 origin-top-right"
                            }`}
                          >
                            <button
                              onClick={() => {
                                onSelectInvoice(inv);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Voir détail complet</span>
                            </button>

                            <button
                              onClick={() => {
                                setInvoiceToEditConfirm(inv);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <FileEdit className="w-3.5 h-3.5 text-blue-600" />
                              <span>Modifier la facture</span>
                            </button>

                            {inv.status !== "payee" && (
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
                                generateInvoicePdf(inv, inv.company || companyInfo);
                                if (onToast) {
                                  onToast(`Téléchargement du PDF de la facture ${inv.id}...`, "success");
                                }
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                            >
                              <Download className="w-3.5 h-3.5 text-blue-600" />
                              <span>Télécharger reçu / PDF</span>
                            </button>

                            <button
                              onClick={() => {
                                if (onOpenReminder) {
                                  onOpenReminder(inv);
                                }
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                            >
                              <Send className="w-3.5 h-3.5 text-amber-600" />
                              <span>Relancer le client</span>
                            </button>

                            <div className="border-t border-slate-100 my-1"></div>

                            <button
                              onClick={() => {
                                setInvoiceToDeleteConfirm(inv);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer / Pagination matching screenshot */}
      <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
        <div>
          Affichage de{" "}
          <span className="font-bold text-slate-800">
            {totalItems > 0 ? startIndex + 1 : 0}
          </span>{" "}
          à <span className="font-bold text-slate-800">{endIndex}</span> sur{" "}
          <span className="font-bold text-slate-800">{totalItems}</span> factures
        </div>

        {/* Center / Right: Pagination Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  currentPage === pageNum
                    ? "bg-[#183BB0] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 border border-transparent"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Rows per page selector from screenshot */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Lignes par page</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modal d'exportation Excel XLSX et CSV avec téléchargement réel */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allInvoices={invoices}
        filteredInvoices={sortedInvoices}
        onToast={onToast}
      />

      {/* Pop-up de confirmation de Modification (Oui / Non) */}
      <ConfirmationModal
        isOpen={Boolean(invoiceToEditConfirm)}
        onClose={() => setInvoiceToEditConfirm(null)}
        onConfirm={() => {
          const inv = invoiceToEditConfirm;
          setInvoiceToEditConfirm(null);
          setInvoiceToEdit(inv);
        }}
        title="Modifier la facture"
        message={`Êtes-vous sûr de vouloir modifier la facture ${invoiceToEditConfirm?.id} ?`}
        subtitle={
          invoiceToEditConfirm
            ? `Client : ${invoiceToEditConfirm.clientName}. Vous pourrez modifier les articles, montants, dates et coordonnées.`
            : ""
        }
        confirmLabel="Oui"
        cancelLabel="Non"
        type="primary"
        icon={<FileEdit className="w-7 h-7 text-blue-600" />}
      />

      {/* Modal d'édition de la facture */}
      <EditInvoiceModal
        isOpen={Boolean(invoiceToEdit)}
        onClose={() => setInvoiceToEdit(null)}
        invoice={invoiceToEdit}
        clients={clients}
        companyInfo={companyInfo}
        onSave={(updatedInvoice) => {
          if (onUpdateInvoice) {
            onUpdateInvoice(updatedInvoice);
          }
          setInvoiceToEdit(null);
        }}
      />

      {/* Pop-up de confirmation de Suppression (Oui / Non ou Annuler) */}
      <ConfirmationModal
        isOpen={Boolean(invoiceToDeleteConfirm)}
        onClose={() => setInvoiceToDeleteConfirm(null)}
        onConfirm={() => {
          const id = invoiceToDeleteConfirm?.id;
          setInvoiceToDeleteConfirm(null);
          if (onDeleteInvoice && id) {
            onDeleteInvoice(id);
          }
        }}
        title="Supprimer la facture"
        message={`Êtes-vous sûr de vouloir supprimer cette facture ${invoiceToDeleteConfirm?.id || ""} ?`}
        subtitle={
          invoiceToDeleteConfirm
            ? `Client : ${invoiceToDeleteConfirm.clientName}. Attention, cette action retirera définitivement la facture.`
            : ""
        }
        confirmLabel="Oui, supprimer"
        cancelLabel="Non / Annuler"
        type="danger"
        icon={<Trash2 className="w-7 h-7 text-rose-600" />}
      />
    </div>
  );
}
