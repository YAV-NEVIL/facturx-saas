import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      companyName = "Votre entreprise",
      decision,
      rejectionReason = "",
    } = body || {};

    if (!email || !["approved", "rejected"].includes(decision)) {
      return NextResponse.json(
        { error: "Paramètres d'email ou de décision manquants." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://facturx-saas.vercel.app";
    const isApproved = decision === "approved";

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
            ✓ Dossier Légal Validé
          </div>
          <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a;">Vos documents pour ${companyName} ont été approuvés</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Bonjour,<br/><br/>
            Nous avons terminé la vérification de vos documents légaux d'entreprise. Tout est conforme : votre espace <strong>${companyName}</strong> dispose désormais du badge officiel <strong>Entreprise Vérifiée</strong> sur FacturX.
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
            ⚠️ Documents non conformes — Révision demandée
          </div>
          <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a;">Veuillez revoir les documents de ${companyName}</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Bonjour,<br/><br/>
            Après vérification de votre dossier, <strong>vos documents légaux ne sont pas conformes</strong> et nécessitent une mise à jour de votre part.
          </p>
          <div style="padding: 14px 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; font-size: 13px; color: #92400e; margin: 16px 0;">
            <strong>Observation :</strong> ${reasonText}
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

    let sentAutomatically = false;
    let providerUsed = null;

    // 1. Envoi automatique via Resend si RESEND_API_KEY est configuré sur Vercel
    if (process.env.RESEND_API_KEY) {
      const fromAddress = process.env.FACTURX_FROM_EMAIL || "FacturX <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject,
          html: htmlBody,
          text: plainBody,
        }),
      });
      if (res.ok) {
        sentAutomatically = true;
        providerUsed = "resend";
      }
    }

    // 2. Envoi automatique via Brevo si BREVO_API_KEY est configuré sur Vercel
    if (!sentAutomatically && process.env.BREVO_API_KEY) {
      const senderEmail = process.env.FACTURX_SENDER_EMAIL || "loumalabs@gmail.com";
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "FacturX Conformité", email: senderEmail },
          to: [{ email, name: companyName }],
          subject,
          htmlContent: htmlBody,
          textContent: plainBody,
        }),
      });
      if (res.ok) {
        sentAutomatically = true;
        providerUsed = "brevo";
      }
    }

    return NextResponse.json({
      ok: true,
      sentAutomatically,
      providerUsed,
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
