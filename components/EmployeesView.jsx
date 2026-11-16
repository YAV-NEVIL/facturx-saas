"use client";

import React, { useState } from "react";
import {
  Users,
  Shield,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Briefcase,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit2,
  Lock,
  Sparkles,
  X,
  Building2,
  UserCheck,
  BarChart3,
  Package,
  Send,
  Loader2,
} from "lucide-react";

const EMPLOYEE_ROLE_META = {
  admin: {
    id: "admin",
    title: "Administrateur",
    fullTitle: "Administrateur Général",
    badge: "Propriétaire",
    desc: "Accès total sans restriction",
  },
  comptable: {
    id: "comptable",
    title: "Responsable Comptable",
    fullTitle: "Responsable Comptable",
    badge: "Comptabilité",
    desc: "Factures, Devis, Paiements & TVA",
  },
  commercial: {
    id: "commercial",
    title: "Chargé Commercial",
    fullTitle: "Chargé Commercial",
    badge: "Commercial",
    desc: "Devis, CRM Clients",
  },
  gestionnaire_stock: {
    id: "gestionnaire_stock",
    title: "Gestionnaire Stock",
    fullTitle: "Gestionnaire de Stock",
    badge: "Gestionnaire Stock",
    desc: "Articles, Devis, Facturation",
  },
};

