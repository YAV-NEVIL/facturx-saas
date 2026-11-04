"use client";

import React, { useMemo } from "react";
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Edit3,
  ExternalLink,
  MessageCircle,
  ArrowRight,
  TrendingUp,
  FileText,
} from "lucide-react";
import { calculateInvoiceTotals, formatAmount } from "@/lib/mock-data";

export default function ClientProfileDrawer({
  isOpen,
  onClose,
  client,
  invoices = [],
  payments = [],
  companyInfo,
  onNewInvoice,
  onSelectInvoice,
  onEditClient,
  avatarGradient = "from-blue-600 to-indigo-700",
}) {
  // Filtrer les factures de ce client (inconditionnel selon les règles de Hooks)
  const clientInvoices = useMemo(() => {
    if (!client) return [];
    return (invoices || []).filter(
      (inv) => inv.clientName && inv.clientName.toLowerCase() === client.name.toLowerCase()
    );
  }, [invoices, client]);

  // Filtrer les règlements enregistrés pour ce client
  const clientPayments = useMemo(() => {
    if (!client) return [];
    return (payments || []).filter(
      (p) =>
        (p.clientName && p.clientName.toLowerCase() === client.name.toLowerCase()) ||
        clientInvoices.some((inv) => inv.id === p.invoiceId)
    );
  }, [payments, client, clientInvoices]);

  // Calculs financiers réels pour ce client (combinant factures et encaissements Supabase)
  const { totalBilled, totalPaid, totalPending, pendingCount, invoicePaymentMap } = useMemo(() => {
    let billed = 0;
    let paid = 0;
    let pending = 0;
    let pCount = 0;
    const invMap = {};

    (clientInvoices || []).forEach((inv) => {
      const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
      billed += total;

      const paymentsForInv = (clientPayments || []).filter((p) => p.invoiceId === inv.id);
      const paidFromRecords = paymentsForInv.reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0
      );

      let effectivePaid = paidFromRecords;
      if (inv.status === "payee" && effectivePaid === 0) {
        effectivePaid = total;
      }
      const effectiveRemaining = Math.max(0, total - effectivePaid);

      invMap[inv.id] = {
        total,
        paid: effectivePaid,
        remaining: effectiveRemaining,
        paymentsCount: paymentsForInv.length,
      };

      paid += effectivePaid;
      pending += effectiveRemaining;
      if (effectiveRemaining > 0 || inv.status !== "payee") {
        pCount += 1;
      }
    });

    return {
      totalBilled: billed,
      totalPaid: paid,
      totalPending: pending,
      pendingCount: pCount,
      invoicePaymentMap: invMap,
    };
  }, [clientInvoices, clientPayments]);

  if (!isOpen || !client) return null;

  const cleanPhone = (client.phone || "").replace(/[^0-9]/g, "");
  const whatsappMessage = `Bonjour ${client.contactPerson || client.name}, je vous contacte de la part de ${
    companyInfo?.name || "FacturX"
  } concernant vos factures et règlements.`;
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  const getStatusBadge = (status) => {
    switch (status) {
      case "payee":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Payée
          </span>
        );
      case "envoyee":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Envoyée
          </span>
        );
      case "en_attente":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> En retard
          </span>
        );
      case "brouillon":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Brouillon
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Fond obscurci avec blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
      />

      {/* Panneau latéral coulissant */}
      <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l border-slate-200">
        {/* Entête du tiroir avec Avatar & Actions */}
        <div className="p-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${avatarGradient} text-white flex items-center justify-center font-extrabold text-xl shadow-lg shrink-0`}
              >
                {client.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {client.name}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Fiche Client 360°
                  </span>
                </div>
                {client.contactPerson && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Interlocuteur :{" "}
                    <strong className="text-slate-700">{client.contactPerson}</strong>
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Fermer la fiche"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Boutons d'interaction directe rapide (WhatsApp, Appel, Email) */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-[1.02] shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Direct</span>
              </a>
            )}
            {client.phone && (
              <a
                href={`tel:${cleanPhone}`}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-[1.02] shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Appeler</span>
              </a>
            )}
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-[1.02] shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Envoyer Email</span>
              </a>
            )}
            <button
              onClick={() => {
                onClose();
                if (onEditClient) onEditClient(client);
              }}
              className="ml-auto px-3 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modifier fiche</span>
            </button>
          </div>
        </div>

        {/* Corps du tiroir avec scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Synthèse Financière du Client (KPIs) */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Synthèse Financière & Recouvrement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Total Facturé
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 mt-1 block">
                  {formatAmount(totalBilled, companyInfo?.defaultCurrency)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {clientInvoices.length} facture(s) émise(s)
                </span>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                <span className="text-[11px] font-semibold text-emerald-800 block">
                  Total Encaissé
                </span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-700 mt-1 block">
                  {formatAmount(totalPaid, companyInfo?.defaultCurrency)}
                </span>
                <span className="text-[10px] text-emerald-600/80">
                  Paiements validés
                </span>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100">
                <span className="text-[11px] font-semibold text-amber-800 block">
                  Reste à Recouvrer
                </span>
                <span className="text-base sm:text-lg font-extrabold text-amber-700 mt-1 block">
                  {formatAmount(totalPending, companyInfo?.defaultCurrency)}
                </span>
                <span className="text-[10px] text-amber-600/80">
                  {pendingCount} facture(s) en attente
                </span>
              </div>
            </div>
          </div>

          {/* Coordonnées & Données Légales */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Coordonnées & Informations Légales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Siège & Ville</span>
                <p className="font-semibold text-slate-800 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    {client.address ? `${client.address}, ` : ""}
                    {client.location || "Non renseigné"}
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Identifiant Fiscal</span>
                <p className="font-mono font-bold text-slate-700">
                  {client.taxId || "RCCM / NIF non communiqué"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Téléphone / Mobile</span>
                <p className="font-mono font-semibold text-slate-800">
                  {client.phone || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Email Officiel</span>
                <p className="font-medium text-slate-800 truncate">
                  {client.email || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Historique des Factures de ce Client */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Historique des Factures ({clientInvoices.length})
              </h3>
              <button
                onClick={() => {
                  onClose();
                  if (onNewInvoice) onNewInvoice(client);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouvelle Facture</span>
              </button>
            </div>

            {clientInvoices.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  Aucune facture émise pour cette entreprise
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Générez la première facture certifiée en 1 clic pour ce client.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    if (onNewInvoice) onNewInvoice(client);
                  }}
                  className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Créer la 1ère facture
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {clientInvoices.map((inv) => {
                  const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
                  const invInfo = invoicePaymentMap[inv.id] || { paid: 0, remaining: total };
                  return (
                    <div
                      key={inv.id}
                      className="group p-3.5 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-700">
                            {inv.id}
                          </span>
                          {getStatusBadge(inv.status)}
                          {invInfo.paid > 0 && inv.status !== "payee" && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              Partiel
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>Émise le {inv.issueDate}</span>
                          <span>•</span>
                          <span>Échéance : {inv.dueDate}</span>
                        </p>
                        {invInfo.remaining > 0 && inv.status !== "payee" && invInfo.paid > 0 && (
                          <p className="text-[10px] text-amber-700 font-semibold mt-1">
                            Reste dû : {formatAmount(invInfo.remaining, companyInfo?.defaultCurrency)} (sur {formatAmount(total, companyInfo?.defaultCurrency)})
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <span className="font-extrabold text-sm text-slate-900 block">
                            {formatAmount(total, companyInfo?.defaultCurrency)}
                          </span>
                          <span className="text-[10px] text-slate-400">TTC</span>
                        </div>
                        <button
                          onClick={() => {
                            onClose();
                            if (onSelectInvoice) onSelectInvoice(inv);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Consulter le détail de cette facture"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historique des Règlements Encaissés (Synchronisation Supabase) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              Historique des Règlements Encaissés ({clientPayments.length})
            </h3>

            {clientPayments.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CreditCard className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-500">
                  Aucun règlement enregistré pour cette entreprise
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Les encaissements enregistrés dans l&apos;onglet Règlements apparaîtront ici automatiquement.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-emerald-700">
                          {p.receiptNumber || p.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.paymentMethod || "Règlement"}
                        </span>
                        {p.invoiceId && (
                          <span className="text-[10px] font-mono text-slate-500">
                            (Facture {p.invoiceId})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Reçu le {p.paymentDate || p.date} {p.bankName ? `• ${p.bankName}` : ""} {p.reference ? `• Réf: ${p.reference}` : ""}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-sm text-emerald-700 block">
                        +{formatAmount(Number(p.amount) || 0, companyInfo?.defaultCurrency)}
                      </span>
                      <span className="text-[10px] text-slate-400">Encaissé</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pied du tiroir */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>

          <button
            onClick={() => {
              onClose();
              if (onNewInvoice) onNewInvoice(client);
            }}
            className="px-5 py-2.5 bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Facturer {client.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
