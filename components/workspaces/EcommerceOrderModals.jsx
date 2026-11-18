"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Truck,
  Printer,
  Share2,
  MapPin,
  Phone,
  User,
  Package,
  CreditCard,
} from "lucide-react";
import { formatAmount } from "@/lib/mock-data";

/**
 * Modale d'édition logistique & assignation livreur (Mobile-First)
 */
export function EditOrderDeliveryModal({
  order,
  onClose,
  onSave,
  knownDrivers = [],
  currSym = "FC",
}) {
  const [form, setForm] = useState({
    driverName: "",
    deliveryZone: "Centre-ville",
    deliveryAddress: "",
    deliveryFee: "0",
    customerPhone: "",
    paymentMethod: "Cash à la livraison",
    orderStatus: "nouvelle",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!order) return;
    setForm({
      driverName: order.driverName || "",
      deliveryZone: order.deliveryZone || "Centre-ville",
      deliveryAddress: order.deliveryAddress || "",
      deliveryFee: String(order.deliveryFee ?? 0),
      customerPhone: order.customerPhone || "",
      paymentMethod: order.paymentMethod || "Cash à la livraison",
      orderStatus: order.orderStatus || "nouvelle",
      notes: order.notes || "",
    });
  }, [order]);

  if (!order) return null;

  const subtotal = Number(order.subtotal || 0);
  const fee = Math.max(0, Number(form.deliveryFee || 0));
  const nextTotal = subtotal + fee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(order.id, {
        driverName: form.driverName.trim(),
        deliveryZone: form.deliveryZone.trim() || "Standard",
        deliveryAddress: form.deliveryAddress.trim(),
        deliveryFee: fee,
        totalAmount: nextTotal,
        customerPhone: form.customerPhone.trim(),
        paymentMethod: form.paymentMethod,
        orderStatus: form.orderStatus,
        notes: form.notes.trim(),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92dvh] flex flex-col border border-slate-100 shadow-2xl overflow-hidden">
        <div className="shrink-0 px-5 py-4 bg-gradient-to-r from-[#1A44B8] to-[#183BB0] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            <div>
              <h3 className="text-sm sm:text-base font-extrabold">
                Livraison &amp; Coursier — {order.id}
              </h3>
              <p className="text-[11px] text-blue-100">
                Client : {order.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-100 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Livreur / Coursier assigné
              </label>
              <input
                type="text"
                value={form.driverName}
                onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                placeholder="Ex: Patrick Mukendi, Moto Express..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              />
              {knownDrivers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {knownDrivers.slice(0, 6).map((drv) => (
                    <button
                      key={drv}
                      type="button"
                      onClick={() => setForm({ ...form, driverName: drv })}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer ${
                        form.driverName === drv
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {drv}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Zone / Commune</label>
                <input
                  type="text"
                  value={form.deliveryZone}
                  onChange={(e) => setForm({ ...form, deliveryZone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Frais de livraison ({currSym})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.deliveryFee}
                  onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Adresse complète</label>
              <input
                type="text"
                value={form.deliveryAddress}
                onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                placeholder="Avenue, N°, référence..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Téléphone client</label>
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Statut commande</label>
                <select
                  value={form.orderStatus}
                  onChange={(e) => setForm({ ...form, orderStatus: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="nouvelle">Nouvelle</option>
                  <option value="confirmee">Confirmée</option>
                  <option value="en_preparation">En préparation</option>
                  <option value="expediee">En livraison</option>
                  <option value="livree">Livrée</option>
                  <option value="annulee">Annulée</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mode de paiement</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              >
                <option value="Cash à la livraison">Cash à la livraison</option>
                <option value="Airtel Money">Airtel Money</option>
                <option value="Orange Money">Orange Money</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Wave">Wave</option>
                <option value="Carte / Virement">Carte / Virement</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Instructions livreur</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Point de repère, code portail, appel avant passage..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between font-extrabold text-blue-900">
              <span>Nouveau Total Commande :</span>
              <span className="text-sm">{formatAmount(nextTotal, currSym)}</span>
            </div>
          </div>

          <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Enregistrement..." : "Enregistrer la Livraison"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modale Bon de Livraison Imprimable & Partageable WhatsApp (Mobile-First)
 */
export function DeliverySlipModal({
  order,
  onClose,
  companyInfo = {},
  currSym = "FC",
  onShareWhatsApp,
}) {
  const slipRef = useRef(null);

  if (!order) return null;

  const isPaid = order.paymentStatus === "paye";
  const createdStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("fr-FR");

  const handlePrintSlip = () => {
    if (!slipRef.current || typeof window === "undefined") return;
    const w = window.open("", "_blank", "width=760,height=780");
    if (!w) {
      window.print();
      return;
    }
    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Bon de Livraison ${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; font-size: 12px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #183BB0; padding-bottom: 12px; margin-bottom: 16px; }
            .title { font-size: 18px; font-weight: 800; color: #183BB0; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; text-align: left; }
            th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #475569; }
            .right { text-align: right; }
            .total-box { margin-top: 14px; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; }
            .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 28px; }
            .sign-box { border: 1px dashed #94a3b8; border-radius: 8px; height: 68px; padding: 8px; font-size: 10px; color: #475569; }
          </style>
        </head>
        <body>
          ${slipRef.current.innerHTML}
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col border border-slate-100 shadow-2xl overflow-hidden">
        <div className="shrink-0 px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-300" />
            <div>
              <h3 className="text-sm sm:text-base font-extrabold">
                Bon de Livraison — {order.id}
              </h3>
              <p className="text-[11px] text-slate-300">
                Fiche colis pour le livreur et signature client à la remise
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-5">
          <div ref={slipRef} className="space-y-4 text-xs">
            <div className="header flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#183BB0]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {companyInfo?.name || "Boutique E-Commerce"}
                </p>
                <h4 className="title text-lg font-extrabold text-[#183BB0]">
                  BON DE LIVRAISON
                </h4>
              </div>
              <div className="sm:text-right">
                <p className="font-mono font-extrabold text-slate-900">{order.id}</p>
                <p className="text-[11px] text-slate-500">{createdStr}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="box p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> Destinataire
                </p>
                <p className="font-extrabold text-slate-900">{order.customerName}</p>
                {order.customerPhone && (
                  <p className="text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {order.customerPhone}
                  </p>
                )}
                <p className="text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {order.deliveryAddress || "Adresse non précisée"} ({order.deliveryZone})
                </p>
              </div>

              <div className="box p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Truck className="w-3 h-3" /> Expédition &amp; Encaissement
                </p>
                <p className="font-bold text-slate-900">
                  Livreur : {order.driverName || "Non encore assigné"}
                </p>
                <p className="text-slate-600 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> {order.paymentMethod}
                </p>
                <p className={`font-extrabold ${isPaid ? "text-emerald-700" : "text-amber-700"}`}>
                  {isPaid
                    ? "STATUT : DÉJÀ PAYÉE (0 à percevoir)"
                    : `À PERCEVOIR À LA LIVRAISON : ${formatAmount(order.totalAmount, currSym)}`}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500">
                    <th className="py-2 px-3">Article &amp; Variante</th>
                    <th className="py-2 px-3 text-center">Qté</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{it.description}</td>
                      <td className="py-2 px-3 text-center font-bold">{it.quantity}</td>
                      <td className="py-2 px-3 text-right font-bold">
                        {formatAmount(Number(it.quantity || 1) * Number(it.unitPrice || 0), currSym)}
                      </td>
                    </tr>
                  ))}
                  {Number(order.deliveryFee || 0) > 0 && (
                    <tr>
                      <td className="py-2 px-3 text-slate-600">
                        Frais de livraison ({order.deliveryZone})
                      </td>
                      <td className="py-2 px-3 text-center">1</td>
                      <td className="py-2 px-3 text-right font-bold">
                        {formatAmount(order.deliveryFee, currSym)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {order.notes && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <strong>Note :</strong> {order.notes}
              </div>
            )}

            <div className="total-box p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between font-extrabold text-sm text-[#183BB0]">
              <span>TOTAL COMMANDE :</span>
              <span>{formatAmount(order.totalAmount, currSym)}</span>
            </div>

            <div className="signs grid grid-cols-2 gap-3 pt-2">
              <div className="sign-box h-16 p-2 rounded-xl border border-dashed border-slate-300 text-[10px] text-slate-500">
                Visa Livreur / Coursier :
              </div>
              <div className="sign-box h-16 p-2 rounded-xl border border-dashed border-slate-300 text-[10px] text-slate-500">
                Signature Client (Colis reçu conforme) :
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <button
            type="button"
            onClick={() => onShareWhatsApp && onShareWhatsApp(order)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Suivi WhatsApp Client</span>
          </button>

          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handlePrintSlip}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le Bon</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

