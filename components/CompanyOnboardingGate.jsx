"use client";

import React, { useState } from "react";
import {
  Building2,
  ShieldCheck,
  FileCheck2,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Eye,
  Landmark,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Lock,
  Edit3,
} from "lucide-react";
import {
  uploadKybLegalFile,
  submitCompanyOnboardingAndKyb,
  getKybDocumentSignedUrl,
} from "../lib/supabaseService";

const REQUIRED_DOC_SLOTS = [
  {
    docType: "rccm_guce",
    title: "Extrait RCCM / Guichet Unique (GUCE) ou Agrément d'État",
    subtitle: "Acte officiel d'immatriculation commerciale délivré par l'État (PDF, JPG ou PNG)",
    required: true,
  },
  {
    docType: "nif_dgi",
    title: "Attestation Fiscale N° Impôt (DGI / NIF) ou Id. Nationale",
    subtitle: "Certificat d'enregistrement fiscal ou Identification Nationale approuvée",
    required: true,
  },
  {
    docType: "id_dirigeant",
    title: "Pièce d'Identité Officielle du Représentant Légal",
    subtitle: "Passeport valide, Carte d'électeur ou Carte Nationale d'Identité du gérant",
    required: true,
  },
  {
    docType: "statuts_acte",
    title: "Statuts Notariés ou Autorisation Ministérielle (Optionnel)",
    subtitle: "Tout document complémentaire renforçant la conformité de votre dossier",
    required: false,
  },
];

const CURRENCY_OPTIONS = [
  { label: "Franc Congolais (CDF / FC)", symbol: "FC", defaultVat: 0.16 },
  { label: "Dollar Américain (USD / $)", symbol: "$", defaultVat: 0.16 },
  { label: "Franc CFA — UEMOA / CEMAC (FCFA)", symbol: "FCFA", defaultVat: 0.18 },
  { label: "Euro (EUR / €)", symbol: "€", defaultVat: 0.16 },
];

