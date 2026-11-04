"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Receipt,
  Building,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Edit3,
} from "lucide-react";
import { defaultClients, defaultCompanyInfo, formatFCFA } from "@/lib/mock-data";

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onCreateInvoice,
  clients = defaultClients,
  onAddNewClient,
  initialSelectedClient = null,
  companyInfo = defaultCompanyInfo,
  existingInvoices = [],
}) {
  // Coordonnées de l'Entreprise Émettrice (Votre Société)
  const activeCompany = companyInfo || defaultCompanyInfo;
  const [companyName, setCompanyName] = useState(activeCompany.name);
  const [companyNinea, setCompanyNinea] = useState(activeCompany.ninea);
  const [companyRccm, setCompanyRccm] = useState(activeCompany.rccm);
  const [companyAddress, setCompanyAddress] = useState(activeCompany.address);
  const [companyCity, setCompanyCity] = useState(activeCompany.city || "Dakar Plateau");
  const [companyCountry, setCompanyCountry] = useState(activeCompany.country || "Sénégal");
  const [companyEmail, setCompanyEmail] = useState(activeCompany.email);
  const [companyPhone, setCompanyPhone] = useState(activeCompany.phone);
  const [showEditCompany, setShowEditCompany] = useState(false);

  // Coordonnées de l'Entreprise Cliente (Destinataire)
  const [clientMode, setClientMode] = useState("existing"); // "existing" | "new"
  const [selectedClientId, setSelectedClientId] = useState(
    initialSelectedClient?.id || clients[0]?.id || null
  );
  const [selectedClientName, setSelectedClientName] = useState(
    initialSelectedClient?.name || clients[0]?.name || ""
  );

  const [clientName, setClientName] = useState(
    initialSelectedClient?.name || clients[0]?.name || ""
  );
  const [contactPerson, setContactPerson] = useState(
    initialSelectedClient?.contactPerson || clients[0]?.contactPerson || ""
  );
  const [clientEmail, setClientEmail] = useState(
    initialSelectedClient?.email || clients[0]?.email || ""
  );
  const [clientPhone, setClientPhone] = useState(
    initialSelectedClient?.phone || clients[0]?.phone || "+221 77 492 10 20"
  );
  const [address, setAddress] = useState(
    initialSelectedClient?.address || clients[0]?.address || "Plateau"
  );
  const [location, setLocation] = useState(
    initialSelectedClient?.location || clients[0]?.location || "Dakar, Sénégal"
  );
  const [taxId, setTaxId] = useState(
    initialSelectedClient?.taxId || clients[0]?.taxId || "SN-NINEA-0089241"
  );
  const [saveToDirectory, setSaveToDirectory] = useState(true);

  // Synchronisation avec companyInfo si mis à jour
  useEffect(() => {
    if (companyInfo) {
      setCompanyName(companyInfo.name || defaultCompanyInfo.name);
      setCompanyNinea(companyInfo.ninea || defaultCompanyInfo.ninea);
      setCompanyRccm(companyInfo.rccm || defaultCompanyInfo.rccm);
      setCompanyAddress(companyInfo.address || defaultCompanyInfo.address);
      setCompanyCity(companyInfo.city || defaultCompanyInfo.city);
      setCompanyCountry(companyInfo.country || defaultCompanyInfo.country);
      setCompanyEmail(companyInfo.email || defaultCompanyInfo.email);
      setCompanyPhone(companyInfo.phone || defaultCompanyInfo.phone);
    }
  }, [companyInfo, isOpen]);

  const [issueDate, setIssueDate] = useState("21/10/2026");
  const [dueDate, setDueDate] = useState("05/11/2026");
  const [status, setStatus] = useState("envoyee");
  const [applyVat, setApplyVat] = useState(true);
  const [vatRate, setVatRate] = useState(activeCompany.defaultVatRate || 0.16); // 16% TVA RDC par défaut

  const [items, setItems] = useState([
    { description: "Prestation de développement & intégration", quantity: 1, unitPrice: 1200000 },
    { description: "Maintenance & support technique mensuel", quantity: 1, unitPrice: 350000 },
  ]);

  const [notes, setNotes] = useState("Paiement sous 15 jours par virement bancaire ou Wave.");

  // Si un client initial est fourni à l'ouverture
  useEffect(() => {
    if (initialSelectedClient) {
      handleSelectClient(initialSelectedClient);
      setClientMode("existing");
    }
  }, [initialSelectedClient]);

  if (!isOpen) return null;

  // Sélection d'un client
  const handleSelectClient = (clientObj) => {
    if (!clientObj) return;
    setSelectedClientId(clientObj.id || null);
    setSelectedClientName(clientObj.name);
    setClientName(clientObj.name);
    setContactPerson(clientObj.contactPerson || "");
    setClientEmail(clientObj.email || "");
    setClientPhone(clientObj.phone || "");
    setAddress(clientObj.address || "");
    setLocation(clientObj.location || "");
    setTaxId(clientObj.taxId || "");
  };

  const handleSelectClientByName = (name) => {
    const found = clients.find((c) => c.name === name);
    if (found) {
      handleSelectClient(found);
    }
  };

  // Line item manipulation
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === "description" ? value : Number(value) || 0;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Real-time FCFA calculations
  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const vatAmount = applyVat ? Math.round(subtotal * vatRate) : 0;
  const total = subtotal + vatAmount;

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!clientName.trim()) {
      alert("Veuillez renseigner un client.");
      return;
    }

    // Si nouveau client ou option de sauvegarde cochée, l'enregistrer dans le fichier clients
    const matchedClient = clients.find(
      (c) => c.name.toLowerCase() === clientName.trim().toLowerCase()
    );

    let finalClientId = selectedClientId || matchedClient?.id || null;

    if ((clientMode === "new" || !matchedClient || saveToDirectory) && onAddNewClient) {
      onAddNewClient({
        name: clientName.trim(),
        contactPerson: contactPerson.trim() || "Direction Financière",
        phone: clientPhone.trim() || "+243 81 000 00 00",
        email: clientEmail.trim() || `contact@${clientName.toLowerCase().replace(/[^a-z0-9]/g, "")}.cd`,
        address: address.trim() || "Gombe",
        location: location.trim() || "Kinshasa, RDC",
        taxId: taxId.trim() || `CD-NIF-${Math.floor(1000000 + Math.random() * 9000000)}`,
      });
    }

    const invoiceNumbers = (existingInvoices || [])
      .map((inv) => {
        const match = inv.id && inv.id.match(/FAC-2026-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(Boolean);
    const maxNum = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 89;
    const nextInvoiceId = `FAC-2026-${String(maxNum + 1).padStart(4, "0")}`;

    const newInvoice = {
      id: nextInvoiceId,
      clientId: finalClientId,
      company: {
        name: companyName.trim() || activeCompany.name,
        ninea: companyNinea.trim() || activeCompany.ninea,
        rccm: companyRccm.trim() || activeCompany.rccm,
        address: companyAddress.trim() || activeCompany.address,
        city: companyCity.trim() || activeCompany.city,
        country: companyCountry.trim() || activeCompany.country,
        email: companyEmail.trim() || activeCompany.email,
        phone: companyPhone.trim() || activeCompany.phone,
        logoUrl: activeCompany.logoUrl || null,
      },
      clientName: clientName.trim(),
      contactPerson: contactPerson.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      address: address.trim(),
      location: location.trim(),
      taxId: taxId.trim(),
      issueDate,
      dueDate,
      status,
      items,
      vatRate: applyVat ? vatRate : 0,
      notes,
      reminders: [],
    };

    onCreateInvoice(newInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 my-8 overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#183BB0] to-[#2D60FF] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                Créer une nouvelle facture
              </h2>
              <p className="text-xs text-blue-100">
                Calculs automatiques en Franc Congolais (CDF) avec TVA à 16% (OHADA / RDC)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 0: Entreprise Émettrice (Votre Société / Fournisseur) */}
          <div className="bg-gradient-to-br from-blue-50/70 to-slate-50 rounded-2xl p-4 sm:p-5 border border-blue-200/70 space-y-3.5">
            <div className="flex items-center justify-between border-b border-blue-200/50 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  FX
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Entreprise Émettrice (Votre Société)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold normal-case">
                      Émetteur
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Coordonnées légales figurant sur l&apos;en-tête de la facture
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditCompany(!showEditCompany)}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{showEditCompany ? "Masquer" : "Personnaliser l'émetteur"}</span>
                {showEditCompany ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Aperçu rapide de l'entreprise */}
            {!showEditCompany ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-white/80 p-3 rounded-xl border border-blue-100/80">
                <div>
                  <span className="font-extrabold text-slate-900">{companyName}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="font-mono text-slate-600">NINEA : {companyNinea}</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  <span>{companyCity}, {companyCountry}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span>{companyPhone}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Raison Sociale de l&apos;émetteur *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Numéro NINEA *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyNinea}
                    onChange={(e) => setCompanyNinea(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Numéro RCCM
                  </label>
                  <input
                    type="text"
                    value={companyRccm}
                    onChange={(e) => setCompanyRccm(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Adresse du siège
                  </label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Ville & Pays
                  </label>
                  <input
                    type="text"
                    value={`${companyCity}, ${companyCountry}`}
                    onChange={(e) => {
                      const parts = e.target.value.split(",");
                      setCompanyCity(parts[0]?.trim() || "");
                      if (parts[1]) setCompanyCountry(parts[1]?.trim() || "");
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Téléphone émetteur
                  </label>
                  <input
                    type="text"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Client & Destination */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                Entreprise Facturée (Client Destinataire)
              </label>

              {/* Mode switch pills */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setClientMode("existing")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    clientMode === "existing"
                      ? "bg-[#183BB0] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Client existant ({clients.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClientMode("new");
                    setClientName("");
                    setContactPerson("");
                    setClientPhone("");
                    setClientEmail("");
                    setAddress("");
                    setLocation("");
                    setTaxId("");
                  }}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    clientMode === "new"
                      ? "bg-[#183BB0] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Nouveau client</span>
                </button>
              </div>
            </div>

            {/* Mode 1: Sélecteur déroulant complet de tous les clients existants */}
            {clientMode === "existing" && (
              <div className="space-y-3 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Sélectionner dans le fichier clients ({clients.length} disponibles) :
                  </label>
                  <select
                    value={selectedClientName}
                    onChange={(e) => handleSelectClientByName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                  >
                    {clients.map((c, i) => (
                      <option key={i} value={c.name}>
                        {c.name} — {c.location} ({c.phone || c.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick client shortcuts pills */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">
                    Accès rapide :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {clients.slice(0, 6).map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectClient(c)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                          clientName === c.name
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Bannière Nouveau Client */}
            {clientMode === "new" && (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between animate-in fade-in">
                <span className="font-semibold flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Remplissez les informations du nouveau client :
                </span>
                <button
                  type="button"
                  onClick={() => setClientMode("existing")}
                  className="text-[11px] text-blue-700 hover:underline font-bold"
                >
                  Revenir à la liste existante
                </button>
              </div>
            )}

            {/* Grille des coordonnées détaillées du client */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nom du Client / Entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Sahel Logix SARL"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Interlocuteur (Nom & Poste)
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="M. Mamadou Diop (DAF)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Téléphone / WhatsApp Direct *
                </label>
                <input
                  type="text"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+221 77 492 10 20"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Email de facturation *
                </label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="compta@entreprise.sn"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Adresse physique
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="14 Rue Félix Faure, Plateau"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ville / Pays
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Dakar, Sénégal"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Checkbox auto-enregistrement nouveau client */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToDirectory}
                  onChange={(e) => setSaveToDirectory(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-700">
                  Enregistrer automatiquement ce client dans le fichier clients pour les prochaines factures
                </span>
              </label>

              <span className="text-[11px] text-slate-400 font-mono">
                {taxId || "SN-NINEA-0089241"}
              </span>
            </div>
          </div>

          {/* Section 2: Dates & Statut */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Date d&apos;émission (JJ/MM/AAAA)
              </label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Date d&apos;échéance (JJ/MM/AAAA)
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Statut initial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="envoyee">Envoyée (En attente de paiement)</option>
                <option value="brouillon">Brouillon (Non validée)</option>
                <option value="payee">Payée (Règlement déjà reçu)</option>
                <option value="en_attente">En retard / En attente</option>
              </select>
            </div>
          </div>

          {/* Section 3: Lignes de Facture dynamiques */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Articles & Prestations
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter une ligne
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => {
                const lineTotal = item.quantity * item.unitPrice;

                return (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl"
                  >
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        placeholder="Description du service ou produit..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-24">
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        placeholder="Qté"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center focus:outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-36">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        required
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, "unitPrice", e.target.value)
                        }
                        placeholder="Prix U (FCFA)"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right focus:outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-36 text-right font-bold text-xs text-slate-800 pr-2">
                      {formatFCFA(lineTotal)}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: TVA & Récapitulatif Totaux */}
          <div className="bg-[#EEF4FD] rounded-2xl p-5 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* TVA Toggle and Notes */}
            <div className="space-y-3 w-full md:w-1/2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="applyVat"
                  checked={applyVat}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="applyVat" className="text-xs font-bold text-slate-800">
                  Appliquer la TVA légale (18%)
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Conditions de règlement & notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Total figures */}
            <div className="w-full md:w-1/2 bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Sous-total HT :</span>
                <span className="font-semibold">{formatFCFA(subtotal)}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>TVA (18%) :</span>
                <span className="font-semibold">{formatFCFA(vatAmount)}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Total TTC :</span>
                <span className="text-base text-blue-600">{formatFCFA(total)}</span>
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold shadow-lg shadow-blue-900/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider & Générer la Facture</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
