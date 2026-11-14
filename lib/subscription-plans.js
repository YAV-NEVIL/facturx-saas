/**
 * CONFIGURATION OFFICIELLE DES OFFRES D'ABONNEMENT FACTURX SAAS
 * Offres : Free (0$), Starter (14$), Business (34$), Gold (Contactez-nous)
 */

export const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "Découverte & test de la facturation normalisée",
    priceMonthly: 0,
    priceYearly: 0,
    priceLabel: "0 $",
    periodLabel: "/ mois (Gratuit)",
    badge: "Offre Gratuite",
    isPopular: false,
    isEnterprise: false,
    ctaLabel: "Plan Gratuit Actif",
    limits: {
      maxInvoices: 3,
      maxQuotes: 3,
      maxEmployees: 1,
      allowReminders: false,
      allowEmployees: false,
      allowAdvancedSettings: false,
      allowDgiLiveMode: false,
      allowAdvancedExports: false,
    },
    features: [
      { label: "Génération de 3 factures maximum", included: true, highlight: true },
      { label: "Jusqu'à 3 devis & estimations", included: true },
      { label: "Facture normalisée DGI (Mode Simulation SFE)", included: true },
      { label: "1 seul utilisateur (Propriétaire uniquement)", included: true },
      { label: "Relances clients (WhatsApp, Email, SMS)", included: false },
      { label: "Inclusion d'employés & collaborateurs (RBAC)", included: false },
      { label: "Paramètres avancés & Passerelle DGI Live", included: false },
      { label: "Exports comptables OHADA avancés", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "Idéal pour les PME, commerces et consultants en croissance",
    priceMonthly: 14,
    priceYearly: 11,
    priceLabel: "14 $",
    periodLabel: "/ mois",
    badge: "Croissance PME",
    isPopular: false,
    isEnterprise: false,
    ctaLabel: "Passer à Starter (14 $)",
    limits: {
      maxInvoices: 100,
      maxQuotes: 100,
      maxEmployees: 3,
      allowReminders: true,
      allowEmployees: true,
      allowAdvancedSettings: true,
      allowDgiLiveMode: false,
      allowAdvancedExports: true,
    },
    features: [
      { label: "100 factures générées / mois", included: true, highlight: true },
      { label: "Jusqu'à 100 devis & conversion en 1 clic", included: true },
      { label: "Relances clients WhatsApp & Email activées", included: true, highlight: true },
      { label: "Jusqu'à 3 employés / collaborateurs inclus", included: true },
      { label: "Facture normalisée DGI RDC + QR Code PDF", included: true },
      { label: "Paramétrage complet (Logo, Banques & Mobile Money)", included: true },
      { label: "Exports Excel / CSV & Rapports financiers", included: true },
      { label: "Passerelle API DGI Live illimitée & Multi-équipes", included: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "Accès intégral sans aucune restriction pour piloter toute votre entreprise",
    priceMonthly: 34,
    priceYearly: 27,
    priceLabel: "34 $",
    periodLabel: "/ mois",
    badge: "Recommandé • Accès Total",
    isPopular: true,
    isEnterprise: false,
    ctaLabel: "Choisir Business (34 $)",
    limits: {
      maxInvoices: Infinity,
      maxQuotes: Infinity,
      maxEmployees: Infinity,
      allowReminders: true,
      allowEmployees: true,
      allowAdvancedSettings: true,
      allowDgiLiveMode: true,
      allowAdvancedExports: true,
    },
    features: [
      { label: "Factures & Devis 100 % illimités", included: true, highlight: true },
      { label: "Accès complet à toutes les fonctionnalités", included: true, highlight: true },
      { label: "Relances automatiques & multi-canal illimitées", included: true },
      { label: "Employés & collaborateurs RBAC illimités", included: true },
      { label: "Passerelle DGI RDC e-MCF (Sandbox + Production Live)", included: true },
      { label: "Tous les paramètres, thèmes & modèles débloqués", included: true },
      { label: "Rapports OHADA, Analytique & Trésorerie 90 jours", included: true },
      { label: "Mode Hors-Ligne PWA & Synchronisation prioritaire", included: true },
    ],
  },
  {
    id: "gold",
    name: "Gold",
    tagline: "Architecture sur mesure pour grandes entreprises, banques, mines & holdings",
    priceMonthly: null,
    priceYearly: null,
    priceLabel: "Sur mesure",
    periodLabel: "Contrat Entreprise",
    badge: "Grandes Entreprises",
    isPopular: false,
    isEnterprise: true,
    ctaLabel: "Contactez-nous",
    limits: {
      maxInvoices: Infinity,
      maxQuotes: Infinity,
      maxEmployees: Infinity,
      allowReminders: true,
      allowEmployees: true,
      allowAdvancedSettings: true,
      allowDgiLiveMode: true,
      allowAdvancedExports: true,
    },
    features: [
      { label: "Tout le plan Business inclus en illimité", included: true, highlight: true },
      { label: "Multi-sociétés & Multi-filiales (Holding)", included: true, highlight: true },
      { label: "Intégration ERP sur mesure (SAP, Odoo, Sage)", included: true },
      { label: "Serveur SFE / e-MCF DGI dédié & Audit fiscal", included: true },
      { label: "API REST dédiée & Webhooks temps réel", included: true },
      { label: "Gestionnaire de compte dédié & Support 24/7", included: true },
      { label: "Formation des équipes sur site (RDC / OHADA)", included: true },
      { label: "Contrat SLA garanti à 99,9 %", included: true },
    ],
  },
];

export function getPlanConfig(planId = "free") {
  const raw = String(planId || "free").toLowerCase().trim();
  const normalized = raw === "stargate" ? "starter" : raw;
  return (
    SUBSCRIPTION_PLANS.find((p) => p.id === normalized) || SUBSCRIPTION_PLANS[0]
  );
}

export function canCreateInvoice(planId = "free", currentInvoiceCount = 0) {
  const plan = getPlanConfig(planId);
  const max = plan.limits.maxInvoices;
  const allowed = currentInvoiceCount < max;
  return {
    allowed,
    max,
    current: currentInvoiceCount,
    remaining: max === Infinity ? Infinity : Math.max(0, max - currentInvoiceCount),
    plan,
  };
}

export function canSendReminder(planId = "free") {
  const plan = getPlanConfig(planId);
  return {
    allowed: Boolean(plan.limits.allowReminders),
    plan,
  };
}

export function canManageEmployees(planId = "free", currentEmployeeCount = 1) {
  const plan = getPlanConfig(planId);
  return {
    allowed: Boolean(plan.limits.allowEmployees),
    canAddMore:
      Boolean(plan.limits.allowEmployees) &&
      currentEmployeeCount < plan.limits.maxEmployees,
    max: plan.limits.maxEmployees,
    current: currentEmployeeCount,
    plan,
  };
}

export function canUseAdvancedSettings(planId = "free") {
  const plan = getPlanConfig(planId);
  return {
    allowed: Boolean(plan.limits.allowAdvancedSettings),
    allowDgiLiveMode: Boolean(plan.limits.allowDgiLiveMode),
    allowAdvancedExports: Boolean(plan.limits.allowAdvancedExports),
    plan,
  };
}

