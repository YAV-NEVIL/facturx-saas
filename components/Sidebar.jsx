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
      return (
        itemId === "payments" ||
        itemId === "reports" ||
        itemId === "settings" ||
        itemId === "company" ||
        itemId === "employees"
      );
    }
    if (userRole === "gestionnaire_stock") {
      return (
        itemId === "payments" ||
        itemId === "reports" ||
        itemId === "settings" ||
        itemId === "company" ||
        itemId === "employees"
      );
    }
    return false;
  };

  const navItems = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "invoices", label: "Factures", icon: FileText, badge: invoiceCount },
    { id: "company", label: "Mon entreprise", icon: Building2 },
    { id: "clients", label: "Clients", icon: Users },
    { id: "quotes", label: "Devis et estimations", icon: Briefcase },
    { id: "payments", label: "Paiements", icon: CreditCard },
    { id: "employees", label: "Employés", icon: ShieldCheck },
    { id: "analytics", label: "Analytique", icon: BarChart3 },
    { id: "reports", label: "Rapports", icon: FileSpreadsheet },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  const roleName =
    userRole === "admin"
      ? "Direction"
      : userRole === "comptable"
      ? "Comptabilité"
      : userRole === "gestionnaire_stock"
      ? "Logistique"
      : "Commercial";

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-150"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container — Pass 1 & Pass 2: 260px wide, deepest graphite #0f0f10, hairline border */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[260px] max-w-[85vw] overflow-y-auto overscroll-contain bg-[#0f0f10] text-[#ededed] border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-4">
          <div className="flex items-center justify-between h-9 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[7px] bg-[#19191b] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4 stroke-[1.5] text-[#ededed]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-[17px] leading-none text-[#ededed]">
                  FacturX
                </span>
                <span className="text-xs text-[#85858b] font-mono">
                  {roleName}
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-[8px] text-[#85858b] hover:text-[#ededed] hover:bg-[#19191b] transition-colors duration-150"
              aria-label="Fermer le menu"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>

          {/* Navigation — Pass 1: 36px rows (h-9), 4px gap (space-y-1), 18px icons in one column */}
          <div className="mt-6">
            <span className="px-3 text-xs text-[#85858b] block mb-2">
              Navigation
            </span>
            <nav className="space-y-1">
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
                    className={`w-full h-9 flex items-center justify-between px-3 rounded-[8px] text-[14px] transition-colors duration-150 ${
                      isActive
                        ? "bg-[#232325] text-[#ededed] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : isRestricted
                        ? "text-[#85858b]/60 hover:text-[#a1a1a6] hover:bg-[#19191b]"
                        : "text-[#a1a1a6] hover:text-[#ededed] hover:bg-[#19191b]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-[18px] h-[18px] stroke-[1.5] shrink-0 ${
                          isActive
                            ? "text-[#ededed]"
                            : isRestricted
                            ? "text-[#85858b]/50"
                            : "text-[#85858b]"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isRestricted && (
                        <Lock className="w-3.5 h-3.5 stroke-[1.5] text-[#85858b]/60" />
                      )}

                      {item.badge !== undefined && (
                        <span
                          className={`text-xs font-mono tabular-nums ${
                            isActive ? "text-[#ededed]" : "text-[#85858b]"
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
        </div>

        {/* Bottom Card — Quiet surface #19191b, off-white primary button */}
        <div className="p-4 pt-2">
          <div className="bg-[#19191b] border border-white/[0.08] rounded-[12px] p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cc38a]" />
              <span className="text-xs text-[#a1a1a6]">
                Conforme OHADA et DGI
              </span>
            </div>

            <p className="text-xs text-[#85858b] leading-relaxed mb-3">
              Facturation certifiée TVA et suivi multi-devises
            </p>

            <button
              onClick={() => {
                if (onOpenCreateModal) onOpenCreateModal();
                if (isMobileOpen) setIsMobileOpen(false);
              }}
              className="w-full h-9 px-3 bg-[#ededed] hover:bg-white active:scale-[0.98] text-[#0f0f10] font-medium text-xs rounded-[8px] flex items-center justify-center gap-2 transition-[background-color,transform] duration-150"
            >
              <FilePlus className="w-4 h-4 stroke-[1.5]" />
              <span>Nouvelle facture</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5] ml-auto" />
            </button>
          </div>

          <div className="mt-3 px-1 flex items-center justify-between text-xs text-[#85858b] font-mono tabular-nums">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5] text-[#4cc38a]" />
              <span>Chiffré</span>
            </span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