export default function EmployeesView({
  currentUser,
  teamMembers = [],
  onCreateMember,
  onUpdateMember,
  onDeleteMember,
  companyInfo = null,
  subscriptionPlan = "free",
  onNavigateToPricing = null,
  onToast,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [memberToEdit, setMemberToEdit] = useState(null);

  // Formulaire d'ajout d'employé
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("+243 ");
  const [newMemberRole, setNewMemberRole] = useState("comptable");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [sendInviteEmail, setSendInviteEmail] = useState(true);
  const [includePasswordInInvite, setIncludePasswordInInvite] = useState(false);
  const [resendingMemberId, setResendingMemberId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vérification stricte du rôle Administrateur
  const isAdmin = currentUser?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Accès Réservé à l&apos;Administrateur Général
        </h2>
        <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
          Le module de gestion des employés et des présences est strictement restreint. Votre compte
          actuel ({currentUser?.fullName} — {currentUser?.badge || currentUser?.role}) ne dispose
          pas des privilèges nécessaires pour consulter ou modifier l&apos;équipe.
        </p>
      </div>
    );
  }

  // Restriction stricte sur l'offre Free : pas de droit d'inclure des employés
  if (subscriptionPlan === "free") {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-12 text-center max-w-xl mx-auto my-8 space-y-5 animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
            Restriction Offre Free (0 $)
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-3">
            L&apos;inclusion d&apos;employés n&apos;est pas autorisée dans l&apos;offre Free
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            L&apos;offre gratuite est limitée à <strong>1 seul accès (Propriétaire)</strong> et{" "}
            <strong>3 factures</strong>. Passez à l&apos;offre{" "}
            <strong className="text-slate-900">Starter (14 $/mois)</strong> pour inclure jusqu&apos;à
            3 employés, ou à l&apos;offre{" "}
            <strong className="text-[#183BB0]">Business (34 $/mois)</strong> pour un nombre illimité
            de collaborateurs.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigateToPricing && onNavigateToPricing()}
            className="w-full sm:w-auto px-6 py-3 bg-[#183BB0] hover:bg-[#122F8C] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Voir les abonnements Starter (14 $) & Business (34 $)</span>
          </button>
        </div>
      </div>
    );
  }

  // Filtrage des collaborateurs
  const filteredMembers = teamMembers.filter((m) => {
    const matchesSearch =
      (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.phone || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || m.role === roleFilter;

    const isOnline = m.status === "En ligne";
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "online"
        ? isOnline
        : !isOnline;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Métriques d'équipe
  const totalEmployees = teamMembers.length;
  const onlineEmployees = teamMembers.filter((m) => m.status === "En ligne").length;
  const adminEmployees = teamMembers.filter((m) => m.role === "admin").length;
  const operationalEmployees = totalEmployees - adminEmployees;

  const sendEmployeeInvitationEmail = async (memberData, temporaryPassword = "") => {
    const roleMeta = EMPLOYEE_ROLE_META[memberData.role] || EMPLOYEE_ROLE_META.comptable;
    const companyName = companyInfo?.name || currentUser?.companyName || "FacturX";
    const inviterName = currentUser?.fullName || currentUser?.name || "L'administrateur";
    const loginUrl =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://facturx-saas.vercel.app";

    const messageLines = [
      `Bonjour ${memberData.name},`,
      "",
      `${inviterName} vous a ajouté comme collaborateur au sein de l'espace FacturX de « ${companyName} ».`,
      `Votre poste attribué est : ${roleMeta.fullTitle} (${roleMeta.desc}).`,
      "",
      temporaryPassword
        ? `Vous pouvez vous connecter dès maintenant avec votre email (${memberData.email}) et votre mot de passe provisoire indiqué ci-dessous.`
        : `Connectez-vous avec votre adresse email (${memberData.email}) et le mot de passe provisoire communiqué par votre administrateur.`,
      "",
      `Lien de connexion : ${loginUrl}`,
    ];

    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "employee_invite",
        to: memberData.email,
        toName: memberData.name,
        subject: `Invitation FacturX — Rejoignez ${companyName}`,
        message: messageLines.join("\n"),
        replyTo: companyInfo?.email || currentUser?.email || "",
        companyInfo: companyInfo || { name: companyName },
        employee: {
          name: memberData.name,
          email: memberData.email,
          role: memberData.role,
          roleLabel: roleMeta.fullTitle,
          permissionsDesc: roleMeta.desc,
          invitedBy: inviterName,
          loginUrl,
          temporaryPassword: temporaryPassword || undefined,
        },
      }),
    });

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && Boolean(data.sentAutomatically), data };
  };

  const handleResendInvite = async (member) => {
    if (!member?.email) return;
    setResendingMemberId(member.id || member.email);
    try {
      const result = await sendEmployeeInvitationEmail(member);
      if (result.ok) {
        if (onToast) {
          onToast(`Invitation renvoyée par email à ${member.email} !`, "success");
        }
      } else if (onToast) {
        onToast(
          result.data?.error || "Impossible d'envoyer l'email d'invitation automatiquement.",
          "error"
        );
      }
    } catch (err) {
      console.error("Erreur renvoi invitation:", err);
      if (onToast) onToast("Erreur réseau lors de l'envoi de l'invitation.", "error");
    } finally {
      setResendingMemberId(null);
    }
  };

  // Soumission du formulaire d'ajout
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      if (onToast) onToast("Le nom et l'email sont obligatoires.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const roleMeta = EMPLOYEE_ROLE_META[newMemberRole] || EMPLOYEE_ROLE_META.comptable;
      const memberPayload = {
        name: newMemberName.trim(),
        email: newMemberEmail.trim().toLowerCase(),
        phone: newMemberPhone.trim(),
        password: newMemberPassword.trim(),
        role: newMemberRole,
        badge: roleMeta.badge,
        status: "Invité",
      };

      await onCreateMember(memberPayload);

      let inviteSent = false;
      let inviteError = null;
      if (sendInviteEmail) {
        try {
          const inviteRes = await sendEmployeeInvitationEmail(
            memberPayload,
            includePasswordInInvite ? newMemberPassword.trim() : ""
          );
          inviteSent = inviteRes.ok;
          if (!inviteRes.ok) {
            inviteError = inviteRes.data?.error || "Passerelle email indisponible";
          }
        } catch (inviteErr) {
          inviteError = inviteErr.message;
        }
      }

      setIsCreateModalOpen(false);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberPhone("+243 ");
      setNewMemberPassword("");
      setNewMemberRole("comptable");
      setSendInviteEmail(true);
      setIncludePasswordInInvite(false);

      if (onToast) {
        if (sendInviteEmail && inviteSent) {
          onToast(
            `Collaborateur créé et invitation envoyée à ${memberPayload.email} !`,
            "success"
          );
        } else if (sendInviteEmail && inviteError) {
          onToast(
            `Collaborateur créé, mais l'email d'invitation n'a pas pu partir (${inviteError}).`,
            "info"
          );
        } else {
          onToast("Collaborateur créé et ajouté à votre organisation !", "success");
        }
      }
    } catch (err) {
      console.error("Erreur création employé:", err);
      if (onToast) onToast(err.message || "Erreur lors de la création de l'employé.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleBadgeStyle = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "comptable":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "commercial":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "gestionnaire_stock":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const roleLabel = (role) => {
    switch (role) {
      case "admin":
        return (
          <>
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Administrateur Général</span>
          </>
        );
      case "comptable":
        return (
          <>
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Responsable Comptable</span>
          </>
        );
      case "commercial":
        return (
          <>
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span>Chargé Commercial</span>
          </>
        );
      case "gestionnaire_stock":
        return (
          <>
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span>Gestionnaire de Stock</span>
          </>
        );
      default:
        return "Membre de l'équipe";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header de Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Gestion des Employés & Collaborateurs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
              {totalEmployees} membres
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Supervisez les présences en direct, les habilitations hiérarchiques et les accès de{" "}
            <span className="font-bold text-slate-700">
              {companyInfo?.name || currentUser?.companyName || "votre entreprise"}
            </span>
            .
          </p>
        </div>

        <button
          onClick={() => {
            if ((subscriptionPlan === "starter" || subscriptionPlan === "stargate") && totalEmployees >= 3) {
              if (onToast) {
                onToast(
                  "Limite Starter atteinte (3/3 employés). Passez à l'offre Business (34 $) pour des employés illimités.",
                  "info"
                );
              }
              if (onNavigateToPricing) onNavigateToPricing();
              return;
            }
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Ajouter un Collaborateur
        </button>
      </div>

      {/* Rangée de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1 : Total Employés */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Effectif
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
              {totalEmployees}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Membres de votre organisation</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 : En Ligne Actuellement (Pastille verte pulsante) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              En Ligne Actuellement
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600">
                {onlineEmployees}
              </p>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Sessions actives en direct</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 : Direction & Administrateurs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Direction & Admins
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-purple-700 mt-1">
              {adminEmployees}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Accès total sans restriction</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 : Opérationnels */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Équipe Opérationnelle
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
              {operationalEmployees}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Comptabilité, Vente, Stock</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filtre Présence */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="online">En ligne</option>
            <option value="offline">Hors ligne</option>
          </select>

          {/* Filtre Rôle */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 cursor-pointer"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateur</option>
            <option value="comptable">Comptable</option>
            <option value="commercial">Commercial</option>
            <option value="gestionnaire_stock">Gestionnaire Stock</option>
          </select>
        </div>
      </div>

      {/* Tableau des Collaborateurs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Collaborateur
                </th>
                <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Niveau Hiérarchique & Poste
                </th>
                <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Présence en Direct
                </th>
                <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Coordonnées Téléphoniques
                </th>
                <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                    Aucun collaborateur ne correspond à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isOnline = member.status === "En ligne";
                  const isCurrentUser = member.email === currentUser?.email;

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Nom & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                              {member.initials || "FX"}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                              }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {member.name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  Vous
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{member.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rôle & Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleBadgeStyle(
                            member.role
                          )}`}
                        >
                          {roleLabel(member.role)}
                        </span>
                      </td>

                      {/* Présence en Direct */}
                      <td className="py-4 px-6">
                        {isOnline ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              En ligne
                            </span>
                            <span className="text-xs text-slate-400">Actif maintenant</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
                              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                              Hors ligne
                            </span>
                            <span className="text-xs text-slate-400">
                              Dernière : {member.lastLogin || "Inconnue"}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Téléphone */}
                      <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.phone || "Non renseigné"}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          {!isCurrentUser && member.email && (
                            <button
                              type="button"
                              onClick={() => handleResendInvite(member)}
                              disabled={resendingMemberId === (member.id || member.email)}
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                              title="Envoyer / renvoyer l'email d'invitation"
                            >
                              {resendingMemberId === (member.id || member.email) ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {/* Supprimer (si ce n'est pas le compte actif) */}
                          {!isCurrentUser && (
                            <button
                              onClick={() => setMemberToDelete(member)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Révoquer l'accès"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      </div>

      {/* MODALE D'AJOUT DE COLLABORATEUR (Mobile-First : feuille coulissante & scroll fluide) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92dvh] flex flex-col border border-slate-100 shadow-2xl overflow-hidden">
            <div className="shrink-0 bg-gradient-to-r from-[#1A44B8] via-[#163DA9] to-[#112F85] text-white p-4 sm:p-6 relative">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 pr-10">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                    Ajouter un Nouveau Collaborateur
                  </h3>
                  <p className="text-[11px] sm:text-xs text-blue-200">
                    Attribuez un poste et configurez les droits d&apos;accès
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Nom Complet du Collaborateur *
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Ex: Prénom & Nom du collaborateur"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Email Professionnel *
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="collaborateur@votre-entreprise.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Téléphone Professionnel
                </label>
                <input
                  type="tel"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  placeholder="+243 85 333 44 55"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Mot de passe provisoire du collaborateur * (min 6 caractères)
                </label>
                <input
                  type="password"
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                  placeholder="Définir son mot de passe de connexion"
                  minLength={6}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Poste & Habilitations dans l&apos;Entreprise *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      ...EMPLOYEE_ROLE_META.admin,
                      icon: <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
                    },
                    {
                      ...EMPLOYEE_ROLE_META.comptable,
                      icon: <BarChart3 className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
                    },
                    {
                      ...EMPLOYEE_ROLE_META.commercial,
                      icon: <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
                    },
                    {
                      ...EMPLOYEE_ROLE_META.gestionnaire_stock,
                      icon: <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
                    },
                  ].map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setNewMemberRole(r.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        newMemberRole === r.id
                          ? "bg-blue-50/80 border-blue-500 shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {r.icon}
                        <span>{r.title}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options d'invitation automatique par email */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={sendInviteEmail}
                    onChange={(e) => setSendInviteEmail(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                  />
                  <span>
                    Envoyer automatiquement un email d&apos;invitation au collaborateur
                    <span className="block text-[11px] font-medium text-slate-500 mt-0.5">
                      Transmet son email de connexion, son poste et le lien vers votre espace FacturX.
                    </span>
                  </span>
                </label>

                {sendInviteEmail && (
                  <label className="flex items-center gap-2.5 pl-6 cursor-pointer text-[11px] font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={includePasswordInInvite}
                      onChange={(e) => setIncludePasswordInInvite(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 rounded"
                    />
                    <span>Inclure le mot de passe provisoire dans l&apos;email d&apos;invitation</span>
                  </label>
                )}
              </div>

              </div>

              <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Enregistrement..." : "Créer le Collaborateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-6 border border-slate-100 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Révoquer l&apos;accès de {memberToDelete.name} ?
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Ce collaborateur ne pourra plus se connecter à l&apos;application FacturX. Ses données
              seront retirées des collaborateurs autorisés de votre entreprise.
            </p>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 mt-6">
              <button
                onClick={() => setMemberToDelete(null)}
                className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  await onDeleteMember(memberToDelete.id);
                  setMemberToDelete(null);
                  if (onToast) onToast("Accès révoqué avec succès.", "success");
                }}
                className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Confirmer la Révocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
