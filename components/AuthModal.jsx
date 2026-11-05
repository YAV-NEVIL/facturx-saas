"use client";

import React, { useState } from "react";
import {
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Receipt,
  UserCheck,
  Building2,
  Briefcase,
  Layers,
} from "lucide-react";
import { signInWithEmail, signUpWithEmail } from "@/lib/supabaseService";

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onToast,
  teamMembers = [],
}) {
  const [mode, setMode] = useState("quick"); // "quick" | "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("comptable");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  // Rôles prédéfinis pour le switch instantané
  const defaultProfiles = [
    {
      id: "admin-koyinsola",
      fullName: "Koyinsola Adeyemi",
      email: "koyinsola@facturx.africa",
      role: "admin",
      roleTitle: "Administrateur Général",
      badge: "Propriétaire",
      initials: "KA",
      description: "Accès illimité : Facturation, Fiscalité, Règlements, Paramètres société et Gestion d'équipe.",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      avatarGradient: "from-amber-600 to-orange-400",
    },
    {
      id: "comptable-marcelle",
      fullName: "Marcelle Tshimanga",
      email: "marcelle.t@horizon-groupe.cd",
      role: "comptable",
      roleTitle: "Responsable Comptable",
      badge: "Comptabilité",
      initials: "MT",
      description: "Accès financier : Facturation, Encaissements, Déclarations fiscales TVA et Rapports.",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
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
      description: "Accès commercial : Pipeline de Devis, Carnet d'adresses Clients et Suivi des opportunités.",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
      description: "Accès logistique : Articles, prestations, devis et facturation. Paramètres fiscaux et paiements bloqués.",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      avatarGradient: "from-amber-600 to-orange-500",
    },
  ];

  const handleQuickSelect = (profile) => {
    if (onSelectUser) {
      onSelectUser({
        fullName: profile.fullName,
        email: profile.email,
        role: profile.role,
        badge: profile.badge,
        initials: profile.initials,
      });
    }
    if (onToast) {
      onToast(`Connecté en tant que ${profile.fullName} (${profile.roleTitle})`, "success");
    }
    onClose();
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await signInWithEmail(email, password);
      const user = data?.user;
      const userMeta = user?.user_metadata || {};
      
      const newProfile = {
        fullName: userMeta.full_name || email.split("@")[0],
        email: user.email,
        role: userMeta.role || "admin",
        badge: userMeta.role === "admin" ? "Propriétaire" : userMeta.role === "comptable" ? "Comptabilité" : "Commercial",
        initials: (userMeta.full_name || email.slice(0, 2)).slice(0, 2).toUpperCase(),
      };

      if (onSelectUser) onSelectUser(newProfile);
      if (onToast) onToast(`Connexion Supabase réussie pour ${user.email} !`, "success");
      onClose();
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setErrorMessage(err.message || "Email ou mot de passe incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await signUpWithEmail(email, password, fullName, role);
      if (onToast) {
        onToast(`Compte créé avec succès pour ${email} !`, "success");
      }
      
      const newProfile = {
        fullName: fullName || email.split("@")[0],
        email: email,
        role: role,
        badge: role === "admin" ? "Propriétaire" : role === "comptable" ? "Comptabilité" : "Commercial",
        initials: (fullName || email.slice(0, 2)).slice(0, 2).toUpperCase(),
      };

      if (onSelectUser) onSelectUser(newProfile);
      onClose();
    } catch (err) {
      console.error("Erreur d'inscription:", err);
      setErrorMessage(err.message || "Erreur lors de la création du compte.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Header de la modale */}
        <div className="bg-gradient-to-r from-[#1A44B8] via-[#163DA9] to-[#112F85] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Authentification & Gestion des Rôles</h2>
              <p className="text-xs text-blue-200">FacturX — Sécurité & Contrôle d&apos;accès RBAC</p>
            </div>
          </div>

          {/* Onglets de sélection du mode */}
          <div className="flex items-center gap-1.5 mt-5 bg-black/20 p-1 rounded-xl">
            <button
              onClick={() => {
                setMode("quick");
                setErrorMessage("");
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === "quick"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-blue-100/80 hover:text-white"
              }`}
            >
              👑 Rôles Équipe (1-Clic)
            </button>
            <button
              onClick={() => {
                setMode("signin");
                setErrorMessage("");
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-blue-100/80 hover:text-white"
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setErrorMessage("");
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-blue-100/80 hover:text-white"
              }`}
            >
              Inscription
            </button>
          </div>
        </div>

        {/* Corps de la modale */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* MODE 1 : SWITCH DE RÔLES RAPIDE EN 1-CLIC */}
          {mode === "quick" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Sélectionnez un profil pour tester les permissions et l&apos;interface correspondante :
                </p>
              </div>

              <div className="space-y-2.5">
                {defaultProfiles.map((prof) => {
                  const isCurrent = currentUser?.email === prof.email;
                  return (
                    <div
                      key={prof.id}
                      onClick={() => handleQuickSelect(prof)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                        isCurrent
                          ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20"
                          : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${prof.avatarGradient} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm`}
                        >
                          {prof.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {prof.fullName}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${prof.badgeColor}`}
                            >
                              {prof.roleTitle}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{prof.email}</p>
                          <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
                            {prof.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 pt-1">
                        {isCurrent ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-white px-2 py-1 rounded-lg border border-blue-200 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            Actif
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-400 font-medium">
                  Changement de rôle immédiat avec mise à jour des droits dans la barre latérale.
                </span>
              </div>
            </div>
          )}

          {/* MODE 2 : CONNEXION SUPABASE EMAIL/PASSWORD */}
          {mode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Adresse Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@horizongroupe.cd"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Mot de Passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Connexion en cours...</span>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Se Connecter à Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* MODE 3 : INSCRIPTION NOUVEL UTILISATEUR */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Nom Complet
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Koyinsola Adeyemi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Adresse Email Professionnelle
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nom@horizon-groupe.cd"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Rôle Attribué
                </label>
                <select
                  value={role === "admin" ? "comptable" : role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all cursor-pointer"
                >
                  <option value="comptable">Responsable Comptable (Factures, Règlements, Fiscal)</option>
                  <option value="commercial">Commercial (Devis, Estimations, Clients)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Mot de Passe (min. 6 caractères)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Création du compte...</span>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Créer mon Compte Sécurisé</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer Sécurité & Certificat */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Chiffrement TLS 256 bits & Supabase Auth
            </span>
            <span className="font-semibold text-slate-600">Multi-Tenant v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
