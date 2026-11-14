"use client";

import React from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Receipt,
  Sparkles,
  ArrowRight,
  X,
  FilePlus,
  ShieldCheck,
  Building2,
  Briefcase,
  Lock,
} from "lucide-react";

export default function Sidebar({
  activeTab = "dashboard",
  setActiveTab,
  isMobileOpen = false,
  setIsMobileOpen,
  onOpenCreateModal,
  invoiceCount = 8,
  userRole = "admin",
  userProfile = null,
}) {
  const isRestrictedForRole = (itemId) => {
    if (userRole === "admin") return false;
    if (userRole === "comptable") {
      return itemId === "settings" || itemId === "company" || itemId === "employees";
    }
    if (userRole === "commercial") {
      return itemId === "payments" || itemId === "reports" || itemId === "settings" || itemId === "company" || itemId === "employees";
    }
    if (userRole === "gestionnaire_stock") {
      return itemId === "payments" || itemId === "reports" || itemId === "settings" || itemId === "company" || itemId === "employees";
    }
    return false;
  };

  const navItems = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "invoices", label: "Factures", icon: FileText, badge: invoiceCount },
    { id: "company", label: "Mon Entreprise", icon: Building2 },
    { id: "clients", label: "Clients", icon: Users },
    { id: "quotes", label: "Devis & Estimations", icon: Briefcase },
    { id: "payments", label: "Paiements", icon: CreditCard },
    { id: "employees", label: "Employés", icon: ShieldCheck },
    { id: "analytics", label: "Analytique", icon: BarChart3 },
    { id: "reports", label: "Rapports", icon: FileSpreadsheet },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[272px] max-w-[85vw] sm:w-64 overflow-y-auto overscroll-contain bg-gradient-to-b from-[#1A44B8] via-[#163DA9] to-[#112F85] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner shrink-0">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                  Factur<span className="text-blue-200">X</span>
                </h1>
                <p className="text-[10px] sm:text-[11px] text-blue-200/80 font-medium tracking-wide uppercase">
                  Gestion & Facturation
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Rôle Actif Badge sous le logo */}
          <div className="mt-3.5 px-3 py-1.5 bg-white/10 rounded-xl border border-white/15 flex items-center justify-between text-[11px]">
            <span className="text-blue-200">
              Espace {userRole === "admin" ? "Direction" : userRole === "comptable" ? "Finance" : userRole === "gestionnaire_stock" ? "Logistique" : "Commercial"}
            </span>
            <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] ${
              userRole === "commercial"
                ? "bg-emerald-400/20 text-emerald-300"
                : userRole === "comptable"
                ? "bg-cyan-400/20 text-cyan-200"
                : userRole === "gestionnaire_stock"
                ? "bg-orange-400/20 text-orange-200"
                : "bg-amber-400/20 text-amber-200"
            }`}>
              {userRole === "admin" ? "Admin" : userRole === "comptable" ? "Comptable" : userRole === "gestionnaire_stock" ? "Stock" : "Commercial"}
            </span>
          </div>

          {/* Nav List */}
          <nav className="mt-4 sm:mt-5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isRestricted = isRestrictedForRole(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isMobileOpen) setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] sm:text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-[#2D60FF] text-white shadow-lg shadow-blue-900/40"
                      : isRestricted
                      ? "text-blue-200/50 hover:text-white/80 hover:bg-white/5"
                      : "text-blue-100/85 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? "text-white" : isRestricted ? "text-blue-300/50" : "text-blue-200/90"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isRestricted && (
                      <Lock className="w-3.5 h-3.5 text-blue-300/60" />
                    )}

                    {item.badge !== undefined && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          isActive
                            ? "bg-white text-blue-700"
                            : "bg-white/15 text-blue-100"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Card */}
        <div className="p-4 pt-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-white/15 to-white/5 border border-white/20 backdrop-blur-md rounded-2xl p-3.5 text-white shadow-inner">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 rounded-md bg-blue-400/20 text-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <span className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider">
                Conforme OHADA / RDC
              </span>
            </div>

            <p className="text-xs font-semibold text-white leading-snug mb-2.5">
              Facturation certifiée TVA & multi-devises en temps réel
            </p>

            <button
              onClick={() => {
                if (onOpenCreateModal) onOpenCreateModal();
                if (isMobileOpen) setIsMobileOpen(false);
              }}
              className="w-full py-2 px-3 bg-white hover:bg-blue-50 text-[#183DA9] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md hover:shadow-lg group"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Créer une facture</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Footer small note */}
          <div className="mt-3 px-1 flex items-center justify-between text-[10px] text-blue-300/75 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Données chiffrées
            </span>
            <span>v1.0 Pro</span>
          </div>
        </div>
      </aside>
    </>
  );
}
