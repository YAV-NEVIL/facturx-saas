import { NextResponse } from "next/server";
import {
  escapeHtml,
  isEmailProviderConfigured,
  sendTransactionalEmail,
} from "@/lib/server-email";

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: isEmailProviderConfigured(),
    providers: {
      resend: Boolean(process.env.RESEND_API_KEY),
      brevo: Boolean(process.env.BREVO_API_KEY),
      smtp: Boolean(
        process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
      ),
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      type = "custom",
      to,
      toName = "",
      subject,
      message = "",
      replyTo = "",
      companyInfo = null,
      invoice = null,
      attachment = null, // { filename, base64 }
      reminderLevel = "niveau2",
      goldForm = null,
    } = body || {};

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://facturx-saas.vercel.app";
    const adminEmail =
      process.env.FACTURX_ADMIN_EMAIL || "facturx01@gmail.com";

    // =========================================================================
    // 1. DEMANDE OFFRE GOLD ("Contactez-nous")
    // =========================================================================
    if (type === "gold_inquiry") {
      if (!goldForm || !goldForm.email || !goldForm.companyName) {
        return NextResponse.json(
          { error: "Informations de contact Gold incomplètes." },
          { status: 400 }
        );
      }

      const safeCompany = escapeHtml(goldForm.companyName);
      const safeContact = escapeHtml(goldForm.contactName || "Direction");
      const safeEmail = escapeHtml(goldForm.email);
      const safePhone = escapeHtml(goldForm.phone || "Non renseigné");
      const safeRange = escapeHtml(goldForm.employeesRange || "Non précisé");
      const safeNeeds = escapeHtml(goldForm.needs || "Offre Gold sur mesure");

      const adminSubject = `Demande Offre GOLD — ${goldForm.companyName}`;
      const adminText = `Nouvelle demande Grands Comptes (Offre Gold) reçue depuis FacturX :\n\nEntreprise : ${goldForm.companyName}\nContact : ${goldForm.contactName || "—"}\nEmail : ${goldForm.email}\nTéléphone / WhatsApp : ${goldForm.phone || "—"}\nTaille équipe : ${goldForm.employeesRange || "—"}\nBesoins : ${goldForm.needs || "—"}\n\nRépondez directement à cet email pour joindre le prospect.`;

      const adminHtml = `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #fde68a; border-radius: 16px; color: #0f172a;">
        <div style="display: inline-block; padding: 6px 12px; border-radius: 999px; background: #0f172a; color: #fcd34d; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 16px;">
          OFFRE GOLD • DEMANDE GRANDS COMPTES
        </div>
        <h2 style="margin: 0 0 14px; font-size: 20px; color: #0f172a;">Nouvelle demande de devis : ${safeCompany}</h2>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.7; color: #334155;">
          <div><strong>Entreprise / Groupe :</strong> ${safeCompany}</div>
          <div><strong>Interlocuteur :</strong> ${safeContact}</div>
          <div><strong>Email professionnel :</strong> ${safeEmail}</div>
          <div><strong>Téléphone / WhatsApp :</strong> ${safePhone}</div>
          <div><strong>Effectif estimé :</strong> ${safeRange}</div>
        </div>
        <div style="margin-top: 14px; padding: 14px 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; font-size: 13px; color: #78350f;">
          <strong>Besoins exprimés :</strong><br/>${safeNeeds.replace(/\n/g, "<br/>")}
        </div>
      </div>`;

      const adminRes = await sendTransactionalEmail({
        to: adminEmail,
        toName: "Équipe Grands Comptes FacturX",
        subject: adminSubject,
        html: adminHtml,
        text: adminText,
        replyTo: goldForm.email,
        senderName: "FacturX Enterprise",
      });

      let prospectRes = null;
      if (goldForm.email.includes("@")) {
        const ackSubject = `FacturX Gold — Confirmation de votre demande pour ${goldForm.companyName}`;
        const ackText = `Bonjour ${goldForm.contactName || ""},\n\nNous avons bien reçu votre demande de devis pour l'Offre GOLD FacturX destinée à « ${goldForm.companyName} ».\n\nUn responsable Grands Comptes vous contactera sous peu au ${goldForm.phone || goldForm.email} pour préparer votre déploiement sur mesure (Multi-filiales, ERP, Serveur DGI dédié).\n\nBien cordialement,\nL'équipe Enterprise FacturX`;
        const ackHtml = `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; color: #0f172a;">
          <div style="display: inline-block; padding: 6px 12px; border-radius: 999px; background: #0f172a; color: #fcd34d; font-size: 11px; font-weight: 800; margin-bottom: 16px;">
            OFFRE GOLD • SUR MESURE
          </div>
          <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a;">Votre demande a bien été transmise</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Bonjour ${safeContact},<br/><br/>
            Nous confirmons la réception de votre demande pour l'architecture <strong>Offre Gold</strong> concernant <strong>${safeCompany}</strong>.
            Un conseiller dédié Grands Comptes reviendra vers vous très rapidement.
          </p>
          <p style="font-size: 12px; color: #64748b; margin-top: 24px;">FacturX Enterprise • ${appUrl}</p>
        </div>`;

        prospectRes = await sendTransactionalEmail({
          to: goldForm.email,
          toName: goldForm.contactName || goldForm.companyName,
          subject: ackSubject,
          html: ackHtml,
          text: ackText,
          replyTo: adminEmail,
          senderName: "FacturX Enterprise",
        });
      }

      return NextResponse.json({
        ok: true,
        sentAutomatically: adminRes.sentAutomatically,
        providerUsed: adminRes.providerUsed,
        prospectAckSent: Boolean(prospectRes?.sentAutomatically),
        error: adminRes.sentAutomatically ? null : adminRes.error,
        mailtoUrl: `mailto:${encodeURIComponent(adminEmail)}?subject=${encodeURIComponent(
          adminSubject
        )}&body=${encodeURIComponent(adminText)}`,
      });
    }

    // =========================================================================
    // 2. ENVOI DE TEST CONFIGURÉ PAR L'ADMIN
    // =========================================================================
    if (type === "test") {
      if (!to || !String(to).includes("@")) {
        return NextResponse.json(
          { error: "Veuillez saisir une adresse email de destination valide." },
          { status: 400 }
        );
      }

      const coName = companyInfo?.name || "FacturX";
      const testSubject = `Test d'envoi réel FacturX — ${coName}`;
      const testText = `Bonjour,\n\nFélicitations ! La passerelle d'envoi réel d'emails de FacturX pour « ${coName} » est opérationnelle.\nVos factures PDF, relances clients, notifications KYB et demandes Gold peuvent désormais être expédiées automatiquement.\n\nFacturX SaaS`;
      const testHtml = `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; border: 1px solid #d1fae5; border-radius: 16px; color: #0f172a;">
        <div style="display: inline-block; padding: 6px 12px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; margin-bottom: 14px;">
          Passerelle Email Opérationnelle
        </div>
        <h2 style="margin: 0 0 10px; font-size: 19px; color: #0f172a;">Test réussi pour ${escapeHtml(coName)}</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          Vos factures normalisées PDF, relances de recouvrement, notifications légales KYB et demandes Gold sont désormais envoyées automatiquement depuis FacturX.
        </p>
      </div>`;

      const res = await sendTransactionalEmail({
        to,
        toName: coName,
        subject: testSubject,
        html: testHtml,
        text: testText,
        senderName: coName,
      });

      return NextResponse.json({
        ok: res.sentAutomatically,
        sentAutomatically: res.sentAutomatically,
        providerUsed: res.providerUsed,
        error: res.sentAutomatically ? null : res.error,
      });
    }

    // =========================================================================
    // 3. FACTURE PDF & RELANCE CLIENT (AVEC PIÈCE JOINTE PDF RÉELLE)
    // =========================================================================
    if (!to || !String(to).includes("@")) {
      return NextResponse.json(
        { error: "L'adresse email du client destinataire est requise ou invalide." },
        { status: 400 }
      );
    }

    const coName = companyInfo?.name || "FacturX";
    const coEmail = companyInfo?.email || "";
    const coPhone = companyInfo?.phone || "";
    const coBank = companyInfo?.bankName
      ? `${companyInfo.bankName}${companyInfo.iban ? ` (${companyInfo.iban})` : ""}`
      : "";
    const coMobile =
      companyInfo?.airtelMoneyNumber ||
      companyInfo?.orangeMoneyNumber ||
      companyInfo?.waveNumber ||
      "";

    const finalSubject =
      subject ||
      (type === "invoice_pdf" && invoice?.id
        ? `Facture normalisée ${invoice.id} — ${coName}`
        : `Communication de ${coName}`);

    const safeMessageHtml = escapeHtml(message).replace(/\n/g, "<br/>");
    const hasAttachment = Boolean(attachment?.filename && attachment?.base64);

    let badgeLabel = "Facture Normalisée DGI • SFE";
    let badgeBg = "#eff6ff";
    let badgeColor = "#1d4ed8";

    if (type === "reminder") {
      if (reminderLevel === "niveau3") {
        badgeLabel = "Mise en demeure • Recouvrement Urgent";
        badgeBg = "#fff1f2";
        badgeColor = "#be123c";
      } else if (reminderLevel === "niveau2") {
        badgeLabel = "Relance de Règlement • Facture Échue";
        badgeBg = "#fffbeb";
        badgeColor = "#b45309";
      } else {
        badgeLabel = "Rappel Courtois d'Échéance";
        badgeBg = "#eff6ff";
        badgeColor = "#1d4ed8";
      }
    }

    const invoiceMetaHtml = invoice
      ? `<div style="margin: 18px 0; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 13px; color: #334155;">
          <div style="font-weight: 800; color: #0f172a; margin-bottom: 6px;">Récapitulatif de la pièce : ${escapeHtml(
            invoice.id || ""
          )}</div>
          ${
            invoice.totalFormatted
              ? `<div><strong>Montant TTC :</strong> ${escapeHtml(invoice.totalFormatted)}</div>`
              : ""
          }
          ${
            invoice.dueDate
              ? `<div><strong>Date d'échéance :</strong> ${escapeHtml(invoice.dueDate)}</div>`
              : ""
          }
          ${
            invoice.dgiCodeDef
              ? `<div><strong>Code DEF / DGI :</strong> <span style="font-family: monospace; color: #047857; font-weight: 700;">${escapeHtml(
                  invoice.dgiCodeDef
                )}</span></div>`
              : ""
          }
          ${coBank ? `<div><strong>Banque :</strong> ${escapeHtml(coBank)}</div>` : ""}
          ${coMobile ? `<div><strong>Mobile Money :</strong> ${escapeHtml(coMobile)}</div>` : ""}
        </div>`
      : "";

    const htmlBody = `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; color: #0f172a; background: #ffffff;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 14px;">
        <strong style="font-size: 17px; color: #183BB0;">${escapeHtml(coName)}</strong>
        <span style="display: inline-block; padding: 5px 11px; border-radius: 999px; background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 800;">
          ${badgeLabel}
        </span>
      </div>
      <div style="font-size: 14px; line-height: 1.65; color: #1e293b;">
        ${safeMessageHtml}
      </div>
      ${invoiceMetaHtml}
      ${
        hasAttachment
          ? `<div style="margin-top: 14px; padding: 10px 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; font-size: 12px; color: #065f46; font-weight: 700;">
              Pièce jointe incluse : ${escapeHtml(attachment.filename)}
            </div>`
          : ""
      }
      <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
        <strong>${escapeHtml(coName)}</strong>
        ${coPhone || coEmail ? ` • ${escapeHtml([coPhone, coEmail].filter(Boolean).join(" | "))}` : ""}
        <div style="margin-top: 4px; font-size: 11px; color: #94a3b8;">Document certifié & transmis via FacturX</div>
      </div>
    </div>`;

    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      finalSubject
    )}&body=${encodeURIComponent(message)}`;

    const sendRes = await sendTransactionalEmail({
      to,
      toName: toName || invoice?.clientName || "",
      subject: finalSubject,
      html: htmlBody,
      text: message,
      replyTo: replyTo || coEmail || "",
      senderName: coName,
      attachments: hasAttachment
        ? [
            {
              filename: attachment.filename,
              base64: attachment.base64,
              contentType: "application/pdf",
            },
          ]
        : [],
    });

    return NextResponse.json({
      ok: sendRes.ok,
      sentAutomatically: sendRes.sentAutomatically,
      providerUsed: sendRes.providerUsed,
      messageId: sendRes.messageId || null,
      error: sendRes.sentAutomatically ? null : sendRes.error,
      mailtoUrl,
    });
  } catch (err) {
    console.error("Erreur /api/send-email:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'envoi de l'email." },
      { status: 500 }
    );
  }
}

