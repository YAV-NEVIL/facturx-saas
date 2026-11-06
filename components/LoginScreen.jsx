"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  Receipt,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Briefcase,
  Phone,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  Check,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  signInWithEmail,
  signUpWithEmail,
  verifyEmailOtp,
  resendVerificationOtp,
  syncAuthUserWithTeamMember,
  updateMemberOnlineStatus,
  completeAdminOnboardingAfterOtp,
  getCurrentSession,
  onAuthStateChange,
} from "@/lib/supabaseService";
import { Building2, Globe } from "lucide-react";

export default function LoginScreen({
  onLoginSuccess,
  teamMembers = [],
  companyInfo = null,
}) {
  // Mode : "signin" | "signup" | "otp_verify" | "quick"
  const [activeTab, setActiveTab] = useState("signin");

  // Formulaire Connexion
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Formulaire Inscription Admin & Entreprise (SaaS Multi-Tenant)
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [phone, setPhone] = useState("+243 ");
  const [currency, setCurrency] = useState("Franc Congolais (CDF / FC)");
  const [currencySymbol, setCurrencySymbol] = useState("FC");
  const [country, setCountry] = useState("République Démocratique du Congo");
  const [countryCode, setCountryCode] = useState("CD");
  const [city, setCity] = useState("Kinshasa");
  const [loginRoleFilter, setLoginRoleFilter] = useState("all"); // "admin" | "employee" | "all"
  const [pendingOnboardingData, setPendingOnboardingData] = useState(null);

  // Vérification OTP (Code envoyé par email)
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingProfile, setPendingProfile] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const autoLoginHandledRef = useRef(false);

  // Détection automatique du retour depuis le lien de confirmation email Supabase (#access_token=...)
  useEffect(() => {
    let isActive = true;

    const finalizeConfirmedSession = async (session) => {
      if (!session?.user || !session.user.email_confirmed_at || autoLoginHandledRef.current) {
        return;
      }
      // Ne déclencher automatiquement que si un retour d'authentification (hash URL) ou un onboarding en attente est présent
      const hasAuthHash =
        typeof window !== "undefined" &&
        (window.location.hash.includes("access_token") ||
          window.location.search.includes("code="));
      let savedPending = null;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("facturx_pending_onboarding_v3");
          if (raw) savedPending = JSON.parse(raw);
        } catch (e) {
          console.warn("Lecture onboarding en attente:", e);
        }
      }

      if (!hasAuthHash && !savedPending) return;

      autoLoginHandledRef.current = true;
      setIsLoading(true);
      try {
        const authEmail = (session.user.email || "").toLowerCase().trim();
        let finalProfile = null;

        if (savedPending && savedPending.email === authEmail) {
          finalProfile = await completeAdminOnboardingAfterOtp({
            ...savedPending,
            authUser: session.user,
          });
        } else {
          finalProfile = await syncAuthUserWithTeamMember(session.user, {
            email: authEmail,
            allowAdmin: session.user.user_metadata?.role === "admin",
          });
        }

        if (typeof window !== "undefined") {
          localStorage.removeItem("facturx_pending_onboarding_v3");
          if (window.location.hash.includes("access_token")) {
            window.history.replaceState(null, "", window.location.pathname);
          }
        }

        if (isActive && finalProfile) {
          await updateMemberOnlineStatus(finalProfile.email, true);
          onLoginSuccess(finalProfile);
        }
      } catch (err) {
        console.warn("Erreur finalisation automatique après lien email:", err);
        autoLoginHandledRef.current = false;
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    getCurrentSession().then((session) => {
      if (session) finalizeConfirmedSession(session);
    });

    const { data: listener } = onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        finalizeConfirmedSession(session);
      }
    });

    return () => {
      isActive = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [onLoginSuccess]);

  // Compte à rebours renvoi OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // États UI
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // Rôles démo pour tests rapides
  const quickProfiles = [
    {
      id: "admin-koyinsola",
      fullName: "Koyinsola Adeyemi",
      email: "koyinsola@facturx.africa",
      role: "admin",
      roleTitle: "Administrateur Général",
      badge: "Propriétaire",
      initials: "KA",
      description: "Accès illimité : Factures, Trésorerie, Fiscalité, Paramètres & Employés.",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      avatarGradient: "from-amber-600 to-orange-500",
    },
    {
      id: "comptable-marcelle",
      fullName: "Marcelle Tshimanga",
      email: "marcelle.t@horizon-groupe.cd",
      role: "comptable",
      roleTitle: "Responsable Comptable",
      badge: "Comptabilité",
      initials: "MT",
      description: "Accès financier : Facturation, Devis, Règlements, Déclarations TVA & Rapports.",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      avatarGradient: "from-blue-600 to-indigo-600",
    },
    {
      id: "commercial-patrick",
      fullName: "Patrick Bakari",
      email: "patrick.b@horizon-groupe.cd",
      role: "commercial",
      roleTitle: "Chargé d'Affaires Commercial",
      badge: "Commercial",
      initials: "PB",
      description: "Accès commercial : Pipeline de Devis, Portefeuille Clients & Facturation.",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      avatarGradient: "from-emerald-600 to-teal-600",
    },
    {
      id: "stock-alain",
      fullName: "Alain Mutombo",
      email: "alain.m@horizon-groupe.cd",
      role: "gestionnaire_stock",
      roleTitle: "Gestionnaire de Stock & Articles",
      badge: "Gestionnaire Stock",
      initials: "AM",
      description: "Accès logistique : Articles, prestations, devis & facturation opérationnelle.",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      avatarGradient: "from-amber-500 to-orange-600",
    },
  ];

  // 1. GESTION DE LA CONNEXION (Sign In)
  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessNotice("");

    if (!loginEmail.trim()) {
      setErrorMessage("Veuillez renseigner votre adresse email professionnelle.");
      return;
    }
    if (!loginPassword.trim()) {
      setErrorMessage("Veuillez renseigner votre mot de passe.");
      return;
    }

    setIsLoading(true);

    try {
      let authUser = null;
      let userMeta = {};

      try {
        const authData = await signInWithEmail(loginEmail, loginPassword);
        authUser = authData?.user;
        userMeta = authUser?.user_metadata || {};
      } catch (authErr) {
        // Si l'erreur indique que l'email n'est pas encore confirmé
        if (
          authErr?.message?.toLowerCase().includes("email not confirmed") ||
          authErr?.message?.toLowerCase().includes("non confirmé")
        ) {
          setPendingEmail(loginEmail.trim().toLowerCase());
          setActiveTab("otp_verify");
          setErrorMessage(
            "Votre adresse email n'est pas encore validée. Veuillez saisir le code de vérification reçu par email."
          );
          setIsLoading(false);
          return;
        }
        throw new Error("Identifiants incorrects. Veuillez vérifier votre adresse email et votre mot de passe.");
      }

      // Résoudre le profil depuis Supabase team_members ou finaliser l'onboarding si l'email vient d'être confirmé par lien
      let savedPending = null;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("facturx_pending_onboarding_v3");
          if (raw) savedPending = JSON.parse(raw);
        } catch (e) {
          // ignore
        }
      }

      const cleanLoginEmail = loginEmail.trim().toLowerCase();
      let syncedMember = null;
      if (savedPending && savedPending.email === cleanLoginEmail) {
        syncedMember = await completeAdminOnboardingAfterOtp({
          ...savedPending,
          authUser,
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem("facturx_pending_onboarding_v3");
        }
      } else {
        syncedMember = await syncAuthUserWithTeamMember(authUser, {
          email: cleanLoginEmail,
          allowAdmin: userMeta.role === "admin",
        });
      }

      const matchedMember =
        syncedMember ||
        teamMembers.find(
          (m) => m.email.toLowerCase() === cleanLoginEmail
        );

      const resolvedName =
        matchedMember?.fullName || matchedMember?.name || userMeta.full_name || cleanLoginEmail.split("@")[0];
      const resolvedRole = matchedMember?.role || userMeta.role || "comptable";

      const roleBadge =
        resolvedRole === "admin"
          ? "Propriétaire"
          : resolvedRole === "comptable"
            ? "Comptabilité"
            : resolvedRole === "commercial"
              ? "Commercial"
              : "Gestionnaire Stock";

      const initials = resolvedName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const profile = {
        fullName: resolvedName,
        email: cleanLoginEmail,
        role: resolvedRole,
        badge: roleBadge,
        initials: initials || "FX",
        phone: matchedMember?.phone || userMeta.phone || "",
        companyId: matchedMember?.companyId || matchedMember?.company_id || null,
        companyName: matchedMember?.companyName || userMeta.company_name || undefined,
        currency: matchedMember?.currency || userMeta.currency || undefined,
        currencySymbol: matchedMember?.currencySymbol || userMeta.currency_symbol || undefined,
        city: matchedMember?.city || userMeta.city || undefined,
        country: matchedMember?.country || userMeta.country || undefined,
        countryCode: matchedMember?.countryCode || userMeta.country_code || undefined,
        isNewOrganization: Boolean(matchedMember?.isNewOrganization),
      };

      // Mettre à jour le statut "En ligne" sur Supabase
      await updateMemberOnlineStatus(profile.email, true);

      onLoginSuccess(profile);
    } catch (err) {
      console.error("Erreur connexion:", err);
      setErrorMessage(
        err.message || "Identifiants incorrects. Veuillez vérifier votre adresse email et mot de passe."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 2. GESTION DE LA CRÉATION D'ENTREPRISE & COMPTE ADMIN (SaaS Multi-Tenant avec OTP Supabase)
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessNotice("");

    if (!fullName.trim()) {
      setErrorMessage("Veuillez renseigner le nom complet de l'administrateur.");
      return;
    }
    if (!companyName.trim()) {
      setErrorMessage("Veuillez renseigner le nom de votre organisation / entreprise.");
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes("@")) {
      setErrorMessage("Veuillez renseigner une adresse email professionnelle valide.");
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMessage("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    setIsLoading(true);

    try {
      const onboardingData = {
        adminName: fullName.trim(),
        companyName: companyName.trim(),
        email: signupEmail.trim().toLowerCase(),
        phone: phone.trim(),
        currency: currency,
        currencySymbol: currencySymbol,
        city: city.trim() || "Kinshasa",
        country: country.trim() || "RDC",
        countryCode: countryCode || "CD",
      };

      // Enregistrement Auth auprès de Supabase avec métadonnées complètes d'organisation
      const signUpRes = await signUpWithEmail(
        signupEmail.trim().toLowerCase(),
        signupPassword,
        fullName.trim(),
        "admin",
        phone.trim(),
        {
          company_name: onboardingData.companyName,
          currency: onboardingData.currency,
          currency_symbol: onboardingData.currencySymbol,
          city: onboardingData.city,
          country: onboardingData.country,
          country_code: onboardingData.countryCode,
        }
      );

      if (typeof window !== "undefined") {
        localStorage.setItem("facturx_pending_onboarding_v3", JSON.stringify(onboardingData));
      }

      // Si la confirmation d'email est désactivée dans Supabase, connecter immédiatement
      if (signUpRes?.session?.user) {
        const finalProfile = await completeAdminOnboardingAfterOtp({
          ...onboardingData,
          authUser: signUpRes.session.user,
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem("facturx_pending_onboarding_v3");
        }
        await updateMemberOnlineStatus(finalProfile.email, true);
        onLoginSuccess(finalProfile);
        return;
      }

      setPendingEmail(signupEmail.trim().toLowerCase());
      setPendingOnboardingData(onboardingData);

      // Basculer vers l'écran de vérification OTP
      setActiveTab("otp_verify");
      setSuccessNotice(
        `Code d'authentification expédié avec succès à ${signupEmail.trim().toLowerCase()} !`
      );
      setResendCooldown(60);
    } catch (err) {
      console.error("Erreur inscription:", err);
      setErrorMessage(
        err.message || "Impossible d'initier l'inscription. Vérifiez l'adresse email saisie."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 3. VALIDATION DU CODE DE VÉRIFICATION (OTP)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessNotice("");

    const code = otpCode.trim();
    if (!code) {
      setErrorMessage("Veuillez saisir le code de vérification reçu par email.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Valider le code OTP auprès de Supabase
      let verifiedUser = null;
      try {
        const verifyData = await verifyEmailOtp(pendingEmail, code, "signup");
        verifiedUser = verifyData?.user;
      } catch (otpErr) {
        console.warn("Échec verifyOtp Supabase:", otpErr);
        // Si le code est un code de confirmation numérique valide (ex: 6 chiffres saisis)
        if (otpErr) {
          throw new Error("Code de vérification invalide ou expiré. Veuillez vérifier le code reçu par email.");
        }
        if (code.length < 4) {
          throw new Error("Le code d'authentification saisi est trop court.");
        }
      }

      // 2. Synchroniser le profil validé ou finaliser l'onboarding complet de la nouvelle entreprise
      let finalProfile = null;
      if (pendingOnboardingData) {
        finalProfile = await completeAdminOnboardingAfterOtp({
          ...pendingOnboardingData,
          authUser: verifiedUser,
        });
      } else {
        const synced = await syncAuthUserWithTeamMember(
          verifiedUser,
          pendingProfile || { email: pendingEmail }
        );
        finalProfile = synced || pendingProfile || {
          fullName: pendingEmail.split("@")[0],
          email: pendingEmail,
          role: "admin",
          badge: "Propriétaire",
          initials: "FX",
          phone: "+243 ",
        };
      }

      // Mettre à jour le statut en ligne
      await updateMemberOnlineStatus(finalProfile.email, true);

      if (typeof window !== "undefined") {
        localStorage.removeItem("facturx_pending_onboarding_v3");
      }
      // Donner accès à l'application
      onLoginSuccess(finalProfile);
    } catch (err) {
      console.error("Erreur validation OTP:", err);
      setErrorMessage(
        err.message ||
        "Code d'authentification invalide ou expiré. Veuillez vérifier votre boîte de réception ou renvoyer un code."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Continuer si l'utilisateur a validé son email en cliquant sur le lien reçu dans sa boîte mail
  const handleConfirmedByEmailLink = async () => {
    setErrorMessage("");
    setSuccessNotice("");
    setIsLoading(true);
    try {
      let verifiedUser = null;
      const currentSess = await getCurrentSession();
      if (currentSess?.user?.email?.toLowerCase() === pendingEmail.toLowerCase()) {
        verifiedUser = currentSess.user;
      } else if (signupPassword) {
        const authData = await signInWithEmail(pendingEmail, signupPassword);
        verifiedUser = authData?.user;
      } else {
        setActiveTab("signin");
        setLoginEmail(pendingEmail);
        setSuccessNotice("Votre email est confirmé ! Saisissez votre mot de passe pour accéder à FacturX.");
        setIsLoading(false);
        return;
      }

      if (!verifiedUser) {
        throw new Error("Cliquez d'abord sur le lien « Confirm email address » dans votre boîte mail avant de continuer.");
      }

      let finalProfile = null;
      if (pendingOnboardingData) {
        finalProfile = await completeAdminOnboardingAfterOtp({
          ...pendingOnboardingData,
          authUser: verifiedUser,
        });
      } else {
        finalProfile = await syncAuthUserWithTeamMember(verifiedUser, {
          email: pendingEmail,
          allowAdmin: verifiedUser.user_metadata?.role === "admin",
        });
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("facturx_pending_onboarding_v3");
      }
      await updateMemberOnlineStatus(finalProfile.email, true);
      onLoginSuccess(finalProfile);
    } catch (err) {
      console.warn("Vérification par lien non finalisée:", err);
      setErrorMessage(
        "Email pas encore confirmé : cliquez d'abord sur le lien reçu dans votre email (ou saisissez le code à 6 chiffres ci-dessus)."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Renvoyer un code OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      await resendVerificationOtp(pendingEmail, "signup");
      setSuccessNotice(`Un nouveau code a été expédié à ${pendingEmail}`);
      setResendCooldown(60);
    } catch (err) {
      console.warn("Erreur renvoi code:", err);
      setSuccessNotice(`Nouveau code généré pour ${pendingEmail}.`);
      setResendCooldown(30);
    } finally {
      setIsLoading(false);
    }
  };

  // Accès direct profil test
  const handleQuickSelect = async (profile) => {
    const selected = {
      fullName: profile.fullName,
      email: profile.email,
      role: profile.role,
      badge: profile.badge,
      initials: profile.initials,
      phone: "+243 81 000 40 50",
    };
    await updateMemberOnlineStatus(profile.email, true);
    onLoginSuccess(selected);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-xl w-full">
        {/* En-tête officiel FacturX */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1A44B8] via-[#163DA9] to-[#2D60FF] text-white shadow-xl shadow-blue-900/20 mb-3.5 border border-white/20">
            <Receipt className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
            Factur<span className="text-blue-600">X</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1">
            {companyInfo?.name || "HORIZON GROUPE"} — Facturation & Recouvrement B2B
          </p>
        </div>

        {/* CARTE D'AUTHENTIFICATION PRINCIPALE */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          {/* BARRE D'ONGLETS SUPÉRIEURE : SE CONNECTER / CRÉER UN COMPTE */}
          {activeTab !== "otp_verify" && (
            <div className="border-b border-slate-100 bg-slate-50/70 p-2">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("signin");
                    setErrorMessage("");
                    setSuccessNotice("");
                  }}
                  className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "signin"
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Se Connecter</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("signup");
                    setErrorMessage("");
                    setSuccessNotice("");
                  }}
                  className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "signup"
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <User className="w-4 h-4" />
                  <span>Créer un Compte</span>
                </button>
              </div>

              {/* Ligne d'invitation contextuelle Google-Style */}
              <div className="text-center mt-2.5 pb-1">
                {activeTab === "signin" ? (
                  <p className="text-xs text-slate-500">
                    Vous n&apos;avez pas encore de compte ?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("signup");
                        setErrorMessage("");
                      }}
                      className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Créer un compte
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Avez-vous déjà un compte ?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("signin");
                        setErrorMessage("");
                      }}
                      className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Se connecter
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CONTENU DE LA CARTE */}
          <div className="p-6 sm:p-8">
            {/* Notification de succès */}
            {successNotice && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-xs sm:text-sm animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{successNotice}</p>
              </div>
            )}

            {/* Message d'erreur */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs sm:text-sm animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* ============================================================== */}
            {/* 1. VUE : SE CONNECTER (Sign In) */}
            {/* ============================================================== */}
            {activeTab === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Adresse Email Professionnelle *
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nom.prenom@horizon-groupe.cd"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Mot de Passe *
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Chiffrement SSL 256-bit
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (loginEmail) {
                        setPendingEmail(loginEmail);
                        setActiveTab("otp_verify");
                      } else {
                        setErrorMessage("Veuillez d'abord saisir votre email pour réinitialiser.");
                      }
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Code de vérification ?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Se Connecter à FacturX</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ============================================================== */}
            {/* 2. VUE : CRÉER UN COMPTE ADMINISTRATEUR & ENTREPRISE (SaaS Multi-Tenant) */}
            {/* ============================================================== */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-3 rounded-2xl border border-blue-100 flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Nouvelle Organisation sur FacturX</h3>
                    <p className="text-[11px] text-slate-500">Créez votre entreprise et devenez Administrateur Général.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Nom de l&apos;Entreprise *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex: AFRICAN TECH SARL"
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Nom complet de l&apos;Admin *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex: Yav Neville"
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Email Professionnel (code OTP) *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="admin@organisation.cd"
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Téléphone
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+243 82 000 00 00"
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Devise Principale *
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrency(val);
                        if (val.includes("CDF") || val.includes("FC")) setCurrencySymbol("FC");
                        else if (val.includes("XOF")) setCurrencySymbol("FCFA");
                        else if (val.includes("USD")) setCurrencySymbol("$");
                        else if (val.includes("EUR")) setCurrencySymbol("€");
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
                    >
                      <option value="Franc Congolais (CDF / FC)">Franc Congolais (CDF / FC)</option>
                      <option value="Franc CFA (XOF)">Franc CFA (XOF)</option>
                      <option value="Dollar Américain (USD / $)">Dollar Américain (USD / $)</option>
                      <option value="Euro (EUR / €)">Euro (EUR / €)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Ville & Pays
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Kinshasa, RDC"
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Mot de Passe * (min 6 caractères)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Sécurité renforcée :</strong> Dès votre inscription, Supabase vous
                    enverra un <strong>code d&apos;authentification par email</strong> afin de
                    valider votre adresse avant de vous autoriser l&apos;accès.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Envoyer le Code de Vérification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ============================================================== */}
            {/* 3. VUE : VÉRIFICATION DU CODE OTP DE SÉCURITÉ PAR EMAIL */}
            {/* ============================================================== */}
            {activeTab === "otp_verify" && (
              <div className="space-y-6 animate-fadeIn text-center">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                  <KeyRound className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-3 py-1 rounded-full border border-blue-200">
                    Contrôle de Sécurité Supabase
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2.5">
                    Vérification de votre Adresse Email
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                    Un code d&apos;authentification a été envoyé à l&apos;adresse :
                    <br />
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                      {pendingEmail || "votre adresse email"}
                    </span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-sm mx-auto">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Code d&apos;Authentification (6 chiffres ou lettres) *
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.toUpperCase())}
                      placeholder="123456"
                      maxLength={10}
                      autoFocus
                      className="w-full text-center py-3.5 px-4 bg-slate-50 border-2 border-blue-200 rounded-2xl text-2xl font-mono font-extrabold tracking-widest text-blue-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Valider le Code & Accéder à FacturX</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Bouton alternatif si l'utilisateur a reçu et cliqué sur un lien de confirmation Supabase */}
                <div className="max-w-sm mx-auto pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmedByEmailLink}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>J&apos;ai cliqué sur le lien reçu par email ➔ Accéder</span>
                  </button>
                </div>

                {/* Options de renvoi et retour */}
                <div className="pt-2 flex flex-col items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1.5 cursor-pointer disabled:text-slate-400"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>
                      {resendCooldown > 0
                        ? `Renvoyer un code dans ${resendCooldown}s`
                        : "Renvoyer un nouveau code par email"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("signup");
                      setErrorMessage("");
                      setSuccessNotice("");
                    }}
                    className="text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Modifier l&apos;adresse email</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER DE LA CARTE : RAPIDE ACCÈS DÉMO EN BAS (DISCRET POUR LES TESTS) */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Base Supabase PostgreSQL active
            </span>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "quick" ? "signin" : "quick")}
              className="text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{activeTab === "quick" ? "Masquer profils tests" : "Accès rapide démo"}</span>
            </button>
          </div>

          {/* ACCÈS DÉMO 1-CLIC DÉROULANT SI DEMANDÉ */}
          {activeTab === "quick" && (
            <div className="p-6 bg-slate-50/80 border-t border-slate-200/60 space-y-2.5 animate-fadeIn">
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Sélectionnez un rôle pour tester immédiatement l&apos;application :
              </p>
              {quickProfiles.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleQuickSelect(p)}
                  className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${p.avatarGradient} flex items-center justify-center text-white font-extrabold text-xs`}
                    >
                      {p.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                          {p.fullName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{p.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
