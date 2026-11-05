"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Moon,
  Sun,
  Monitor,
  Check,
  Building2,
  User,
  Users,
  Shield,
  Bell,
  Sliders,
  FileText,
  CreditCard,
  Database,
  Lock,
  Key,
  Download,
  Upload,
  RefreshCw,
  Copy,
  ExternalLink,
  Save,
  Volume2,
  Sparkles,
  Smartphone,
  Mail,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Palette,
  Eye,
  Trash2,
  QrCode,
  ShieldCheck,
  Clock,
  HelpCircle,
  Laptop,
  CheckCheck,
  DollarSign,
  Wallet,
  Send,
  FileCheck,
  Landmark,
  Globe,
  Activity,
  CheckSquare,
  ArrowLeftRight,
  Plus,
  History,
} from "lucide-react";
import { formatFCFA, formatAmount, getCurrencySymbol } from "@/lib/mock-data";
import { createTeamMember, deleteTeamMember } from "@/lib/supabaseService";

export default function SettingsView({
  companyInfo = {},
  setCompanyInfo,
  userProfile = {},
  setUserProfile,
  teamMembers: propTeamMembers = null,
  setTeamMembers: propSetTeamMembers = null,
  invoices = [],
  quotes = [],
  clients = [],
  payments = [],
  onToast,
  onResetAllData,
  onApplyTheme,
  currentTheme = "light",
}) {
  // Navigation entre les 8 sous-onglets des paramètres
  const [activeSettingsTab, setActiveSettingsTab] = useState("appearance");
  const [copiedKey, setCopiedKey] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Logo file input ref
  const logoInputRef = useRef(null);
  const backupInputRef = useRef(null);

  // État local des paramètres complets de l'application FacturX
  const [settings, setSettings] = useState(() => {
    const defaultSettings = {
      // 1. Thème & Apparence
      theme: currentTheme || "light",
      accentColor: "#2563EB", // Bleu Royal
      density: "comfortable",
      animationsEnabled: true,
      highContrast: false,

      // 2. Facturation, Fiscalité & Multi-devises
      defaultCurrency: "FC",
      currencyFullName: "Franc Congolais (CDF / FC)",
      multiCurrencyEnabled: true,
      usdExchangeRate: 2850,
      eurExchangeRate: 3100,
      cfaExchangeRate: 4.35,
      defaultVatRate: 0.16,
      withholdingTaxEnabled: true,
      withholdingTaxRate: 0.02, // 2% retenue à la source standard
      taxRegime: "reel_normal", // 'reel_normal' | 'reel_simplifie' | 'forfait'
      invoicePrefix: "FAC-2026-",
      quotePrefix: "DEV-2026-",
      receiptPrefix: "REC-2026-",
      defaultPaymentTerms: "30_days",
      latePenaltyRate: 12,
      earlyDiscountRate: 2,
      defaultLegalNotes:
        "Facture payable par virement bancaire ou Mobile Money selon les coordonnées ci-dessous. En cas de retard de paiement, une indemnité forfaitaire pour frais de recouvrement de 40 000 FC sera appliquée conformément au droit commercial OHADA en vigueur.",

      // 3. Passerelles & Moyens de Paiement
      enableMpesa: true,
      mpesaShortcode: "892014",
      enableOrangeMoney: true,
      orangeMerchantId: "OM-CD-44210",
      enableAirtelMoney: true,
      airtelMerchantId: "AM-882190",
      enableWave: true,
      waveAccountId: "+243 99 820 40 50",
      enableCardPayments: true,
      paymentLinkAutoGenerate: true,

      // 4. Notifications & Recouvrement
      enableOverdueAlerts: true,
      autoReminderBeforeDue: true, // J-3
      autoReminderFirstOverdue: true, // J+7
      autoReminderSecondOverdue: true, // J+15
      emailNotifications: true,
      whatsappAlerts: true,
      soundOnPayment: true,
      weeklyDigest: true,

      // 5. Studio Templates d'Emails & WhatsApp
      activeTemplateTab: "invoice_sent",
      templateInvoiceSent:
        "Bonjour {nom_client},\n\nVeuillez trouver ci-joint votre facture {numero_facture} d'un montant de {montant_total} émise par {nom_entreprise}.\nDate d'échéance : {date_echeance}.\n\nVous pouvez régler instantanément via ce lien sécurisé : {lien_paiement}\n\nCordialement,\n{nom_entreprise}",
      templateReminderDue:
        "Bonjour {nom_client},\n\nRappel amical : la facture {numero_facture} ({montant_total}) arrive à échéance le {date_echeance}.\nLien de règlement rapide : {lien_paiement}\n\nMerci de votre confiance.",
      templateOverdue:
        "URGENT - Facture en retard {numero_facture}\n\nBonjour {nom_client},\nSauf erreur de notre part, votre facture de {montant_total} échue le {date_echeance} reste impayée. Merci de régulariser sous 48h.\nLien : {lien_paiement}",

      // 6. Documents PDF
      pdfTemplate: "elegance", // 'elegance' | 'modern' | 'corporate'
      showBankDetailsOnPdf: true,
      showMobileMoneyOnPdf: true,
      showStampOnPdf: true,
      includeQrCodeOnPdf: true,
      documentLogoUrl: null,

      // 7. Sécurité & Authentification
      twoFactorAuth: false,
      sessionTimeout: "30_min",
      requirePasswordOnExport: true,

      // 8. Développeur / API & Webhook
      apiKey: "fk_live_8f3d10ab7c42e99d14a601be5c7891",
      webhookUrl: "https://api.facturx.africa/v1/webhooks/paiements",
      sandboxMode: false,
    };

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("facturx_settings_v3");
        if (saved) {
          return { ...defaultSettings, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.error("Erreur lecture settings:", e);
      }
    }
    return defaultSettings;
  });

  // Profil Administrateur
  const [profileForm, setProfileForm] = useState({
    fullName: userProfile?.fullName || "Koyinsola Adeyemi",
    email: userProfile?.email || "koyinsola@facturx.africa",
    role: userProfile?.role || "Head Admin",
    phone: userProfile?.phone || "+243 81 000 40 50",
  });

  // Équipe & Collaborateurs
  const [localTeamMembers, setLocalTeamMembers] = useState([
    {
      id: "admin-1",
      name: "Koyinsola Adeyemi",
      email: "koyinsola@facturx.africa",
      role: "admin",
      badge: "Propriétaire",
      status: "Actif",
      initials: "KA",
      lastLogin: "Aujourd'hui à 22:40",
    },
    {
      id: "comptable-2",
      name: "Marcelle Tshimanga",
      email: "marcelle.t@horizon-groupe.cd",
      role: "comptable",
      badge: "Comptabilité",
      status: "Actif",
      initials: "MT",
      lastLogin: "Hier à 18:15",
    },
    {
      id: "commercial-3",
      name: "Patrick Bakari",
      email: "patrick.b@horizon-groupe.cd",
      role: "commercial",
      badge: "Commercial",
      status: "Actif",
      initials: "PB",
      lastLogin: "Il y a 3 jours",
    },
    {
      id: "audit-4",
      name: "Cabinet Audit KPMG RDC",
      email: "audit-externe@kpmg.cd",
      role: "comptable",
      badge: "Lecture Seule",
      status: "Invité",
      initials: "KP",
      lastLogin: "15/10/2026",
    },
  ]);

  const teamMembers = (propTeamMembers && propTeamMembers.length > 0) ? propTeamMembers : localTeamMembers;
  const setTeamMembers = propSetTeamMembers || setLocalTeamMembers;

  // Nouveau membre modal form
  const [newMemberForm, setNewMemberForm] = useState({
    name: "",
    email: "",
    role: "Responsable Comptable",
  });

  // Journal d'audit d'activité (Audit Trail de conformité)
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      timestamp: "Aujourd'hui à 22:35",
      user: "Koyinsola Adeyemi",
      action: "Modification du thème d'affichage",
      details: "Bascule en Mode Sombre",
      badge: "Interface",
    },
    {
      id: 2,
      timestamp: "Aujourd'hui à 21:14",
      user: "Marcelle Tshimanga",
      action: "Validation de paiement bancaire",
      details: "18 500 000 FC enregistrés sur FAC-2026-0042",
      badge: "Finances",
    },
    {
      id: 3,
      timestamp: "Hier à 17:42",
      user: "Patrick Bakari",
      action: "Conversion de devis en facture",
      details: "DEV-2026-0019 -> FAC-2026-0089",
      badge: "Ventes",
    },
    {
      id: 4,
      timestamp: "21/10/2026 à 14:00",
      user: "Koyinsola Adeyemi",
      action: "Export comptable certifié",
      details: "Téléchargement de la balance mensuelle Excel",
      badge: "Audit",
    },
  ]);

  // Simulateur convertisseur interactif en temps réel
  const [convertAmount, setConvertAmount] = useState(1000);
  const [convertFrom, setConvertFrom] = useState("USD");

  // Mot de passe
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Thème switch
  const handleThemeChange = (newTheme) => {
    const updated = { ...settings, theme: newTheme };
    setSettings(updated);
    if (onApplyTheme) onApplyTheme(newTheme);
    try {
      localStorage.setItem("facturx_settings_v3", JSON.stringify(updated));
      localStorage.setItem("facturx_theme", newTheme);
    } catch (e) {
      console.error(e);
    }
    if (onToast) {
      onToast(
        `Thème basculé en mode ${newTheme === "dark" ? "Sombre" : newTheme === "light" ? "Clair" : "Automatique (Système)"} !`,
        "success"
      );
    }
  };

  // Changement de couleur d'accentuation
  const handleAccentChange = (hex) => {
    const updated = { ...settings, accentColor: hex };
    setSettings(updated);
    try {
      localStorage.setItem("facturx_settings_v3", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (onToast) onToast("Couleur d'accentuation mise à jour !", "info");
  };

  // Test du synthétiseur sonore Web Audio
  const playPaymentSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);

      if (onToast) onToast("Carillon sonore de paiement joué avec succès !", "info");
    } catch (err) {
      console.error(err);
    }
  };

  // Sauvegarder l'intégralité des paramètres
  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      try {
        localStorage.setItem("facturx_settings_v3", JSON.stringify(settings));
        if (setUserProfile) {
          const newProfile = { ...userProfile, ...profileForm };
          setUserProfile(newProfile);
          localStorage.setItem("facturx_user_profile_v3", JSON.stringify(newProfile));
        }
        setIsSaving(false);
        if (onToast) onToast("Tous les paramètres ont été enregistrés avec succès !", "success");
      } catch (e) {
        setIsSaving(false);
        if (onToast) onToast("Erreur lors de la sauvegarde locale.", "error");
      }
    }, 400);
  };

  // Export complet de sauvegarde JSON
  const handleExportFullBackup = () => {
    try {
      const fullData = {
        meta: {
          app: "FacturX",
          version: "1.0-Pro",
          exportedAt: new Date().toISOString(),
          author: profileForm.fullName,
        },
        settings,
        companyInfo,
        userProfile: profileForm,
        teamMembers,
        invoices,
        quotes,
        clients,
        payments,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `facturx_sauvegarde_complete_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      if (onToast) onToast("Archive complète FacturX exportée en JSON !", "success");
    } catch (e) {
      if (onToast) onToast("Échec de la génération de sauvegarde.", "error");
    }
  };

  // Import de sauvegarde JSON sécurisé et complet
  const handleImportBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1. Limite de taille : 5 Mo max
    if (file.size > 5 * 1024 * 1024) {
      if (onToast) onToast("Fichier de sauvegarde trop volumineux (maximum 5 Mo).", "error");
      event.target.value = "";
      return;
    }

    // 2. Confirmation explicite avant écrasement
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Attention : la restauration remplacera vos données actuelles par celles du fichier JSON. Voulez-vous continuer ?"
      )
    ) {
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // 3. Parse sécurisé filtrant la pollution de prototype (__proto__, constructor, prototype)
        const content = JSON.parse(String(e.target?.result || ""), (key, val) =>
          key === "__proto__" || key === "constructor" || key === "prototype" ? undefined : val
        );

        if (!content || typeof content !== "object" || Array.isArray(content)) {
          throw new Error("Format de sauvegarde invalide.");
        }

        // 4. Copie de secours automatique de l'état précédent avant écrasement
        try {
          localStorage.setItem(
            "facturx_pre_restore_backup_v3",
            JSON.stringify({
              timestamp: new Date().toISOString(),
              invoices: localStorage.getItem("facturx_invoices_v3"),
              clients: localStorage.getItem("facturx_clients_v3"),
              quotes: localStorage.getItem("facturx_quotes_v3"),
              payments: localStorage.getItem("facturx_payments_v3"),
              companyInfo: localStorage.getItem("facturx_company_info_v3"),
            })
          );
        } catch (_) {}

        // 5. Restauration complète des entités financières et paramètres
        if (Array.isArray(content.invoices)) {
          localStorage.setItem("facturx_invoices_v3", JSON.stringify(content.invoices));
        }
        if (Array.isArray(content.quotes)) {
          localStorage.setItem("facturx_quotes_v3", JSON.stringify(content.quotes));
        }
        if (Array.isArray(content.clients)) {
          localStorage.setItem("facturx_clients_v3", JSON.stringify(content.clients));
        }
        if (Array.isArray(content.payments)) {
          localStorage.setItem("facturx_payments_v3", JSON.stringify(content.payments));
        }
        if (content.settings && typeof content.settings === "object") {
          setSettings(content.settings);
          localStorage.setItem("facturx_settings_v3", JSON.stringify(content.settings));
          if (content.settings.theme && onApplyTheme) {
            onApplyTheme(content.settings.theme);
          }
        }
        if (content.companyInfo && typeof content.companyInfo === "object" && setCompanyInfo) {
          // Vérifier que logoUrl est uniquement une image bitmap sûre (PNG/JPEG/WebP)
          if (
            content.companyInfo.logoUrl &&
            !/^data:image\/(png|jpeg|jpg|webp);base64,/.test(String(content.companyInfo.logoUrl))
          ) {
            content.companyInfo.logoUrl = null;
          }
          setCompanyInfo(content.companyInfo);
          localStorage.setItem("facturx_company_info_v3", JSON.stringify(content.companyInfo));
        }
        if (content.userProfile && typeof content.userProfile === "object" && setUserProfile) {
          setUserProfile(content.userProfile);
          setProfileForm(content.userProfile);
          localStorage.setItem("facturx_user_profile_v3", JSON.stringify(content.userProfile));
        }
        if (onToast) onToast("Sauvegarde importée et restaurée avec succès ! Rechargement...", "success");
        setTimeout(() => {
          if (typeof window !== "undefined") window.location.reload();
        }, 800);
      } catch (err) {
        if (onToast) onToast("Fichier JSON de sauvegarde corrompu ou invalide.", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Copier la clé API
  const handleCopyApiKey = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(settings.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      if (onToast) onToast("Clé d'API secrète copiée !", "success");
    }
  };

  // Ajouter un collaborateur à l'équipe avec synchronisation Supabase
  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.email) {
      if (onToast) onToast("Veuillez renseigner le nom et l'email du membre.", "error");
      return;
    }
    const initials = newMemberForm.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // Déterminer le rôle normalisé
    const roleSlug = newMemberForm.role.includes("Admin")
      ? "admin"
      : newMemberForm.role.includes("Comptable")
      ? "comptable"
      : newMemberForm.role.includes("Stock")
      ? "gestionnaire_stock"
      : "commercial";

    const roleBadge =
      roleSlug === "admin"
        ? "Propriétaire"
        : roleSlug === "comptable"
        ? "Comptabilité"
        : roleSlug === "commercial"
        ? "Commercial"
        : "Gestionnaire Stock";

    try {
      const created = await createTeamMember({
        name: newMemberForm.name,
        email: newMemberForm.email,
        role: roleSlug,
        badge: roleBadge,
        initials,
        status: "Invité",
      });

      setTeamMembers([...teamMembers, created]);
      setShowInviteModal(false);
      setNewMemberForm({ name: "", email: "", role: "Responsable Comptable" });
      if (onToast) onToast(`Collaborateur ${newMemberForm.name} ajouté sur Supabase !`, "success");
    } catch (err) {
      console.warn("Ajout Supabase teamMember:", err);
      const newMember = {
        id: Date.now().toString(),
        name: newMemberForm.name,
        email: newMemberForm.email,
        role: roleSlug,
        badge: roleBadge,
        status: "Invité",
        initials,
        lastLogin: "Jamais connecté",
      };
      setTeamMembers([...teamMembers, newMember]);
      setShowInviteModal(false);
      setNewMemberForm({ name: "", email: "", role: "Responsable Comptable" });
      if (onToast) onToast(`Invitation créée pour ${newMember.email} !`, "success");
    }
  };

  // Révoquer un collaborateur de l'équipe
  const handleDeleteTeamMember = async (memberId, memberName) => {
    if (confirm(`Confirmez-vous la révocation des accès de ${memberName} ?`)) {
      try {
        await deleteTeamMember(memberId);
        setTeamMembers(teamMembers.filter((m) => m.id !== memberId));
        if (onToast) onToast(`Accès révoqué pour ${memberName} sur Supabase.`, "info");
      } catch (err) {
        setTeamMembers(teamMembers.filter((m) => m.id !== memberId));
        if (onToast) onToast(`Accès révoqué pour ${memberName}.`, "info");
      }
    }
  };

  // Palette de 5 nuances d'accentuation haute fidélité
  const accentPalettes = [
    { name: "Bleu Royal (Défaut)", hex: "#2563EB", bg: "bg-blue-600" },
    { name: "Émeraude FinTech", hex: "#059669", bg: "bg-emerald-600" },
    { name: "Violet Améthyste", hex: "#7C3AED", bg: "bg-purple-600" },
    { name: "Indigo Corporate", hex: "#4F46E5", bg: "bg-indigo-600" },
    { name: "Ambre Prestige", hex: "#D97706", bg: "bg-amber-600" },
  ];

  // Les 8 onglets professionnels de haut de gamme
  const tabs = [
    { id: "appearance", label: "Apparence & Thème", icon: Moon, desc: "Dark mode & immersion" },
    { id: "billing", label: "Fiscalité & Devises", icon: Landmark, desc: "TVA, OHADA & conversion" },
    { id: "gateways", label: "Passerelles & Paiement", icon: CreditCard, desc: "Mobile Money & Cartes" },
    { id: "notifications", label: "Relances & Alertes", icon: Bell, desc: "Recouvrement automatique" },
    { id: "templates", label: "Studio Messages", icon: MessageSquare, desc: "Templates WhatsApp & Emails" },
    { id: "pdf", label: "Design Documents", icon: Palette, desc: "Gabarits PDF & logo" },
    { id: "team", label: "Équipe & Accès", icon: Users, desc: "Rôles, RBAC & sécurité" },
    { id: "audit_data", label: "Audit & Sauvegardes", icon: Database, desc: "Traçabilité & exports" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Header principal haute fidélité */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Panneau d&apos;Administration Haute Fidélité
            </span>
            <span className="text-xs text-slate-400 font-medium">FacturX v1.0 Enterprise</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            Paramètres & Configuration Système
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Pilotez votre solution comptable : basculez en mode sombre, ajustez les règles fiscales OHADA, activez les passerelles Mobile Money et personnalisez vos modèles.
          </p>
        </div>

        {/* Boutons d'actions rapides en haut */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleExportFullBackup}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Sauvegarde (.JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? "Enregistrement..." : "Enregistrer les modifications"}</span>
          </button>
        </div>
      </div>

      {/* 2. Barre d'onglets professionnelle */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200/80">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSettingsTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Contenu de chaque onglet */}

      {/* ==================== ONGLET 1 : APPARENCE & THÈME (MODE SOMBRE & CLAIR) ==================== */}
      {activeSettingsTab === "appearance" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" />
                Thème Visuel & Immersion Graphique
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Basculez entre le Mode Sombre cinématique (Navy / Obsidienne) et le Mode Clair certifié FacturX.
              </p>
            </div>

            {/* Grille des 3 modes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Mode Clair */}
              <div
                onClick={() => handleThemeChange("light")}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between h-48 group ${
                  settings.theme === "light"
                    ? "border-blue-600 bg-blue-50/20 ring-4 ring-blue-500/10 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                      <Sun className="w-5 h-5" />
                    </div>
                    {settings.theme === "light" && (
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-4">Mode Clair</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Surfaces nettes, fond #F6F8FC éclatant, lisibilité maximale en journée et contraste précis.
                  </p>
                </div>
                <div className="h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center px-2 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <div className="w-12 h-1.5 rounded-full bg-slate-300" />
                </div>
              </div>

              {/* Mode Sombre */}
              <div
                onClick={() => handleThemeChange("dark")}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between h-48 group ${
                  settings.theme === "dark"
                    ? "border-blue-500 bg-slate-900 ring-4 ring-blue-500/20 text-white shadow-lg"
                    : "border-slate-800 bg-[#0B132B] text-slate-200 hover:border-blue-400"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center shadow-xs">
                      <Moon className="w-5 h-5" />
                    </div>
                    {settings.theme === "dark" && (
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-sm text-white mt-4">Mode Sombre</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Noir profond Obsidienne & Navy (#0B132B), réduit la fatigue oculaire et sublime les indicateurs.
                  </p>
                </div>
                <div className="h-6 rounded-lg bg-[#111C44] border border-[#2B3674] flex items-center px-2 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <div className="w-12 h-1.5 rounded-full bg-slate-600" />
                </div>
              </div>

              {/* Automatique / Système */}
              <div
                onClick={() => handleThemeChange("system")}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between h-48 group ${
                  settings.theme === "system"
                    ? "border-blue-600 bg-blue-50/20 ring-4 ring-blue-500/10 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-xs">
                      <Monitor className="w-5 h-5" />
                    </div>
                    {settings.theme === "system" && (
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-4">Système Automatique</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    S&apos;aligne instantanément sur les préférences de votre système d&apos;exploitation.
                  </p>
                </div>
                <div className="h-6 rounded-lg bg-gradient-to-r from-slate-200 to-slate-800 flex items-center px-2 justify-between">
                  <span className="text-[9px] font-bold text-slate-700">Jour</span>
                  <span className="text-[9px] font-bold text-slate-300">Nuit</span>
                </div>
              </div>
            </div>

            {/* Nuances d'accentuation */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Couleur d&apos;Accentuation Principale
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                {accentPalettes.map((acc) => (
                  <button
                    key={acc.hex}
                    type="button"
                    onClick={() => handleAccentChange(acc.hex)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      settings.accentColor === acc.hex
                        ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 shadow-2xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${acc.bg}`} />
                    <span>{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Densité & Animations */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                  Densité d&apos;affichage des tableaux
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, density: "comfortable" })}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      settings.density === "comfortable"
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Aéré (Recommandé)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, density: "compact" })}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      settings.density === "compact"
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Compact (Dense)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                  Micro-Animations & Fluidité 60fps
                </label>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">Transitions d&apos;interface</p>
                    <p className="text-[11px] text-slate-500">Désactiver pour un rendu instantané</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.animationsEnabled}
                    onChange={(e) => setSettings({ ...settings, animationsEnabled: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ONGLET 2 : FISCALITÉ, DEVISES & CONVERSION EN DIRECT ==================== */}
      {activeSettingsTab === "billing" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-600" />
                Règles Fiscales OHADA & Gestion Multi-Devises
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Configurez les taux légaux de TVA, la retenue à la source, le régime fiscal de l&apos;entreprise et les taux de change en direct.
              </p>
            </div>

            {/* Ligne 1 : Devise, TVA, Retenue */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                  Devise de référence principale
                </label>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => {
                    const val = e.target.value;
                    let fullName = "Franc Congolais (CDF / FC)";
                    if (val === "FCFA") fullName = "Franc CFA (XOF / XAF)";
                    if (val === "€") fullName = "Euro (EUR / €)";
                    if (val === "$") fullName = "Dollar Américain (USD / $)";
                    setSettings({ ...settings, defaultCurrency: val, currencyFullName: fullName });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                >
                  <option value="FC">Franc Congolais — CDF / FC (RDC)</option>
                  <option value="FCFA">Franc CFA — XOF / XAF (UEMOA / CEMAC)</option>
                  <option value="€">Euro — EUR (€)</option>
                  <option value="$">Dollar US — USD ($)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                  Taux de TVA Standard
                </label>
                <select
                  value={settings.defaultVatRate}
                  onChange={(e) => setSettings({ ...settings, defaultVatRate: parseFloat(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                >
                  <option value={0.16}>16% — RDC DGI (Kinshasa / OHADA)</option>
                  <option value={0.18}>18% — UEMOA (Sénégal, Côte d&apos;Ivoire)</option>
                  <option value={0.20}>20% — France / International</option>
                  <option value={0.0}>0% — Régime Exonéré</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                  Retenue à la Source (Withholding Tax)
                </label>
                <select
                  value={settings.withholdingTaxRate}
                  onChange={(e) => setSettings({ ...settings, withholdingTaxRate: parseFloat(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                >
                  <option value={0.02}>2% — Retenue standard prestations B2B</option>
                  <option value={0.05}>5% — Retenue marchés publics</option>
                  <option value={0.10}>10% — Retenue honoraires non-résidents</option>
                  <option value={0.0}>0% — Aucune retenue automatique</option>
                </select>
              </div>
            </div>

            {/* Convertisseur interactif en temps réel */}
            <div className="p-5 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl border border-blue-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                  Simulateur de Change en Temps Réel
                </span>
                <span className="text-[11px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                  Taux BCEAO / BCC Actifs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Montant à convertir</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={convertAmount}
                      onChange={(e) => setConvertAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-extrabold text-slate-900"
                    />
                    <select
                      value={convertFrom}
                      onChange={(e) => setConvertFrom(e.target.value)}
                      className="px-2 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                {/* Résultat CDF */}
                <div className="p-3 bg-white rounded-xl border border-blue-200/80 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Équivalent en Franc Congolais</span>
                  <span className="text-base font-extrabold text-blue-700">
                    {formatAmount(
                      convertFrom === "USD"
                        ? convertAmount * settings.usdExchangeRate
                        : convertAmount * settings.eurExchangeRate,
                      "FC"
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Taux : 1 {convertFrom} = {convertFrom === "USD" ? settings.usdExchangeRate : settings.eurExchangeRate} FC
                  </span>
                </div>

                {/* Résultat FCFA */}
                <div className="p-3 bg-white rounded-xl border border-blue-200/80 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Équivalent en Franc CFA</span>
                  <span className="text-base font-extrabold text-emerald-600">
                    {formatAmount(
                      convertFrom === "USD"
                        ? Math.round(convertAmount * 605)
                        : Math.round(convertAmount * 655.957),
                      "FCFA"
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Taux : 1 {convertFrom} = {convertFrom === "USD" ? "605 FCFA" : "655,957 FCFA (Fixe)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Délais & Préfixes */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Préfixe Factures</label>
                <input
                  type="text"
                  value={settings.invoicePrefix}
                  onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Préfixe Devis</label>
                <input
                  type="text"
                  value={settings.quotePrefix}
                  onChange={(e) => setSettings({ ...settings, quotePrefix: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Délai par défaut</label>
                <select
                  value={settings.defaultPaymentTerms}
                  onChange={(e) => setSettings({ ...settings, defaultPaymentTerms: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                >
                  <option value="immediate">Comptant à réception</option>
                  <option value="15_days">15 jours nets</option>
                  <option value="30_days">30 jours nets</option>
                  <option value="60_days">60 jours nets</option>
                </select>
              </div>
            </div>

            {/* Mentions légales */}
            <div className="pt-4 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                Mentions Légales & Pénalités OHADA (Pied de Page)
              </label>
              <textarea
                rows={3}
                value={settings.defaultLegalNotes}
                onChange={(e) => setSettings({ ...settings, defaultLegalNotes: e.target.value })}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 leading-relaxed outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== ONGLET 3 : PASSERELLES & PAIEMENTS MOBILE MONEY ==================== */}
      {activeSettingsTab === "gateways" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Passerelles de Paiement & Mobile Money Direct
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Activez les règlements instantanés par M-Pesa, Orange Money, Airtel Money, Wave ou Carte Bancaire directement depuis les factures.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* M-Pesa Vodacom */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-extrabold flex items-center justify-center text-xs">
                      M-Pesa
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">M-Pesa Vodacom (RDC)</h4>
                      <p className="text-xs text-slate-500">Paiement instantané C2B / Push USSD</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableMpesa}
                    onChange={(e) => setSettings({ ...settings, enableMpesa: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                </div>
                {settings.enableMpesa && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="text-[11px] text-slate-500 block mb-1">Code Marchand / Shortcode</label>
                    <input
                      type="text"
                      value={settings.mpesaShortcode}
                      onChange={(e) => setSettings({ ...settings, mpesaShortcode: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Orange Money */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-extrabold flex items-center justify-center text-xs">
                      Orange
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Orange Money</h4>
                      <p className="text-xs text-slate-500">QR Code marchand & débit direct</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableOrangeMoney}
                    onChange={(e) => setSettings({ ...settings, enableOrangeMoney: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                </div>
                {settings.enableOrangeMoney && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="text-[11px] text-slate-500 block mb-1">ID Marchand Orange Money</label>
                    <input
                      type="text"
                      value={settings.orangeMerchantId}
                      onChange={(e) => setSettings({ ...settings, orangeMerchantId: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Airtel Money */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-extrabold flex items-center justify-center text-xs">
                      Airtel
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Airtel Money</h4>
                      <p className="text-xs text-slate-500">Règlement en FC et USD</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableAirtelMoney}
                    onChange={(e) => setSettings({ ...settings, enableAirtelMoney: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                </div>
                {settings.enableAirtelMoney && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="text-[11px] text-slate-500 block mb-1">Code Marchand Airtel</label>
                    <input
                      type="text"
                      value={settings.airtelMerchantId}
                      onChange={(e) => setSettings({ ...settings, airtelMerchantId: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Wave & Cartes */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white font-extrabold flex items-center justify-center text-xs">
                      Wave
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Wave & Cartes Bancaires</h4>
                      <p className="text-xs text-slate-500">Visa / Mastercard & Wave 0% frais</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableWave}
                    onChange={(e) => setSettings({ ...settings, enableWave: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                </div>
                {settings.enableWave && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="text-[11px] text-slate-500 block mb-1">Numéro Wave Récepteur</label>
                    <input
                      type="text"
                      value={settings.waveAccountId}
                      onChange={(e) => setSettings({ ...settings, waveAccountId: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Option lien 1 clic */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Générer un lien de paiement sécurisé sur chaque facture</h4>
                  <p className="text-[11px] text-emerald-800">Le client clique et règle par Mobile Money sans quitter son téléphone.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.paymentLinkAutoGenerate}
                onChange={(e) => setSettings({ ...settings, paymentLinkAutoGenerate: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== ONGLET 4 : NOTIFICATIONS & RELANCES ==================== */}
      {activeSettingsTab === "notifications" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Automatisations de Recouvrement & Alertes
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Pilotez vos relances automatiques et testez les retours sonores lors des paiements enregistrés.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    J-3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Rappel Préventif de Courtoisie</h4>
                    <p className="text-xs text-slate-500">Envoyé 3 jours avant la date d&apos;échéance avec lien direct de paiement.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoReminderBeforeDue}
                  onChange={(e) => setSettings({ ...settings, autoReminderBeforeDue: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    J+7
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Première Relance Amiable de Retard</h4>
                    <p className="text-xs text-slate-500">Envoyée 7 jours après échéance dépassée.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoReminderFirstOverdue}
                  onChange={(e) => setSettings({ ...settings, autoReminderFirstOverdue: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                    J+15
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Mise en Demeure & Application des Pénalités</h4>
                    <p className="text-xs text-slate-500">Notification formelle avec calcul automatique des intérêts légaux.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoReminderSecondOverdue}
                  onChange={(e) => setSettings({ ...settings, autoReminderSecondOverdue: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Test Sonore & Synthétiseur */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    Son lors d&apos;un encaissement réussi
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.soundOnPayment}
                    onChange={(e) => setSettings({ ...settings, soundOnPayment: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={playPaymentSound}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tester le carillon de paiement</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Alertes WhatsApp Business & SMS
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.whatsappAlerts}
                    onChange={(e) => setSettings({ ...settings, whatsappAlerts: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Envoie automatiquement un message WhatsApp au contact financier du client.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ONGLET 5 : STUDIO TEMPLATES MESSAGES ==================== */}
      {activeSettingsTab === "templates" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Studio de Personnalisation des Modèles de Messages
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Personnalisez le texte des messages envoyés par Email et WhatsApp avec insertion dynamique de variables.
              </p>
            </div>

            {/* Sélecteur de scénario */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, activeTemplateTab: "invoice_sent" })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  settings.activeTemplateTab === "invoice_sent"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                1. Envoi Initial de Facture
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, activeTemplateTab: "reminder_due" })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  settings.activeTemplateTab === "reminder_due"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                2. Rappel Amiable (J-3)
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, activeTemplateTab: "overdue" })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  settings.activeTemplateTab === "overdue"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                3. Relance Échéance Dépassée
              </button>
            </div>

            {/* Éditeur et simulateur d'aperçu côte à côte */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Éditeur avec tags */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                  Texte du Message Personnalisé
                </label>
                <textarea
                  rows={8}
                  value={
                    settings.activeTemplateTab === "invoice_sent"
                      ? settings.templateInvoiceSent
                      : settings.activeTemplateTab === "reminder_due"
                      ? settings.templateReminderDue
                      : settings.templateOverdue
                  }
                  onChange={(e) => {
                    const text = e.target.value;
                    if (settings.activeTemplateTab === "invoice_sent") {
                      setSettings({ ...settings, templateInvoiceSent: text });
                    } else if (settings.activeTemplateTab === "reminder_due") {
                      setSettings({ ...settings, templateReminderDue: text });
                    } else {
                      setSettings({ ...settings, templateOverdue: text });
                    }
                  }}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-sans text-slate-800 leading-relaxed outline-none"
                />

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Variables disponibles à copier :</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["{nom_client}", "{numero_facture}", "{montant_total}", "{date_echeance}", "{lien_paiement}", "{nom_entreprise}"].map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-mono font-bold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Aperçu Bulle Smartphone */}
              <div className="p-5 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Aperçu Direct du Rendu Client (WhatsApp / SMS)
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div className="my-auto py-3">
                  <div className="bg-emerald-600 text-white p-4 rounded-2xl rounded-tl-xs shadow-md space-y-2 text-xs leading-relaxed max-w-sm">
                    <p className="whitespace-pre-line">
                      {(settings.activeTemplateTab === "invoice_sent"
                        ? settings.templateInvoiceSent
                        : settings.activeTemplateTab === "reminder_due"
                        ? settings.templateReminderDue
                        : settings.templateOverdue
                      )
                        .replace("{nom_client}", "Rawbank SA")
                        .replace("{numero_facture}", "FAC-2026-0042")
                        .replace("{montant_total}", "18 500 000 FC")
                        .replace("{date_echeance}", "21/11/2026")
                        .replace("{lien_paiement}", "https://pay.facturx.cd/fac-0042")
                        .replace("{nom_entreprise}", companyInfo.name || "HORIZON GROUPE")}
                    </p>
                    <div className="text-[9px] text-emerald-100 text-right flex items-center justify-end gap-1">
                      <span>22:42</span>
                      <CheckCheck className="w-3 h-3 text-cyan-200" />
                    </div>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 text-center">
                  Formatage automatique avec emojis et liens cliquables
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ONGLET 6 : DESIGN DOCUMENTS PDF ==================== */}
      {activeSettingsTab === "pdf" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" />
                Mise en Page des Factures & Devis PDF
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Choisissez le gabarit officiel appliqué lors de l&apos;impression et du téléchargement de vos documents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setSettings({ ...settings, pdfTemplate: "elegance" })}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between h-44 ${
                  settings.pdfTemplate === "elegance"
                    ? "border-blue-600 bg-blue-50/20 ring-4 ring-blue-500/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                    Recommandé
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-3">Élégance B2B</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    En-tête bleu institutionnel, tableau clair et encadré total net en valeur.
                  </p>
                </div>
                <div className="h-4 bg-blue-600 rounded-sm w-full" />
              </div>

              <div
                onClick={() => setSettings({ ...settings, pdfTemplate: "modern" })}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between h-44 ${
                  settings.pdfTemplate === "modern"
                    ? "border-blue-600 bg-blue-50/20 ring-4 ring-blue-500/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    Épuré
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-3">Minimaliste Pro</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Design contemporain, bordures fines, impression optimisée faible encrage.
                  </p>
                </div>
                <div className="h-1 bg-slate-800 rounded-sm w-full" />
              </div>

              <div
                onClick={() => setSettings({ ...settings, pdfTemplate: "corporate" })}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between h-44 ${
                  settings.pdfTemplate === "corporate"
                    ? "border-blue-600 bg-blue-50/20 ring-4 ring-blue-500/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                    Fiscalité DGI
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-3">OHADA Corporate</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Double encadré légal avec NINEA, RCCM, Id. Nat et mentions bancaires complètes.
                  </p>
                </div>
                <div className="h-4 border-2 border-emerald-600 rounded-sm w-full" />
              </div>
            </div>

            {/* Inclusions */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <span className="text-xs font-bold text-slate-800">Afficher l&apos;IBAN / RIB Bancaire</span>
                <input
                  type="checkbox"
                  checked={settings.showBankDetailsOnPdf}
                  onChange={(e) => setSettings({ ...settings, showBankDetailsOnPdf: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <span className="text-xs font-bold text-slate-800">Afficher les numéros Mobile Money</span>
                <input
                  type="checkbox"
                  checked={settings.showMobileMoneyOnPdf}
                  onChange={(e) => setSettings({ ...settings, showMobileMoneyOnPdf: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <span className="text-xs font-bold text-slate-800">Apposer le Cachet & Signature Numérique</span>
                <input
                  type="checkbox"
                  checked={settings.showStampOnPdf}
                  onChange={(e) => setSettings({ ...settings, showStampOnPdf: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <span className="text-xs font-bold text-slate-800">Inclure le QR Code de certification de conformité</span>
                <input
                  type="checkbox"
                  checked={settings.includeQrCodeOnPdf}
                  onChange={(e) => setSettings({ ...settings, includeQrCodeOnPdf: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ONGLET 7 : ÉQUIPE, RÔLES & SÉCURITÉ ==================== */}
      {activeSettingsTab === "team" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Gestion de l&apos;Équipe & Permissions Collaboratives
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Attribuez les rôles comptables et sécurisez les accès à votre organisation FacturX.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Inviter un collaborateur</span>
              </button>
            </div>

            {/* Table des membres */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Membre</th>
                    <th className="p-3.5">Rôle</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5">Dernière Connexion</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs">
                            {member.initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{member.name}</p>
                            <p className="text-[11px] text-slate-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                          member.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : member.role === "comptable"
                            ? "bg-blue-100 text-blue-800"
                            : member.role === "commercial"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {member.role === "admin"
                            ? "Administrateur"
                            : member.role === "comptable"
                            ? "Comptable"
                            : member.role === "commercial"
                            ? "Commercial"
                            : "Gestionnaire Stock"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                          {member.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">{member.lastLogin}</td>
                      <td className="p-3.5 text-right">
                        {member.role !== "admin" ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteTeamMember(member.id, member.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Révoquer l'accès"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold italic">Propriétaire</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section Double Authentification */}
            <div className="pt-6 border-t border-slate-100 p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Double Authentification Obligatoire (2FA / OTP)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exiger un code TOTP temporaire pour tous les accès comptables.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextState = !settings.twoFactorAuth;
                  setSettings({ ...settings, twoFactorAuth: nextState });
                  if (nextState) setShowQrModal(true);
                  if (onToast) onToast(nextState ? "2FA activée avec succès !" : "2FA désactivée.", "info");
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settings.twoFactorAuth
                    ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                }`}
              >
                {settings.twoFactorAuth ? "Désactiver la 2FA" : "Activer la 2FA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ONGLET 8 : AUDIT, SAUVEGARDES & API ==================== */}
      {activeSettingsTab === "audit_data" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Journal d&apos;Audit & Sauvegardes Complètes
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Traçabilité anti-fraude des modifications, exports complets et clés d&apos;intégration pour vos systèmes ERP.
              </p>
            </div>

            {/* Sauvegarde & Restauration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-3">
                <h3 className="font-extrabold text-sm text-blue-950 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  Sauvegarde Complète Téléchargeable (.JSON)
                </h3>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Archive complète contenant {invoices.length} factures, {quotes.length} devis, {clients.length} clients, {payments.length} paiements et l&apos;intégralité de la configuration.
                </p>
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger l&apos;archive JSON</span>
                </button>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-700" />
                  Restaurer depuis un Fichier de Sauvegarde
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Importez un instantané pour recharger vos factures et préférences instantanément.
                </p>
                <input
                  type="file"
                  ref={backupInputRef}
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => backupInputRef.current?.click()}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Sélectionner le fichier JSON</span>
                </button>
              </div>
            </div>

            {/* Clé API & Webhook */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                Accès API & Webhooks ERP
              </h3>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  readOnly
                  value={settings.apiKey}
                  className="flex-1 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                />
                <button
                  type="button"
                  onClick={handleCopyApiKey}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? "Copié !" : "Copier"}</span>
                </button>
              </div>
            </div>

            {/* Journal d'audit traçabilité */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Journal d&apos;Audit & Traçabilité Anti-Fraude
                </h3>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Certifié Conforme
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3">Horodatage</th>
                      <th className="p-3">Utilisateur</th>
                      <th className="p-3">Action Comptable</th>
                      <th className="p-3">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono text-slate-500 text-[11px]">{log.timestamp}</td>
                        <td className="p-3 font-bold text-slate-800">{log.user}</td>
                        <td className="p-3 font-semibold text-blue-700">{log.action}</td>
                        <td className="p-3 text-slate-600">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Zone de Danger */}
            <div className="pt-6 border-t border-rose-100 p-5 bg-rose-50/40 rounded-2xl border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="font-extrabold text-sm">Zone d&apos;Administration Sensible</h4>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Remettre à zéro l&apos;application aux données initiales de démonstration.
              </p>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Réinitialiser aux Données d&apos;Usine</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INVITER UN MEMBRE */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Inviter un Collaborateur</h3>
                  <p className="text-xs text-slate-500">Ajoutez un accès à l&apos;espace FacturX</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddTeamMember} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Nom Complet
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Jean-Luc Mwamba"
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Adresse Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.cd"
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Rôle & Niveau d&apos;Accès
                </label>
                <select
                  value={newMemberForm.role}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                >
                  <option value="Administrateur">Administrateur (Tous droits)</option>
                  <option value="Responsable Comptable">Responsable Comptable (Factures & Paiements)</option>
                  <option value="Chargé d'Affaires & Devis">Commercial (Devis & Clients)</option>
                  <option value="Gestionnaire de Stock">Gestionnaire de Stock (Articles & Facturation)</option>
                  <option value="Auditeur Externe">Auditeur Externe (Lecture Seule)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Envoyer l&apos;invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QR CODE 2FA */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Scannez le QR Code 2FA</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ouvrez Google Authenticator ou Microsoft Authenticator et scannez ce code.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 w-48 h-48 mx-auto flex items-center justify-center">
              <div className="w-40 h-40 bg-slate-900 rounded-xl p-2 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-4 border-white rounded-sm bg-black" />
                  <div className="w-8 h-8 border-4 border-white rounded-sm bg-black" />
                </div>
                <div className="text-center font-mono text-[9px] text-white">FACTURX-2FA-SECURE</div>
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-4 border-white rounded-sm bg-black" />
                  <div className="w-4 h-4 bg-emerald-400 rounded-full mx-auto" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl text-xs font-mono text-slate-700">
              Clé manuelle : <span className="font-bold">FACT-9920-ABCD-8812</span>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              Terminer la configuration
            </button>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION RÉINITIALISATION */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Confirmer la Réinitialisation ?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Toutes vos modifications locales de paramètres et de données seront réinitialisées à leurs valeurs par défaut. Êtes-vous certain de vouloir continuer ?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  if (onResetAllData) {
                    onResetAllData();
                  } else {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Oui, Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
