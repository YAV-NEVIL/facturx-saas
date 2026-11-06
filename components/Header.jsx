"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Calendar,
  Bell,
  ChevronDown,
  Menu,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Building2,
  LogOut,
  X,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";

import CalendarDropdown from "./CalendarDropdown";

export default function Header({
  searchQuery = "",
  setSearchQuery,
  onOpenMobileMenu,
  selectedDate = "21/10/2026",
  onSelectDate,
  selectedPeriod = "Ce mois-ci",
  onSelectPeriod,
  invoiceDates = [],
  companyInfo = null,
  onNavigate = null,
  isSyncing = false,
  isSupabaseConnected = true,
  isOffline = false,
  pendingSyncCount = 0,
  onTriggerSync = null,
  userProfile = null,
  onOpenAuthModal = null,
  onSignOut = null,
  notifications = [],
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);

  // Raccourci global Ctrl+K ou Cmd+K pour activer la recherche instantanément
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && isSearchFocused) {
        searchInputRef.current?.blur();
        setIsSearchFocused(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchFocused]);

  const quickFilters = ["Payée", "En retard", "Kinshasa", "Lubumbashi"];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 transition-all">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Mobile Menu Button + Search Input avec animation et focus glow */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Search bar avec animations et interactions riches */}
          <div className="relative w-full min-w-0 group">
            <div
              className={`relative flex items-center w-full transition-all duration-300 rounded-xl border ${
                isSearchFocused
                  ? "bg-white border-[#183BB0] ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/5"
                  : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/90"
              }`}
            >
              <Search
                className={`w-4 h-4 ml-3 transition-all duration-200 shrink-0 ${
                  isSearchFocused
                    ? "text-[#183BB0] scale-110"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />

              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                placeholder="Rechercher factures, clients..."
                className="w-full pl-2.5 pr-3 sm:pr-20 py-2 bg-transparent text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none min-w-0"
              />

              {/* Bouton d'effacement rapide si du texte est saisi */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    if (setSearchQuery) setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-md transition-colors shrink-0"
                  title="Effacer la recherche"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Raccourci clavier visuel Ctrl+K */}
              <div className="pr-3 hidden sm:flex items-center gap-1 shrink-0 select-none pointer-events-none">
                <kbd
                  className={`px-1.5 py-0.5 text-[10px] font-semibold border rounded shadow-2xs transition-colors ${
                    isSearchFocused
                      ? "bg-blue-50 text-[#183BB0] border-blue-200"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}
                >
                  Ctrl
                </kbd>
                <span className="text-[10px] text-slate-400">+</span>
                <kbd
                  className={`px-1.5 py-0.5 text-[10px] font-semibold border rounded shadow-2xs transition-colors ${
                    isSearchFocused
                      ? "bg-blue-50 text-[#183BB0] border-blue-200"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}
                >
                  K
                </kbd>
              </div>
            </div>

            {/* Menu suggestions animées au focus */}
            {isSearchFocused && !searchQuery && (
              <div className="absolute top-full left-0 right-0 min-w-[250px] sm:min-w-0 mt-2 p-3 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-top-1 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#183BB0]" />
                    Filtres rapides :
                  </span>
                  <span className="hidden sm:inline">Échap pour fermer</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickFilters.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (setSearchQuery) setSearchQuery(tag);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-[#183BB0] text-slate-600 font-semibold border border-slate-200/80 transition-all text-[11px]"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cloud Badge, Date Selector, Notifications, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-5 shrink-0">
          {/* Badge Statut Supabase Full-Stack & Mode Hors-Ligne */}
          <div className="hidden sm:flex items-center gap-2">
            {isOffline ? (
              <button
                type="button"
                onClick={onTriggerSync}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs hover:bg-amber-100 transition-all cursor-pointer"
                title={
                  pendingSyncCount > 0
                    ? `${pendingSyncCount} modification(s) enregistrée(s) hors-ligne. Cliquez pour tenter la synchronisation.`
                    : "Vous êtes actuellement hors-ligne. Les modifications sont enregistrées localement."
                }
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="text-[11px] font-bold tracking-tight">
                  Hors-Ligne {pendingSyncCount > 0 ? `(${pendingSyncCount})` : ""}
                </span>
                {pendingSyncCount > 0 && onTriggerSync && (
                  <RefreshCw className="w-3 h-3 text-amber-700 hover:rotate-180 transition-transform" />
                )}
              </button>
            ) : isSyncing ? (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                title="Synchronisation de vos données en cours..."
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span className="text-[11px] font-bold tracking-tight">
                  Synchronisation {pendingSyncCount > 0 ? `(${pendingSyncCount})` : "..."}
                </span>
              </div>
            ) : pendingSyncCount > 0 ? (
              <button
                type="button"
                onClick={onTriggerSync}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs hover:bg-amber-100 transition-all cursor-pointer"
                title={`${pendingSyncCount} action(s) en attente de synchronisation. Cliquez pour synchroniser.`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-[11px] font-bold tracking-tight">
                  {pendingSyncCount} en attente
                </span>
                <RefreshCw className="w-3 h-3 text-amber-700" />
              </button>
            ) : (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                  isSupabaseConnected
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
                title={
                  isSupabaseConnected
                    ? "Synchronisation cloud active en direct"
                    : "Mode local activé"
                }
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSupabaseConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                <span className="text-[11px] font-bold tracking-tight">
                  {isSupabaseConnected ? "Synchronisé" : "Mode Local"}
                </span>
              </div>
            )}
          </div>

          {/* Interactive Date Selector with Calendar Dropdown */}
          <div className="hidden md:block">
            <CalendarDropdown
              selectedDate={selectedDate}
              onSelectDate={onSelectDate}
              selectedPeriod={selectedPeriod}
              onSelectPeriod={onSelectPeriod}
              invoiceDates={invoiceDates}
              buttonClassName="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              align="right"
            />
          </div>

          {/* Notifications Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2 sm:p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            {/* Notification Popover (Mobile-safe fixed inset-x-3 on small screens) */}
            {showNotifications && (
              <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {notifications.length} nouvelle{notifications.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Fermer
                  </button>
                </div>

                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600">Aucune nouvelle notification</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Vos alertes de règlements et relances apparaîtront ici.</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className="px-4 py-3 hover:bg-slate-50/80 transition-colors flex items-start gap-3 cursor-pointer"
                      >
                        <div className="mt-0.5 shrink-0">
                          {item.type === "success" && (
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                          {item.type === "warning" && (
                            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          )}
                          {item.type === "info" && (
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500 truncate">{item.desc}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{item.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 pt-2 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        if (onNavigate) onNavigate("invoices");
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Voir toutes les factures →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 transition-colors text-left"
            >
              <div className="relative">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr ${
                  userProfile?.role === "commercial"
                    ? "from-emerald-600 to-teal-500"
                    : userProfile?.role === "comptable"
                    ? "from-blue-600 to-indigo-600"
                    : userProfile?.role === "gestionnaire_stock"
                    ? "from-amber-600 to-orange-500"
                    : "from-purple-600 to-indigo-700"
                } border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-xs overflow-hidden`}>
                  <span className="text-xs sm:text-sm">{userProfile?.initials || "FX"}</span>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>

              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {userProfile?.fullName || "Administrateur"}
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-[11px] text-slate-500 font-medium">
                    {userProfile?.role === "admin"
                      ? "Propriétaire"
                      : userProfile?.role === "comptable"
                      ? "Comptabilité"
                      : userProfile?.role === "commercial"
                      ? "Commercial"
                      : userProfile?.role === "gestionnaire_stock"
                      ? "Gestionnaire Stock"
                      : userProfile?.badge || "Utilisateur"}
                  </p>
                </div>
              </div>

              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800">{userProfile?.fullName || "Administrateur"}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      userProfile?.role === "commercial"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : userProfile?.role === "comptable"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : userProfile?.role === "gestionnaire_stock"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}>
                      {userProfile?.role === "admin"
                        ? "Admin"
                        : userProfile?.role === "comptable"
                        ? "Comptable"
                        : userProfile?.role === "commercial"
                        ? "Commercial"
                        : userProfile?.role === "gestionnaire_stock"
                        ? "Stock"
                        : "Membre"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{userProfile?.email || ""}</p>
                </div>
                <div className="py-1">
                  {userProfile?.role === "admin" && (
                    <button
                      onClick={() => {
                        if (onNavigate) onNavigate("employees");
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-xs text-blue-700 hover:bg-blue-50 flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-blue-600" />
                      <span>Gérer mes Collaborateurs</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate("settings");
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Mon Profil & Sécurité</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate("company");
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>Paramètres Entreprise</span>
                  </button>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onSignOut) onSignOut();
                    }}
                    className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
