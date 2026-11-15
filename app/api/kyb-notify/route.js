import { NextResponse } from "next/server";
import { escapeHtml, sendTransactionalEmail } from "@/lib/server-email";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      companyName = "Votre entreprise",
      decision,
      rejectionReason = "",
      rccm = "",
      nif = "",
      city = "",
      country = "",
      phone = "",
    } = body || {};

    if (!decision || !["approved", "rejected", "submitted"].includes(decision)) {
      return NextResponse.json(
        { error: "Paramètre de décision KYB invalide ou manquant." },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://facturx-saas.vercel.app";
    const adminEmail =
      process.env.FACTURX_ADMIN_EMAIL || "facturx01@gmail.com";

    // CAS 1 : Une entreprise vient de soumettre ses documents légaux -> Alerter le Super-Admin + Accusé de réception au client
    if (decision === "submitted") {
      const safeCo = escapeHtml(companyName);
      const safeEmail = escapeHtml(email || "Non renseigné");
      const safePhone = escapeHtml(phone || "Non renseigné");
      const safeCity = escapeHtml([city, country].filter(Boolean).join(", ") || "—");
      const safeRccm = escapeHtml(rccm || "Non renseigné");
      const safeNif = escapeHtml(nif || "Non renseigné");

      const adminSubject = `Nouveau dossier KYB à vérifier (48h) — ${companyName}`;
      const adminText = `Nouveau dossier d'entreprise soumis sur FacturX :\n\nEntreprise : ${companyName}\nEmail : ${email || "Non renseigné"}\nTéléphone : ${phone || "Non renseigné"}\nLocalisation : ${[city, country].filter(Boolean).join(", ") || "—"}\nRCCM : ${rccm || "Non renseigné"}\nN° Impôt / NIF : ${nif || "Non renseigné"}\n\nConnectez-vous à l'espace Paramètres > Validation Légale (KYB) pour vérifier les pièces : ${appUrl}`;

      const adminHtml = `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; color: #0f172a;">
        <div style="display: inline-block; padding: 6px 12px; border-radius: 999px; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
          Nouveau Dossier KYB • Vérification 24h–48h
        </div>
        <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a;">Dossier légal soumis par ${safeCo}</h2>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.7; color: #334155;">
          <div><strong>Entreprise :</strong> ${safeCo}</div>
          <div><strong>Email :</strong> ${safeEmail}</div>
          <div><strong>Téléphone :</strong> ${safePhone}</div>
          <div><strong>Ville / Pays :</strong> ${safeCity}</div>
          <div><strong>RCCM :</strong> ${safeRccm}</div>
          <div><strong>N° Impôt / NIF :</strong> ${safeNif}</div>
        </div>
        <div style="margin: 24px 0;">
          <a href="${appUrl}" style="display: inline-block; padding: 12px 22px; background: #183BB0; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px;">
            Ouvrir la Console KYB Super-Admin
          </a>
        </div>
      </div>`;

      const adminRes = await sendTransactionalEmail({
        to: adminEmail,
        subject: adminSubject,
        html: adminHtml,
        text: adminText,
        replyTo: email || "",
        senderName: "FacturX Conformité KYB",
      });

      let clientRes = null;
      if (email && String(email).includes("@") && email.toLowerCase() !== adminEmail.toLowerCase()) {
        const clientSubject = `FacturX — Dossier légal reçu pour ${companyName} (vérification sous 48h)`;
        const clientText = `Bonjour,\n\nNous confirmons la bonne réception des documents légaux de votre entreprise « ${companyName} ».\n\nNotre équipe conformité examine votre dossier sous 24h à 48h. En attendant, votre espace FacturX reste 100 % opérationnel.\n\nAccéder à FacturX : ${appUrl}\n\nCordialement,\nL'équipe FacturX`;
        const clientHtml = `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #dbeafe; border-radius: 16px; color: #0f172a;">
          <div style="display: inline-block; padding: 6px 12px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
            Dossier reçu • Vérification sous 24h – 48h
          </div>
          <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a;">Merci ! Votre dossier pour ${safeCo} est en cours d'examen</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Bonjour,<br/><br/>
            Vos pièces légales ont bien été transmises. Vous serez informé par email dans un délai de <strong>24h à 48h</strong> dès validation de votre entreprise. Votre accès à FacturX reste immédiatement actif.
          </p>
          <div style="margin: 24px 0;">
            <a href="${appUrl}" style="display: inline-block; padding: 12px 22px; background: #183BB0; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px;">
              Accéder à mon tableau de bord
            </a>
          </div>
        </div>`;

        clientRes = await sendTransactionalEmail({
          to: email,
          toName: companyName,
          subject: clientSubject,
          html: clientHtml,
          text: clientText,
          senderName: "FacturX Conformité",
        });
      }

      return NextResponse.json({
        ok: true,
        sentAutomatically: adminRes.sentAutomatically,
        providerUsed: adminRes.providerUsed,
        clientConfirmationSent: Boolean(clientRes?.sentAutomatically),
      });
    }

    // CAS 2 : Décision Super-Admin ("approved" | "rejected") -> Informer l'entreprise
    if (!email) {
      return NextResponse.json(
        { error: "Adresse email de l'entreprise manquante." },
        { status: 400 }
      );
    }

    const isApproved = decision === "approved";
    const safeCo = escapeHtml(companyName);

    const subject = isApproved
      ? `FacturX — Vos documents légaux pour ${companyName} sont validés`
      : `FacturX — Vos documents pour ${companyName} ne sont pas conformes (à revoir)`;

    const reasonText =
      rejectionReason?.trim() ||
      "Certaines pièces justificatives sont illisibles, expirées ou ne correspondent pas aux informations déclarées.";

    const plainBody = isApproved
      ? `Bonjour,\n\nBonne nouvelle ! Après vérification sous 24h-48h par notre équipe conformité, les documents légaux de votre entreprise « ${companyName} » ont été approuvés.\n\nVotre entreprise bénéficie désormais du statut « Entreprise Vérifiée » sur FacturX.\n\nAccéder à votre espace : ${appUrl}\n\nCordialement,\nL'équipe FacturX`
      : `Bonjour,\n\nAprès examen de votre dossier pour l'entreprise « ${companyName} », nous vous informons que vos documents légaux ne sont pas conformes.\n\nMotif constaté : ${reasonText}\n\nVotre accès à l'application FacturX reste 100 % actif et sans aucune coupure. Toutefois, veuillez vous connecter à votre tableau de bord et cliquer sur « Revoir & Remplacer mes documents » afin de soumettre à nouveau des pièces conformes.\n\nAccéder à votre tableau de bord : ${appUrl}\n\nCordialement,\nL'équipe Conformité FacturX`;

    const htmlBody = isApproved
      ? `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; color: #0f172a;">
          <div style="display: inline-block; padding: 6px 12px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
            Dossier Légal Validé
          </div>
          <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a;">Vos documents pour ${safeCo} ont été approuvés</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Bonjour,<br/><br/>
            Nous avons terminé la vérification de vos documents légaux d'entreprise. Tout est conforme : votre espace <strong>${safeCo}</strong> dispose désormais du badge officiel <strong>Entreprise Vérifiée</strong> sur FacturX.
          </p>
          <div style="margin: 24px 0;">
            <a href="${appUrl}" style="display: inline-block; padding: 12px 22px; background: #183BB0; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px;">
              Ouvrir mon espace FacturX
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 24px;">L'équipe FacturX</p>
        </div>`
      : `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #fecdd3; border-radius: 16px; color: #0f172a;">
          <div style="display: inline-block; padding: 6px 12px; border-radius: 999px; background: #fff1f2; color: #be123c; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
            Documents non conformes — Révision demandée
          </div>
          <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a;">Veuillez revoir les documents de ${safeCo}</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Bonjour,<br/><br/>
            Après vérification de votre dossier, <strong>vos documents légaux ne sont pas conformes</strong> et nécessitent une mise à jour de votre part.
          </p>
          <div style="padding: 14px 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; font-size: 13px; color: #92400e; margin: 16px 0;">
            <strong>Observation :</strong> ${escapeHtml(reasonText)}
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            <strong>Important :</strong> Votre accès à l'application FacturX n'est pas bloqué — vous pouvez continuer à travailler normalement. Connectez-vous simplement à votre tableau de bord pour téléverser à nouveau vos documents corrigés.
          </p>
          <div style="margin: 24px 0;">
            <a href="${appUrl}" style="display: inline-block; padding: 12px 22px; background: #183BB0; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px;">
              Revoir mes documents sur FacturX
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 24px;">L'équipe Conformité FacturX</p>
        </div>`;

    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(plainBody)}`;

    const sendRes = await sendTransactionalEmail({
      to: email,
      toName: companyName,
      subject,
      html: htmlBody,
      text: plainBody,
      senderName: "FacturX Conformité",
    });

    return NextResponse.json({
      ok: true,
      sentAutomatically: sendRes.sentAutomatically,
      providerUsed: sendRes.providerUsed,
      error: sendRes.sentAutomatically ? null : sendRes.error,
      subject,
      plainBody,
      mailtoUrl,
    });
  } catch (err) {
    console.error("Erreur /api/kyb-notify:", err);
    return NextResponse.json(
      { error: "Erreur lors de la préparation de la notification email." },
      { status: 500 }
    );
  }
}
