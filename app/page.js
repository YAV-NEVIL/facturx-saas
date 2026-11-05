"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import InvoiceTable from "@/components/InvoiceTable";
import CreateInvoiceModal from "@/components/CreateInvoiceModal";
import CreateClientModal from "@/components/CreateClientModal";
import EditClientModal from "@/components/EditClientModal";
import InvoiceDetailModal from "@/components/InvoiceDetailModal";
import EditInvoiceModal from "@/components/EditInvoiceModal";
import ClientReminderModal from "@/components/ClientReminderModal";
import ClientProfileDrawer from "@/components/ClientProfileDrawer";
import CreateQuoteModal from "@/components/CreateQuoteModal";
import QuoteDetailModal from "@/components/QuoteDetailModal";
import QuotesPipelineView from "@/components/QuotesPipelineView";
import ConfirmationModal from "@/components/ConfirmationModal";
import CalendarDropdown from "@/components/CalendarDropdown";
import DashboardForecast from "@/components/DashboardForecast";
import DashboardRecentInvoices from "@/components/DashboardRecentInvoices";
import InvoiceMetricsBar from "@/components/InvoiceMetricsBar";
import PhoneCountryInput from "@/components/PhoneCountryInput";
import CountrySelect from "@/components/CountrySelect";
import PaymentsView from "@/components/PaymentsView";
import AnalyticsView from "@/components/AnalyticsView";
import ReportsView from "@/components/ReportsView";
import SettingsView from "@/components/SettingsView";
import AuthModal from "@/components/AuthModal";
import LoginScreen from "@/components/LoginScreen";
import EmployeesView from "@/components/EmployeesView";
import {
  fetchCompanyProfile,
  upsertCompanyProfile,
  fetchClients,
  createClient as apiCreateClient,
  updateClient as apiUpdateClient,
  deleteClient as apiDeleteClient,
  fetchInvoices,
  createInvoice as apiCreateInvoice,
  updateInvoice as apiUpdateInvoice,
  updateInvoiceStatus as apiUpdateInvoiceStatus,
  addInvoiceReminder as apiAddInvoiceReminder,
  deleteInvoice as apiDeleteInvoice,
  fetchQuotes,
  createQuote as apiCreateQuote,
  updateQuoteStatus as apiUpdateQuoteStatus,
  deleteQuote as apiDeleteQuote,
  fetchPayments,
  createPayment as apiCreatePayment,
  updatePayment as apiUpdatePayment,
  deletePayment as apiDeletePayment,
  fetchTeamMembers,
  createTeamMember as apiCreateTeamMember,
  deleteTeamMember as apiDeleteTeamMember,
  updateMemberOnlineStatus,
  signOutUser,
  getCurrentSession,
} from "@/lib/supabaseService";
import {
  enqueueOfflineAction,
  initOfflineSync,
  processSyncQueue,
  getPendingCount,
} from "@/lib/offlineSyncService";
import {
  initialInvoices,
  initialQuotes,
  initialPayments,
  getDashboardMetrics,
  calculateInvoiceTotals,
  formatFCFA,
  formatAmount,
  getCurrencySymbol,
  defaultClients,
  defaultCompanyInfo,
  defaultUserProfile,
  CONGO_BANKS,
  CURRENCIES,
  COUNTRIES,
} from "@/lib/mock-data";
import {
  Calendar,
  ChevronDown,
  Plus,
  Users,
  CreditCard,
  Building2,
  Building,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RotateCcw,
  UserPlus,
  Edit3,
  Trash2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Shield,
  Check,
  Save,
  Search,
  Briefcase,
  Receipt,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Camera,
  Download,
  Copy,
  Filter,
  LayoutGrid,
  List,
  MessageCircle,
  ArrowRight,
  Eye,
  ArrowUpRight,
} from "lucide-react";
import { exportClientsToXLSX, exportQuotesToXLSX } from "@/lib/export-utils";

