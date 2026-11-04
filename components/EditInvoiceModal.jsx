"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileEdit,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Receipt,
  CheckCircle2,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
} from "lucide-react";
import { defaultClients, formatFCFA, calculateInvoiceTotals } from "@/lib/mock-data";

export default function EditInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onSave,
  clients = defaultClients,
  companyInfo = null,
}) {
  const [clientId, setClientId] = useState(null);
  const [clientName, setClientName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [taxId, setTaxId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("brouillon");
  const [items, setItems] = useState([]);
  const [vatRate, setVatRate] = useState(companyInfo?.defaultVatRate || 0.16);
  const [applyVat, setApplyVat] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (invoice) {
      setClientId(invoice.clientId || null);
      setClientName(invoice.clientName || "");
      setContactPerson(invoice.contactPerson || "");
      setClientEmail(invoice.clientEmail || "");
      setClientPhone(invoice.clientPhone || "");
      setAddress(invoice.address || "");
      setLocation(invoice.location || "");
      setTaxId(invoice.taxId || "");
      setIssueDate(invoice.issueDate || "");
      setDueDate(invoice.dueDate || "");
      setStatus(invoice.status || "brouillon");
      setItems(
        Array.isArray(invoice.items) && invoice.items.length > 0
          ? invoice.items.map((it) => ({ ...it }))
          : [{ description: "Prestation", quantity: 1, unitPrice: 0 }]
      );
      const invoiceRate =
        invoice.vatRate !== undefined
          ? invoice.vatRate
          : companyInfo?.defaultVatRate || 0.16;
      setVatRate(invoiceRate);
      setApplyVat(Boolean(invoiceRate && invoiceRate > 0));
      setNotes(invoice.notes || "");
    }
  }, [invoice, isOpen, companyInfo]);

  if (!isOpen || !invoice) return null;

  // Calculs dynamiques en FCFA
  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );
  const vatAmount = applyVat ? Math.round(subtotal * vatRate) : 0;
  const total = subtotal + vatAmount;

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === "description" ? value : Number(value) || 0;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSelectExistingClient = (name) => {
    const found = clients.find((c) => c.name === name);
    if (found) {
      setClientId(found.id || null);
      setClientName(found.name);
      setContactPerson(found.contactPerson || "");
      setClientEmail(found.email || "");
      setClientPhone(found.phone || "");
      setAddress(found.address || "");
      setLocation(found.location || "");
      setTaxId(found.taxId || "");
    } else {
      setClientId(null);
      setClientName(name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert("Veuillez renseigner un client.");
      return;
    }

    const effectiveVatRate = applyVat ? Number(vatRate) || 0.16 : 0;
    const finalVatAmount = applyVat ? Math.round(subtotal * effectiveVatRate) : 0;
    const finalTotal = subtotal + finalVatAmount;

    const updatedInvoice = {
      ...invoice,
      clientId: clientId || invoice.clientId || null,
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
      vatRate: effectiveVatRate,
      subtotal,
      vatAmount: finalVatAmount,
      total: finalTotal,
      notes,
    };

    onSave(updatedInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#183BB0] to-[#2D60FF] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <FileEdit className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">
                  Modifier la facture
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/20 border border-white/30 text-white">
                  {invoice.id}
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Ajustez les coordonnées client, prestations, prix et dates
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Informations Client */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Client & Coordonnées</span>
              </h3>
              {clients && clients.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-semibold">Choisir parmi :</span>
                  <select
                    value={clientName}
                    onChange={(e) => handleSelectExistingClient(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Sélectionner un client --</option>
                    {clients.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nom du Client / Entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Personne contact
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Email de facturation
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Téléphone
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ville & Pays
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  N° NINEA / Fiscal
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Dates et Statut */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Date d&apos;émission
              </label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                placeholder="JJ/MM/AAAA"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Date d&apos;échéance
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="JJ/MM/AAAA"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Statut de la facture
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="payee">PAYÉE (Verte)</option>
                <option value="envoyee">ENVOYÉE (Orange)</option>
                <option value="en_attente">EN RETARD (Rouge)</option>
                <option value="brouillon">BROUILLON (Gris)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Lignes de Prestations / Articles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>Prestations & Montants (FCFA)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-3"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <input
                        type="text"
                        required
                        placeholder="Description de la prestation..."
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Qté"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="w-36 shrink-0">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        required
                        placeholder="Prix Unit. (FCFA)"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="w-32 text-right font-extrabold text-xs text-slate-900 shrink-0">
                      {formatFCFA(lineTotal)}
                    </div>

                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Totaux & TVA */}
          <div className="p-4 bg-gradient-to-br from-blue-50/50 to-slate-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={applyVat}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Appliquer la TVA</span>
              </label>

              {applyVat && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] font-bold text-slate-500">Taux :</span>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    className="text-xs font-bold text-blue-700 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value={0.16}>16% (Standard RDC / DGI)</option>
                    <option value={0.18}>18% (Standard UEMOA)</option>
                    <option value={0}>0% (Exonéré de TVA)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="text-right space-y-1 w-full sm:w-auto">
              <div className="text-xs text-slate-500">
                Total HT : <span className="font-semibold text-slate-700">{formatFCFA(subtotal)}</span>
              </div>
              {applyVat && vatRate > 0 && (
                <div className="text-xs text-slate-500">
                  TVA ({Math.round(vatRate * 100)}%) :{" "}
                  <span className="font-semibold text-slate-700">{formatFCFA(vatAmount)}</span>
                </div>
              )}
              <div className="text-sm font-black text-slate-900 border-t border-slate-200 pt-1">
                Total TTC : <span className="text-[#183BB0]">{formatFCFA(total)}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Notes & Modalités de paiement
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-900/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les modifications</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
