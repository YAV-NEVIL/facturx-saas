"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  FileText,
  Calendar,
  Building2,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
} from "lucide-react";
import { defaultClients, defaultCompanyInfo, formatAmount } from "@/lib/mock-data";

export default function CreateQuoteModal({
  isOpen,
  onClose,
  onCreateQuote,
  clients = defaultClients,
  companyInfo = defaultCompanyInfo,
  initialQuoteCount = 5,
  initialSelectedClient = null,
  existingQuotes = [],
}) {
  const activeCompany = companyInfo || defaultCompanyInfo;

  // Numéro de devis auto-généré sans risque de collision
  const quoteNumbers = (existingQuotes || [])
    .map((q) => {
      const match = q.id && q.id.match(/DEV-2026-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(Boolean);
  const maxNum = quoteNumbers.length > 0 ? Math.max(...quoteNumbers) : initialQuoteCount;
  const nextQuoteNumber = `DEV-2026-${String(maxNum + 1).padStart(3, "0")}`;

  // État du client
  const [clientMode, setClientMode] = useState("existing");
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
    initialSelectedClient?.phone || clients[0]?.phone || "+243 99 000 00 00"
  );
  const [address, setAddress] = useState(
    initialSelectedClient?.address || clients[0]?.address || ""
  );
  const [location, setLocation] = useState(
    initialSelectedClient?.location || clients[0]?.location || "Kinshasa, RDC"
  );
  const [taxId, setTaxId] = useState(
    initialSelectedClient?.taxId || clients[0]?.taxId || ""
  );

  // Dates et validité
  const [issueDate, setIssueDate] = useState("22/10/2026");
  const [validityDays, setValidityDays] = useState(30);
  const [validUntil, setValidUntil] = useState("22/11/2026");

  // Articles / Prestations
  const [items, setItems] = useState([
    { id: 1, description: "Étude technique & déploiement de solution", quantity: 1, unitPrice: 4500000 },
  ]);

  // TVA et conditions
  const [vatRate, setVatRate] = useState(activeCompany?.defaultVatRate ?? 0.16);
  const [notes, setNotes] = useState(
    "Offre commerciale valable 30 jours. Acompte de 40% à la validation du devis, solde à la livraison finale."
  );

  // Synchronisation si initialSelectedClient change
  useEffect(() => {
    if (initialSelectedClient) {
      setSelectedClientName(initialSelectedClient.name);
      setClientName(initialSelectedClient.name);
      setContactPerson(initialSelectedClient.contactPerson || "");
      setClientEmail(initialSelectedClient.email || "");
      setClientPhone(initialSelectedClient.phone || "");
      setAddress(initialSelectedClient.address || "");
      setLocation(initialSelectedClient.location || "");
      setTaxId(initialSelectedClient.taxId || "");
      setClientMode("existing");
    }
  }, [initialSelectedClient]);

  // Sélection d'un client existant
  const handleClientSelect = (e) => {
    const name = e.target.value;
    setSelectedClientName(name);
    const found = clients.find((c) => c.name === name);
    if (found) {
      setClientName(found.name);
      setContactPerson(found.contactPerson || "");
      setClientEmail(found.email || "");
      setClientPhone(found.phone || "");
      setAddress(found.address || "");
      setLocation(found.location || "");
      setTaxId(found.taxId || "");
    }
  };

  // Calcul de la date de fin de validité
  const handleValidityChange = (days) => {
    setValidityDays(days);
    // Calcul simple pour la date JJ/MM/AAAA
    const [d, m, y] = issueDate.split("/").map(Number);
    const current = new Date(y, m - 1, d);
    current.setDate(current.getDate() + Number(days));
    const nextD = String(current.getDate()).padStart(2, "0");
    const nextM = String(current.getMonth() + 1).padStart(2, "0");
    const nextY = current.getFullYear();
    setValidUntil(`${nextD}/${nextM}/${nextY}`);
  };

  // Gestion des articles
  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Calculs financiers
  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );
  const vatAmount = Math.round(subtotal * (Number(vatRate) || 0));
  const total = subtotal + vatAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const newQuote = {
      id: nextQuoteNumber,
      clientName: clientName.trim(),
      contactPerson: contactPerson.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      address: address.trim(),
      location: location.trim(),
      taxId: taxId.trim(),
      issueDate,
      validUntil,
      status: "en_attente", // Toujours en attente à la création
      items: items.map((it) => ({
        description: it.description || "Prestation",
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
      })),
      vatRate: Number(vatRate),
      notes: notes.trim(),
    };

    onCreateQuote(newQuote);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Boîte Modale */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full my-8 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Entête de la Modale */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-[#183BB0] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FileText className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">
                  Établir un Nouveau Devis
                </h2>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/30 font-bold">
                  {nextQuoteNumber}
                </span>
              </div>
              <p className="text-xs text-blue-100/80 mt-0.5">
                Proposition commerciale et chiffrage officiel ({activeCompany.name})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* 1. Sélection ou Saisie du Client */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                Entreprise Cliente (Destinataire de l&apos;offre)
              </label>

              {/* Bascule client existant / nouveau */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setClientMode("existing");
                    if (clients.length > 0) {
                      const first = clients[0];
                      setSelectedClientName(first.name);
                      setClientName(first.name);
                      setContactPerson(first.contactPerson || "");
                      setClientEmail(first.email || "");
                      setClientPhone(first.phone || "");
                      setAddress(first.address || "");
                      setLocation(first.location || "");
                      setTaxId(first.taxId || "");
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    clientMode === "existing"
                      ? "bg-white text-blue-700 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Client Répertoire
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClientMode("new");
                    setSelectedClientName("");
                    setClientName("");
                    setContactPerson("");
                    setClientEmail("");
                    setClientPhone("");
                    setAddress("");
                    setLocation("Kinshasa, RDC");
                    setTaxId("");
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    clientMode === "new"
                      ? "bg-white text-blue-700 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Nouveau Prospect
                </button>
              </div>
            </div>

            {clientMode === "existing" ? (
              <div className="space-y-3">
                <select
                  value={selectedClientName}
                  onChange={handleClientSelect}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                >
                  {clients.map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name} — {c.contactPerson || c.location}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Contact :</span>
                    <strong className="text-slate-900 block truncate">{contactPerson || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Téléphone :</span>
                    <strong className="text-slate-900 font-mono block">{clientPhone || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Email :</span>
                    <strong className="text-slate-900 block truncate">{clientEmail || "—"}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Raison Sociale de l&apos;entreprise *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Société Minière du Katanga SAS"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Interlocuteur / Titre
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Ex: M. Patrick Mboma (DG)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Téléphone direct
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+243 99 000 00 00"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Email officiel
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="contact@entreprise.cd"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Ville / Province
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Lubumbashi, RDC"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Dates & Durée de Validité du Devis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Date d&apos;Émission
              </label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                placeholder="22/10/2026"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Validité de l&apos;offre
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[15, 30, 60].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleValidityChange(days)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      validityDays === days
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {days} j
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Date d&apos;Échéance / Fin de Validité
              </label>
              <input
                type="text"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          {/* 3. Lignes de Prestations et Chiffrage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Détail des Prestations & Fournitures
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100"
                >
                  <div className="col-span-12 sm:col-span-6">
                    <label className="text-[10px] text-slate-400 font-bold block sm:hidden">
                      Description
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Désignation du service ou matériel chiffré..."
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold block sm:hidden">
                      Qté
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label className="text-[10px] text-slate-400 font-bold block sm:hidden">
                      Prix Unitaire HT
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      required
                      placeholder="Prix unit. HT"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(index, "unitPrice", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-right font-mono focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
                      title="Supprimer cette ligne"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Totaux et Taux de TVA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Taux de TVA applicable
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { rate: 0.16, label: "16% (RDC)" },
                  { rate: 0.18, label: "18% (UEMOA)" },
                  { rate: 0, label: "0% (Exonéré)" },
                ].map((vat) => (
                  <button
                    key={vat.rate}
                    type="button"
                    onClick={() => setVatRate(vat.rate)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                      vatRate === vat.rate
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {vat.label}
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Conditions de règlement & Validité
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Modalités de paiement, acomptes, délais d'exécution..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Récapitulatif Chiffré */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 flex flex-col justify-center">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Sous-total HT :</span>
                <span className="font-bold font-mono">
                  {formatAmount(subtotal, activeCompany.defaultCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>TVA ({Math.round(vatRate * 100)}%) :</span>
                <span className="font-bold font-mono">
                  {formatAmount(vatAmount, activeCompany.defaultCurrency)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-extrabold text-sm text-slate-900">
                  Total Estimé TTC :
                </span>
                <span className="font-extrabold text-lg text-[#183BB0] font-mono">
                  {formatAmount(total, activeCompany.defaultCurrency)}
                </span>
              </div>
            </div>
          </div>

          {/* Boutons d'Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Créer et Enregistrer le Devis</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