// Clés de persistance locale pour le navigateur
const STORAGE_KEY_COMPANY = "facturx_company_info_v3";
const STORAGE_KEY_ACCOUNT_BASELINE = "facturx_account_baseline_company_v3";
const STORAGE_KEY_USER_PROFILE = "facturx_user_profile_v3";
const STORAGE_KEY_INVOICES = "facturx_invoices_v3";
const STORAGE_KEY_CLIENTS = "facturx_clients_v3";
const STORAGE_KEY_QUOTES = "facturx_quotes_v3";
const STORAGE_KEY_PAYMENTS = "facturx_payments_v3";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [clients, setClients] = useState(defaultClients);
  const [quotes, setQuotes] = useState(initialQuotes);
  const [payments, setPayments] = useState(initialPayments);
  const [companyInfo, setCompanyInfo] = useState(defaultCompanyInfo);
  const [searchQuery, setSearchQuery] = useState("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [clientFilterMode, setClientFilterMode] = useState("all");
  const [clientViewMode, setClientViewMode] = useState("grid");
  const [quoteSearchQuery, setQuoteSearchQuery] = useState("");
  const [quoteFilterMode, setQuoteFilterMode] = useState("all");
  const [quoteViewMode, setQuoteViewMode] = useState("grid");
  const [copiedFieldId, setCopiedFieldId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [reminderInvoice, setReminderInvoice] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
  const [isCreateQuoteModalOpen, setIsCreateQuoteModalOpen] = useState(false);
  const [clientForEdit, setClientForEdit] = useState(null);
  const [invoiceForEdit, setInvoiceForEdit] = useState(null);
  const [clientForInvoice, setClientForInvoice] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [quoteToDelete, setQuoteToDelete] = useState(null);
  const [selectedClientForProfile, setSelectedClientForProfile] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("Ce mois-ci");
  const [selectedDate, setSelectedDate] = useState(null);
  const [feedbackToast, setFeedbackToast] = useState(null);
  const [currentTheme, setCurrentTheme] = useState("light");

  const applyTheme = (theme) => {
    setCurrentTheme(theme);
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  };

  // Formulaire local pour la gestion de l'entreprise
  const [companyForm, setCompanyForm] = useState(defaultCompanyInfo);
  const [emailValidationError, setEmailValidationError] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const logoFileInputRef = useRef(null);

  // 1. Chargement initial : local d'abord (zéro latence), puis synchronisation Supabase en temps réel
  useEffect(() => {
    let isMounted = true;

    if (typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem("facturx_theme") || "light";
        applyTheme(savedTheme);

        // Initialiser ou charger le profil utilisateur
        const savedProfile = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
        if (savedProfile) {
          try {
            setUserProfile(JSON.parse(savedProfile));
          } catch (e) {
            console.error("Erreur lecture userProfile:", e);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        setIsAuthChecking(false);

        // Initialiser ou charger la baseline d'entreprise liée au compte
        let baseline = defaultCompanyInfo;
        const savedBaseline = localStorage.getItem(STORAGE_KEY_ACCOUNT_BASELINE);
        if (savedBaseline) {
          try {
            baseline = JSON.parse(savedBaseline);
          } catch (e) {
            console.error("Erreur lecture baseline:", e);
          }
        } else {
          localStorage.setItem(STORAGE_KEY_ACCOUNT_BASELINE, JSON.stringify(defaultCompanyInfo));
        }

        // Charger les coordonnées actives de l'entreprise
        const savedCompany = localStorage.getItem(STORAGE_KEY_COMPANY);
        if (savedCompany) {
          const parsedComp = JSON.parse(savedCompany);
          setCompanyInfo(parsedComp);
          setCompanyForm(parsedComp);
        } else {
          setCompanyInfo(baseline);
          setCompanyForm(baseline);
        }

        const savedInvoices = localStorage.getItem(STORAGE_KEY_INVOICES);
        if (savedInvoices) {
          const parsedInvoices = JSON.parse(savedInvoices);
          if (Array.isArray(parsedInvoices) && parsedInvoices.length > 0) {
            setInvoices(parsedInvoices);
          }
        }
        const savedClients = localStorage.getItem(STORAGE_KEY_CLIENTS);
        if (savedClients) {
          const parsedClients = JSON.parse(savedClients);
          if (Array.isArray(parsedClients) && parsedClients.length > 0) {
            setClients(parsedClients);
          }
        }
        const savedQuotes = localStorage.getItem(STORAGE_KEY_QUOTES);
        if (savedQuotes) {
          const parsedQuotes = JSON.parse(savedQuotes);
          if (Array.isArray(parsedQuotes) && parsedQuotes.length > 0) {
            setQuotes(parsedQuotes);
          }
        }
        const savedPayments = localStorage.getItem(STORAGE_KEY_PAYMENTS);
        if (savedPayments) {
          const parsedPayments = JSON.parse(savedPayments);
          if (Array.isArray(parsedPayments) && parsedPayments.length > 0) {
            setPayments(parsedPayments);
          }
        }
      } catch (err) {
        console.error("Erreur lecture localStorage:", err);
      }
    }

    // Récupération en temps réel depuis Supabase filtrée par Organisation
    const syncFromSupabase = async (overrideCompId = null) => {
      setIsSyncing(true);
      const activeCompId = overrideCompId || parsedUser?.companyId || null;

      try {
        const [comp, clis, invs, qts, pays, tms] = await Promise.all([
          fetchCompanyProfile(activeCompId).catch((e) => {
            console.warn("Supabase fetchCompanyProfile:", e);
            return null;
          }),
          fetchClients(activeCompId).catch((e) => {
            console.warn("Supabase fetchClients:", e);
            return [];
          }),
          fetchInvoices(activeCompId).catch((e) => {
            console.warn("Supabase fetchInvoices:", e);
            return [];
          }),
          fetchQuotes(activeCompId).catch((e) => {
            console.warn("Supabase fetchQuotes:", e);
            return [];
          }),
          fetchPayments(activeCompId).catch((e) => {
            console.warn("Supabase fetchPayments:", e);
            return [];
          }),
          fetchTeamMembers(activeCompId).catch((e) => {
            console.warn("Supabase fetchTeamMembers:", e);
            return [];
          }),
        ]);

        if (!isMounted) return;

        if (comp) {
          setCompanyInfo((prev) => ({ ...prev, ...comp }));
          setCompanyForm((prev) => ({ ...prev, ...comp }));
        }
        if (Array.isArray(clis)) {
          setClients(clis);
        }
        if (Array.isArray(invs)) {
          setInvoices(invs);
        }
        if (Array.isArray(qts)) {
          setQuotes(qts);
        }
        if (Array.isArray(pays)) {
          setPayments(pays);
        }
        if (Array.isArray(tms) && tms.length > 0) {
          setTeamMembers(tms);
        }
        setIsSupabaseConnected(true);
      } catch (err) {
        console.error("Erreur globale sync Supabase:", err);
        setIsSupabaseConnected(false);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    let parsedUser = null;
    const rawSaved = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (rawSaved) {
      try { parsedUser = JSON.parse(rawSaved); } catch(e){}
    }

    syncFromSupabase(parsedUser?.companyId);

    return () => {
      isMounted = false;
    };
  }, []);

  // 1.b. File d'attente Hors-Ligne & Rejeu automatique au retour du réseau
  useEffect(() => {
    const offlineServices = {
      apiCreateClient,
      apiUpdateClient,
      apiDeleteClient,
      apiCreateInvoice,
      apiUpdateInvoice,
      apiUpdateInvoiceStatus,
      apiAddInvoiceReminder,
      apiDeleteInvoice,
      apiCreateQuote,
      apiUpdateQuoteStatus,
      apiDeleteQuote,
      apiCreatePayment,
      apiUpdatePayment,
      apiDeletePayment,
      upsertCompanyProfile,
    };

    const cleanup = initOfflineSync(offlineServices, (status) => {
      setIsOffline(!status.isOnline);
      setPendingSyncCount(status.pendingCount);
      if (status.isOnline && status.pendingCount === 0) {
        setIsSupabaseConnected(true);
      }
    });

    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
      setPendingSyncCount(getPendingCount());
    }

    return cleanup;
  }, []);

  // Déclenchement manuel de la synchronisation de la file d'attente
  const handleTriggerManualSync = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showToast("Impossible de synchroniser : vous êtes actuellement hors-ligne.", "error");
      return;
    }
    setIsSyncing(true);
    showToast("Synchronisation des actions en attente vers Supabase...", "info");
    try {
      const offlineServices = {
        apiCreateClient,
        apiUpdateClient,
        apiDeleteClient,
        apiCreateInvoice,
        apiUpdateInvoice,
        apiUpdateInvoiceStatus,
        apiAddInvoiceReminder,
        apiDeleteInvoice,
        apiCreateQuote,
        apiUpdateQuoteStatus,
        apiDeleteQuote,
        apiCreatePayment,
        apiUpdatePayment,
        apiDeletePayment,
        upsertCompanyProfile,
      };
      const res = await processSyncQueue(offlineServices);
      setIsSyncing(false);
      if (res.processedCount > 0) {
        showToast(`${res.processedCount} action(s) synchronisée(s) avec succès sur Supabase !`, "success");
      } else if (res.errors.length > 0) {
        showToast("Certaines actions nécessitent une réévaluation réseau.", "warning");
      } else {
        showToast("Toutes vos données locales sont déjà à jour avec Supabase.", "info");
      }
    } catch (err) {
      setIsSyncing(false);
      showToast("Erreur lors du traitement de la synchronisation.", "error");
    }
  };

  // 2. Persistance continue des factures, clients et devis
  useEffect(() => {
    if (typeof window !== "undefined" && invoices.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
      } catch (err) {
        console.error("Erreur enregistrement invoices:", err);
      }
    }
  }, [invoices]);

  useEffect(() => {
    if (typeof window !== "undefined" && clients.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
      } catch (err) {
        console.error("Erreur enregistrement clients:", err);
      }
    }
  }, [clients]);

  useEffect(() => {
    if (typeof window !== "undefined" && quotes.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(quotes));
      } catch (err) {
        console.error("Erreur enregistrement quotes:", err);
      }
    }
  }, [quotes]);

  useEffect(() => {
    if (typeof window !== "undefined" && payments.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
      } catch (err) {
        console.error("Erreur enregistrement payments:", err);
      }
    }
  }, [payments]);

  // Synchroniser le formulaire d'entreprise
  const handleCompanyFieldChange = (field, value) => {
    setCompanyForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "defaultCurrency") {
        updated.currencySymbol = getCurrencySymbol(value);
      }
      return updated;
    });

    // Validation d'email en temps réel
    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value.trim())) {
        setEmailValidationError("Format d'adresse email non valide (ex: contact@facturx.cd)");
      } else {
        setEmailValidationError("");
      }
    }
  };

  // Enregistrement officiel des coordonnées avec persistance localStorage
  const handleSaveCompany = async (e) => {
    if (e) e.preventDefault();

    // Validation stricte de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (companyForm.email && !emailRegex.test(companyForm.email.trim())) {
      setEmailValidationError("Veuillez saisir une adresse email valide avant d'enregistrer.");
      showToast("Erreur : Adresse email officielle invalide.", "error");
      return;
    }
    setEmailValidationError("");

    // Construire l'objet final propre
    const finalData = {
      ...companyForm,
      phone: companyForm.phoneDigits
        ? `${companyForm.phoneCountryCode || "+243"} ${companyForm.phoneDigits.trim()}`
        : companyForm.phone,
      mobile: companyForm.mobileDigits
        ? `${companyForm.mobileCountryCode || "+243"} ${companyForm.mobileDigits.trim()}`
        : companyForm.mobile,
      airtelMoneyNumber: companyForm.airtelDigits
        ? `${companyForm.airtelCountryCode || "+243"} ${companyForm.airtelDigits.trim()}`
        : (companyForm.airtelMoneyNumber || companyForm.waveNumber),
      orangeMoneyNumber: companyForm.orangeDigits
        ? `${companyForm.orangeCountryCode || "+243"} ${companyForm.orangeDigits.trim()}`
        : companyForm.orangeMoneyNumber,
      bankName:
        companyForm.bankName === "Autre banque (saisie manuelle)"
          ? (companyForm.bankCustomName || "Autre banque")
          : companyForm.bankName,
      currencySymbol: getCurrencySymbol(companyForm.defaultCurrency),
      // Rétrocompatibilité
      ninea: companyForm.nif || companyForm.idNat,
      waveNumber: companyForm.airtelMoneyNumber,
    };

    setCompanyInfo(finalData);
    setCompanyForm(finalData);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(finalData));
      } catch (err) {
        console.error("Erreur enregistrement company:", err);
      }
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("UPSERT_COMPANY", finalData, userProfile?.companyId);
      showToast(`Coordonnées de "${finalData.name}" enregistrées en mode hors-ligne.`, "info");
      return;
    }

    // Sauvegarde en direct sur Supabase
    showToast(`Enregistrement sur Supabase...`, "info");
    try {
      await upsertCompanyProfile(finalData);
      showToast(`Coordonnées de l'entreprise "${finalData.name}" sauvegardées sur Supabase !`, "success");
    } catch (err) {
      console.warn("Erreur sauvegarde Supabase company, mise en attente hors-ligne:", err);
      enqueueOfflineAction("UPSERT_COMPANY", finalData, userProfile?.companyId);
      showToast(`Coordonnées de "${finalData.name}" sauvegardées en file d'attente hors-ligne !`, "info");
    }
  };

  // Gestion de l'upload du logo / photo de l'entreprise (Data URL Base64)
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      showToast("Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WebP).", "error");
      return;
    }

    // Limite de taille : 5 Mo
    if (file.size > 500 * 1024) {
      showToast("L'image sélectionnée est trop volumineuse (maximum 5 Mo).", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        handleCompanyFieldChange("logoUrl", dataUrl);
        showToast("Logo / Photo de l'entreprise importé avec succès !", "success");
      }
    };
    reader.onerror = () => {
      showToast("Erreur lors de la lecture du fichier image.", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleCompanyFieldChange("logoUrl", null);
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = "";
    }
    showToast("Logo personnalisé supprimé. Vos initiales officielles seront affichées.", "info");
  };

  // Rétablissement confirmé des coordonnées par défaut (reliées aux informations du compte)
  const handleConfirmResetCompany = () => {
    let baseline = defaultCompanyInfo;
    if (typeof window !== "undefined") {
      try {
        const savedBaseline = localStorage.getItem(STORAGE_KEY_ACCOUNT_BASELINE);
        if (savedBaseline) {
          baseline = JSON.parse(savedBaseline);
        }
      } catch (err) {
        console.error("Erreur lecture baseline:", err);
      }
    }

    setCompanyForm(baseline);
    setCompanyInfo(baseline);
    setEmailValidationError("");

    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = "";
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(baseline));
      } catch (err) {
        console.error("Erreur reset localStorage:", err);
      }
    }

    setIsResetModalOpen(false);
    showToast(
      `Coordonnées de l'entreprise rétablies aux paramètres par défaut de votre compte (${baseline.name || "HORIZON GROUPE"}).`,
      "success"
    );
  };

  // Dates des factures pour les pastilles du calendrier
  const invoiceDates = invoices.map((inv) => inv.issueDate);

  // Filtrage par date/période historique
  const displayedInvoices = invoices.filter((inv) => {
    if (!selectedDate && (selectedPeriod === "Toutes les dates" || !selectedPeriod)) return true;
    if (selectedDate && selectedDate.includes("/")) {
      return inv.issueDate === selectedDate;
    }
    if (selectedPeriod === "Aujourd'hui") {
      return inv.issueDate === "21/10/2026";
    }
    if (selectedPeriod === "Hier") {
      return inv.issueDate === "20/10/2026";
    }
    if (selectedPeriod === "Avant-hier") {
      return inv.issueDate === "19/10/2026";
    }
    if (selectedPeriod === "Cette semaine") {
      return ["19/10/2026", "20/10/2026", "21/10/2026", "22/10/2026", "23/10/2026", "24/10/2026", "25/10/2026"].includes(inv.issueDate);
    }
    if (selectedPeriod === "Ce mois-ci") {
      return inv.issueDate.includes("/10/");
    }
    if (selectedPeriod === "Mois précédent") {
      return inv.issueDate.includes("/09/");
    }
    return true;
  });

  // Calculate live metrics whenever displayed invoices state updates
  const metrics = getDashboardMetrics(displayedInvoices);

  // Toast feedback helper
  const showToast = (message, type = "success") => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Add new client to global directory
  const handleAddNewClient = async (newClient) => {
    setClients((prev) => {
      const exists = prev.some(
        (c) => c.name.toLowerCase() === newClient.name.toLowerCase()
      );
      if (exists) return prev;
      return [newClient, ...prev];
    });

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("CREATE_CLIENT", newClient, userProfile?.companyId);
      showToast(`Client "${newClient.name}" créé en mode hors-ligne (en attente de sync).`, "info");
      return;
    }

    showToast(`Enregistrement du client sur Supabase...`, "info");
    try {
      const saved = await apiCreateClient(newClient, userProfile?.companyId);
      if (saved && saved.id) {
        setClients((prev) =>
          prev.map((c) => (c.name === newClient.name ? { ...c, id: saved.id } : c))
        );
      }
      showToast(`Client "${newClient.name}" enregistré sur Supabase !`, "success");
    } catch (err) {
      console.warn("Erreur sauvegarde client Supabase, mise en file d'attente hors-ligne:", err);
      enqueueOfflineAction("CREATE_CLIENT", newClient, userProfile?.companyId);
      showToast(`Client "${newClient.name}" enregistré en file d'attente hors-ligne !`, "info");
    }
  };

  // Edit existing client
  const handleUpdateClient = async (oldClientName, updatedClient) => {
    setClients((prev) =>
      prev.map((c) => (c.name === oldClientName ? { ...c, ...updatedClient } : c))
    );

    // Mettre à jour le tiroir 360° si ce client est actuellement affiché
    if (selectedClientForProfile && selectedClientForProfile.name === oldClientName) {
      setSelectedClientForProfile({ ...selectedClientForProfile, ...updatedClient });
    }

    // Mettre à jour les factures associées si le nom ou coordonnées ont changé
    if (oldClientName !== updatedClient.name) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.clientName === oldClientName
            ? {
                ...inv,
                clientName: updatedClient.name,
                clientEmail: updatedClient.email,
                clientPhone: updatedClient.phone,
                location: updatedClient.location,
              }
            : inv
        )
      );

      // Mettre également à jour les devis associés
      setQuotes((prev) =>
        prev.map((q) =>
          q.clientName === oldClientName
            ? {
                ...q,
                clientName: updatedClient.name,
                clientEmail: updatedClient.email,
                clientPhone: updatedClient.phone,
                location: updatedClient.location,
              }
            : q
        )
      );
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("UPDATE_CLIENT", updatedClient, userProfile?.companyId);
      showToast(`Client "${updatedClient.name}" mis à jour en mode hors-ligne.`, "info");
      return;
    }

    showToast(`Synchronisation de "${updatedClient.name}" sur Supabase...`, "info");
    try {
      const targetId = updatedClient.id || oldClientName;
      const saved = await apiUpdateClient(targetId, updatedClient);
      if (saved && saved.id) {
        setClients((prev) =>
          prev.map((c) => (c.name === updatedClient.name ? { ...c, id: saved.id } : c))
        );
      }
      showToast(`Entreprise cliente "${updatedClient.name}" mise à jour sur Supabase !`, "success");
    } catch (err) {
      console.warn("Erreur updateClient Supabase, mise en file d'attente hors-ligne:", err);
      enqueueOfflineAction("UPDATE_CLIENT", updatedClient, userProfile?.companyId);
      showToast(`Entreprise cliente "${updatedClient.name}" mise à jour en file d'attente hors-ligne.`, "info");
    }
  };

  // Delete client
  const handleDeleteClient = async (clientNameToDelete) => {
    const target = clients.find(
      (c) => c.name.toLowerCase() === clientNameToDelete.toLowerCase()
    );
    setClients((prev) =>
      prev.filter((c) => c.name.toLowerCase() !== clientNameToDelete.toLowerCase())
    );

    if (
      selectedClientForProfile &&
      selectedClientForProfile.name.toLowerCase() === clientNameToDelete.toLowerCase()
    ) {
      setSelectedClientForProfile(null);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("DELETE_CLIENT", { id: target?.id || clientNameToDelete, name: clientNameToDelete }, userProfile?.companyId);
      showToast(`Client "${clientNameToDelete}" retiré (suppression différée).`, "info");
      return;
    }

    showToast(`Suppression de "${clientNameToDelete}"...`, "info");
    try {
      await apiDeleteClient(target?.id || clientNameToDelete);
      showToast(`Client "${clientNameToDelete}" supprimé de Supabase.`, "success");
    } catch (err) {
      console.warn("Erreur deleteClient Supabase, mise en file d'attente hors-ligne:", err);
      enqueueOfflineAction("DELETE_CLIENT", { id: target?.id || clientNameToDelete, name: clientNameToDelete }, userProfile?.companyId);
      showToast(`Client "${clientNameToDelete}" retiré en file d'attente hors-ligne.`, "info");
    }
  };

  // Add new invoice
  const handleCreateInvoice = async (newInvoice) => {
    setInvoices((prev) => [newInvoice, ...prev]);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("CREATE_INVOICE", newInvoice, userProfile?.companyId);
      showToast(`Facture ${newInvoice.id} créée en mode hors-ligne (en attente de sync).`, "info");
      return;
    }

    showToast(`Enregistrement de la facture ${newInvoice.id} sur Supabase...`, "info");
    try {
      await apiCreateInvoice(newInvoice, userProfile?.companyId);
      showToast(`La facture ${newInvoice.id} a été enregistrée sur Supabase !`, "success");
    } catch (err) {
      console.warn("Erreur sauvegarde facture Supabase, mise en file d'attente hors-ligne:", err);
      enqueueOfflineAction("CREATE_INVOICE", newInvoice, userProfile?.companyId);
      showToast(`Facture ${newInvoice.id} créée (sauvegardée en file d'attente hors-ligne).`, "info");
    }
  };

  // Mark invoice as paid
  const handleMarkAsPaid = async (invoiceId) => {
    const targetInv = invoices.find((i) => i.id === invoiceId);
    if (targetInv) {
      const { total } = calculateInvoiceTotals(targetInv.items, targetInv.vatRate);
      const alreadyPaid = payments
        .filter((p) => p.invoiceId === invoiceId)
        .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const remaining = Math.max(0, total - alreadyPaid);
      if (remaining > 0) {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, "0");
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const yyyy = now.getFullYear();
        const autoPayment = {
          id: `PAY-${invoiceId.replace("FAC-", "")}-${Date.now().toString().slice(-4)}`,
          receiptNumber: `REC-${invoiceId.replace("FAC-", "")}`,
          invoiceId: invoiceId,
          clientName: targetInv.clientName,
          contactPerson: targetInv.contactPerson || "",
          clientEmail: targetInv.clientEmail || "",
          clientPhone: targetInv.clientPhone || "",
          clientTaxId: targetInv.taxId || "",
          amount: remaining,
          currency: companyInfo?.currencySymbol || "FC",
          paymentDate: `${dd}/${mm}/${yyyy}`,
          paymentTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
          paymentMethod: "Règlement Direct (1-Clic)",
          channel: "virement",
          bankName: companyInfo?.bankName || "Rawbank",
          transactionRef: `REG-${Date.now().toString().slice(-6)}`,
          beneficiaryAccount: companyInfo?.iban || "",
          status: "valide",
          note: `Règlement intégral validé en 1 clic pour la facture ${invoiceId}`,
          recordedBy: userProfile?.fullName || "Administrateur",
        };
        setPayments((prev) => [autoPayment, ...prev]);
        apiCreatePayment(autoPayment, userProfile?.companyId).catch(() => {});
      }
    }
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: "payee" } : inv
      )
    );
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice((prev) => ({ ...prev, status: "payee" }));
    }
    showToast(`La facture ${invoiceId} est désormais marquée comme Payée.`);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("UPDATE_INVOICE_STATUS", { id: invoiceId, status: "payee" }, userProfile?.companyId);
      return;
    }

    try {
      await apiUpdateInvoiceStatus(invoiceId, "payee");
    } catch (err) {
      console.warn("Erreur updateInvoiceStatus Supabase, mise en attente hors-ligne:", err);
      enqueueOfflineAction("UPDATE_INVOICE_STATUS", { id: invoiceId, status: "payee" }, userProfile?.companyId);
    }
  };

  // Enregistrer une relance client
  const handleSaveReminder = async (invoiceId, reminderData) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              reminders: [reminderData, ...(inv.reminders || [])],
            }
          : inv
      )
    );
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice((prev) => ({
        ...prev,
        reminders: [reminderData, ...(prev.reminders || [])],
      }));
    }
    showToast(`Relance enregistrée avec succès pour la facture ${invoiceId} !`);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("ADD_INVOICE_REMINDER", { id: invoiceId, reminder: reminderData }, userProfile?.companyId);
      return;
    }

    try {
      await apiAddInvoiceReminder(invoiceId, reminderData);
    } catch (err) {
      console.warn("Erreur addInvoiceReminder Supabase, mise en attente hors-ligne:", err);
      enqueueOfflineAction("ADD_INVOICE_REMINDER", { id: invoiceId, reminder: reminderData }, userProfile?.companyId);
    }
  };

  // Update existing invoice
  const handleUpdateInvoice = async (updatedInvoice) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
    );
    if (selectedInvoice && selectedInvoice.id === updatedInvoice.id) {
      setSelectedInvoice(updatedInvoice);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("UPDATE_INVOICE", updatedInvoice, userProfile?.companyId);
      showToast(`Facture ${updatedInvoice.id} mise à jour en mode hors-ligne.`, "info");
      return;
    }

    showToast(`Mise à jour de la facture sur Supabase...`, "info");
    try {
      await apiUpdateInvoice(updatedInvoice);
      showToast(`La facture ${updatedInvoice.id} a été mise à jour sur Supabase !`, "success");
    } catch (err) {
      console.warn("Erreur updateInvoice Supabase, mise en file d'attente hors-ligne:", err);
      enqueueOfflineAction("UPDATE_INVOICE", updatedInvoice, userProfile?.companyId);
      showToast(`La facture ${updatedInvoice.id} mise à jour en file d'attente hors-ligne.`, "info");
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (invoiceId) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice(null);
    }
    showToast(`La facture ${invoiceId} a été supprimée avec succès.`, "info");

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("DELETE_INVOICE", { id: invoiceId }, userProfile?.companyId);
      return;
    }

    try {
      await apiDeleteInvoice(invoiceId);
    } catch (err) {
      console.warn("Erreur deleteInvoice Supabase, mise en attente hors-ligne:", err);
      enqueueOfflineAction("DELETE_INVOICE", { id: invoiceId }, userProfile?.companyId);
    }
  };

  // Gestionnaires des Règlements & Paiements
  const handleSavePayment = async (newPayment) => {
    setPayments((prev) => [newPayment, ...prev]);

    // 1. Calcul en temps réel du solde restant dû de la facture
    let isFullySettled = false;
    if (newPayment.invoiceId) {
      const targetInv = invoices.find((inv) => inv.id === newPayment.invoiceId);
      if (targetInv) {
        const { total: invoiceTotal } = calculateInvoiceTotals(targetInv.items, targetInv.vatRate);
        const prevPaid = payments
          .filter((p) => p.invoiceId === newPayment.invoiceId && p.id !== newPayment.id)
          .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const cumulatedPaid = prevPaid + (Number(newPayment.amount) || 0);
        isFullySettled = cumulatedPaid >= invoiceTotal - 0.01;
      }
    }

    // 2. Si le solde est nul, basculer immédiatement le statut de la facture à "payee"
    if (newPayment.invoiceId && isFullySettled) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === newPayment.invoiceId ? { ...inv, status: "payee" } : inv
        )
      );
      if (selectedInvoice && selectedInvoice.id === newPayment.invoiceId) {
        setSelectedInvoice((prev) => ({ ...prev, status: "payee" }));
      }
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("CREATE_PAYMENT", newPayment, userProfile?.companyId);
      if (newPayment.invoiceId && isFullySettled) {
        enqueueOfflineAction("UPDATE_INVOICE_STATUS", { id: newPayment.invoiceId, status: "payee" }, userProfile?.companyId);
      }
      showToast(`Règlement ${newPayment.receiptNumber || newPayment.id} enregistré en mode hors-ligne.`, "info");
      return;
    }

    showToast(`Enregistrement du règlement sur Supabase...`, "info");
    try {
      await apiCreatePayment(newPayment, userProfile?.companyId);
      if (newPayment.invoiceId && isFullySettled) {
        await apiUpdateInvoiceStatus(newPayment.invoiceId, "payee");
      }
      showToast(
        `Règlement ${newPayment.receiptNumber || newPayment.id} (${formatAmount(newPayment.amount, "FC")}) enregistré sur Supabase !${
          isFullySettled ? " 🎉 Facture 100% soldée." : ""
        }`,
        "success"
      );
    } catch (err) {
      console.warn("Erreur savePayment Supabase, mise en file d'attente hors-ligne:", err);
      enqueueOfflineAction("CREATE_PAYMENT", newPayment, userProfile?.companyId);
      if (newPayment.invoiceId && isFullySettled) {
        enqueueOfflineAction("UPDATE_INVOICE_STATUS", { id: newPayment.invoiceId, status: "payee" }, userProfile?.companyId);
      }
      showToast(`Règlement enregistré en file d'attente hors-ligne !`, "info");
    }
  };

  const handleUpdatePayment = async (updatedPayment) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
    );

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("UPDATE_PAYMENT", updatedPayment, userProfile?.companyId);
      showToast(`Règlement mis à jour en mode hors-ligne.`, "info");
      return;
    }

    showToast(`Mise à jour du règlement sur Supabase...`, "info");
    try {
      await apiUpdatePayment(updatedPayment);
      showToast(`Règlement ${updatedPayment.receiptNumber || updatedPayment.id} mis à jour sur Supabase !`, "success");
    } catch (err) {
      console.warn("Erreur updatePayment Supabase, mise en attente hors-ligne:", err);
      enqueueOfflineAction("UPDATE_PAYMENT", updatedPayment, userProfile?.companyId);
      showToast(`Règlement mis à jour en file d'attente hors-ligne.`, "info");
    }
  };

  const handleDeletePayment = async (paymentId, invoiceId = null, revertInvoice = true) => {
    const deletedPayment = payments.find((p) => p.id === paymentId);
    const targetInvoiceId = invoiceId || deletedPayment?.invoiceId;

    setPayments((prev) => prev.filter((p) => p.id !== paymentId));

    // Si la facture avait été marquée payée et qu'on supprime le versement, restaurer le statut
    if (revertInvoice && targetInvoiceId) {
      const targetInv = invoices.find((inv) => inv.id === targetInvoiceId);
      if (targetInv) {
        const { total: invoiceTotal } = calculateInvoiceTotals(targetInv.items, targetInv.vatRate);
        const remainingPaid = payments
          .filter((p) => p.invoiceId === targetInvoiceId && p.id !== paymentId)
          .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

        if (remainingPaid < invoiceTotal - 0.01) {
          setInvoices((prev) =>
            prev.map((inv) =>
              inv.id === targetInvoiceId ? { ...inv, status: "envoyee" } : inv
            )
          );
          if (selectedInvoice && selectedInvoice.id === targetInvoiceId) {
            setSelectedInvoice((prev) => ({ ...prev, status: "envoyee" }));
          }
          try {
            await apiUpdateInvoiceStatus(targetInvoiceId, "envoyee");
          } catch (e) {
            console.error("Erreur revert invoice status:", e);
          }
        }
      }
    }

    showToast(`Règlement supprimé du journal.`, "info");

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("DELETE_PAYMENT", { id: paymentId }, userProfile?.companyId);
      return;
    }

    try {
      await apiDeletePayment(paymentId);
    } catch (err) {
      console.warn("Erreur deletePayment Supabase, mise en attente hors-ligne:", err);
      enqueueOfflineAction("DELETE_PAYMENT", { id: paymentId }, userProfile?.companyId);
    }
  };

  // Copier dans le presse-papier avec feedback immédiat
  const handleCopyContact = (text, fieldId) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedFieldId(fieldId);
      showToast(`"${text}" copié dans le presse-papier !`, "info");
      setTimeout(() => setCopiedFieldId(null), 2000);
    }
  };

  // Génération de l'URL WhatsApp direct pour le client
  const getWhatsAppUrl = (phone, clientName, contactPerson) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!cleanPhone) return null;
    const greeting = contactPerson ? `Bonjour ${contactPerson}` : `Bonjour`;
    const message = `${greeting}, je vous contacte de la part de ${
      companyInfo?.name || "FacturX"
    } concernant vos factures et règlements.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Gradient personnalisé et distinctif par entreprise cliente
  const getClientAvatarGradient = (name = "") => {
    const gradients = [
      "from-blue-600 via-indigo-600 to-indigo-800 shadow-blue-500/20",
      "from-emerald-600 via-teal-600 to-teal-800 shadow-emerald-500/20",
      "from-violet-600 via-purple-600 to-purple-800 shadow-purple-500/20",
      "from-amber-600 via-orange-600 to-orange-800 shadow-amber-500/20",
      "from-cyan-600 via-blue-600 to-blue-800 shadow-cyan-500/20",
      "from-rose-600 via-pink-600 to-pink-800 shadow-rose-500/20",
      "from-slate-700 via-slate-800 to-slate-900 shadow-slate-500/20",
      "from-blue-700 via-sky-700 to-cyan-800 shadow-sky-500/20",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  // Métriques globales des clients
  const clientsWithPending = clients.filter((c) =>
    invoices.some((inv) => inv.clientName.toLowerCase() === c.name.toLowerCase() && inv.status !== "payee")
  ).length;

  const clientsUpToDate = clients.filter((c) => {
    const clientInvs = invoices.filter((inv) => inv.clientName.toLowerCase() === c.name.toLowerCase());
    return clientInvs.length > 0 && clientInvs.every((inv) => inv.status === "payee");
  }).length;

  const totalBilledAcrossClients = invoices.reduce((acc, inv) => {
    const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
    return acc + total;
  }, 0);

  // Filtrage combiné : texte + statut comptable
  const filteredClients = clients.filter((c) => {
    // Filtre par statut comptable
    if (clientFilterMode === "pending") {
      const hasUnpaid = invoices.some(
        (inv) => inv.clientName.toLowerCase() === c.name.toLowerCase() && inv.status !== "payee"
      );
      if (!hasUnpaid) return false;
    } else if (clientFilterMode === "up_to_date") {
      const clientInvs = invoices.filter(
        (inv) => inv.clientName.toLowerCase() === c.name.toLowerCase()
      );
      const hasUnpaid = clientInvs.some((inv) => inv.status !== "payee");
      if (hasUnpaid || clientInvs.length === 0) return false;
    }

    // Filtre par texte de recherche
    if (!clientSearchQuery.trim()) return true;
    const q = clientSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.taxId && c.taxId.toLowerCase().includes(q))
    );
  });

  // --- GESTION DU MODULE DEVIS & ESTIMATIONS ---

  // 1. Création d'un devis
  const handleCreateQuote = async (newQuote) => {
    const quoteWithValidity = {
      ...newQuote,
      validUntil: newQuote.validUntil || newQuote.expiryDate || "22/11/2026",
      expiryDate: newQuote.expiryDate || newQuote.validUntil || "22/11/2026",
    };
    setQuotes((prev) => [quoteWithValidity, ...prev]);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("CREATE_QUOTE", quoteWithValidity, userProfile?.companyId);
      showToast(`Devis ${quoteWithValidity.id} créé en mode hors-ligne (en attente de sync).`, "info");
      return;
    }

    showToast(`Enregistrement du devis sur Supabase...`, "info");
    try {
      await apiCreateQuote(quoteWithValidity, userProfile?.companyId);
      showToast(`Devis ${quoteWithValidity.id} créé avec succès sur Supabase pour ${quoteWithValidity.clientName} !`, "success");
    } catch (err) {
      console.warn("Erreur createQuote Supabase, mise en file d'attente hors-ligne:", err);
      enqueueOfflineAction("CREATE_QUOTE", quoteWithValidity, userProfile?.companyId);
      showToast(`Devis ${quoteWithValidity.id} créé (sauvegardé en file d'attente hors-ligne).`, "info");
    }
  };

  // 2. Mise à jour de statut d'un devis
  const handleUpdateQuoteStatus = async (quoteId, newStatus) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q))
    );
    if (selectedQuote && selectedQuote.id === quoteId) {
      setSelectedQuote((prev) => ({ ...prev, status: newStatus }));
    }
    const label =
      newStatus === "accepte"
        ? "Accepté / Validé"
        : newStatus === "refuse"
        ? "Refusé"
        : newStatus === "expire"
        ? "Expiré"
        : "En négociation";
    showToast(`Statut du devis ${quoteId} mis à jour : ${label}`, "info");

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("UPDATE_QUOTE_STATUS", { id: quoteId, status: newStatus }, userProfile?.companyId);
      return;
    }

    try {
      await apiUpdateQuoteStatus(quoteId, newStatus);
    } catch (err) {
      console.warn("Erreur updateQuoteStatus Supabase, mise en attente hors-ligne:", err);
      enqueueOfflineAction("UPDATE_QUOTE_STATUS", { id: quoteId, status: newStatus }, userProfile?.companyId);
    }
  };

  // 3. Suppression d'un devis
  const handleDeleteQuote = async (quoteId) => {
    setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
    if (selectedQuote && selectedQuote.id === quoteId) {
      setSelectedQuote(null);
    }
    showToast(`Devis ${quoteId} supprimé avec succès.`, "info");

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("DELETE_QUOTE", { id: quoteId }, userProfile?.companyId);
      return;
    }

    try {
      await apiDeleteQuote(quoteId);
    } catch (err) {
      console.warn("Erreur deleteQuote Supabase, mise en attente hors-ligne:", err);
      enqueueOfflineAction("DELETE_QUOTE", { id: quoteId }, userProfile?.companyId);
    }
  };

  // 4. Conversion magique d'un devis en facture officielle
  const handleConvertQuoteToInvoice = async (quote) => {
    if (!quote) return;
    if (
      quote.convertedToInvoiceId ||
      invoices.some((inv) => inv.convertedFromQuoteId === quote.id)
    ) {
      showToast(`Le devis ${quote.id} a déjà été converti en facture.`, "info");
      return;
    }
    const invoiceNumbers = invoices
      .map((inv) => {
        const match = inv.id && inv.id.match(/FAC-2026-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(Boolean);
    const maxNum = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 88;
    const nextInvoiceId = `FAC-2026-${String(maxNum + 1).padStart(4, "0")}`;

    const newInvoice = {
      id: nextInvoiceId,
      clientName: quote.clientName,
      contactPerson: quote.contactPerson || "",
      clientEmail: quote.clientEmail || "",
      clientPhone: quote.clientPhone || "",
      address: quote.address || "",
      location: quote.location || "",
      taxId: quote.taxId || "",
      issueDate: new Date().toLocaleDateString("fr-FR"),
      dueDate: "07/11/2026",
      status: "envoyee",
      items: quote.items.map((it) => ({ ...it })),
      vatRate: quote.vatRate ?? 0.16,
      notes: `Facture émise suite à la validation du devis ${quote.id}. ${quote.notes || ""}`.trim(),
      convertedFromQuoteId: quote.id,
      reminders: [
        {
          id: 1,
          date: "24/10/2026 10:00",
          channel: "system",
          author: "FacturX Engine",
          note: `Facture certifiée générée par conversion du devis validé ${quote.id}`,
          status: "Délivré",
        },
      ],
    };

    setQuotes((prev) =>
      prev.map((q) => (q.id === quote.id ? { ...q, status: "accepte", convertedToInvoiceId: nextInvoiceId } : q))
    );
    setInvoices((prev) => [newInvoice, ...prev]);
    setSelectedQuote(null);
    setSelectedInvoice(newInvoice);

    showToast(`✨ Conversion du devis en facture sur Supabase...`, "info");
    try {
      await apiCreateInvoice(newInvoice, userProfile?.companyId);
      await apiUpdateQuoteStatus(quote.id, "accepte", nextInvoiceId);
      showToast(`✨ Devis ${quote.id} converti en Facture ${nextInvoiceId} sur Supabase !`, "success");
    } catch (err) {
      console.error("Erreur conversion devis Supabase:", err);
      showToast(`✨ Devis ${quote.id} converti en Facture officielle ${nextInvoiceId} !`, "success");
    }
  };

  // Calculs financiers pour les Devis & Estimations
  const totalQuoteEstimated = quotes.reduce((acc, q) => {
    const { total } = calculateInvoiceTotals(q.items, q.vatRate);
    return acc + total;
  }, 0);

  const pendingQuotes = quotes.filter((q) => q.status === "en_attente");
  const pendingQuotesCount = pendingQuotes.length;
  const pendingQuotesAmount = pendingQuotes.reduce((acc, q) => {
    const { total } = calculateInvoiceTotals(q.items, q.vatRate);
    return acc + total;
  }, 0);

  const acceptedQuotes = quotes.filter((q) => q.status === "accepte");
  const acceptedQuotesCount = acceptedQuotes.length;
  const acceptedQuotesAmount = acceptedQuotes.reduce((acc, q) => {
    const { total } = calculateInvoiceTotals(q.items, q.vatRate);
    return acc + total;
  }, 0);

  const expiredQuotesCount = quotes.filter((q) => q.status === "expire").length;
  const quoteConversionRate = quotes.length > 0
    ? Math.round((acceptedQuotesCount / quotes.length) * 100)
    : 0;

  // Filtrage combiné des devis
  const filteredQuotes = quotes.filter((q) => {
    if (quoteFilterMode !== "all" && q.status !== quoteFilterMode) {
      return false;
    }
    if (quoteSearchQuery.trim()) {
      const query = quoteSearchQuery.toLowerCase();
      const matchId = (q.id || "").toLowerCase().includes(query);
      const matchClient = (q.clientName || "").toLowerCase().includes(query);
      const matchContact = (q.contactPerson || "").toLowerCase().includes(query);
      const matchLocation = (q.location || "").toLowerCase().includes(query);
      const matchItem = (q.items || []).some((it) =>
        (it.description || "").toLowerCase().includes(query)
      );
      return matchId || matchClient || matchContact || matchLocation || matchItem;
    }
    return true;
  });

  // Gestion des profils et sessions d'authentification
  const handleSelectUser = (profile) => {
    setUserProfile(profile);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
    }
  };

  const handleSignOut = async () => {
    try {
      if (userProfile?.email) {
        await updateMemberOnlineStatus(userProfile.email, false);
      }
      await signOutUser();
    } catch (e) {
      console.warn("Sign out:", e);
    }
    if (typeof window !== "undefined") {
      [
        STORAGE_KEY_USER_PROFILE,
        STORAGE_KEY_INVOICES,
        STORAGE_KEY_CLIENTS,
        STORAGE_KEY_QUOTES,
        STORAGE_KEY_PAYMENTS,
        STORAGE_KEY_COMPANY,
        STORAGE_KEY_ACCOUNT_BASELINE,
        "facturx_settings_v3",
        "facturx_team_v3",
      ].forEach((k) => localStorage.removeItem(k));
    }
    setUserProfile(null);
    showToast("Session déconnectée. Veuillez vous identifier pour continuer.", "info");
  };

  // Contrôle RBAC des autorisations d'accès par rôle
  const isTabRestrictedForRole = (tab) => {
    const role = userProfile?.role || "admin";
    if (role === "admin") return false;
    if (role === "comptable") {
      return tab === "company" || tab === "settings" || tab === "employees";
    }
    if (role === "commercial") {
      return tab === "payments" || tab === "reports" || tab === "settings" || tab === "company" || tab === "employees";
    }
    if (role === "gestionnaire_stock") {
      return tab === "payments" || tab === "reports" || tab === "settings" || tab === "company" || tab === "employees";
    }
    return false;
  };

  // Écran de chargement initial si vérification en cours
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Chargement sécurisé de FacturX...
          </p>
        </div>
      </div>
    );
  }

  // Écran de connexion obligatoire si aucun utilisateur n'est connecté
  if (!userProfile) {
    return (
      <LoginScreen
        onLoginSuccess={(profile) => {
          setUserProfile(profile);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
          }
          if (profile.companyId) {
            if (profile.companyName) {
              setCompanyInfo((prev) => ({
                ...prev,
                id: profile.companyId,
                name: profile.companyName,
                defaultCurrency: profile.currency || prev.defaultCurrency,
                currencySymbol: profile.currencySymbol || prev.currencySymbol,
              }));
            }
            // Réinitialiser les données pour la nouvelle organisation
            setClients([]);
            setInvoices([]);
            setQuotes([]);
            setPayments([]);
          }
          showToast(`Bienvenue, ${profile.fullName} ! Accès ${profile.badge || profile.role}`, "success");
        }}
        teamMembers={teamMembers}
        companyInfo={companyInfo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex text-slate-800">
      {/* 1. Left Sidebar with active navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        invoiceCount={invoices.length}
        userRole={userProfile?.role || "admin"}
        userProfile={userProfile}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header with interactive Calendar & Profile navigation */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
          invoiceDates={invoiceDates}
          companyInfo={companyInfo}
          onNavigate={(tab) => setActiveTab(tab)}
          isSyncing={isSyncing}
          isSupabaseConnected={isSupabaseConnected}
          isOffline={isOffline}
          pendingSyncCount={pendingSyncCount}
          onTriggerSync={handleTriggerManualSync}
          userProfile={userProfile}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
        />

        {/* Bannière Mode Hors-Ligne & Synchronisation PWA */}
        {(isOffline || pendingSyncCount > 0) && (
          <div className="bg-amber-500/10 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 transition-all duration-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-semibold">
                {isOffline
                  ? `Mode Hors-Ligne actif — ${pendingSyncCount} modification(s) sauvegardée(s) localement.`
                  : `Connexion rétablie — ${pendingSyncCount} action(s) prête(s) à être synchronisées.`}
              </span>
            </div>
            {!isOffline && pendingSyncCount > 0 && (
              <button
                onClick={handleTriggerManualSync}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition-all cursor-pointer"
              >
                Synchroniser maintenant
              </button>
            )}
          </div>
        )}

        {/* Dynamic Toast Feedback */}
        {feedbackToast && (
          <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackToast.message}</span>
            </div>
          </div>
        )}

        {/* Main Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl w-full mx-auto">
          {/* ÉCRAN DE RESTRICTION D'ACCÈS RBAC (SI MODULE NON AUTORISÉ POUR CE RÔLE) */}
          {isTabRestrictedForRole(activeTab) && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-12 text-center max-w-xl mx-auto my-12 space-y-5 animate-fadeIn">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
                <Shield className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-3 py-1 rounded-full border border-amber-200">
                  Module Restreint (RBAC)
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-3">
                  Accès Réservé à la Direction & Finance
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Votre profil actif est <span className="font-bold text-slate-800">{userProfile?.role === "commercial" ? "Commercial" : userProfile?.role === "comptable" ? "Responsable Comptable" : userProfile?.role}</span> ({userProfile?.fullName || "Utilisateur"}). L&apos;accès à cet espace requiert les autorisations d&apos;un Administrateur Général.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Changer de Profil / Se Connecter en Admin</span>
                </button>
                <button
                  onClick={() => setActiveTab(userProfile?.role === "commercial" ? "quotes" : "dashboard")}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Retourner au {userProfile?.role === "commercial" ? "Pipeline Devis" : "Tableau de bord"}
                </button>
              </div>
            </div>
          )}
          {/* TAB: DASHBOARD (SYNTHÈSE FINANCIÈRE & PRÉVISIONS) */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-200">
              {/* BANNIÈRE DE BIENVENUE PERSONNALISÉE SELON LE PROFIL CONNECTÉ */}
              <div className="bg-gradient-to-r from-[#1A44B8] via-[#163DA9] to-[#2D60FF] rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-lg font-extrabold shadow-inner shrink-0">
                    {userProfile?.initials || "FX"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                        Bonjour, {userProfile?.fullName || "Collaborateur"} 👋
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Connecté en direct
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
                      Espace <strong>{userProfile?.badge || userProfile?.role}</strong> chez{" "}
                      <span className="underline decoration-blue-300 font-bold">{companyInfo?.name || "HORIZON GROUPE"}</span>{" "}
                      — ({userProfile?.email})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-3.5 py-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/20 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Changer de profil
                  </button>
                </div>
              </div>

              {/* En-tête Tableau de Bord */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-[#183BB0] border border-blue-200">
                      Tour de Contrôle
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Données synchronisées en direct
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                    Tableau de bord financier
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    Synthèse globale, prévisions de trésorerie et pilotage du recouvrement en FCFA pour {companyInfo.name}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDropdown
                    selectedPeriod={selectedPeriod}
                    onSelectPeriod={setSelectedPeriod}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    invoiceDates={invoiceDates}
                    buttonClassName="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer transition-colors"
                    align="right"
                  />

                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-blue-900/20 transition-all hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Créer une Facture</span>
                  </button>
                </div>
              </div>

              {/* Bannière de filtre historique actif */}
              {(selectedDate || (selectedPeriod && selectedPeriod !== "Toutes les dates")) && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50/90 border border-blue-200 rounded-2xl text-xs font-semibold text-blue-900 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      Historique actif : <strong>{selectedDate || selectedPeriod}</strong> —{" "}
                      <span className="text-blue-700 font-bold">
                        {displayedInvoices.length} facture(s) trouvée(s)
                      </span>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDate(null);
                      setSelectedPeriod("Toutes les dates");
                    }}
                    className="px-2.5 py-1 text-xs text-blue-700 hover:text-white hover:bg-blue-600 font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Afficher tout l&apos;historique</span>
                  </button>
                </div>
              )}

              {/* 4 KPIs Globaux reliés aux données des factures */}
              <StatsCards metrics={metrics} />

              {/* Prévisions de trésorerie (30j) & Alertes de recouvrement */}
              <DashboardForecast
                invoices={invoices}
                metrics={metrics}
                onNavigateToInvoices={() => setActiveTab("invoices")}
                onOpenCreateInvoice={() => setIsCreateModalOpen(true)}
                onOpenCreateClient={() => setIsCreateClientModalOpen(true)}
                onOpenReminder={(inv) => setReminderInvoice(inv)}
              />

              {/* Dernières factures récentes (compact, 4 factures max avec lien vers le registre complet) */}
              <DashboardRecentInvoices
                invoices={displayedInvoices}
                onSelectInvoice={(inv) => setSelectedInvoice(inv)}
                onNavigateToInvoices={() => setActiveTab("invoices")}
                onOpenCreateInvoice={() => setIsCreateModalOpen(true)}
              />
            </div>
          )}

          {/* TAB: FACTURES (REGISTRE COMPLET & EXHAUSTIF DES PIÈCES COMPTABLES) */}
          {activeTab === "invoices" && (
            <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-200">
              {/* En-tête Gestion des Factures */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#183BB0] border border-blue-200">
                      Registre Comptable
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Conformité UEMOA / OHADA • TVA 18%
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                    Gestion des Factures
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    Registre intégral de toutes les pièces émises, règlements, relances clients et exports officiels
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDropdown
                    selectedPeriod={selectedPeriod}
                    onSelectPeriod={setSelectedPeriod}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    invoiceDates={invoiceDates}
                    buttonClassName="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer transition-colors"
                    align="right"
                  />

                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-blue-900/20 transition-all hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer une Facture</span>
                  </button>
                </div>
              </div>

              {/* Bannière de filtre historique actif */}
              {(selectedDate || (selectedPeriod && selectedPeriod !== "Toutes les dates")) && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50/90 border border-blue-200 rounded-2xl text-xs font-semibold text-blue-900 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      Historique actif : <strong>{selectedDate || selectedPeriod}</strong> —{" "}
                      <span className="text-blue-700 font-bold">
                        {displayedInvoices.length} facture(s) trouvée(s)
                      </span>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDate(null);
                      setSelectedPeriod("Toutes les dates");
                    }}
                    className="px-2.5 py-1 text-xs text-blue-700 hover:text-white hover:bg-blue-600 font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Afficher tout l&apos;historique</span>
                  </button>
                </div>
              )}

              {/* Barre de métriques opérationnelles dédiées à la facturation */}
              <InvoiceMetricsBar invoices={displayedInvoices} />

              {/* Table intégrale et complète de toutes les factures avec filtres et pagination */}
              <InvoiceTable
                invoices={displayedInvoices}
                clients={clients}
                onSelectInvoice={(inv) => setSelectedInvoice(inv)}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                onMarkAsPaid={handleMarkAsPaid}
                onUpdateInvoice={handleUpdateInvoice}
                onDeleteInvoice={handleDeleteInvoice}
                onOpenReminder={(inv) => setReminderInvoice(inv)}
                searchQuery={searchQuery}
                onToast={showToast}
                companyInfo={companyInfo}
                title="Registre Général des Factures"
                subtitle="Visualisation, filtrage avancé et gestion opérationnelle de toutes les pièces comptables"
              />
            </div>
          )}

          {/* TAB: MON ENTREPRISE (Configuration complète et interactive adaptée à la RDC) */}
          {activeTab === "company" && !isTabRestrictedForRole("company") && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header section Entreprise */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                    <Building2 className="w-7 h-7 text-[#183BB0]" />
                    <span>Mon Entreprise & Coordonnées Légales</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Gérez l&apos;identité légale, le logo, les comptes bancaires et les mentions obligatoires de vos factures (Normes OHADA / RDC)
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(true)}
                    className="group px-4 py-2 bg-white text-slate-700 hover:bg-black hover:text-white border border-slate-300 hover:border-black text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-xs hover:shadow-md cursor-pointer active:scale-95"
                    title="Rétablir les coordonnées d'origine associées au compte"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:-rotate-90 transition-all duration-300" />
                    <span>Rétablir par défaut</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCompany}
                    className="px-5 py-2.5 bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/25 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les coordonnées</span>
                  </button>
                </div>
              </div>

              {/* 1. Carte de Prévisualisation en direct de l'en-tête de facture */}
              <div className="bg-gradient-to-r from-blue-900 via-[#183BB0] to-[#2D60FF] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white text-[#183BB0] font-black text-2xl flex items-center justify-center shadow-lg tracking-wider shrink-0 overflow-hidden border-2 border-white/30">
                      {companyForm.logoUrl ? (
                        <img
                          src={companyForm.logoUrl}
                          alt={companyForm.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span>{companyForm.initials || "HG"}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-blue-100">
                          Aperçu En-tête Facture
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Conforme OHADA / RDC • DGI
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-white">
                        {companyForm.name || "HORIZON GROUPE"}
                      </h2>
                      <p className="text-xs text-blue-100">
                        {companyForm.subtitle || "Solutions Digitales & Facturation OHADA / RDC"}
                      </p>
                    </div>
                  </div>

                  {/* Identifiants légaux en RDC */}
                  <div className="text-xs space-y-1 text-blue-100/90 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[240px]">
                    <p className="font-bold text-white text-[11px] uppercase tracking-wider">
                      Identifiants Officiels (RDC) :
                    </p>
                    <p className="font-mono text-[11px]">
                      RCCM : <span className="font-bold text-white">{companyForm.rccm || "CD/KIN/RCCM/24-B-01420"}</span>
                    </p>
                    <p className="font-mono text-[11px]">
                      Id. Nat. : <span className="font-bold text-white">{companyForm.idNat || "01-G4701-B89201"}</span>
                    </p>
                    <p className="font-mono text-[11px]">
                      N° Impôt : <span className="font-bold text-white">{companyForm.nif || companyForm.ninea || "A2408912Z"}</span>
                    </p>
                  </div>
                </div>

                {/* Coordonnées rapides bas de bannière */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-blue-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-200 shrink-0" />
                    <span className="truncate">
                      {companyForm.address ? `${companyForm.address}, ` : ""}
                      {companyForm.city}, {companyForm.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-200 shrink-0" />
                    <span>
                      {companyForm.phoneDigits
                        ? `${companyForm.phoneCountryCode || "+243"} ${companyForm.phoneDigits}`
                        : (companyForm.phone || companyForm.mobile)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-200 shrink-0" />
                    <span className="truncate">{companyForm.email}</span>
                  </div>
                </div>

                {/* Paiement en direct */}
                <div className="relative z-10 pt-3 mt-3 border-t border-white/10 flex flex-wrap items-center gap-4 text-[11px] text-blue-200/90">
                  <span className="flex items-center gap-1 font-semibold text-white">
                    <CreditCard className="w-3.5 h-3.5 text-blue-300" />
                    {companyForm.bankName === "Autre banque (saisie manuelle)"
                      ? (companyForm.bankCustomName || "Autre banque")
                      : (companyForm.bankName || "Rawbank")}
                  </span>
                  <span>•</span>
                  <span>Airtel Money : <strong className="text-white">{companyForm.airtelDigits ? `${companyForm.airtelCountryCode || "+243"} ${companyForm.airtelDigits}` : (companyForm.airtelMoneyNumber || companyForm.waveNumber || "+243 99 820 40 50")}</strong></span>
                  <span>•</span>
                  <span>Orange Money RDC : <strong className="text-white">{companyForm.orangeDigits ? `${companyForm.orangeCountryCode || "+243"} ${companyForm.orangeDigits}` : (companyForm.orangeMoneyNumber || "+243 89 820 40 50")}</strong></span>
                  <span>•</span>
                  <span>Devise : <strong className="text-amber-300 font-bold">{companyForm.defaultCurrency || "Franc Congolais (CDF / FC)"}</strong></span>
                </div>
              </div>

              {/* 2. Formulaire d'édition complet de l'entreprise */}
              <form onSubmit={handleSaveCompany} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bloc A : Identité Juridique */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Identité & Enregistrement Fiscal (RDC)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Raison sociale, logo officiel, RCCM, Id. Nat. et N° d&apos;Impôt obligatoires en République Démocratique du Congo
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* Zone Logo / Photo Officielle de l'Entreprise */}
                    <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>Logo & Photo Officielle de l&apos;Entreprise</span>
                        </label>
                        {companyForm.logoUrl ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Logo actif
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                            Initiales : {companyForm.initials || "HG"}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        {/* Prévisualisation Logo */}
                        <div className="relative w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 hover:border-blue-400 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden transition-all group">
                          {companyForm.logoUrl ? (
                            <img
                              src={companyForm.logoUrl}
                              alt="Logo entreprise"
                              className="w-full h-full object-contain rounded-xl"
                            />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-blue-50 text-[#183BB0] font-black text-xl flex flex-col items-center justify-center gap-0.5">
                              <span>{companyForm.initials || "HG"}</span>
                              <span className="text-[9px] font-semibold text-slate-400">Aucun logo</span>
                            </div>
                          )}
                        </div>

                        {/* Boutons d'action upload */}
                        <div className="space-y-2 flex-1 text-center sm:text-left">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <input
                              type="file"
                              ref={logoFileInputRef}
                              onChange={handleLogoUpload}
                              accept="image/png, image/jpeg, image/jpg, image/webp"
                              className="hidden"
                              id="company-logo-input"
                            />
                            <button
                              type="button"
                              onClick={() => logoFileInputRef.current?.click()}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{companyForm.logoUrl ? "Changer le logo / photo" : "Téléverser le logo / photo"}</span>
                            </button>

                            {companyForm.logoUrl && (
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Supprimer le logo personnalisé"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Supprimer</span>
                              </button>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Formats acceptés : <strong>PNG, JPG, SVG, WebP</strong> (max 5 Mo).
                            Ce visuel s&apos;affiche automatiquement sur vos factures, devis, exports PDF et documents officiels.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Raison Sociale / Nom de l&apos;entreprise *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyForm.name}
                        onChange={(e) => handleCompanyFieldChange("name", e.target.value)}
                        placeholder="Ex: HORIZON GROUPE"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Sigle / Initiales Logo
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          value={companyForm.initials}
                          onChange={(e) => handleCompanyFieldChange("initials", e.target.value.toUpperCase())}
                          placeholder="FX"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-blue-700 text-center uppercase focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Slogan / Sous-titre
                        </label>
                        <input
                          type="text"
                          value={companyForm.subtitle}
                          onChange={(e) => handleCompanyFieldChange("subtitle", e.target.value)}
                          placeholder="Solutions Digitales & Facturation OHADA / RDC"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Identifiants légaux congolais */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Numéro RCCM *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyForm.rccm}
                        onChange={(e) => handleCompanyFieldChange("rccm", e.target.value)}
                        placeholder="CD/KIN/RCCM/24-B-01420"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 font-semibold focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Registre du Commerce et du Crédit Mobilier (ex: CD/KIN/RCCM/...)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Identification Nationale (ID. NAT) *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyForm.idNat}
                          onChange={(e) => handleCompanyFieldChange("idNat", e.target.value)}
                          placeholder="01-G4701-B89201"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Numéro d&apos;identification nationale officiel
                        </span>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Numéro d&apos;Impôt / NIF *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyForm.nif || companyForm.ninea}
                          onChange={(e) => {
                            handleCompanyFieldChange("nif", e.target.value);
                            handleCompanyFieldChange("ninea", e.target.value);
                          }}
                          placeholder="A2408912Z"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Numéro fiscal DGI (Direction Générale des Impôts)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloc B : Coordonnées & Siège Social */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Siège Social & Contact
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Adresse physique, sélection du pays, indicatifs automatiques et emails
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Adresse Physique du Siège *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyForm.address}
                        onChange={(e) => handleCompanyFieldChange("address", e.target.value)}
                        placeholder="Boulevard du 30 Juin, Immeuble BCDC, Gombe"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Boîte Postale (BP)
                        </label>
                        <input
                          type="text"
                          value={companyForm.bp}
                          onChange={(e) => handleCompanyFieldChange("bp", e.target.value)}
                          placeholder="BP 1250 Kinshasa 1"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Ville *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyForm.city}
                          onChange={(e) => handleCompanyFieldChange("city", e.target.value)}
                          placeholder="Kinshasa (ou Lubumbashi, Goma...)"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Sélection moderne du Pays (Menu déroulant avec priorité pays d'Afrique & RDC) */}
                    <div>
                      <CountrySelect
                        label="Pays du Siège *"
                        value={companyForm.country}
                        onChange={(newCountry, newDialCode) => {
                          handleCompanyFieldChange("country", newCountry);
                          // Mettre à jour les indicatifs par défaut si c'était l'ancien indicatif
                          if (!companyForm.phoneCountryCode || companyForm.phoneCountryCode === "+243") {
                            handleCompanyFieldChange("phoneCountryCode", newDialCode);
                          }
                          if (!companyForm.mobileCountryCode || companyForm.mobileCountryCode === "+243") {
                            handleCompanyFieldChange("mobileCountryCode", newDialCode);
                          }
                        }}
                        required
                      />
                    </div>

                    {/* Numéros de Téléphone avec Sélecteur d'indicatif pays automatique */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <PhoneCountryInput
                        label="Téléphone Fixe / Standard"
                        countryCode={companyForm.phoneCountryCode || "+243"}
                        onCountryCodeChange={(code) => handleCompanyFieldChange("phoneCountryCode", code)}
                        digits={companyForm.phoneDigits || ""}
                        onDigitsChange={(digits) => handleCompanyFieldChange("phoneDigits", digits)}
                        placeholder="81 000 40 50"
                        helpText="Indicatif automatique + saisie du numéro"
                      />

                      <PhoneCountryInput
                        label="Téléphone WhatsApp / Mobile *"
                        countryCode={companyForm.mobileCountryCode || "+243"}
                        onCountryCodeChange={(code) => handleCompanyFieldChange("mobileCountryCode", code)}
                        digits={companyForm.mobileDigits || ""}
                        onDigitsChange={(digits) => handleCompanyFieldChange("mobileDigits", digits)}
                        placeholder="99 820 40 50"
                        required
                        helpText="Contact direct pour les relances"
                      />
                    </div>

                    {/* Email et Site Web avec validation email stricte */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Email Officiel de Facturation *
                        </label>
                        <input
                          type="email"
                          required
                          value={companyForm.email}
                          onChange={(e) => handleCompanyFieldChange("email", e.target.value)}
                          placeholder="contact@facturx.cd"
                          className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-800 focus:bg-white focus:outline-none transition-all ${
                            emailValidationError
                              ? "border-rose-400 ring-2 ring-rose-100"
                              : "border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          }`}
                        />
                        {emailValidationError ? (
                          <p className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{emailValidationError}</span>
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Adresse utilisée pour l&apos;envoi automatique des factures
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Site Web Officiel
                        </label>
                        <input
                          type="text"
                          value={companyForm.website}
                          onChange={(e) => handleCompanyFieldChange("website", e.target.value)}
                          placeholder="https://facturx.cd"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloc C : Modalités Bancaires & Mobile Money Congolais */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Coordonnées Bancaires & Mobile Money (RDC)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Banques congolaises (Rawbank, Equity BCDC...), Airtel Money Pro et Orange Money RDC
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* Sélecteur de Banque avec Rawbank par défaut et saisie manuelle */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Nom de la Banque Partenaire *
                      </label>
                      <select
                        value={
                          CONGO_BANKS.includes(companyForm.bankName)
                            ? companyForm.bankName
                            : "Autre banque (saisie manuelle)"
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          handleCompanyFieldChange("bankName", val);
                          if (val !== "Autre banque (saisie manuelle)") {
                            handleCompanyFieldChange("bankCustomName", "");
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      >
                        {CONGO_BANKS.map((b, i) => (
                          <option key={i} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>

                      {/* Si saisie manuelle / autre pays */}
                      {(companyForm.bankName === "Autre banque (saisie manuelle)" ||
                        !CONGO_BANKS.includes(companyForm.bankName)) && (
                        <div className="mt-2 animate-in fade-in">
                          <input
                            type="text"
                            required
                            value={companyForm.bankCustomName || (CONGO_BANKS.includes(companyForm.bankName) ? "" : companyForm.bankName)}
                            onChange={(e) => {
                              handleCompanyFieldChange("bankCustomName", e.target.value);
                              handleCompanyFieldChange("bankName", e.target.value);
                            }}
                            placeholder="Saisissez le nom complet de votre banque..."
                            className="w-full px-3.5 py-2 bg-white border border-blue-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        IBAN / Numéro de Compte Bancaire (RIB) *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyForm.iban}
                        onChange={(e) => handleCompanyFieldChange("iban", e.target.value)}
                        placeholder="CD00 RAWB 0100 1000 0123 4567 89"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 font-semibold focus:bg-white focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Relevé d&apos;Identité Bancaire ou numéro de compte bancaire
                      </span>
                    </div>

                    {/* Airtel Money Pro et Orange Money RDC Pro avec sélecteur d'indicatif */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <PhoneCountryInput
                        label="Numéro Airtel Money Pro"
                        countryCode={companyForm.airtelCountryCode || "+243"}
                        onCountryCodeChange={(code) => handleCompanyFieldChange("airtelCountryCode", code)}
                        digits={companyForm.airtelDigits || ""}
                        onDigitsChange={(digits) => {
                          handleCompanyFieldChange("airtelDigits", digits);
                          handleCompanyFieldChange("waveNumber", `${companyForm.airtelCountryCode || "+243"} ${digits}`);
                        }}
                        placeholder="99 820 40 50"
                        helpText="Paiement instantané Airtel Money RDC"
                      />

                      <PhoneCountryInput
                        label="Numéro Orange Money RDC Pro"
                        countryCode={companyForm.orangeCountryCode || "+243"}
                        onCountryCodeChange={(code) => handleCompanyFieldChange("orangeCountryCode", code)}
                        digits={companyForm.orangeDigits || ""}
                        onDigitsChange={(digits) => handleCompanyFieldChange("orangeDigits", digits)}
                        placeholder="89 820 40 50"
                        helpText="Paiement instantané Orange Money RDC"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloc D : Fiscalité & Devises (Franc Congolais par défaut + USD, EUR, GBP, FCFA) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Fiscalité & Paramètres Monétaires
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Choix de la devise de facturation et configuration du taux légal de TVA
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* Menu déroulant du choix de la Devise */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Devise de Facturation par défaut *
                      </label>
                      <select
                        value={companyForm.defaultCurrency}
                        onChange={(e) => handleCompanyFieldChange("defaultCurrency", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      >
                        {CURRENCIES.map((curr) => (
                          <option key={curr.code} value={curr.name}>
                            {curr.name} {curr.isDefault ? "— Par défaut (RDC)" : ""}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Symbole appliqué sur vos factures :</span>
                        <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {getCurrencySymbol(companyForm.defaultCurrency)}
                        </span>
                      </div>
                    </div>

                    {/* Configuration du Taux de TVA (16% RDC standard) */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Taux de TVA par défaut
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCompanyFieldChange("defaultVatRate", 0.16)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                            companyForm.defaultVatRate === 0.16
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          16% (RDC DGI)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompanyFieldChange("defaultVatRate", 0.18)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                            companyForm.defaultVatRate === 0.18
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          18% (UEMOA)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompanyFieldChange("defaultVatRate", 0)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                            companyForm.defaultVatRate === 0
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          0% (Exonéré)
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        16% est le taux légal standard en République Démocratique du Congo (DGI).
                      </p>
                    </div>

                    {/* Bloc certification */}
                    <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200/80 text-blue-900 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        Certification OHADA / RDC Active
                      </p>
                      <p className="text-[11px] text-blue-800/80 leading-relaxed">
                        Chaque facture émise hérite automatiquement de ces coordonnées. Vos factures et fichiers PDF générés sont conformes au droit comptable OHADA et aux obligations fiscales congolaises.
                      </p>
                    </div>

                    {/* Bouton Enregistrer */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#183BB0] hover:bg-[#122F8C] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Enregistrer les coordonnées de l&apos;entreprise</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB: CLIENTS (Fichier des Entreprises Clientes avec KPIs, animations et export) */}
          {activeTab === "clients" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header avec Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                    <Users className="w-7 h-7 text-[#183BB0]" />
                    <span>Fichier des Entreprises Clientes</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Répertoire officiel ({clients.length} entreprises clientes). Consultez l&apos;historique comptable, modifiez les coordonnées ou facturez en 1 clic.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        exportClientsToXLSX(clients, invoices);
                        showToast("Répertoire clients exporté au format Excel (XLSX) avec succès !");
                      } catch (e) {
                        showToast("Erreur lors de l'exportation des clients.", "error");
                      }
                    }}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
                    title="Exporter la base clients en fichier Excel"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Exporter Excel</span>
                  </button>

                  <button
                    onClick={() => setIsCreateClientModalOpen(true)}
                    className="px-4 py-2.5 bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouvelle Entreprise Cliente</span>
                  </button>
                </div>
              </div>

              {/* 1. Rangée de KPIs statistiques des clients (Conforme au Design System) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Total Entreprises */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Répertoire Clients
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {clients.length}
                    </span>
                    <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Actives
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Entreprises certifiées dans le fichier
                  </p>
                </div>

                {/* Clients avec factures en attente */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      En Attente de Règlement
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
                      {clientsWithPending}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      sur {clients.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Relance disponible en 1 clic
                  </p>
                </div>

                {/* Clients 100% à jour */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Clients 100% À Jour
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
                      {clientsUpToDate}
                    </span>
                    <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {Math.round((clientsUpToDate / (clients.length || 1)) * 100)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Toutes factures soldées
                  </p>
                </div>

                {/* Volume Total Facturé */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Volume Facturé Global
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Receipt className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate block">
                      {formatAmount(totalBilledAcrossClients, companyInfo?.defaultCurrency)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Généré sur {invoices.length} factures
                  </p>
                </div>
              </div>

              {/* 2. Barre de recherche, filtres d'état rapides et commutateur Grille / Liste */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      placeholder="Rechercher par raison sociale, contact, ville, RCCM..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                    {/* Commutateur de vue Grille / Tableau Liste */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setClientViewMode("grid")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          clientViewMode === "grid"
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Affichage en Grille de cartes"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Grille</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientViewMode("list")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          clientViewMode === "list"
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Affichage en Tableau Liste"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Liste</span>
                      </button>
                    </div>

                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                      <span>
                        <strong className="text-slate-800">{filteredClients.length}</strong> /{" "}
                        <strong className="text-slate-800">{clients.length}</strong>
                      </span>
                      {(clientSearchQuery || clientFilterMode !== "all") && (
                        <button
                          onClick={() => {
                            setClientSearchQuery("");
                            setClientFilterMode("all");
                          }}
                          className="text-blue-600 hover:underline font-bold text-xs cursor-pointer"
                        >
                          Réinitialiser
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pilules de filtrage interactives */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-slate-400" /> Filtres :
                  </span>
                  <button
                    onClick={() => setClientFilterMode("all")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      clientFilterMode === "all"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    Toutes ({clients.length})
                  </button>
                  <button
                    onClick={() => setClientFilterMode("pending")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      clientFilterMode === "pending"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    En attente de paiement ({clientsWithPending})
                  </button>
                  <button
                    onClick={() => setClientFilterMode("up_to_date")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      clientFilterMode === "up_to_date"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    100% À jour ({clientsUpToDate})
                  </button>
                </div>
              </div>

              {/* 3. Contenu : État vide OU Grille OU Tableau Liste */}
              {filteredClients.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4 max-w-md mx-auto my-8 shadow-xs animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Aucune entreprise trouvée
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Aucun client ne correspond à votre filtre actuel. Vous pouvez réinitialiser la recherche ou créer une nouvelle entreprise.
                  </p>
                  <button
                    onClick={() => {
                      setClientSearchQuery("");
                      setClientFilterMode("all");
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : clientViewMode === "grid" ? (
                /* Grille de cartes avec animation cascade staggered et liseré lumineux */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredClients.map((client, idx) => {
                    const clientInvoices = invoices.filter(
                      (inv) => inv.clientName.toLowerCase() === client.name.toLowerCase()
                    );
                    const clientInvoiceCount = clientInvoices.length;
                    const hasUnpaid = clientInvoices.some((i) => i.status !== "payee");
                    const whatsappDirectUrl = getWhatsAppUrl(
                      client.phone,
                      client.name,
                      client.contactPerson
                    );

                    return (
                      <div
                        key={client.name || idx}
                        style={{ animationDelay: `${idx * 40}ms` }}
                        className="group relative overflow-hidden bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1.5 hover:border-blue-200 transition-all duration-300 ease-out flex flex-col justify-between space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
                      >
                        {/* Ligne d'accent lumineuse au survol */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/80 transition-all duration-500"></div>

                        <div>
                          {/* Header de la carte : Avatar vibrant, Titre cliquable, Actions */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={() => setSelectedClientForProfile(client)}
                                title="Ouvrir la fiche client 360°"
                                className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${getClientAvatarGradient(
                                  client.name
                                )} text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300 cursor-pointer`}
                              >
                                {client.name.substring(0, 2).toUpperCase()}
                              </button>
                              <div className="min-w-0 text-left">
                                <button
                                  type="button"
                                  onClick={() => setSelectedClientForProfile(client)}
                                  className="font-extrabold text-sm text-slate-900 truncate group-hover:text-[#183BB0] transition-colors text-left block w-full cursor-pointer"
                                  title={`Consulter la fiche complète de ${client.name}`}
                                >
                                  <span className="flex items-center gap-1">
                                    <span className="truncate">{client.name}</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                  </span>
                                </button>
                                {client.contactPerson && (
                                  <p
                                    className="text-[11px] text-slate-500 font-medium truncate"
                                    title={client.contactPerson}
                                  >
                                    {client.contactPerson}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Actions rapides Édition / Suppression */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setSelectedClientForProfile(client)}
                                title="Fiche Client 360°"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setClientForEdit(client)}
                                title="Modifier cette entreprise"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setClientToDelete(client)}
                                title="Supprimer cette entreprise"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer active:scale-95"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Badge de statut comptable */}
                          <div className="mt-2.5">
                            {hasUnpaid ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Facture en attente de règlement
                              </span>
                            ) : clientInvoiceCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                100% À jour
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Nouveau client
                              </span>
                            )}
                          </div>

                          {/* Coordonnées détaillées avec copie rapide et WhatsApp */}
                          <div className="mt-3 space-y-2 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 group-hover:bg-slate-50 transition-colors">
                            {/* Téléphone WhatsApp */}
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                <Phone className="w-3 h-3 text-blue-500" />
                                Tél / WhatsApp :
                              </span>
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`tel:${(client.phone || "").replace(/[^0-9]/g, "")}`}
                                  className="font-bold text-blue-700 font-mono hover:underline"
                                >
                                  {client.phone || "+243 99 492 10 20"}
                                </a>
                                {whatsappDirectUrl && (
                                  <a
                                    href={whatsappDirectUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Ouvrir WhatsApp direct"
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-0.5 rounded transition-colors"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleCopyContact(client.phone, `phone-${idx}`)}
                                  title="Copier le numéro"
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors cursor-pointer"
                                >
                                  {copiedFieldId === `phone-${idx}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                <Mail className="w-3 h-3 text-blue-500" />
                                Email :
                              </span>
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`mailto:${client.email}`}
                                  className="font-medium text-slate-800 hover:text-blue-600 truncate max-w-[150px]"
                                  title={client.email}
                                >
                                  {client.email}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopyContact(client.email, `email-${idx}`)}
                                  title="Copier l'adresse email"
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors cursor-pointer"
                                >
                                  {copiedFieldId === `email-${idx}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Siège */}
                            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60 text-[11px]">
                              <span className="flex items-center gap-1.5 text-slate-400">
                                <MapPin className="w-3 h-3 text-blue-500" />
                                Siège :
                              </span>
                              <span className="font-medium text-slate-700 text-right truncate max-w-[170px]">
                                {client.address ? `${client.address}, ` : ""}{client.location}
                              </span>
                            </div>

                            {/* NIF / RCCM */}
                            {client.taxId && (
                              <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono pt-0.5">
                                <span>RCCM / NIF :</span>
                                <span className="font-bold text-slate-600">{client.taxId}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setClientForInvoice(client);
                              setIsCreateModalOpen(true);
                            }}
                            className="py-2.5 px-3 text-xs font-bold bg-[#183BB0] hover:bg-[#122F8C] text-white rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 hover:scale-[1.03] active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Facturer</span>
                          </button>

                          <button
                            onClick={() => setSelectedClientForProfile(client)}
                            className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all border flex items-center justify-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-95 ${
                              hasUnpaid
                                ? "text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200"
                                : "text-blue-700 hover:bg-blue-50 border-blue-200"
                            }`}
                            title="Ouvrir la fiche client 360° et l'historique complet"
                          >
                            <span>Factures ({clientInvoiceCount})</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Vue Tableau / Liste compacte haute densité (Conforme au Design System FacturX) */
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3.5 px-4 sm:px-6">Entreprise & Contact</th>
                          <th className="py-3.5 px-4">Coordonnées</th>
                          <th className="py-3.5 px-4">Localisation</th>
                          <th className="py-3.5 px-4">Identifiant Fiscal</th>
                          <th className="py-3.5 px-4">Factures & Statut</th>
                          <th className="py-3.5 px-4 text-right">Total Facturé</th>
                          <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredClients.map((client, idx) => {
                          const clientInvoices = invoices.filter(
                            (inv) => inv.clientName.toLowerCase() === client.name.toLowerCase()
                          );
                          const clientInvoiceCount = clientInvoices.length;
                          const hasUnpaid = clientInvoices.some((i) => i.status !== "payee");
                          const totalClientBilled = clientInvoices.reduce((acc, inv) => {
                            const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
                            return acc + total;
                          }, 0);
                          const whatsappDirectUrl = getWhatsAppUrl(
                            client.phone,
                            client.name,
                            client.contactPerson
                          );

                          return (
                            <tr
                              key={client.name || idx}
                              style={{ animationDelay: `${idx * 30}ms` }}
                              className="hover:bg-blue-50/40 transition-colors animate-in fade-in slide-in-from-bottom-1 duration-200 fill-mode-both group"
                            >
                              {/* Entreprise & Contact */}
                              <td className="py-3.5 px-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedClientForProfile(client)}
                                    className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${getClientAvatarGradient(
                                      client.name
                                    )} text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0 cursor-pointer`}
                                    title="Fiche Client 360°"
                                  >
                                    {client.name.substring(0, 2).toUpperCase()}
                                  </button>
                                  <div className="min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedClientForProfile(client)}
                                      className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left truncate block max-w-[200px] cursor-pointer"
                                      title="Ouvrir la fiche client 360°"
                                    >
                                      {client.name}
                                    </button>
                                    <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                                      {client.contactPerson || "Interlocuteur non renseigné"}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Coordonnées */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={`tel:${(client.phone || "").replace(/[^0-9]/g, "")}`}
                                      className="font-bold text-blue-700 font-mono text-[11px] hover:underline"
                                    >
                                      {client.phone || "—"}
                                    </a>
                                    {whatsappDirectUrl && (
                                      <a
                                        href={whatsappDirectUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                        title="WhatsApp direct"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleCopyContact(client.phone, `tbl-phone-${idx}`)}
                                      className="text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer"
                                      title="Copier le numéro"
                                    >
                                      {copiedFieldId === `tbl-phone-${idx}` ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                    <span className="truncate max-w-[160px]">{client.email || "—"}</span>
                                    {client.email && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopyContact(client.email, `tbl-mail-${idx}`)}
                                        className="text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer"
                                        title="Copier l'email"
                                      >
                                        {copiedFieldId === `tbl-mail-${idx}` ? (
                                          <Check className="w-3 h-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Localisation */}
                              <td className="py-3.5 px-4 text-slate-600">
                                <span className="font-semibold block">{client.location || "—"}</span>
                                {client.address && (
                                  <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                                    {client.address}
                                  </span>
                                )}
                              </td>

                              {/* Identifiant Fiscal */}
                              <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 font-semibold">
                                {client.taxId || "—"}
                              </td>

                              {/* Factures & Statut */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <span className="font-bold text-slate-800 text-xs block">
                                    {clientInvoiceCount} facture(s)
                                  </span>
                                  {hasUnpaid ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                      En attente
                                    </span>
                                  ) : clientInvoiceCount > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      100% À jour
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Aucune facture</span>
                                  )}
                                </div>
                              </td>

                              {/* Total Facturé */}
                              <td className="py-3.5 px-4 text-right">
                                <span className="font-extrabold text-slate-900 text-xs block">
                                  {formatAmount(totalClientBilled, companyInfo?.defaultCurrency)}
                                </span>
                                <span className="text-[10px] text-slate-400">TTC</span>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 sm:px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setClientForInvoice(client);
                                      setIsCreateModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 bg-[#183BB0] hover:bg-[#122F8C] text-white rounded-lg text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
                                    title="Facturer cette entreprise"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span className="hidden xl:inline">Facturer</span>
                                  </button>
                                  <button
                                    onClick={() => setSelectedClientForProfile(client)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                    title="Voir la fiche client 360°"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setClientForEdit(client)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                    title="Modifier les coordonnées"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setClientToDelete(client)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Supprimer cette entreprise"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PAIEMENTS */}
          {activeTab === "payments" && !isTabRestrictedForRole("payments") && (
            <PaymentsView
              payments={payments}
              invoices={invoices}
              clients={clients}
              companyInfo={companyInfo}
              onSavePayment={handleSavePayment}
              onUpdatePayment={handleUpdatePayment}
              onDeletePayment={handleDeletePayment}
              onOpenInvoice={(invoiceId) => {
                const found = invoices.find((inv) => inv.id === invoiceId);
                if (found) setSelectedInvoice(found);
              }}
              onOpenClientProfile={(clientObj) => {
                setSelectedClientForProfile(clientObj);
              }}
              onNavigateToInvoices={() => setActiveTab("invoices")}
            />
          )}

          {/* TAB: EMPLOYÉS & COLLABORATEURS (STRICTEMENT ADMINISTRATEUR) */}
          {activeTab === "employees" && !isTabRestrictedForRole("employees") && (
            <EmployeesView
              currentUser={userProfile}
              teamMembers={teamMembers}
              companyInfo={companyInfo}
              onCreateMember={async (newMember) => {
                const created = await apiCreateTeamMember(newMember, userProfile?.companyId);
                if (created) {
                  setTeamMembers((prev) => [created, ...prev]);
                }
              }}
              onDeleteMember={async (memberId) => {
                await apiDeleteTeamMember(memberId);
                setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
              }}
              onToast={showToast}
            />
          )}

          {/* TAB: PARAMÈTRES & CONFIGURATION SYSTÈME */}
          {activeTab === "settings" && !isTabRestrictedForRole("settings") && (
            <SettingsView
              companyInfo={companyInfo}
              setCompanyInfo={setCompanyInfo}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              teamMembers={teamMembers}
              setTeamMembers={setTeamMembers}
              invoices={invoices}
              quotes={quotes}
              clients={clients}
              payments={payments}
              onToast={showToast}
              onApplyTheme={applyTheme}
              currentTheme={currentTheme}
              onResetAllData={() => {
                if (typeof window !== "undefined") {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            />
          )}

          {/* TAB: DEVIS & ESTIMATIONS (Pipeline Commercial, Négociation & Conversion 1-clic) */}
          {activeTab === "quotes" && (
            <QuotesPipelineView
              quotes={quotes}
              companyInfo={companyInfo}
              onOpenCreateModal={() => setIsCreateQuoteModalOpen(true)}
              onSelectQuote={(q) => setSelectedQuote(q)}
              onConvertToInvoice={handleConvertQuoteToInvoice}
              onUpdateStatus={handleUpdateQuoteStatus}
              onDeleteQuote={(q) => setQuoteToDelete(q)}
              onToast={showToast}
              onExportExcel={() => {
                try {
                  exportQuotesToXLSX(quotes);
                  showToast("Pipeline commercial exporté avec succès en Excel !", "success");
                } catch (e) {
                  showToast("Erreur lors de l'exportation du pipeline.", "error");
                }
              }}
              getClientAvatarGradient={getClientAvatarGradient}
            />
          )}

          {/* TAB: ANALYTIQUE (Intelligence Financière & Prise de Décision) */}
          {activeTab === "analytics" && (
            <AnalyticsView
              invoices={invoices}
              payments={payments}
              quotes={quotes}
              clients={clients}
              companyInfo={companyInfo}
              onOpenInvoice={(inv) => setSelectedInvoice(inv)}
              onOpenClientProfile={(clientObj) => setSelectedClientForProfile(clientObj)}
              onOpenReminder={(inv) => setReminderInvoice(inv)}
              onOpenCreateInvoice={() => setIsCreateModalOpen(true)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onToast={showToast}
            />
          )}

          {/* TAB: RAPPORTS & ÉTATS FINANCIERS */}
          {activeTab === "reports" && !isTabRestrictedForRole("reports") && (
            <ReportsView
              invoices={invoices}
              clients={clients}
              quotes={quotes}
              payments={payments}
              companyInfo={companyInfo}
              userProfile={userProfile}
              onOpenInvoice={(inv) => setSelectedInvoice(inv)}
              onOpenClientProfile={(clientObj) => setSelectedClientForProfile(clientObj)}
              onOpenReminder={(inv) => setReminderInvoice(inv)}
              onOpenQuote={(quoteObj) => setSelectedQuote(quoteObj)}
              onOpenCreateInvoice={() => setIsCreateModalOpen(true)}
              onRecordPayment={(inv) => {
                if (inv) {
                  setSelectedInvoice(inv);
                }
              }}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      {/* 5. Modals */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setClientForInvoice(null);
        }}
        onCreateInvoice={handleCreateInvoice}
        clients={clients}
        onAddNewClient={handleAddNewClient}
        initialSelectedClient={clientForInvoice}
        companyInfo={companyInfo}
        existingInvoices={invoices}
      />

      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        onClose={() => setIsCreateClientModalOpen(false)}
        onCreateClient={handleAddNewClient}
      />

      <EditClientModal
        isOpen={!!clientForEdit}
        client={clientForEdit}
        onClose={() => setClientForEdit(null)}
        onUpdateClient={handleUpdateClient}
        onDeleteClient={handleDeleteClient}
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onMarkAsPaid={handleMarkAsPaid}
        onOpenReminder={(inv) => setReminderInvoice(inv)}
        onEditInvoice={(inv) => {
          setSelectedInvoice(null);
          setInvoiceForEdit(inv);
        }}
        companyInfo={companyInfo}
      />

      <EditInvoiceModal
        isOpen={!!invoiceForEdit}
        onClose={() => setInvoiceForEdit(null)}
        invoice={invoiceForEdit}
        clients={clients}
        companyInfo={companyInfo}
        onSave={handleUpdateInvoice}
      />

      <ClientReminderModal
        invoice={reminderInvoice}
        isOpen={!!reminderInvoice}
        onClose={() => setReminderInvoice(null)}
        onSaveReminder={handleSaveReminder}
      />

      {/* Fiche Client 360° (Tiroir latéral immersif avec synthèse financière et historique) */}
      <ClientProfileDrawer
        isOpen={!!selectedClientForProfile}
        onClose={() => setSelectedClientForProfile(null)}
        client={selectedClientForProfile}
        invoices={invoices}
        payments={payments}
        companyInfo={companyInfo}
        onNewInvoice={(cl) => {
          setClientForInvoice(cl);
          setIsCreateModalOpen(true);
        }}
        onSelectInvoice={(inv) => setSelectedInvoice(inv)}
        onEditClient={(cl) => setClientForEdit(cl)}
        avatarGradient={
          selectedClientForProfile
            ? getClientAvatarGradient(selectedClientForProfile.name)
            : "from-blue-600 to-indigo-700"
        }
      />

      {/* Modales Devis & Estimations */}
      <CreateQuoteModal
        isOpen={isCreateQuoteModalOpen}
        onClose={() => setIsCreateQuoteModalOpen(false)}
        onCreateQuote={handleCreateQuote}
        clients={clients}
        companyInfo={companyInfo}
        initialQuoteCount={quotes.length}
        existingQuotes={quotes}
      />

      <QuoteDetailModal
        quote={selectedQuote}
        isOpen={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
        onConvertToInvoice={handleConvertQuoteToInvoice}
        onUpdateStatus={handleUpdateQuoteStatus}
        companyInfo={companyInfo}
      />

      {/* Confirmation Modal pour Rétablir par défaut */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmResetCompany}
        title="Rétablir les coordonnées par défaut ?"
        message="Êtes-vous sûr de vouloir réinitialiser toutes les coordonnées de l'entreprise ?"
        subtitle={`Cette opération restaurera l'identité, le logo et les coordonnées d'origine enregistrées lors de la création de votre compte (${companyInfo.name || "HORIZON GROUPE"}). Toutes vos modifications non enregistrées seront remplacées.`}
        confirmLabel="Oui, rétablir par défaut"
        cancelLabel="Annuler"
        type="dark"
        icon={<RotateCcw className="w-6 h-6 text-white" />}
      />

      {/* Pop-up de confirmation de suppression d'une entreprise cliente depuis la carte */}
      <ConfirmationModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={() => {
          if (clientToDelete) {
            handleDeleteClient(clientToDelete.name);
            setClientToDelete(null);
          }
        }}
        title="Supprimer l'entreprise cliente ?"
        message={`Voulez-vous réellement supprimer l'entreprise cliente "${clientToDelete?.name}" ?`}
        subtitle="Cette action retirera cette entreprise de votre fichier client. Vos factures associées resteront enregistrées dans votre historique."
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        type="danger"
        icon={<Trash2 className="w-7 h-7 text-rose-600" />}
      />

      {/* Pop-up de confirmation de suppression d'un devis */}
      <ConfirmationModal
        isOpen={!!quoteToDelete}
        onClose={() => setQuoteToDelete(null)}
        onConfirm={() => {
          if (quoteToDelete) {
            handleDeleteQuote(quoteToDelete.id);
            setQuoteToDelete(null);
          }
        }}
        title="Supprimer le devis ?"
        message={`Voulez-vous réellement supprimer le devis "${quoteToDelete?.id}" pour ${quoteToDelete?.clientName} ?`}
        subtitle="Cette action retirera ce chiffrage de votre fichier de propositions. Vos factures éventuelles resteront inchangées."
        confirmLabel="Oui, supprimer le devis"
        cancelLabel="Annuler"
        type="danger"
        icon={<Trash2 className="w-7 h-7 text-rose-600" />}
      />

      {/* Modale d'Authentification & Gestion des Rôles (Supabase Auth & Fast Switch) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={userProfile}
        onSelectUser={handleSelectUser}
        onToast={showToast}
        teamMembers={teamMembers}
      />
    </div>
  );
}

