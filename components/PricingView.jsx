"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Lock,
  Sparkles,
  ShieldCheck,
  Zap,
  Building2,
  Crown,
  CreditCard,
  Smartphone,
  ArrowRight,
  FileText,
  Users,
  Send,
  Settings,
  Check,
  Phone,
  Mail,
  MessageCircle,
  HelpCircle,
  AlertTriangle,
  Globe,
  X,
} from "lucide-react";
import { SUBSCRIPTION_PLANS, getPlanConfig } from "@/lib/subscription-plans";

export default function PricingView({
  currentPlanId = "free",
  billingCycle = "monthly",
  invoiceCount = 0,
  quoteCount = 0,
  employeeCount = 1,
  companyInfo = null,
  userProfile = null,
  onSelectPlan,
  onNavigate,
  onToast,
}) {
  const [selectedCycle, setSelectedCycle] = useState(billingCycle || "monthly");
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [paymentPhone, setPaymentPhone] = useState(companyInfo?.phone || "+243 ");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [isGoldContactOpen, setIsGoldContactOpen] = useState(false);
  const [goldForm, setGoldForm] = useState({
    companyName: companyInfo?.name || "",
    contactName: userProfile?.fullName || "",
    email: companyInfo?.email || userProfile?.email || "",
    phone: companyInfo?.phone || userProfile?.phone || "",
    employeesRange: "20 - 100 collaborateurs",
    needs: "Multi-sociétés, intégration ERP & serveur DGI e-MCF dédié",
  });

  const activePlan = getPlanConfig(currentPlanId);
  const normalizedCurrentPlanId = activePlan.id;
  const maxInvoices = activePlan.limits.maxInvoices;
  const invoiceUsagePercent =
    maxInvoices === Infinity
      ? 18
      : Math.min(100, Math.round((invoiceCount / maxInvoices) * 100));

  const handlePlanButtonClick = (plan) => {
    if (plan.id === normalizedCurrentPlanId) {
      if (onToast) {
        onToast(`Vous utilisez déjà l'offre ${plan.name}.`, "info");
      }
      return;
    }

    if (plan.id === "gold") {
      setIsGoldContactOpen(true);
      return;
    }

    if (plan.id === "free") {
      if (onSelectPlan) {
        onSelectPlan("free", selectedCycle);
      }
      return;
    }

    setCheckoutPlan(plan);
  };

  const handleConfirmSubscriptionPayment = async (e) => {
    e.preventDefault();
    if (!checkoutPlan) return;
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      if (onSelectPlan) {
        onSelectPlan(checkoutPlan.id, selectedCycle);
      }
      setCheckoutPlan(null);
    }, 900);
  };

  const handleGoldSubmit = (e) => {
    e.preventDefault();
    setIsGoldContactOpen(false);
    if (onToast) {
      onToast(
        `Votre demande pour l'offre Gold (${goldForm.companyName || "Entreprise"}) a été transmise à notre équipe Grands Comptes !`,
        "success"
      );
    }
  };

  const comparisonRows = [
    {
      feature: "Génération de factures normalisées DGI",
      free: "3 factures max",
      starter: "100 factures / mois",
      business: "Illimitées",
      gold: "Illimitées + Multi-filiales",
    },
    {
      feature: "Devis & Estimations commerciales",
      free: "3 devis max",
      starter: "100 devis / mois",
      business: "Illimités",
      gold: "Illimités",
    },
    {
      feature: "Relances clients (WhatsApp, Email, SMS)",
      free: false,
      starter: "WhatsApp & Email",
      business: "Illimitées (Tous canaux)",
      gold: "Illimitées + API dédiée",
    },
    {
      feature: "Employés & Collaborateurs (Accès RBAC)",
      free: false,
      starter: "Jusqu'à 3 employés",
      business: "Employés illimités",
      gold: "Illimités + SSO Entreprise",
    },
    {
      feature: "Paramètres avancés & Personnalisation",
      free: "Restreints",
      starter: "Débloqués",
      business: "Accès intégral (100 %)",
      gold: "Sur mesure + Marque blanche",
    },
    {
      feature: "Passerelle DGI RDC e-MCF (SFE + QR Code)",
      free: "Simulation SFE",
      starter: "SFE + PDF Certifié",
      business: "Sandbox + Production Live",
      gold: "Serveur e-MCF dédié sur site",
    },
    {
      feature: "Exports Comptables OHADA (Excel / CSV / PDF)",
      free: "PDF standard",
      starter: "PDF + Excel",
      business: "Complet (OHADA + FEC + JSON)",
      gold: "Connecteur ERP (SAP / Odoo / Sage)",
    },
    {
      feature: "Support & Accompagnement",
      free: "Documentation",
      starter: "Support Email & Chat",
      business: "Support Prioritaire 7j/7",
      gold: "Account Manager dédié 24/7 + SLA 99,9%",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-10">
      {/* 1. En-tête de la page Abonnements & Pricing */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-[#183BB0] border border-blue-200">
              <Sparkles className="w-3 h-3" />
              Plans & Tarification SaaS
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              Conforme DGI RDC & OHADA
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Abonnements & Tarifs FacturX
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl">
            Choisissez l&apos;offre adaptée à la taille de votre activité. Commencez gratuitement avec{" "}
            <strong>3 factures</strong>, évoluez vers <strong>Starter (14 $)</strong> ou débloquez l&apos;accès total avec{" "}
            <strong>Business (34 $)</strong>.
          </p>
        </div>

        {/* Sélecteur de facturation Mensuel / Annuel */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-xs self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setSelectedCycle("monthly")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              selectedCycle === "monthly"
                ? "bg-[#183BB0] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Facturation Mensuelle
          </button>
          <button
            type="button"
            onClick={() => setSelectedCycle("yearly")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCycle === "yearly"
                ? "bg-[#183BB0] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Annuel</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                selectedCycle === "yearly"
                  ? "bg-emerald-400/25 text-emerald-100"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* 2. Tableau de contrôle de consommation du forfait actif */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#183BB0] to-[#2D60FF] text-white flex items-center justify-center shadow-md shadow-blue-900/15 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Forfait Actuel de {companyInfo?.name || "votre entreprise"} :
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-[#183BB0] border border-blue-200">
                  Offre {activePlan.name} ({activePlan.priceLabel})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activePlan.tagline}
              </p>
            </div>
          </div>

          {currentPlanId === "free" && (
            <button
              type="button"
              onClick={() => handlePlanButtonClick(getPlanConfig("business"))}
              className="px-4 py-2.5 bg-gradient-to-r from-[#183BB0] to-[#2D60FF] hover:from-[#122F8C] hover:to-[#183BB0] text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-900/20 flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Débloquer tout avec Business (34 $)</span>
            </button>
          )}
        </div>

        {/* 4 Indicateurs de quotas & restrictions en direct */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {/* Quota Factures */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Quota Factures
              </span>
              <span
                className={`font-black ${
                  maxInvoices !== Infinity && invoiceCount >= maxInvoices
                    ? "text-rose-600"
                    : "text-slate-900"
                }`}
              >
                {invoiceCount} / {maxInvoices === Infinity ? "Illimité" : maxInvoices}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div
                style={{ width: `${invoiceUsagePercent}%` }}
                className={`h-full rounded-full transition-all ${
                  maxInvoices !== Infinity && invoiceCount >= maxInvoices
                    ? "bg-rose-600"
                    : "bg-[#183BB0]"
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {maxInvoices === Infinity
                ? "Émission illimitée de factures normalisées"
                : invoiceCount >= maxInvoices
                ? "Limite atteinte — Passez au plan supérieur"
                : `${Math.max(0, maxInvoices - invoiceCount)} facture(s) restante(s) sur ce plan`}
            </p>
          </div>

          {/* Statut Relances */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-amber-600" />
                Relances Clients
              </span>
              {activePlan.limits.allowReminders ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  Activées
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  <Lock className="w-3 h-3" />
                  Bloquées (Free)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {activePlan.limits.allowReminders
                ? "Relances WhatsApp, Email & SMS disponibles en 1 clic."
                : "Aucune relance autorisée dans l'offre Free. Passez à Starter (14 $) ou Business (34 $)."}
            </p>
          </div>

          {/* Statut Employés */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Employés & Équipe
              </span>
              {activePlan.limits.allowEmployees ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {employeeCount} /{" "}
                  {activePlan.limits.maxEmployees === Infinity
                    ? "Illimité"
                    : activePlan.limits.maxEmployees}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  <Lock className="w-3 h-3" />
                  Non inclus
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {activePlan.limits.allowEmployees
                ? activePlan.limits.maxEmployees === Infinity
                  ? "Ajout illimité de comptables, commerciaux et gestionnaires."
                  : `Jusqu'à ${activePlan.limits.maxEmployees} collaborateurs inclus.`
                : "Vous n'avez pas droit d'inclure des employés avec l'offre Free."}
            </p>
          </div>

          {/* Statut Paramètres */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-purple-600" />
                Paramètres & Options
              </span>
              {activePlan.limits.allowAdvancedSettings ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  Débloqués
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  <Lock className="w-3 h-3" />
                  Restreints
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {activePlan.limits.allowDgiLiveMode
                ? "Accès complet : DGI Live e-MCF, Modèles, Exports & Multi-devises."
                : activePlan.limits.allowAdvancedSettings
                ? "Paramètres d'entreprise et modèles débloqués (DGI Live réservé à Business)."
                : "Restrictions sur les paramètres avancés, modèles de relances et exports."}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Grille des 4 Offres : Free ($0), Starter ($14), Business ($34), Gold (Contactez-nous) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = plan.id === normalizedCurrentPlanId;
          const isBusiness = plan.id === "business";
          const isGold = plan.id === "gold";
          const displayPrice =
            plan.priceMonthly === null
              ? "Sur mesure"
              : selectedCycle === "yearly" && plan.priceYearly > 0
              ? `${plan.priceYearly} $`
              : `${plan.priceMonthly} $`;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative ${
                isBusiness
                  ? "bg-gradient-to-b from-[#183BB0] via-[#15349B] to-[#0F2573] text-white shadow-2xl shadow-blue-900/30 ring-4 ring-blue-500/30 xl:-translate-y-2"
                  : isGold
                  ? "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border border-amber-400/40 shadow-xl"
                  : "bg-white text-slate-900 border border-slate-200/90 shadow-sm hover:shadow-lg"
              }`}
            >
              <div>
                {/* Badge supérieur */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      isBusiness
                        ? "bg-amber-400 text-slate-950 border-amber-300"
                        : isGold
                        ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                        : plan.id === "starter"
                        ? "bg-blue-50 text-[#183BB0] border-blue-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {plan.badge}
                  </span>

                  {isCurrent && (
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isBusiness || isGold
                          ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/40"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      Actif
                    </span>
                  )}
                </div>

                {/* Nom de l'offre & description */}
                <div className="flex items-center gap-2">
                  {isGold && <Crown className="w-5 h-5 text-amber-400 shrink-0" />}
                  {isBusiness && <Zap className="w-5 h-5 text-amber-300 shrink-0" />}
                  <h3
                    className={`text-xl font-black tracking-tight ${
                      isBusiness || isGold ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Offre {plan.name}
                  </h3>
                </div>
                <p
                  className={`text-xs mt-1.5 min-h-[34px] leading-relaxed ${
                    isBusiness
                      ? "text-blue-100/90"
                      : isGold
                      ? "text-slate-300"
                      : "text-slate-500"
                  }`}
                >
                  {plan.tagline}
                </p>

                {/* Prix */}
                <div
                  className={`mt-5 pb-5 border-b ${
                    isBusiness
                      ? "border-white/15"
                      : isGold
                      ? "border-slate-800"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-3xl sm:text-4xl font-black tracking-tight ${
                        isBusiness
                          ? "text-white"
                          : isGold
                          ? "text-amber-300"
                          : "text-slate-900"
                      }`}
                    >
                      {displayPrice}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isBusiness
                          ? "text-blue-200"
                          : isGold
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      {plan.periodLabel}
                    </span>
                  </div>
                  {selectedCycle === "yearly" && plan.priceMonthly > 0 && (
                    <p
                      className={`text-[11px] mt-1 font-semibold ${
                        isBusiness ? "text-emerald-300" : "text-emerald-600"
                      }`}
                    >
                      Au lieu de {plan.priceMonthly} $/mois • Facturé annuellement
                    </p>
                  )}
                  {selectedCycle === "monthly" && plan.priceMonthly > 0 && (
                    <p
                      className={`text-[11px] mt-1 ${
                        isBusiness ? "text-blue-200/80" : "text-slate-400"
                      }`}
                    >
                      Sans engagement • Paiement Mobile Money ou Carte
                    </p>
                  )}
                  {plan.id === "free" && (
                    <p className="text-[11px] mt-1 text-slate-400">
                      Limité à 3 factures • Sans relance ni employé
                    </p>
                  )}
                  {isGold && (
                    <p className="text-[11px] mt-1 text-amber-200/80">
                      Devis personnalisé selon le volume et les filiales
                    </p>
                  )}
                </div>

                {/* Liste des fonctionnalités */}
                <ul className="mt-5 space-y-2.5 text-xs">
                  {plan.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2.5 ${
                        !feat.included
                          ? isBusiness || isGold
                            ? "text-white/40 line-through"
                            : "text-slate-400"
                          : ""
                      }`}
                    >
                      {feat.included ? (
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isBusiness
                              ? "text-emerald-300"
                              : isGold
                              ? "text-amber-400"
                              : "text-emerald-600"
                          }`}
                        />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`${
                          feat.highlight
                            ? isBusiness || isGold
                              ? "font-extrabold text-white"
                              : "font-extrabold text-slate-900"
                            : feat.included
                            ? isBusiness
                              ? "text-blue-50 font-medium"
                              : isGold
                              ? "text-slate-200 font-medium"
                              : "text-slate-700 font-medium"
                            : "text-slate-400"
                        }`}
                      >
                        {feat.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bouton d'action de la carte */}
              <div className="mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => handlePlanButtonClick(plan)}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isCurrent
                      ? isBusiness || isGold
                        ? "bg-white/15 text-white border border-white/25"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                      : isBusiness
                      ? "bg-white hover:bg-blue-50 text-[#183BB0] shadow-lg"
                      : isGold
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg"
                      : plan.id === "starter"
                      ? "bg-[#183BB0] hover:bg-[#122F8C] text-white shadow-md shadow-blue-900/15"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {isGold ? (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      <span>Contactez-nous</span>
                    </>
                  ) : isCurrent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Forfait Actuel ({plan.name})</span>
                    </>
                  ) : (
                    <>
                      <span>{plan.ctaLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Tableau comparatif détaillé des 4 offres */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Comparatif Détaillé des Quotas & Paramétrages
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisez exactement les limites de chaque abonnement (factures, relances, employés, paramètres DGI)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-5 min-w-[220px]">Fonctionnalité / Paramètre</th>
                <th className="py-3.5 px-4 text-center">Free (0 $)</th>
                <th className="py-3.5 px-4 text-center text-[#183BB0]">Starter (14 $)</th>
                <th className="py-3.5 px-4 text-center bg-blue-50/70 text-[#183BB0]">
                  Business (34 $)
                </th>
                <th className="py-3.5 px-4 text-center text-amber-700">
                  Gold (Sur Mesure)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-800">
                    {row.feature}
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-600">
                    {row.free === false ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                        <Lock className="w-3.5 h-3.5" /> Non inclus
                      </span>
                    ) : (
                      row.free
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {row.starter}
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-[#183BB0] bg-blue-50/30">
                    {row.business}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                    {row.gold}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal de Paiement / Activation pour Starter (14$) ou Business (34$) */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-[#183BB0] border border-blue-200">
                  Activation Immédiate
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1.5">
                  Souscrire à l&apos;offre {checkoutPlan.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Montant :{" "}
                  <strong className="text-slate-900">
                    {selectedCycle === "yearly"
                      ? `${checkoutPlan.priceYearly} $ / mois (Facturation annuelle)`
                      : `${checkoutPlan.priceMonthly} $ / mois`}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSubscriptionPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Mode de règlement (Mobile Money RDC / UEMOA ou Carte)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "mpesa", label: "M-Pesa / Vodacom", icon: Smartphone },
                    { id: "airtel", label: "Airtel / Orange Money", icon: Smartphone },
                    { id: "card", label: "Visa / Mastercard", icon: CreditCard },
                    { id: "bank", label: "Virement Rawbank / Equity", icon: Building2 },
                  ].map((m) => {
                    const MIcon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? "bg-blue-50 border-[#183BB0] text-[#183BB0]"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <MIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {paymentMethod === "card"
                    ? "Titulaire ou Référence Carte"
                    : "Numéro Mobile Money / Référence de contact"}
                </label>
                <input
                  type="text"
                  required
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  placeholder="+243 81 000 0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#183BB0]"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Déblocage instantané après validation :
                </p>
                <p className="text-emerald-800">
                  {checkoutPlan.id === "starter"
                    ? "100 factures/mois, relances WhatsApp & Email, et jusqu'à 3 employés."
                    : "Factures illimitées, relances illimitées, employés illimités et accès total à tous les paramètres."}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutPlan(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-5 py-2.5 rounded-xl bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-extrabold shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isProcessingPayment
                      ? "Activation en cours..."
                      : `Activer ${checkoutPlan.name} (${
                          selectedCycle === "yearly"
                            ? checkoutPlan.priceYearly
                            : checkoutPlan.priceMonthly
                        } $)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal "Contactez-nous" pour l'Offre Gold */}
      {isGoldContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Offre Gold • Sur Mesure
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                    Contactez notre équipe Grands Comptes
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoldContactOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGoldSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nom de l&apos;entreprise / Groupe
                  </label>
                  <input
                    type="text"
                    required
                    value={goldForm.companyName}
                    onChange={(e) =>
                      setGoldForm({ ...goldForm, companyName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Votre Nom & Fonction
                  </label>
                  <input
                    type="text"
                    required
                    value={goldForm.contactName}
                    onChange={(e) =>
                      setGoldForm({ ...goldForm, contactName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email professionnel
                  </label>
                  <input
                    type="email"
                    required
                    value={goldForm.email}
                    onChange={(e) =>
                      setGoldForm({ ...goldForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Téléphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    value={goldForm.phone}
                    onChange={(e) =>
                      setGoldForm({ ...goldForm, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Besoins spécifiques (Multi-sociétés, ERP, Serveur DGI dédié...)
                </label>
                <textarea
                  rows={3}
                  value={goldForm.needs}
                  onChange={(e) =>
                    setGoldForm({ ...goldForm, needs: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`https://wa.me/243810000000?text=${encodeURIComponent(
                    `Bonjour FacturX, nous souhaitons un devis pour l'Offre GOLD pour l'entreprise ${goldForm.companyName}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Discuter sur WhatsApp</span>
                </a>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsGoldContactOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer la demande Gold</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

