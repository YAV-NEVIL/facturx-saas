"use client";

import React, { useState } from "react";
import {
  X,
  Send,
  Phone,
  Mail,
  MessageCircle,
  Building2,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  History,
  FileText,
  BadgeAlert,
} from "lucide-react";
import { calculateInvoiceTotals, formatFCFA } from "@/lib/mock-data";

export default function ClientReminderModal({
  invoice,
  isOpen,
  onClose,
  onSaveReminder,
}) {
  const [activeChannel, setActiveChannel] = useState("whatsapp"); // 'whatsapp' | 'email' | 'phone'
  const [reminderLevel, setReminderLevel] = useState("niveau2"); // 'niveau1' | 'niveau2' | 'niveau3'
  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [phoneCallNotes, setPhoneCallNotes] = useState("");

  if (!isOpen || !invoice) return null;

  const { total } = calculateInvoiceTotals(invoice.items, invoice.vatRate);
  const cleanPhone = (invoice.clientPhone || "").replace(/[^0-9]/g, "");

  // Messages types pré-formatés
  const getEmailContent = () => {
    switch (reminderLevel) {
      case "niveau1":
        return {
          subject: `Rappel d'échéance : Facture ${invoice.id} - ${formatFCFA(total)}`,
          body: `Bonjour ${invoice.contactPerson || invoice.clientName},\n\nSauf erreur ou omission de notre part, nous constatons que la facture ${invoice.id} d'un montant de ${formatFCFA(total)} arrive à échéance le ${invoice.dueDate}.\n\nVous trouverez en pièce jointe le duplicata de votre facture ainsi que notre RIB pour virement bancaire.\n\nNous restons à votre entière disposition pour tout renseignement complémentaire.\n\nBien cordialement,\nService Facturation & Comptabilité\nFacturX Technologies\n+221 33 820 40 50 | compta@facturx.africa`,
        };
      case "niveau3":
        return {
          subject: `MISE EN DEMEURE : Facture impayée ${invoice.id} - ${formatFCFA(total)}`,
          body: `À l'attention de la Direction Financière - ${invoice.clientName},\n\nMalgré nos précédentes relances, nous constatons que la facture ${invoice.id} émise le ${invoice.issueDate} d'un montant de ${formatFCFA(total)} demeure impayée à ce jour.\n\nNous vous prions de bien vouloir régulariser cette situation sous un délai de 48 heures ouvrées par virement bancaire ou paiement direct Wave/Orange Money (+221 77 492 10 20).\n\nÀ défaut de règlement, nous serons dans l'obligation de suspendre l'accès à vos prestations et d'engager les procédures de recouvrement contentieux.\n\nService Juridique & Recouvrement\nFacturX Technologies SARL`,
        };
      case "niveau2":
      default:
        return {
          subject: `Relance de paiement : Facture échue ${invoice.id} - ${formatFCFA(total)}`,
          body: `Bonjour ${invoice.contactPerson || invoice.clientName},\n\nNous attirons votre attention sur le fait que la facture ${invoice.id} d'un montant de ${formatFCFA(total)}, échue le ${invoice.dueDate}, n'a pas encore fait l'objet d'un règlement.\n\nNous vous remercions de bien vouloir vérifier auprès de vos services comptables et de procéder au virement dans les meilleurs délais.\n\nCoordonnées de règlement :\n- Banque : UBA Sénégal (SN08 SN01 2013 0002 9847 2102 34)\n- Wave / Mobile Money : +221 77 492 10 20\n- Référence à indiquer : ${invoice.id}\n\nRestant à votre écoute,\nService Recouvrement - FacturX Technologies`,
        };
    }
  };

  const getWhatsAppMessage = () => {
    return `Bonjour ${invoice.contactPerson || invoice.clientName},\n\nNous vous informons que la facture *${invoice.id}* d'un montant de *${formatFCFA(total)}* est échue depuis le ${invoice.dueDate}.\n\nMerci de procéder au règlement par virement ou par Wave/OM au *+221 77 492 10 20* (Réf: ${invoice.id}).\n\nN'hésitez pas si vous avez besoin du PDF de la facture.\n\nBien à vous,\n*FacturX Recouvrement*`;
  };

  const emailData = getEmailContent();
  const whatsappText = getWhatsAppMessage();

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;
    window.open(url, "_blank");
  };

  const handleOpenEmail = () => {
    const mailto = `mailto:${invoice.clientEmail}?subject=${encodeURIComponent(
      emailData.subject
    )}&body=${encodeURIComponent(emailData.body)}`;
    window.location.href = mailto;
  };

  const handleConfirmReminder = () => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1
    ).padStart(2, "0")}/${now.getFullYear()} à ${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}`;

    let noteText = "";
    if (activeChannel === "whatsapp") {
      noteText = `Message WhatsApp de relance transmis au ${invoice.clientPhone}`;
    } else if (activeChannel === "email") {
      noteText = `Email de relance (${reminderLevel}) envoyé à ${invoice.clientEmail}`;
    } else {
      noteText = phoneCallNotes
        ? `Appel téléphonique : ${phoneCallNotes}`
        : `Appel téléphonique passé au ${invoice.clientPhone}`;
    }

    if (customNote.trim()) {
      noteText += ` • Remarque : ${customNote.trim()}`;
    }

    const newReminder = {
      id: Date.now(),
      date: formattedDate,
      channel: activeChannel,
      author: "Service Recouvrement",
      note: noteText,
      status: "Effectué",
    };

    onSaveReminder(invoice.id, newReminder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 my-6 overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#183BB0] to-[#2D60FF] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Relance Client & Recouvrement
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
                  {invoice.id}
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Coordonnées de contact direct et communication multi-canal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Overdue / Amount Summary Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Montant en souffrance à recouvrer
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {formatFCFA(total)}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-200/70 text-amber-900">
                <Clock className="w-3.5 h-3.5" />
                <span>Échéance : {invoice.dueDate}</span>
              </div>
              <p className="text-[11px] text-amber-800/80 mt-1">
                {invoice.status === "en_attente"
                  ? "Facture en retard de paiement"
                  : "Facture en cours de règlement"}
              </p>
            </div>
          </div>

          {/* Full Client Identity Card (Coordonnées Complètes) */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                Fiche Coordonnées du Client
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {invoice.taxId || "SN-NINEA-0089241"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Company & Person */}
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Raison sociale :</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {invoice.clientName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Interlocuteur privilégié :</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    {invoice.contactPerson || "Direction Financière"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Adresse physique :</span>
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    {invoice.address || "Plateau"}, {invoice.location}
                  </span>
                </div>
              </div>

              {/* Direct Phone, WhatsApp & Email */}
              <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Téléphone direct :</span>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="font-bold text-blue-700 hover:underline flex items-center gap-1 font-mono"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    {invoice.clientPhone || "+221 77 492 10 20"}
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Ligne WhatsApp :</span>
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                    WhatsApp Actif
                  </a>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Email facturation :</span>
                  <a
                    href={`mailto:${invoice.clientEmail}`}
                    className="font-semibold text-slate-800 hover:text-blue-600 truncate max-w-[180px]"
                    title={invoice.clientEmail}
                  >
                    {invoice.clientEmail}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Channel Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Canal de Relance Préféré
              </label>
              {copied && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Copié dans le presse-papier !
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveChannel("whatsapp")}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activeChannel === "whatsapp"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Direct</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChannel("email")}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activeChannel === "email"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Email de Relance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChannel("phone")}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activeChannel === "phone"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Appel Téléphonique</span>
              </button>
            </div>
          </div>

          {/* CHANNEL 1: WHATSAPP */}
          {activeChannel === "whatsapp" && (
            <div className="space-y-3 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span>Modèle WhatsApp optimisé pour mobile :</span>
                <span className="text-[11px] font-normal text-emerald-700">
                  Numéro destinataire : <strong>{invoice.clientPhone}</strong>
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 text-xs font-sans text-slate-800 whitespace-pre-line leading-relaxed shadow-xs">
                {whatsappText}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyText(whatsappText)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copier le texte</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Ouvrir WhatsApp & Envoyer</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </button>
              </div>
            </div>
          )}

          {/* CHANNEL 2: EMAIL */}
          {activeChannel === "email" && (
            <div className="space-y-3 bg-blue-50/60 p-4 rounded-2xl border border-blue-200/80 animate-in fade-in">
              {/* Level Selector */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-blue-900">
                  Degré de sévérité de la relance :
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "niveau1", label: "1. Courtois" },
                    { id: "niveau2", label: "2. Ferme (Retard)" },
                    { id: "niveau3", label: "3. Mise en demeure" },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setReminderLevel(lvl.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                        reminderLevel === lvl.id
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="bg-white p-2.5 rounded-xl border border-blue-100 text-xs">
                <span className="font-semibold text-slate-400">Objet : </span>
                <span className="font-bold text-slate-800">{emailData.subject}</span>
              </div>

              {/* Body */}
              <div className="bg-white p-3.5 rounded-xl border border-blue-100 text-xs font-sans text-slate-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                {emailData.body}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyText(`${emailData.subject}\n\n${emailData.body}`)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copier l&apos;email</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenEmail}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Ouvrir dans la messagerie</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </button>
              </div>
            </div>
          )}

          {/* CHANNEL 3: PHONE */}
          {activeChannel === "phone" && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">
                    Appel téléphonique direct
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Joindre {invoice.contactPerson || invoice.clientName}
                  </p>
                </div>

                <a
                  href={`tel:${cleanPhone}`}
                  className="px-4 py-2 bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-transform hover:scale-105"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Appeler {invoice.clientPhone}</span>
                </a>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Compte-rendu de l&apos;appel téléphonique :
                </label>
                <textarea
                  rows={2}
                  value={phoneCallNotes}
                  onChange={(e) => setPhoneCallNotes(e.target.value)}
                  placeholder="Ex: Le Directeur Financier confirme la mise en paiement ce vendredi par virement bancaire..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Reminder History List for this Invoice */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2.5">
              <History className="w-3.5 h-3.5 text-blue-600" />
              Historique des relances précédentes ({invoice.reminders?.length || 0})
            </h4>

            {(!invoice.reminders || invoice.reminders.length === 0) ? (
              <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                Aucune relance antérieure enregistrée pour cette facture.
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {invoice.reminders.map((rem, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          rem.channel === "whatsapp"
                            ? "bg-emerald-100 text-emerald-700"
                            : rem.channel === "phone"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {rem.channel === "whatsapp" ? (
                          <MessageCircle className="w-3 h-3" />
                        ) : rem.channel === "phone" ? (
                          <Phone className="w-3 h-3" />
                        ) : (
                          <Mail className="w-3 h-3" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{rem.note}</div>
                        <div className="text-[11px] text-slate-400">
                          Par {rem.author || "Service Recouvrement"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-500 font-mono block">
                        {rem.date}
                      </span>
                      <span className="inline-block text-[10px] font-bold text-emerald-700">
                        {rem.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={handleConfirmReminder}
            className="px-5 py-2.5 rounded-xl bg-[#183BB0] hover:bg-[#122F8C] text-white text-xs font-bold shadow-md shadow-blue-900/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Enregistrer cette relance</span>
          </button>
        </div>
      </div>
    </div>
  );
}