export default function CompanyOnboardingGate({
  userProfile,
  companyInfo,
  onOnboardingSubmitted,
  onSignOut,
  isPreviewMode = false,
  onExitPreview = null,
  isDocumentRevisionMode = false,
  onCloseRevision = null,
}) {
  const isRejected = companyInfo?.kybStatus === "rejected";

  const [step, setStep] = useState(isDocumentRevisionMode ? 3 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [certifiedHonour, setCertifiedHonour] = useState(Boolean(isDocumentRevisionMode));

  const [form, setForm] = useState({
    name: companyInfo?.name || userProfile?.companyName || "",
    legalForm: companyInfo?.legalForm || "SARL",
    activitySector: companyInfo?.activitySector || "Commerce Général & Services B2B",
    logoUrl: companyInfo?.logoUrl || "",
    address: companyInfo?.address || "",
    city: companyInfo?.city || userProfile?.city || "Kinshasa",
    country: companyInfo?.country || userProfile?.country || "République Démocratique du Congo",
    countryCode: companyInfo?.countryCode || userProfile?.countryCode || "CD",
    phone: companyInfo?.phone || userProfile?.phone || "",
    email: companyInfo?.email || userProfile?.email || "",
    website: companyInfo?.website || "",
    rccm: companyInfo?.rccm || "",
    idNat: companyInfo?.idNat || "",
    nif: companyInfo?.nif || "",
    defaultCurrency:
      companyInfo?.defaultCurrency || userProfile?.currency || "Franc Congolais (CDF / FC)",
    currencySymbol: companyInfo?.currencySymbol || userProfile?.currencySymbol || "FC",
    defaultVatRate:
      typeof companyInfo?.defaultVatRate === "number" ? companyInfo.defaultVatRate : 0.16,
    bankName: companyInfo?.bankName || "Rawbank",
    iban: companyInfo?.iban || "",
    airtelMoneyNumber: companyInfo?.airtelMoneyNumber || "",
    orangeMoneyNumber: companyInfo?.orangeMoneyNumber || "",
  });

  const [uploadedDocs, setUploadedDocs] = useState(() => {
    const initial = {};
    if (Array.isArray(companyInfo?.kybDocuments)) {
      for (const doc of companyInfo.kybDocuments) {
        if (doc?.docType) initial[doc.docType] = doc;
      }
    }
    return initial;
  });

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Le logo ne doit pas dépasser 2 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, logoUrl: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = async (slot, file) => {
    if (!file) return;
    setErrorMsg("");
    setUploadingSlot(slot.docType);
    try {
      const uploaded = await uploadKybLegalFile(file, slot.docType, slot.title);
      setUploadedDocs((prev) => ({
        ...prev,
        [slot.docType]: uploaded,
      }));
    } catch (err) {
      setErrorMsg(err.message || "Impossible de téléverser ce document.");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handlePreviewDocument = async (doc) => {
    try {
      if (!doc?.storagePath) return;
      const url = await getKybDocumentSignedUrl(doc.storagePath);
      if (url && typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setErrorMsg("Impossible d'ouvrir l'aperçu sécurisé du document.");
    }
  };

  const validateStep1 = () => {
    if (!form.name.trim()) {
      setErrorMsg("Veuillez renseigner la raison sociale officielle de votre entreprise.");
      return false;
    }
    if (!form.address.trim()) {
      setErrorMsg("Veuillez renseigner l'adresse physique complète du siège social.");
      return false;
    }
    if (!form.city.trim() || !form.country.trim()) {
      setErrorMsg("Veuillez renseigner la ville et le pays d'établissement.");
      return false;
    }
    if (!form.phone.trim()) {
      setErrorMsg("Veuillez renseigner le numéro de téléphone professionnel de l'entreprise.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const validateStep2 = () => {
    if (!form.rccm.trim()) {
      setErrorMsg("Veuillez renseigner votre numéro RCCM (ou numéro d'immatriculation officiel).");
      return false;
    }
    if (!form.nif.trim() && !form.idNat.trim()) {
      setErrorMsg("Veuillez renseigner au moins votre Numéro Impôt (NIF / DGI) ou Identification Nationale.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(3, s + 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const missingRequired = REQUIRED_DOC_SLOTS.filter(
      (slot) => slot.required && !uploadedDocs[slot.docType]
    );
    if (missingRequired.length > 0) {
      setErrorMsg(
        `Document officiel manquant : veuillez téléverser "${missingRequired[0].title}".`
      );
      return;
    }

    if (!certifiedHonour) {
      setErrorMsg(
        "Veuillez cocher la déclaration certifiant l'authenticité des documents gouvernementaux transmis."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const docsList = Object.values(uploadedDocs);
      const updatedCompany = await submitCompanyOnboardingAndKyb(
        companyInfo?.id || userProfile?.companyId || null,
        form,
        docsList,
        userProfile
      );
      if (onOnboardingSubmitted) {
        onOnboardingSubmitted(updatedCompany);
      }
    } catch (err) {
      console.error("Erreur soumission onboarding KYB:", err);
      setErrorMsg(
        err.message ||
          "Une erreur est survenue lors de l'enregistrement de votre dossier d'entreprise."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // VUE ASSISTANT OBLIGATOIRE DE PARAMÉTRAGE D'ENTREPRISE & DÉPÔT LÉGAL (3 ÉTAPES)
  // Sans blocage d'accès après soumission : l'utilisateur accède immédiatement à FacturX
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#F6F8FC] py-5 px-3.5 sm:px-6 lg:px-10">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#183BB0] text-white flex items-center justify-center font-black shadow-md shrink-0">
              FX
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                Factur<span className="text-blue-600">X</span>
              </span>
              <p className="text-[11px] text-slate-500 font-semibold">
                {isDocumentRevisionMode
                  ? "Mise à jour de vos Documents Légaux"
                  : "Configuration de votre Entreprise"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDocumentRevisionMode && onCloseRevision && (
              <button
                type="button"
                onClick={onCloseRevision}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour au Tableau de bord</span>
              </button>
            )}
            {isPreviewMode && onExitPreview && (
              <button
                type="button"
                onClick={onExitPreview}
                className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
              >
                Quitter l&apos;aperçu
              </button>
            )}
            {onSignOut && !isDocumentRevisionMode && (
              <button
                type="button"
                onClick={onSignOut}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Se déconnecter</span>
              </button>
            )}
          </div>
        </div>

        {/* Bannière si dossier signalé non conforme (sans blocage d'accès) */}
        {isRejected && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-rose-900">
                Vos documents ne sont pas conformes — Veuillez encore revoir votre dossier
              </p>
              <p className="text-rose-700 mt-0.5">
                {companyInfo?.kybRejectionReason ||
                  "Un ou plusieurs documents officiels nécessitent une mise à jour. Votre accès à l'application reste actif, veuillez simplement remplacer les pièces ci-dessous."}
              </p>
            </div>
          </div>
        )}

        {/* Carte Principale Wizard */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
          {/* En-tête & Stepper */}
          <div className="bg-gradient-to-r from-[#1A44B8] via-[#183BB0] to-[#2D60FF] p-5 sm:p-8 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-100 text-[11px] font-bold mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                {isDocumentRevisionMode
                  ? "Révision de vos pièces officielles • Accès application conservé"
                  : "Accès immédiat à l'application après ce paramétrage"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Paramétrage de votre Entreprise & Documents d&apos;État
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1.5">
              Bienvenue {userProfile?.fullName || "Administrateur"}. Renseignez les coordonnées de votre entreprise et joignez vos documents officiels : vous accédez immédiatement à FacturX pendant que nos équipes vérifient vos pièces sous 24h à 48h.
            </p>

            {/* Stepper Mobile-First */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              {[
                { num: 1, label: "Identité & Siège" },
                { num: 2, label: "Fiscalité & Banque" },
                { num: 3, label: "Actes Légaux d'État" },
              ].map((s) => {
                const active = step === s.num;
                const done = step > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => {
                      if (isDocumentRevisionMode || s.num < step) setStep(s.num);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      active
                        ? "bg-white text-[#183BB0] border-white shadow-md"
                        : done || isDocumentRevisionMode
                        ? "bg-emerald-500/25 text-white border-emerald-300/40 cursor-pointer"
                        : "bg-white/10 text-blue-100 border-white/15"
                    }`}
                  >
                    <div className="text-[10px] font-extrabold uppercase tracking-wider">
                      Étape {s.num}/3 {done ? "✓" : ""}
                    </div>
                    <div className="text-xs font-bold truncate mt-0.5">{s.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleFinalSubmit} className="p-5 sm:p-8 space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ==================== ÉTAPE 1 : IDENTITÉ & SIÈGE ==================== */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      1. Identité Juridique & Coordonnées de l&apos;Entreprise
                    </h2>
                    <p className="text-xs text-slate-500">
                      Ces informations figureront sur l&apos;en-tête officiel de vos factures et devis.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Raison Sociale Officielle de l&apos;Entreprise *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Kivu Tech Solutions SARL"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Forme Juridique *
                    </label>
                    <select
                      value={form.legalForm}
                      onChange={(e) => setForm({ ...form, legalForm: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="SARL">SARL / SARLU</option>
                      <option value="SAS">SAS / SASU</option>
                      <option value="SA">Société Anonyme (SA)</option>
                      <option value="Établissement">Établissement / Entreprise Individuelle</option>
                      <option value="SNC">SNC / SCS</option>
                      <option value="ONG / ASBL">ONG / ASBL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Secteur d&apos;Activité *
                    </label>
                    <select
                      value={form.activitySector}
                      onChange={(e) => setForm({ ...form, activitySector: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Commerce Général & Services B2B">Commerce Général & Services B2B</option>
                      <option value="Technologies, Logiciels & Télécoms">Technologies, Logiciels & Télécoms</option>
                      <option value="BTP, Génie Civil & Immobilier">BTP, Génie Civil & Immobilier</option>
                      <option value="Transport, Douane & Logistique">Transport, Douane & Logistique</option>
                      <option value="Conseil, Audit & Ingénierie">Conseil, Audit & Ingénierie</option>
                      <option value="Santé, Pharmacie & Laboratoires">Santé, Pharmacie & Laboratoires</option>
                      <option value="Mines, Énergie & Industrie">Mines, Énergie & Industrie</option>
                      <option value="Agroalimentaire & Distribution">Agroalimentaire & Distribution</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Adresse Physique Complète du Siège Social *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Ex: N° 145, Boulevard du 30 Juin, Commune de la Gombe"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Ville *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Kinshasa, Lubumbashi, Goma..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Pays *</label>
                    <input
                      type="text"
                      required
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      placeholder="République Démocratique du Congo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Téléphone Professionnel *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+243 81 000 00 00"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Officiel de Facturation *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="contact@entreprise.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 font-extrabold text-blue-700">
                        {form.logoUrl ? (
                          <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                          <span>{(form.name || "FX").slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Logo de l&apos;entreprise (Optionnel)</p>
                        <p className="text-[11px] text-slate-500">PNG ou JPG (max 2 Mo) pour vos factures PDF</p>
                      </div>
                    </div>
                    <label className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer text-center">
                      Choisir un logo
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>Continuer vers Fiscalité & Paiements</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ==================== ÉTAPE 2 : FISCALITÉ, DEVISES & BANQUE ==================== */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <Landmark className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      2. Paramétrage de l&apos;Interface de Travail (Fiscalité & Paiements)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Configurez votre devise, vos numéros légaux d&apos;État et vos moyens d&apos;encaissement.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Devise Principale de Travail *
                    </label>
                    <select
                      value={form.defaultCurrency}
                      onChange={(e) => {
                        const found = CURRENCY_OPTIONS.find((c) => c.label === e.target.value);
                        setForm({
                          ...form,
                          defaultCurrency: e.target.value,
                          currencySymbol: found?.symbol || "FC",
                        });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.label} value={c.label}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Taux de TVA par Défaut *
                    </label>
                    <select
                      value={String(form.defaultVatRate)}
                      onChange={(e) => setForm({ ...form, defaultVatRate: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="0.16">16% — Taux normal RDC (DGI)</option>
                      <option value="0.18">18% — Taux normal OHADA / UEMOA</option>
                      <option value="0">0% — Exonéré / Franchise de TVA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Numéro RCCM Officiel *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.rccm}
                      onChange={(e) => setForm({ ...form, rccm: e.target.value })}
                      placeholder="Ex: CD/KIN/RCCM/25-B-00123"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Numéro Impôt (DGI / NIF / NINEA) *
                    </label>
                    <input
                      type="text"
                      value={form.nif}
                      onChange={(e) => setForm({ ...form, nif: e.target.value })}
                      placeholder="Ex: A2509876X"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Identification Nationale (Id. Nat.)
                    </label>
                    <input
                      type="text"
                      value={form.idNat}
                      onChange={(e) => setForm({ ...form, idNat: e.target.value })}
                      placeholder="Ex: 01-F4300-N12345K"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Banque Principale de Règlement
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={form.bankName}
                        onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                        placeholder="Rawbank, Equity BCDC, TMB, Ecobank..."
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      RIB / IBAN / Numéro de Compte Bancaire
                    </label>
                    <input
                      type="text"
                      value={form.iban}
                      onChange={(e) => setForm({ ...form, iban: e.target.value })}
                      placeholder="Ex: 05100-01000012345-67 USD"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Numéro Marchand Airtel Money
                    </label>
                    <input
                      type="tel"
                      value={form.airtelMoneyNumber}
                      onChange={(e) => setForm({ ...form, airtelMoneyNumber: e.target.value })}
                      placeholder="+243 99 000 00 00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Numéro Marchand Orange Money
                    </label>
                    <input
                      type="tel"
                      value={form.orangeMoneyNumber}
                      onChange={(e) => setForm({ ...form, orangeMoneyNumber: e.target.value })}
                      placeholder="+243 89 000 00 00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Étape précédente</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>Continuer vers Documents Légaux d&apos;État</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ==================== ÉTAPE 3 : DOCUMENTS LÉGAUX D'ÉTAT (VALIDATION 24H-48H SANS BLOCAGE) ==================== */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      3. Documents Légaux Approuvés par l&apos;État / Gouvernement
                    </h2>
                    <p className="text-xs text-slate-500">
                      Déposez vos pièces justificatives officielles. Votre accès à FacturX est <strong>ouvert immédiatement</strong> pendant que nous vérifions vos documents sous <strong>24h à 48h</strong>.
                    </p>
                  </div>
                </div>

                {/* Bandeau rassurant : Accès immédiat + Vérification 24h-48h par email */}
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-900">
                      Accès immédiat à votre espace • Vérification en arrière-plan (24h – 48h)
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      Dès validation de cette étape, vous entrez directement dans votre tableau de bord FacturX sans aucun blocage. Sous <strong>24h à 48h</strong>, vous recevrez un email vous informant de l&apos;état de conformité de vos documents (PDF, JPG, PNG — max 10 Mo).
                    </p>
                  </div>
                </div>

                {/* Slots de téléversement */}
                <div className="space-y-3">
                  {REQUIRED_DOC_SLOTS.map((slot) => {
                    const existingDoc = uploadedDocs[slot.docType];
                    const isUploadingThis = uploadingSlot === slot.docType;

                    return (
                      <div
                        key={slot.docType}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          existingDoc
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-extrabold text-slate-900">
                              {slot.title}
                            </span>
                            {slot.required ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                                Obligatoire
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold">
                                Optionnel
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600">{slot.subtitle}</p>
                          {existingDoc && (
                            <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 pt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                Fichier joint : {existingDoc.fileName} (
                                {Math.max(1, Math.round((existingDoc.fileSize || 1024) / 1024))} Ko)
                              </span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {existingDoc?.storagePath && (
                            <button
                              type="button"
                              onClick={() => handlePreviewDocument(existingDoc)}
                              className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Voir</span>
                            </button>
                          )}
                          <label
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all ${
                              existingDoc
                                ? "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            }`}
                          >
                            {isUploadingThis ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Envoi...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>{existingDoc ? "Remplacer" : "Téléverser"}</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept=".pdf,image/jpeg,image/png,image/webp"
                              disabled={isUploadingThis}
                              onChange={(e) => handleDocumentUpload(slot, e.target.files?.[0])}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Attestation sur l'honneur */}
                <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certifiedHonour}
                    onChange={(e) => setCertifiedHonour(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    Je certifie sur l&apos;honneur être le représentant habilité de{" "}
                    <strong>{form.name || "cette entreprise"}</strong> et atteste que les documents officiels transmis sont authentiques, délivrés par les autorités compétentes de l&apos;État, et j&apos;accepte le délai de vérification de <strong>24h à 48h</strong>.
                  </span>
                </label>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Étape précédente</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || Boolean(uploadingSlot)}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Enregistrement sécurisé...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {isDocumentRevisionMode
                            ? "Enregistrer mes documents & Retourner au Tableau de bord"
                            : "Finaliser & Accéder immédiatement à FacturX"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

