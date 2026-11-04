"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Building2,
  Search,
  Filter,
  Download,
  Printer,
  ChevronDown,
  ArrowUpRight,
  Send,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Eye,
  Check,
  RefreshCw,
  ExternalLink,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  UserCheck,
  UserX,
  UserPlus,
  FileDown,
} from "lucide-react";
import {
  formatFCFA,
  formatAmount,
  calculateInvoiceTotals,
  getCurrencySymbol,
} from "@/lib/mock-data";
import {
  exportToXLSX,
  exportRecoveryReportToXLSX,
  exportPendingPaymentsReportToXLSX,
  exportFiscalReportToXLSX,
  exportGlobalPortfolioReportToXLSX,
  exportAnalyticsToXLSX,
} from "@/lib/export-utils";
import { generateReportPdf } from "@/lib/pdf-generator";
import ReportPreviewModal from "./ReportPreviewModal";

export default function ReportsView({
  invoices = [],
  clients = [],
  quotes = [],
  payments = [],
  companyInfo = {},
  userProfile = {},
  onOpenInvoice,
  onOpenClientProfile,
  onOpenReminder,
  onOpenQuote,
  onOpenCreateInvoice,
  onRecordPayment,
  onNavigateToTab,
  onToast,
}) {
  // Onglet de rapport actif : "all" | "overdue" | "pending" | "prospects" | "fiscal"
  const [activeReportTab, setActiveReportTab] = useState("all");

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all"); // "all" | "month" | "quarter" | "year"
  const [urgencyFilter, setUrgencyFilter] = useState("all"); // "all" | "critical" | "moderate" | "recent"
  const [clientTypeFilter, setClientTypeFilter] = useState("all"); // "all" | "debtor" | "pending" | "confirmed" | "prospect"

  // Tri
  const [sortField, setSortField] = useState("dueDate");
  const [sortDirection, setSortDirection] = useState("desc");

  // Modale d'aperçu imprimable
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewConfig, setPreviewConfig] = useState({
    title: "Rapport Officiel",
    type: "all",
    data: [],
  });

  // Menu déroulant Export
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Devise active de l'entreprise
  const currency = companyInfo.currencySymbol || "FC";

  // --- 1. CALCUL DES MÉTRIQUES ET DONNÉES FINANCIÈRES ---
  const enrichedInvoices = useMemo(() => {
    return invoices.map((inv) => {
      const { subtotal, vatAmount, total } = calculateInvoiceTotals(
        inv.items,
        inv.vatRate ?? companyInfo.defaultVatRate ?? 0.16
      );

      // Calcul des jours de dépassement d'échéance
      let daysOverdue = 0;
      let daysUntilDue = 0;
      if (inv.dueDate) {
        const parts = inv.dueDate.split("/");
        if (parts.length === 3) {
          const due = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          const today = new Date(); // Date réelle et dynamique du système
          const diffTime = today - due;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 0) {
            daysOverdue = diffDays;
          } else {
            daysUntilDue = Math.abs(diffDays);
          }
        }
      }

      // Gravité du retard
      let urgencyLevel = "low";
      if (daysOverdue > 30) urgencyLevel = "critical";
      else if (daysOverdue >= 15) urgencyLevel = "moderate";
      else if (daysOverdue > 0) urgencyLevel = "recent";

      return {
        ...inv,
        subtotal,
        vatAmount,
        total,
        daysOverdue,
        daysUntilDue,
        urgencyLevel,
      };
    });
  }, [invoices, companyInfo]);

  // Factures échues / à relancer
  const overdueInvoices = useMemo(() => {
    return enrichedInvoices.filter((inv) => inv.status === "en_attente");
  }, [enrichedInvoices]);

  // Factures en attente de paiement (dans les délais)
  const pendingInvoices = useMemo(() => {
    return enrichedInvoices.filter((inv) => inv.status === "envoyee");
  }, [enrichedInvoices]);

  // Factures payées
  const paidInvoices = useMemo(() => {
    return enrichedInvoices.filter((inv) => inv.status === "payee");
  }, [enrichedInvoices]);

  // --- 2. SYNTHÈSE GLOBALE 360° DU PORTEFEUILLE (CLIENTS & PROSPECTS) ---
  const portfolio360 = useMemo(() => {
    const map = new Map();

    // 1. Initialiser avec le répertoire officiel des clients
    clients.forEach((c) => {
      const key = (c.name || "").trim().toLowerCase();
      map.set(key, {
        id: c.id || `CLI-${Math.floor(Math.random() * 9000)}`,
        name: c.name,
        contactPerson: c.contactPerson || "",
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || "",
        location: c.location || "",
        taxId: c.taxId || "",
        invoices: [],
        quotes: [],
        totalBilled: 0,
        totalPaid: 0,
        balanceDue: 0,
        hasOverdue: false,
        hasPending: false,
        isProspectOnly: false,
      });
    });

    // 2. Rattacher les factures
    enrichedInvoices.forEach((inv) => {
      const key = (inv.clientName || "").trim().toLowerCase();
      let record = map.get(key);
      if (!record) {
        record = {
          id: `CLI-${Math.floor(Math.random() * 9000)}`,
          name: inv.clientName,
          contactPerson: inv.contactPerson || "",
          email: inv.clientEmail || "",
          phone: inv.clientPhone || "",
          address: inv.address || "",
          location: inv.location || "",
          taxId: inv.taxId || "",
          invoices: [],
          quotes: [],
          totalBilled: 0,
          totalPaid: 0,
          balanceDue: 0,
          hasOverdue: false,
          hasPending: false,
          isProspectOnly: false,
        };
        map.set(key, record);
      }

      record.invoices.push(inv);
      record.totalBilled += inv.total;
      if (inv.status === "payee") {
        record.totalPaid += inv.total;
      } else {
        record.balanceDue += inv.total;
        if (inv.status === "en_attente") {
          record.hasOverdue = true;
        } else if (inv.status === "envoyee") {
          record.hasPending = true;
        }
      }
    });

    // 3. Rattacher les devis (Prospects)
    quotes.forEach((q) => {
      const key = (q.clientName || "").trim().toLowerCase();
      let record = map.get(key);
      if (!record) {
        record = {
          id: `PROS-${Math.floor(Math.random() * 9000)}`,
          name: q.clientName,
          contactPerson: q.contactPerson || "",
          email: q.clientEmail || "",
          phone: q.clientPhone || "",
          address: q.address || "",
          location: q.location || "",
          taxId: q.taxId || "",
          invoices: [],
          quotes: [],
          totalBilled: 0,
          totalPaid: 0,
          balanceDue: 0,
          hasOverdue: false,
          hasPending: false,
          isProspectOnly: true,
        };
        map.set(key, record);
      }
      record.quotes.push(q);
    });

    // 4. Calculer le profil de chaque entrée
    return Array.from(map.values()).map((p) => {
      p.invoiceCount = p.invoices.length;
      p.quoteCount = p.quotes.length;

      if (p.invoiceCount === 0 && p.quoteCount > 0) {
        p.profileType = "prospect";
        p.statusLabel = "Prospect en Négociation";
        p.solvencyScore = "Prospect (À qualifier)";
      } else if (p.hasOverdue) {
        p.profileType = "debtor";
        p.statusLabel = "Créances Échues (À Relancer)";
        p.solvencyScore = "Vigilance Recouvrement (C)";
      } else if (p.hasPending) {
        p.profileType = "pending";
        p.statusLabel = "Paiement en Attente";
        p.solvencyScore = "Régulier sous délai (B)";
      } else if (p.invoiceCount > 0 && p.balanceDue === 0) {
        p.profileType = "confirmed";
        p.statusLabel = "Client Confirmé (À Jour)";
        p.solvencyScore = "Excellente Solvabilité (A+)";
      } else {
        p.profileType = "dormant";
        p.statusLabel = "Client Référencé (Inactif)";
        p.solvencyScore = "Neutre";
      }

      return p;
    });
  }, [clients, enrichedInvoices, quotes]);

  // --- 3. TOTAUX ET KPIS MAJEURS ---
  const kpis = useMemo(() => {
    const totalOverdueAmount = overdueInvoices.reduce((acc, i) => acc + i.total, 0);
    const totalPendingAmount = pendingInvoices.reduce((acc, i) => acc + i.total, 0);
    const totalPaidAmount = paidInvoices.reduce((acc, i) => acc + i.total, 0);
    const totalQuotesAmount = quotes.reduce((acc, q) => {
      const { total } = calculateInvoiceTotals(q.items, q.vatRate);
      return acc + total;
    }, 0);

    const debtorsCount = portfolio360.filter((p) => p.profileType === "debtor").length;
    const pendingClientsCount = portfolio360.filter((p) => p.profileType === "pending").length;
    const confirmedClientsCount = portfolio360.filter((p) => p.profileType === "confirmed").length;
    const prospectsCount = portfolio360.filter((p) => p.profileType === "prospect").length;

    const totalBilledAll = totalOverdueAmount + totalPendingAmount + totalPaidAmount;
    const globalRecoveryRate =
      totalBilledAll > 0 ? Math.round((totalPaidAmount / totalBilledAll) * 1000) / 10 : 0;

    return {
      totalOverdueAmount,
      totalPendingAmount,
      totalPaidAmount,
      totalQuotesAmount,
      debtorsCount,
      pendingClientsCount,
      confirmedClientsCount,
      prospectsCount,
      globalRecoveryRate,
      totalInvoicesCount: invoices.length,
      totalClientsCount: portfolio360.length,
    };
  }, [overdueInvoices, pendingInvoices, paidInvoices, quotes, portfolio360, invoices]);

  // --- 4. FILTRAGE DYNAMIQUE SELON L'ONGLET ACTIF ---
  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (activeReportTab === "overdue") {
      return overdueInvoices.filter((inv) => {
        const matchesQuery =
          !query ||
          (inv.clientName && inv.clientName.toLowerCase().includes(query)) ||
          (inv.id && inv.id.toLowerCase().includes(query)) ||
          (inv.contactPerson && inv.contactPerson.toLowerCase().includes(query)) ||
          (inv.clientPhone && inv.clientPhone.toLowerCase().includes(query));

        const matchesUrgency =
          urgencyFilter === "all" ||
          (urgencyFilter === "critical" && inv.urgencyLevel === "critical") ||
          (urgencyFilter === "moderate" && inv.urgencyLevel === "moderate") ||
          (urgencyFilter === "recent" && inv.urgencyLevel === "recent");

        return matchesQuery && matchesUrgency;
      });
    }

    if (activeReportTab === "pending") {
      return pendingInvoices.filter((inv) => {
        return (
          !query ||
          (inv.clientName && inv.clientName.toLowerCase().includes(query)) ||
          (inv.id && inv.id.toLowerCase().includes(query)) ||
          (inv.contactPerson && inv.contactPerson.toLowerCase().includes(query)) ||
          (inv.clientPhone && inv.clientPhone.toLowerCase().includes(query))
        );
      });
    }

    if (activeReportTab === "prospects") {
      return quotes.filter((q) => {
        return (
          !query ||
          (q.clientName && q.clientName.toLowerCase().includes(query)) ||
          (q.id && q.id.toLowerCase().includes(query)) ||
          (q.contactPerson && q.contactPerson.toLowerCase().includes(query))
        );
      });
    }

    if (activeReportTab === "fiscal") {
      return enrichedInvoices.filter((inv) => {
        return (
          !query ||
          (inv.clientName && inv.clientName.toLowerCase().includes(query)) ||
          (inv.id && inv.id.toLowerCase().includes(query)) ||
          (inv.taxId && inv.taxId.toLowerCase().includes(query))
        );
      });
    }

    // Default: "all" (Portfolio 360)
    return portfolio360.filter((p) => {
      const matchesQuery =
        !query ||
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.contactPerson && p.contactPerson.toLowerCase().includes(query)) ||
        (p.email && p.email.toLowerCase().includes(query)) ||
        (p.phone && p.phone.toLowerCase().includes(query));

      const matchesType =
        clientTypeFilter === "all" ||
        (clientTypeFilter === "debtor" && p.profileType === "debtor") ||
        (clientTypeFilter === "pending" && p.profileType === "pending") ||
        (clientTypeFilter === "confirmed" && p.profileType === "confirmed") ||
        (clientTypeFilter === "prospect" && p.profileType === "prospect");

      return matchesQuery && matchesType;
    });
  }, [
    activeReportTab,
    searchQuery,
    urgencyFilter,
    clientTypeFilter,
    overdueInvoices,
    pendingInvoices,
    quotes,
    enrichedInvoices,
    portfolio360,
  ]);

  // --- 5. GESTION DES EXPORTS XLSX ---
  const handleExportCurrentView = () => {
    try {
      if (activeReportTab === "overdue") {
        exportRecoveryReportToXLSX(overdueInvoices, companyInfo);
        if (onToast) onToast("Rapport officiel de recouvrement exporté en Excel !");
      } else if (activeReportTab === "pending") {
        exportPendingPaymentsReportToXLSX(pendingInvoices, companyInfo);
        if (onToast) onToast("Calendrier des encaissements en attente exporté en Excel !");
      } else if (activeReportTab === "fiscal") {
        exportFiscalReportToXLSX(invoices, companyInfo);
        if (onToast) onToast("Déclaration fiscale OHADA exportée avec succès !");
      } else if (activeReportTab === "prospects") {
        exportToXLSX(invoices, "Devis_Et_Prospects_FacturX.xlsx");
        if (onToast) onToast("Rapport des opportunités commerciales exporté !");
      } else {
        exportGlobalPortfolioReportToXLSX(portfolio360, companyInfo);
        if (onToast) onToast("Rapport global 360° du portefeuille clients exporté !");
      }
    } catch (e) {
      console.error(e);
      if (onToast) onToast("Erreur lors de l'export Excel");
    }
  };

  const handleExportFullAuditWorkbook = () => {
    try {
      exportAnalyticsToXLSX(invoices, payments, quotes, companyInfo, "Grand_Livre_Audit_FacturX.xlsx");
      if (onToast) onToast("Classeur d'audit multi-feuilles généré avec succès !");
    } catch (e) {
      console.error(e);
      if (onToast) onToast("Erreur lors de la génération de l'audit");
    }
  };

  const handleExportPdfCurrentView = () => {
    try {
      let title = "Rapport Financier & Gestion FacturX";
      let rows = [];

      if (activeReportTab === "overdue") {
        title = "ÉTAT DÉTAILLÉ DE RECOUVREMENT & FACTURES ÉCHUES";
        rows = overdueInvoices.map((inv) => ({
          id: inv.id,
          clientName: inv.clientName,
          contactPerson: inv.contactPerson,
          dueDate: `${inv.dueDate} (+${inv.daysOverdue}j)`,
          totalAmount: inv.total,
          status: inv.status,
          statusLabel: `Retard (+${inv.daysOverdue} jours)`,
        }));
      } else if (activeReportTab === "pending") {
        title = "CALENDRIER PRÉVISIONNEL DES ENCAISSEMENTS EN ATTENTE";
        rows = pendingInvoices.map((inv) => ({
          id: inv.id,
          clientName: inv.clientName,
          contactPerson: inv.contactPerson,
          dueDate: `${inv.dueDate} (dans ${inv.daysUntilDue}j)`,
          totalAmount: inv.total,
          status: inv.status,
          statusLabel: "En attente d'échéance",
        }));
      } else if (activeReportTab === "prospects") {
        title = "PIPELINE COMMERCIAL & DEVIS EN NÉGOCIATION";
        rows = quotes.map((q) => {
          const { total } = calculateInvoiceTotals(q.items, q.vatRate);
          return {
            id: q.id,
            clientName: q.clientName,
            contactPerson: q.contactPerson,
            dueDate: q.validUntil,
            totalAmount: total,
            status: q.status,
            statusLabel: q.status === "accepte" ? "Validé" : "En cours",
          };
        });
      } else if (activeReportTab === "fiscal") {
        title = "DÉCLARATION FISCALE ET JOURNAL DE VENTES OHADA / DGI";
        rows = enrichedInvoices.map((inv) => ({
          id: inv.id,
          clientName: inv.clientName,
          contactPerson: inv.taxId || "NIF non renseigné",
          dueDate: inv.issueDate,
          totalAmount: inv.total,
          status: inv.status,
          statusLabel: inv.status === "payee" ? "TVA Exigible" : "Facturé",
        }));
      } else {
        title = "SYNTHÈSE 360° DU PORTEFEUILLE CLIENTS & PROSPECTS";
        rows = portfolio360.map((p) => ({
          id: p.id,
          clientName: p.name,
          contactPerson: p.contactPerson || p.phone,
          dueDate: `${p.invoiceCount} fac. / ${p.quoteCount} devis`,
          totalAmount: p.balanceDue > 0 ? p.balanceDue : p.totalBilled,
          status: p.hasOverdue ? "en_attente" : p.hasPending ? "envoyee" : "payee",
          statusLabel: p.statusLabel,
        }));
      }

      const ok = generateReportPdf({
        title,
        reportType: activeReportTab,
        companyInfo,
        userProfile,
        data: rows,
        currency,
      });
      if (ok && onToast) {
        onToast("Rapport officiel téléchargé en format PDF avec succès !");
      }
    } catch (e) {
      console.error(e);
      if (onToast) onToast("Erreur lors de la génération du PDF");
    }
  };

  // --- 6. APERÇU ET IMPRESSION DU RAPPORT ---
  const handleOpenPrintPreview = (customType = null) => {
    const targetType = customType || activeReportTab;
    let title = "Rapport Financier & Gestion FacturX";
    let rows = [];

    if (targetType === "overdue") {
      title = "ÉTAT DÉTAILLÉ DE RECOUVREMENT & FACTURES ÉCHUES";
      rows = overdueInvoices.map((inv) => ({
        id: inv.id,
        clientName: inv.clientName,
        contactPerson: inv.contactPerson,
        dueDate: `${inv.dueDate} (+${inv.daysOverdue}j)`,
        totalAmount: inv.total,
        status: inv.status,
        statusLabel: `Retard (+${inv.daysOverdue} jours)`,
      }));
    } else if (targetType === "pending") {
      title = "CALENDRIER PRÉVISIONNEL DES ENCAISSEMENTS EN ATTENTE";
      rows = pendingInvoices.map((inv) => ({
        id: inv.id,
        clientName: inv.clientName,
        contactPerson: inv.contactPerson,
        dueDate: `${inv.dueDate} (dans ${inv.daysUntilDue}j)`,
        totalAmount: inv.total,
        status: inv.status,
        statusLabel: "En attente d'échéance",
      }));
    } else if (targetType === "prospects") {
      title = "PIPELINE COMMERCIAL & DEVIS EN NÉGOCIATION";
      rows = quotes.map((q) => {
        const { total } = calculateInvoiceTotals(q.items, q.vatRate);
        return {
          id: q.id,
          clientName: q.clientName,
          contactPerson: q.contactPerson,
          dueDate: q.validUntil,
          totalAmount: total,
          status: q.status,
          statusLabel: q.status === "accepte" ? "Validé" : "En cours",
        };
      });
    } else if (targetType === "fiscal") {
      title = "DÉCLARATION FISCALE ET JOURNAL DE VENTES OHADA / DGI";
      rows = enrichedInvoices.map((inv) => ({
        id: inv.id,
        clientName: inv.clientName,
        contactPerson: inv.taxId || "NIF non renseigné",
        dueDate: inv.issueDate,
        totalAmount: inv.total,
        status: inv.status,
        statusLabel: inv.status === "payee" ? "TVA Exigible" : "Facturé",
      }));
    } else {
      title = "SYNTHÈSE 360° DU PORTEFEUILLE CLIENTS & PROSPECTS";
      rows = portfolio360.map((p) => ({
        id: p.id,
        clientName: p.name,
        contactPerson: p.contactPerson || p.phone,
        dueDate: `${p.invoiceCount} fac. / ${p.quoteCount} devis`,
        totalAmount: p.balanceDue > 0 ? p.balanceDue : p.totalBilled,
        status: p.hasOverdue ? "en_attente" : p.hasPending ? "envoyee" : "payee",
        statusLabel: p.statusLabel,
      }));
    }

    setPreviewConfig({
      title,
      type: targetType,
      data: rows,
    });
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. HEADER DE PAGE (Conforme Design System) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Rapports & États Financiers
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Conforme OHADA & DGI
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Génération certifiée d&apos;états comptables, recouvrement des créances échues et
            suivi global du portefeuille clients.
          </p>
        </div>

        {/* Boutons d'actions majeurs en haut à droite */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Menu déroulant Exporter */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Exporter Excel</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsExportMenuOpen(false)}
              >
                <button
                  onClick={handleExportCurrentView}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Exporter la vue active (XLSX)</span>
                </button>
                <button
                  onClick={handleExportPdfCurrentView}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-rose-600 flex items-center gap-2.5"
                >
                  <FileDown className="w-4 h-4 text-rose-600" />
                  <span>Télécharger en format PDF</span>
                </button>
                <button
                  onClick={() => exportRecoveryReportToXLSX(overdueInvoices, companyInfo)}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-rose-600 flex items-center gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Rapport de Recouvrement (Créances échues)</span>
                </button>
                <button
                  onClick={() => exportPendingPaymentsReportToXLSX(pendingInvoices, companyInfo)}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-amber-600 flex items-center gap-2.5"
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Paiements en attente (Prévisionnel)</span>
                </button>
                <button
                  onClick={() => exportFiscalReportToXLSX(invoices, companyInfo)}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Déclaration Fiscale OHADA / DGI</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={handleExportFullAuditWorkbook}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Grand Livre Complet d&apos;Audit (Multi-feuilles)</span>
                </button>
              </div>
            )}
          </div>

          {/* Bouton Impression Officielle A4 */}
          <button
            onClick={() => handleOpenPrintPreview()}
            className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Imprimer Officiel</span>
            <span className="sm:hidden">Imprimer</span>
          </button>

          {/* Bouton Primaire : Audit Stratégique */}
          <button
            onClick={() => handleOpenPrintPreview("all")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Générer Rapport d&apos;Audit</span>
          </button>
        </div>
      </div>

      {/* 2. RANGÉE DE CARTES STATISTIQUES (KPIS 4 COLONNES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1 : Créances Échues & Relances d'urgence */}
        <div
          onClick={() => setActiveReportTab("overdue")}
          className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all cursor-pointer group hover:border-rose-300 ${
            activeReportTab === "overdue"
              ? "border-rose-400 ring-2 ring-rose-100 shadow-md"
              : "border-slate-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Créances Échues (À Relancer)
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {formatAmount(kpis.totalOverdueAmount, currency)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-0.5 bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                {kpis.debtorsCount} clients à relancer
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2 : Encaissements en Attente (Prévisionnel court terme) */}
        <div
          onClick={() => setActiveReportTab("pending")}
          className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all cursor-pointer group hover:border-amber-300 ${
            activeReportTab === "pending"
              ? "border-amber-400 ring-2 ring-amber-100 shadow-md"
              : "border-slate-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Paiements en Attente
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {formatAmount(kpis.totalPendingAmount, currency)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-0.5 bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
                {kpis.pendingClientsCount} règlements attendus
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3 : Chiffre d'Affaires Encaissé & Solvabilité */}
        <div
          onClick={() => setActiveReportTab("all")}
          className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all cursor-pointer group hover:border-emerald-300 ${
            activeReportTab === "all"
              ? "border-emerald-400 ring-2 ring-emerald-100 shadow-md"
              : "border-slate-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Clients Confirmés (Encaissé)
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {formatAmount(kpis.totalPaidAmount, currency)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-0.5 bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                {kpis.globalRecoveryRate}% Taux de recouvrement
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4 : Pipeline Devis & Opportunités Prospects */}
        <div
          onClick={() => setActiveReportTab("prospects")}
          className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all cursor-pointer group hover:border-blue-300 ${
            activeReportTab === "prospects"
              ? "border-blue-400 ring-2 ring-blue-100 shadow-md"
              : "border-slate-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Pipeline Prospects & Devis
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {formatAmount(kpis.totalQuotesAmount, currency)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600" />
                {quotes.length} devis en négociation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTENEUR PRINCIPAL / TABLE (Carte blanche officielle) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Navigation des Onglets de Rapports */}
        <div className="px-6 pt-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto pb-px scrollbar-none">
            <button
              onClick={() => setActiveReportTab("all")}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeReportTab === "all"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Synthèse 360° Portefeuille</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {portfolio360.length}
              </span>
            </button>

            <button
              onClick={() => setActiveReportTab("overdue")}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeReportTab === "overdue"
                  ? "border-rose-600 text-rose-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>🚨 Créances Échues & Relances</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                {overdueInvoices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveReportTab("pending")}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeReportTab === "pending"
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>⏳ Paiements en Attente</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {pendingInvoices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveReportTab("prospects")}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeReportTab === "prospects"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>🎯 Prospects & Devis</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {quotes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveReportTab("fiscal")}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeReportTab === "fiscal"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>⚖️ Déclaration Fiscale OHADA / DGI</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                TVA {Math.round((companyInfo.defaultVatRate ?? 0.16) * 100)}%
              </span>
            </button>
          </div>
        </div>

        {/* Barre de Recherche et Filtres contextuels */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Champ de recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeReportTab === "overdue"
                  ? "Rechercher un client débiteur, facture échue..."
                  : activeReportTab === "prospects"
                  ? "Rechercher un devis, prospect..."
                  : "Rechercher par nom de client, contact, email, téléphone..."
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Filtres secondaires */}
          <div className="flex items-center gap-3 flex-wrap">
            {activeReportTab === "overdue" && (
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Tous les retards</option>
                <option value="critical">Critique (&gt; 30 jours de retard)</option>
                <option value="moderate">Modéré (15 à 30 jours)</option>
                <option value="recent">Récent (&lt; 15 jours)</option>
              </select>
            )}

            {activeReportTab === "all" && (
              <select
                value={clientTypeFilter}
                onChange={(e) => setClientTypeFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Tous les profils clients</option>
                <option value="debtor">Débiteurs (Créances à recouvrer)</option>
                <option value="pending">Paiement en attente</option>
                <option value="confirmed">Clients confirmés (À jour)</option>
                <option value="prospect">Prospects (Devis)</option>
              </select>
            )}

            <button
              onClick={() => handleOpenPrintPreview()}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Aperçu Imprimable</span>
            </button>
          </div>
        </div>

        {/* --- CORPS DE LA TABLE SELON L'ONGLET SÉLECTIONNÉ --- */}

        {/* 1. VUE ONGLET 2 : CRÉANCES ÉCHUES & RELANCES D'URGENCE */}
        {activeReportTab === "overdue" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Facture Échue
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Client Débiteur & Contact
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Échéance Dépassée
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Montant Dû TTC
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Dernière Relance
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions Immédiates
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? (
                  filteredData.map((inv) => {
                    const lastReminder =
                      inv.reminders && inv.reminders.length > 0
                        ? inv.reminders[inv.reminders.length - 1]
                        : null;

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* N° Facture */}
                        <td className="py-4 px-4 text-sm align-middle">
                          <button
                            onClick={() => onOpenInvoice && onOpenInvoice(inv)}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{inv.id}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            Émise le {inv.issueDate}
                          </span>
                        </td>

                        {/* Client Débiteur */}
                        <td className="py-4 px-4 text-sm align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-extrabold text-xs">
                              {inv.clientName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">
                                {inv.clientName}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {inv.contactPerson || "Direction Financière"}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {inv.clientPhone || "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Échéance dépassée */}
                        <td className="py-4 px-4 text-sm align-middle">
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-800 block">
                              {inv.dueDate}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                inv.daysOverdue > 30
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : inv.daysOverdue >= 15
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              +{inv.daysOverdue} jours de retard
                            </span>
                          </div>
                        </td>

                        {/* Montant Dû TTC */}
                        <td className="py-4 px-4 text-sm text-right align-middle">
                          <p className="text-base font-extrabold text-rose-700 tracking-tight">
                            {formatAmount(inv.total, currency)}
                          </p>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            dont TVA {formatAmount(inv.vatAmount, currency)}
                          </span>
                        </td>

                        {/* Statut relance */}
                        <td className="py-4 px-4 text-sm align-middle">
                          {lastReminder ? (
                            <div className="text-xs space-y-0.5">
                              <span className="font-semibold text-slate-800 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                Relancé le {lastReminder.date.split(" ")[0]}
                              </span>
                              <span className="text-slate-400 text-[11px] block capitalize">
                                Canal : {lastReminder.channel} ({lastReminder.status || "Transmis"})
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                              Aucune relance effectuée
                            </span>
                          )}
                        </td>

                        {/* Actions Rapides */}
                        <td className="py-4 px-4 text-sm text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                            {/* Bouton Relancer le client (Demande directe du boss !) */}
                            <button
                              onClick={() => onOpenReminder && onOpenReminder(inv)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Ouvrir le formulaire de relance WhatsApp/Email"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Relancer</span>
                            </button>

                            {/* Encaisser */}
                            {onRecordPayment && (
                              <button
                                onClick={() => onRecordPayment(inv)}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
                                title="Enregistrer le règlement perçu"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Encaisser</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                      <p className="font-bold text-slate-700">
                        Aucune créance en retard critique détectée
                      </p>
                      <p className="text-xs text-slate-400">
                        Tous vos clients débiteurs sont à jour ou filtrés.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. VUE ONGLET 3 : PAIEMENTS EN ATTENTE (DANS LES DÉLAIS) */}
        {activeReportTab === "pending" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    N° Facture
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Client & Représentant
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date d&apos;Échéance
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Montant Attendu TTC
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                    Statut Règlement
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? (
                  filteredData.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      <td className="py-4 px-4 text-sm align-middle">
                        <button
                          onClick={() => onOpenInvoice && onOpenInvoice(inv)}
                          className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{inv.id}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          Émise le {inv.issueDate}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-sm align-middle">
                        <p className="font-bold text-slate-900">{inv.clientName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {inv.contactPerson || "Interlocuteur direct"}
                        </p>
                      </td>

                      <td className="py-4 px-4 text-sm align-middle">
                        <span className="text-xs font-semibold text-slate-800 block">
                          {inv.dueDate}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-0.5">
                          <Clock className="w-3 h-3" />
                          Échéance dans {inv.daysUntilDue} jours
                        </span>
                      </td>

                      <td className="py-4 px-4 text-sm text-right align-middle">
                        <p className="text-base font-extrabold text-amber-800 tracking-tight">
                          {formatAmount(inv.total, currency)}
                        </p>
                        <span className="text-[11px] text-slate-400 block">
                          HT : {formatAmount(inv.subtotal, currency)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-sm text-center align-middle">
                        <span className="inline-flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1 bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
                          Envoyée / En attente
                        </span>
                      </td>

                      <td className="py-4 px-4 text-sm text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenInvoice && onOpenInvoice(inv)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                          >
                            Consulter
                          </button>
                          {onRecordPayment && (
                            <button
                              onClick={() => onRecordPayment(inv)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Encaisser</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Aucune facture en cours d&apos;attente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. VUE ONGLET 4 : PROSPECTS & DEVIS EN COURS */}
        {activeReportTab === "prospects" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Réf Devis
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Prospect / Entreprise
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Validité de l&apos;offre
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Montant Potentiel TTC
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                    Statut Négociation
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? (
                  filteredData.map((q) => {
                    const { total } = calculateInvoiceTotals(q.items, q.vatRate);
                    return (
                      <tr
                        key={q.id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        <td className="py-4 px-4 text-sm align-middle font-mono font-bold text-blue-600">
                          {q.id}
                        </td>

                        <td className="py-4 px-4 text-sm align-middle">
                          <p className="font-bold text-slate-900">{q.clientName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {q.contactPerson || q.clientEmail || "Prospect"}
                          </p>
                        </td>

                        <td className="py-4 px-4 text-sm align-middle">
                          <span className="text-xs font-semibold text-slate-800 block">
                            Jusqu&apos;au {q.validUntil}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Émis le {q.issueDate}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-sm text-right align-middle">
                          <p className="text-base font-extrabold text-blue-700 tracking-tight">
                            {formatAmount(total, currency)}
                          </p>
                        </td>

                        <td className="py-4 px-4 text-sm text-center align-middle">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1 ${
                              q.status === "accepte"
                                ? "bg-emerald-100 text-emerald-800"
                                : q.status === "expire"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {q.status === "accepte"
                              ? "Devis Validé (Prêt à Facturer)"
                              : q.status === "expire"
                              ? "Validité Dépassée"
                              : "En Négociation"}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-sm text-right align-middle">
                          <button
                            onClick={() => onOpenQuote && onOpenQuote(q)}
                            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            Voir Devis
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Aucun devis prospect trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. VUE ONGLET 5 : DÉCLARATION FISCALE OHADA / DGI */}
        {activeReportTab === "fiscal" && (
          <div className="p-6 space-y-6">
            {/* Carte Récapitulative Fiscale */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Chiffre d&apos;Affaires Brut HT
                </span>
                <p className="text-xl font-extrabold text-slate-900">
                  {formatAmount(
                    enrichedInvoices.reduce((acc, i) => acc + i.subtotal, 0),
                    currency
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  TVA Collectée ({Math.round((companyInfo.defaultVatRate ?? 0.16) * 100)}%)
                </span>
                <p className="text-xl font-extrabold text-blue-700">
                  {formatAmount(
                    enrichedInvoices.reduce((acc, i) => acc + i.vatAmount, 0),
                    currency
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Facturé TTC
                </span>
                <p className="text-xl font-extrabold text-slate-900">
                  {formatAmount(
                    enrichedInvoices.reduce((acc, i) => acc + i.total, 0),
                    currency
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Encaissé (TVA Exigible)
                </span>
                <p className="text-xl font-extrabold text-emerald-700">
                  {formatAmount(kpis.totalPaidAmount, currency)}
                </p>
              </div>
            </div>

            {/* Ventilation par Régime de TVA (RDC 16% / UEMOA 18% / Exonéré) */}
            <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="font-bold text-slate-700">Régime RDC (16%) :</span>
                <span className="font-semibold text-slate-900">
                  Base HT :{" "}
                  {formatAmount(
                    enrichedInvoices
                      .filter((i) => i.vatRate > 0 && i.vatRate < 0.17)
                      .reduce((acc, i) => acc + i.subtotal, 0),
                    currency
                  )}{" "}
                  | TVA :{" "}
                  {formatAmount(
                    enrichedInvoices
                      .filter((i) => i.vatRate > 0 && i.vatRate < 0.17)
                      .reduce((acc, i) => acc + i.vatAmount, 0),
                    currency
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span className="font-bold text-slate-700">Régime UEMOA (18%) :</span>
                <span className="font-semibold text-slate-900">
                  Base HT :{" "}
                  {formatAmount(
                    enrichedInvoices
                      .filter((i) => i.vatRate >= 0.17)
                      .reduce((acc, i) => acc + i.subtotal, 0),
                    currency
                  )}{" "}
                  | TVA :{" "}
                  {formatAmount(
                    enrichedInvoices
                      .filter((i) => i.vatRate >= 0.17)
                      .reduce((acc, i) => acc + i.vatAmount, 0),
                    currency
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span className="font-bold text-slate-700">Exonéré (0%) :</span>
                <span className="font-semibold text-slate-900">
                  {formatAmount(
                    enrichedInvoices
                      .filter((i) => !i.vatRate || i.vatRate === 0)
                      .reduce((acc, i) => acc + i.subtotal, 0),
                    currency
                  )}
                </span>
              </div>
            </div>

            {/* Table des Factures Fiscales */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 text-xs uppercase tracking-wider">N° Facture</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider">Date</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider">Client & NIF</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-right">Base HT</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-right">TVA</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-right">Total TTC</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-center">Régime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredData.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{inv.id}</td>
                      <td className="py-3 px-4 text-slate-600">{inv.issueDate}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{inv.clientName}</p>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {inv.taxId || "NIF: N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-700">
                        {formatAmount(inv.subtotal, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">
                        {formatAmount(inv.vatAmount, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatAmount(inv.total, currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {inv.status === "payee" ? "Encaissé (Exigible)" : "Créance en cours"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. VUE ONGLET 1 : SYNTHÈSE 360° PORTFEUILLE CLIENTS (TOUS TYPES DE PERSONNES) */}
        {activeReportTab === "all" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Client / Entreprise
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Profil de la Relation
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                    Dossiers
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Total Facturé TTC
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Total Encaissé
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Solde Dû
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? (
                  filteredData.map((p) => {
                    return (
                      <tr
                        key={p.name}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* Entreprise & Contact */}
                        <td className="py-4 px-4 text-sm align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 flex items-center justify-center font-extrabold text-xs shadow-2xs">
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{p.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {p.contactPerson || "Interlocuteur non renseigné"}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {p.phone || "—"}
                                </span>
                                <span>•</span>
                                <span>{p.location || "RDC"}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Profil sémantique */}
                        <td className="py-4 px-4 text-sm align-middle">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1 ${
                              p.profileType === "debtor"
                                ? "bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3]"
                                : p.profileType === "pending"
                                ? "bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]"
                                : p.profileType === "confirmed"
                                ? "bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                p.profileType === "debtor"
                                  ? "bg-[#E11D48] animate-pulse"
                                  : p.profileType === "pending"
                                  ? "bg-[#EA580C]"
                                  : p.profileType === "confirmed"
                                  ? "bg-[#16A34A]"
                                  : "bg-blue-600"
                              }`}
                            />
                            {p.statusLabel}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-1">
                            {p.solvencyScore}
                          </span>
                        </td>

                        {/* Nb Dossiers */}
                        <td className="py-4 px-4 text-sm text-center align-middle">
                          <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-800">
                              {p.invoiceCount} fac.
                            </span>
                            {p.quoteCount > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 font-bold text-blue-700">
                                {p.quoteCount} devis
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Total Facturé */}
                        <td className="py-4 px-4 text-sm text-right align-middle font-semibold text-slate-800">
                          {formatAmount(p.totalBilled, currency)}
                        </td>

                        {/* Total Encaissé */}
                        <td className="py-4 px-4 text-sm text-right align-middle font-bold text-emerald-700">
                          {formatAmount(p.totalPaid, currency)}
                        </td>

                        {/* Solde restant dû */}
                        <td className="py-4 px-4 text-sm text-right align-middle font-extrabold">
                          {p.balanceDue > 0 ? (
                            <span className="text-rose-600">
                              {formatAmount(p.balanceDue, currency)}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">0 {currency}</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-sm text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                            {p.hasOverdue && (
                              <button
                                onClick={() => {
                                  // Trouver la première facture échue de ce client
                                  const overdueInv = p.invoices.find((i) => i.status === "en_attente");
                                  if (overdueInv && onOpenReminder) {
                                    onOpenReminder(overdueInv);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                                title="Relancer ce client"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Relancer</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (onOpenClientProfile) {
                                  onOpenClientProfile(p);
                                }
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                            >
                              Fiche 360°
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Aucun client trouvé pour ce filtre de recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pied de tableau / Synthèse et totalisation */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Affichage de <strong>{filteredData.length}</strong> ligne(s) sur{" "}
            <strong>
              {activeReportTab === "overdue"
                ? overdueInvoices.length
                : activeReportTab === "pending"
                ? pendingInvoices.length
                : activeReportTab === "prospects"
                ? quotes.length
                : activeReportTab === "fiscal"
                ? enrichedInvoices.length
                : portfolio360.length}
            </strong>{" "}
            enregistrements analysés.
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Toutes les données sont chiffrées & certifiées conformes
            </span>
            <button
              onClick={handleExportCurrentView}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger cette vue</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODALE D'APERÇU IMPRIMABLE HAUTE-FIDÉLITÉ */}
      <ReportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        reportType={previewConfig.type}
        reportTitle={previewConfig.title}
        companyInfo={companyInfo}
        userProfile={userProfile}
        data={previewConfig.data}
        currency={currency}
        onExportXLSX={handleExportCurrentView}
      />
    </div>
  );
}
