import nodemailer from "nodemailer";

export function escapeHtml(str = "") {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isEmailProviderConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY ||
      process.env.BREVO_API_KEY ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
}

/**
 * Envoie un email transactionnel réel en cascade :
 * 1) Resend (RESEND_API_KEY)
 * 2) Brevo (BREVO_API_KEY)
 * 3) SMTP Standard / Gmail / Zoho / OVH via Nodemailer (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 */
export async function sendTransactionalEmail({
  to,
  toName = "",
  subject,
  html,
  text,
  replyTo = "",
  senderName = "FacturX",
  attachments = [],
}) {
  const recipients = (Array.isArray(to) ? to : [to])
    .map((e) => String(e || "").trim())
    .filter((e) => e.includes("@"));

  if (recipients.length === 0) {
    return {
      ok: false,
      sentAutomatically: false,
      providerUsed: null,
      error: "Adresse email destinataire invalide ou manquante.",
    };
  }

  const validAttachments = (Array.isArray(attachments) ? attachments : []).filter(
    (att) => att && att.filename && att.base64
  );

  const errors = [];

  // 1. Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const fromAddress =
        process.env.FACTURX_FROM_EMAIL || "FacturX <onboarding@resend.dev>";
      const payload = {
        from: fromAddress,
        to: recipients,
        subject,
        html,
        text,
      };
      if (replyTo && replyTo.includes("@")) {
        payload.reply_to = replyTo;
      }
      if (validAttachments.length > 0) {
        payload.attachments = validAttachments.map((att) => ({
          filename: att.filename,
          content: att.base64,
        }));
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          ok: true,
          sentAutomatically: true,
          providerUsed: "resend",
          messageId: data?.id || null,
        };
      }
      errors.push(`Resend (${res.status}): ${data?.message || res.statusText}`);
    } catch (err) {
      errors.push(`Resend: ${err.message}`);
    }
  }

  // 2. Brevo (ex-Sendinblue)
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail =
        process.env.FACTURX_SENDER_EMAIL || "loumalabs@gmail.com";
      const payload = {
        sender: { name: senderName || "FacturX", email: senderEmail },
        to: recipients.map((email) => ({
          email,
          name: toName || email,
        })),
        subject,
        htmlContent: html,
        textContent: text,
      };
      if (replyTo && replyTo.includes("@")) {
        payload.replyTo = { email: replyTo };
      }
      if (validAttachments.length > 0) {
        payload.attachment = validAttachments.map((att) => ({
          name: att.filename,
          content: att.base64,
        }));
      }

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          ok: true,
          sentAutomatically: true,
          providerUsed: "brevo",
          messageId: data?.messageId || null,
        };
      }
      errors.push(`Brevo (${res.status}): ${data?.message || res.statusText}`);
    } catch (err) {
      errors.push(`Brevo: ${err.message}`);
    }
  }

  // 3. SMTP Direct via Nodemailer (Gmail, Zoho, OVH, Hostinger, Brevo SMTP...)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = Number(process.env.SMTP_PORT || 465);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const fromAddress =
        process.env.FACTURX_FROM_EMAIL ||
        `"${senderName || "FacturX"}" <${process.env.SMTP_USER}>`;

      const mailOptions = {
        from: fromAddress,
        to: recipients.join(", "),
        subject,
        text,
        html,
      };

      if (replyTo && replyTo.includes("@")) {
        mailOptions.replyTo = replyTo;
      }

      if (validAttachments.length > 0) {
        mailOptions.attachments = validAttachments.map((att) => ({
          filename: att.filename,
          content: Buffer.from(att.base64, "base64"),
          contentType: att.contentType || "application/pdf",
        }));
      }

      const info = await transporter.sendMail(mailOptions);
      return {
        ok: true,
        sentAutomatically: true,
        providerUsed: "smtp",
        messageId: info?.messageId || null,
      };
    } catch (err) {
      errors.push(`SMTP: ${err.message}`);
    }
  }

  return {
    ok: errors.length === 0,
    sentAutomatically: false,
    providerUsed: null,
    error:
      errors.length > 0
        ? errors.join(" | ")
        : "Aucun fournisseur SMTP/Email (RESEND_API_KEY, BREVO_API_KEY ou SMTP_HOST) n'est encore configuré sur le serveur.",
  };
}

