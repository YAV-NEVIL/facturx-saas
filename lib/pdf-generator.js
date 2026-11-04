// Générateur PDF conforme standard PDF-1.4 en JavaScript pur (zéro dépendance)
import { calculateInvoiceTotals, formatAmount, getCurrencySymbol } from "./mock-data.js";

// Échappe les caractères spéciaux pour les chaînes de texte PDF (...)
function escapePdfText(text = "") {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[éèêë]/g, "e")
    .replace(/[àâä]/g, "a")
    .replace(/[îï]/g, "i")
    .replace(/[ôö]/g, "o")
    .replace(/[ùûü]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[ÉÈÊË]/g, "E")
    .replace(/[ÀÂÄ]/g, "A")
    .replace(/[ÎÏ]/g, "I")
    .replace(/[ÔÖ]/g, "O")
    .replace(/[ÙÛÜ]/g, "U")
    .replace(/[Ç]/g, "C");
}

export function generateInvoicePdf(invoice, companyInfo = null) {
  if (!invoice) return false;

  const comp = invoice.company || companyInfo || {};
  const companyName = comp.name || "FacturX Technologies RDC SARL";
  const companyAddress = comp.address
    ? `${comp.address}, ${comp.city || "Kinshasa"}, ${comp.country || "RDC"}`
    : "Boulevard du 30 Juin, Gombe, Kinshasa, RDC";
  
  const rccm = comp.rccm || "CD/KIN/RCCM/24-B-01420";
  const idNat = comp.idNat || "01-G4701-B89201";
  const nif = comp.nif || comp.ninea || "A2408912Z";
  const companyTax = `RCCM : ${rccm}  |  Id. Nat : ${idNat}  |  N* Impot : ${nif}`;
  const companyContact = `Contact : ${comp.email || "contact@facturx.cd"}  |  Tel : ${comp.phone || "+243 81 000 40 50"}`;

  const curr = comp.defaultCurrency || "Franc Congolais (CDF / FC)";
  const currSym = comp.currencySymbol || getCurrencySymbol(curr);

  const { subtotal, vatAmount, total } = calculateInvoiceTotals(
    invoice.items,
    invoice.vatRate || 0.16
  );

  // Largeur A4 : 595.28 pt, Hauteur : 841.89 pt
  const commands = [];

  // Helpers pour placement absolu fiable
  const drawText = (x, y, text, font = "/F1 9 Tf", color = "0.2 0.25 0.35 rg") => {
    commands.push(`BT ${font} ${color} ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
  };

  const drawRect = (x, y, w, h, fill = null, stroke = null, lineWidth = 1) => {
    if (fill) {
      commands.push(`${fill} ${x} ${y} ${w} ${h} re f`);
    }
    if (stroke) {
      commands.push(`${stroke} ${lineWidth} w ${x} ${y} ${w} ${h} re S`);
    }
  };

  const drawLine = (x1, y1, x2, y2, stroke = "0.85 0.88 0.94 RG", lineWidth = 1) => {
    commands.push(`${stroke} ${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  // 1. En-tête : Fond bandeau bleu supérieur (#183BB0)
  drawRect(0, 785, 595.28, 57, "0.09 0.23 0.69 rg");
  drawText(40, 806, `${companyName.toUpperCase()}  --  FACTURE B2B`, "/F2 13 Tf", "1 1 1 rg");
  drawText(400, 806, "CONFORME OHADA / RDC (DGI)", "/F2 9 Tf", "0.85 0.92 1 rg");

  // 2. Bloc Émetteur (gauche)
  drawText(40, 755, companyName, "/F2 13 Tf", "0.1 0.15 0.25 rg");
  drawText(40, 740, companyAddress, "/F1 8.5 Tf", "0.35 0.4 0.5 rg");
  drawText(40, 727, companyTax, "/F1 8.5 Tf", "0.35 0.4 0.5 rg");
  drawText(40, 714, companyContact, "/F1 8.5 Tf", "0.35 0.4 0.5 rg");

  // 3. Bloc Numéro Facture & Dates (droite)
  drawText(370, 755, `FACTURE N* ${invoice.id}`, "/F2 15 Tf", "0.09 0.23 0.69 rg");
  drawText(370, 738, `Date d'emission : ${invoice.issueDate}`, "/F1 9 Tf", "0.2 0.25 0.35 rg");
  drawText(370, 724, `Date d'echeance : ${invoice.dueDate}`, "/F1 9 Tf", "0.2 0.25 0.35 rg");
  
  const statusLabel =
    invoice.status === "payee"
      ? "[STATUT : PAYEE]"
      : invoice.status === "envoyee"
      ? "[STATUT : ENVOYEE]"
      : invoice.status === "en_attente"
      ? "[STATUT : EN RETARD - RECOUVREMENT]"
      : "[STATUT : BROUILLON]";

  const statusColor =
    invoice.status === "payee"
      ? "0.08 0.55 0.25 rg"
      : invoice.status === "envoyee"
      ? "0.8 0.35 0.05 rg"
      : invoice.status === "en_attente"
      ? "0.8 0.1 0.15 rg"
      : "0.4 0.45 0.5 rg";

  drawText(370, 710, statusLabel, "/F2 9.5 Tf", statusColor);

  // Ligne de séparation
  drawLine(40, 695, 555, 695, "0.85 0.88 0.94 RG", 1);

  // 4. Bloc Client Complet (Facturé à)
  drawRect(40, 595, 515, 88, "0.96 0.97 0.99 rg", "0.88 0.91 0.96 RG", 1);
  drawText(55, 666, "FACTURE A :", "/F2 9.5 Tf", "0.09 0.23 0.69 rg");
  drawText(55, 650, invoice.clientName || "Client non precise", "/F2 12 Tf", "0.1 0.1 0.1 rg");
  
  if (invoice.contactPerson) {
    drawText(55, 636, `Contact : ${invoice.contactPerson}`, "/F1 8.5 Tf", "0.2 0.25 0.35 rg");
  }
  
  drawText(
    55,
    623,
    `Email : ${invoice.clientEmail || "N/A"}  |  Tel / WhatsApp : ${invoice.clientPhone || "+243 99 000 00 00"}`,
    "/F1 8.5 Tf",
    "0.2 0.25 0.35 rg"
  );
  
  drawText(
    55,
    610,
    `Adresse : ${invoice.address || "Centre-ville"}, ${invoice.location || "Kinshasa, RDC"}  |  Identifiants : ${invoice.taxId || "CD-RCCM-2024"}`,
    "/F1 8.5 Tf",
    "0.35 0.4 0.5 rg"
  );

  // 5. Tableau des prestations
  const tableTop = 560;
  // Entête du tableau (#EEF4FD)
  drawRect(40, tableTop - 22, 515, 22, "0.93 0.96 0.99 rg");
  drawText(50, tableTop - 15, "DESIGNATION DES PRESTATIONS", "/F2 9 Tf", "0.15 0.25 0.45 rg");
  drawText(330, tableTop - 15, "QTE", "/F2 9 Tf", "0.15 0.25 0.45 rg");
  drawText(380, tableTop - 15, `PRIX U. HT (${currSym})`, "/F2 9 Tf", "0.15 0.25 0.45 rg");
  drawText(470, tableTop - 15, `TOTAL HT (${currSym})`, "/F2 9 Tf", "0.15 0.25 0.45 rg");

  // Lignes de prestations
  let currentY = tableTop - 22;
  const items = invoice.items || [];

  items.forEach((item, idx) => {
    currentY -= 26;

    // Ligne alternée douce
    if (idx % 2 === 1) {
      drawRect(40, currentY, 515, 26, "0.98 0.98 0.99 rg");
    }

    // Bordure inférieure
    drawLine(40, currentY, 555, currentY, "0.9 0.92 0.95 RG", 0.6);

    const lineTotal = item.quantity * item.unitPrice;

    drawText(50, currentY + 8, item.description, "/F1 8.5 Tf", "0.15 0.15 0.2 rg");
    drawText(335, currentY + 8, String(item.quantity), "/F1 8.5 Tf", "0.2 0.25 0.3 rg");
    drawText(380, currentY + 8, formatAmount(item.unitPrice, currSym), "/F1 8.5 Tf", "0.2 0.25 0.3 rg");
    drawText(470, currentY + 8, formatAmount(lineTotal, currSym), "/F2 9 Tf", "0.1 0.1 0.1 rg");
  });

  // 6. Bloc Totaux et Modalités de paiement
  currentY -= 25;

  // Encadré Coordonnées bancaires & Mobile Money (gauche)
  drawRect(40, currentY - 95, 275, 100, "0.97 0.98 0.99 rg", "0.88 0.9 0.95 RG", 0.8);
  drawText(52, currentY - 14, `MODALITES DE REGLEMENT (${currSym})`, "/F2 8.5 Tf", "0.09 0.23 0.69 rg");
  drawText(52, currentY - 28, `Banque : ${comp.bankName || "Rawbank"}`, "/F1 8 Tf", "0.2 0.25 0.3 rg");
  drawText(52, currentY - 42, `Compte / IBAN : ${comp.iban || "CD00 RAWB 0100 1000 0123 4567 89"}`, "/F1 8 Tf", "0.2 0.25 0.3 rg");
  if (comp.airtelMoneyNumber) {
    drawText(52, currentY - 56, `Airtel Money Pro : ${comp.airtelMoneyNumber}`, "/F2 8 Tf", "0.1 0.15 0.25 rg");
  }
  if (comp.orangeMoneyNumber) {
    drawText(52, currentY - 70, `Orange Money Pro RDC : ${comp.orangeMoneyNumber}`, "/F2 8 Tf", "0.1 0.15 0.25 rg");
  }
  drawText(52, currentY - 84, `Motif obligatoire : ${invoice.id}`, "/F2 8 Tf", "0.09 0.23 0.69 rg");

  // Récapitulatif Chiffré (droite)
  drawRect(330, currentY - 95, 225, 100, "0.94 0.96 0.99 rg", "0.82 0.88 0.96 RG", 1);
  drawText(345, currentY - 18, "Sous-total HT :", "/F1 9 Tf", "0.3 0.35 0.4 rg");
  drawText(445, currentY - 18, formatAmount(subtotal, currSym), "/F2 9.5 Tf", "0.1 0.15 0.2 rg");

  const vatPercentage = Math.round((invoice.vatRate || 0.16) * 100);
  drawText(345, currentY - 38, `TVA legale ${vatPercentage}% :`, "/F1 9 Tf", "0.3 0.35 0.4 rg");
  drawText(445, currentY - 38, formatAmount(vatAmount, currSym), "/F2 9.5 Tf", "0.1 0.15 0.2 rg");

  // Ligne Total TTC
  drawLine(330, currentY - 55, 555, currentY - 55, "0.09 0.23 0.69 RG", 1.2);
  drawText(345, currentY - 76, "TOTAL TTC :", "/F2 11 Tf", "0.09 0.23 0.69 rg");
  drawText(435, currentY - 76, formatAmount(total, currSym), "/F2 11.5 Tf", "0.09 0.23 0.69 rg");

  // Notes de facture
  if (invoice.notes) {
    drawText(40, currentY - 115, `Note : ${invoice.notes}`, "/F1 8 Tf", "0.45 0.5 0.6 rg");
  }

  // 7. Pied de page & Cachet
  drawLine(40, 60, 555, 60, "0.85 0.88 0.94 RG", 1);
  drawText(
    40,
    45,
    "FacturX SaaS -- Document electronique certifie conforme a la legislation fiscale OHADA / RDC (DGI).",
    "/F1 7.5 Tf",
    "0.45 0.5 0.6 rg"
  );
  drawText(
    40,
    33,
    "Rappel ou reclamation : service.recouvrement@facturx.cd  |  Kinshasa, RDC",
    "/F1 7.5 Tf",
    "0.45 0.5 0.6 rg"
  );

  // Construction du corps PDF-1.4 standard
  const contentStream = commands.join("\n");
  const streamLength = contentStream.length;

  const pdfObjects = [];
  pdfObjects.push("%PDF-1.4");
  pdfObjects.push("%\xE2\xE3\xCF\xD3");

  // Objet 1: Catalog
  pdfObjects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");

  // Objet 2: Pages
  pdfObjects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");

  // Objet 3: Page
  pdfObjects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj"
  );

  // Objet 4: Contents
  pdfObjects.push(
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`
  );

  // Objet 5: Police Helvetica
  pdfObjects.push(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj"
  );

  // Objet 6: Police Helvetica-Bold
  pdfObjects.push(
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj"
  );

  // Calcul table xref
  const pdfStringWithoutXref = pdfObjects.join("\n") + "\n";
  const lines = pdfStringWithoutXref.split("\n");

  const offsets = [0];
  let currentOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^\d+ 0 obj/)) {
      offsets.push(currentOffset);
    }
    currentOffset += line.length + 1; // +1 pour le \n
  }

  const startXref = currentOffset;
  let xref = "xref\n0 7\n0000000000 65535 f \n";
  for (let i = 1; i <= 6; i++) {
    const off = String(offsets[i] || 0).padStart(10, "0");
    xref += `${off} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  const finalPdfData = `${pdfStringWithoutXref}${xref}${trailer}`;

  // Déclencher le téléchargement dans le navigateur
  try {
    const blob = new Blob([finalPdfData], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Facture_${invoice.id}_${invoice.clientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    return false;
  }
}

// Générateur PDF professionnel pour Quittance Officielle d'Encaissement
export function generateReceiptPdf(payment, companyInfo = null) {
  if (!payment) return false;

  const comp = companyInfo || {};
  const companyName = comp.name || "HORIZON GROUPE";
  const companyAddress = comp.address
    ? `${comp.address}, ${comp.city || "Kinshasa"}, ${comp.country || "RDC"}`
    : "Boulevard du 30 Juin, Immeuble BCDC, Gombe, Kinshasa, RDC";
  const rccm = comp.rccm || "CD/KIN/RCCM/24-B-01420";
  const idNat = comp.idNat || "01-G4701-B89201";
  const nif = comp.nif || comp.ninea || "A2408912Z";
  const companyTax = `RCCM : ${rccm}  |  Id. Nat : ${idNat}  |  NIF : ${nif}`;
  const companyContact = `Tel : ${comp.phone || "+243 81 000 40 50"}  |  Email : ${comp.email || "contact@facturx.cd"}`;

  const curr = payment.currency || comp.currencySymbol || "FC";
  const receiptNum = payment.receiptNumber || payment.receipt_number || payment.id || "REC-2026";
  const invoiceRef = payment.invoiceId || payment.invoice_id || "FAC-2026";
  const clientName = payment.clientName || payment.client_name || "Client";
  const contactPerson = payment.contactPerson || payment.contact_person || "";
  const clientEmail = payment.clientEmail || payment.client_email || "";
  const clientPhone = payment.clientPhone || payment.client_phone || "";
  const amount = Number(payment.amount) || 0;
  const payDate = payment.paymentDate || payment.payment_date || new Date().toLocaleDateString("fr-FR");
  const payTime = payment.paymentTime || payment.payment_time || "12:00";
  const method = payment.method || "Mobile Money";
  const txRef = payment.transactionRef || payment.transaction_ref || payment.reference || "N/A";
  const beneficiary = payment.beneficiaryAccount || payment.beneficiary_account || "+243 99 820 40 50";
  const recordedBy = payment.recordedBy || payment.recorded_by || "Direction Financière";

  const commands = [];
  const drawText = (x, y, text, font = "/F1 9 Tf", color = "0.2 0.25 0.35 rg") => {
    commands.push(`BT ${font} ${color} ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
  };
  const drawRect = (x, y, w, h, fill = null, stroke = null, lineWidth = 1) => {
    if (fill) commands.push(`${fill} ${x} ${y} ${w} ${h} re f`);
    if (stroke) commands.push(`${stroke} ${lineWidth} w ${x} ${y} ${w} ${h} re S`);
  };
  const drawLine = (x1, y1, x2, y2, stroke = "0.85 0.88 0.94 RG", lineWidth = 1) => {
    commands.push(`${stroke} ${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  // 1. Bandeau supérieur Vert Émeraude (#059669)
  drawRect(0, 785, 595.28, 57, "0.02 0.59 0.41 rg");
  drawText(40, 806, `${companyName.toUpperCase()}  --  QUITTANCE OFFICIELLE D'ENCAISSEMENT`, "/F2 12 Tf", "1 1 1 rg");
  drawText(390, 806, "ENCAISSE & CERTIFIE CONFORME", "/F2 8.5 Tf", "0.85 1 0.92 rg");

  // 2. Émetteur
  drawText(40, 755, companyName, "/F2 13 Tf", "0.1 0.15 0.25 rg");
  drawText(40, 740, companyAddress, "/F1 8.5 Tf", "0.35 0.4 0.5 rg");
  drawText(40, 727, companyTax, "/F1 8.5 Tf", "0.35 0.4 0.5 rg");
  drawText(40, 714, companyContact, "/F1 8.5 Tf", "0.35 0.4 0.5 rg");

  // 3. Référence Quittance
  drawText(360, 755, `QUITTANCE N* ${receiptNum}`, "/F2 13 Tf", "0.02 0.59 0.41 rg");
  drawText(360, 738, `Date de reglement : ${payDate} a ${payTime}`, "/F1 8.5 Tf", "0.2 0.25 0.35 rg");
  drawText(360, 724, `Facture rattachee : ${invoiceRef}`, "/F2 9.5 Tf", "0.09 0.23 0.69 rg");
  drawText(360, 710, `Statut : REGLEMENT ENCAISSE (100% VALIDE)`, "/F2 8.5 Tf", "0.02 0.59 0.41 rg");

  drawLine(40, 695, 555, 695, "0.85 0.88 0.94 RG", 1);

  // 4. Cartouche Débiteur (Client)
  drawRect(40, 605, 515, 75, "0.97 0.98 1 rg", "0.88 0.91 0.96 RG", 1);
  drawText(55, 663, "REGLEMENT PERCU DE :", "/F2 9 Tf", "0.09 0.23 0.69 rg");
  drawText(55, 647, clientName, "/F2 11.5 Tf", "0.1 0.1 0.1 rg");
  if (contactPerson) {
    drawText(55, 634, `Attn : ${contactPerson}  |  Email : ${clientEmail || "N/A"}  |  Tel : ${clientPhone || "N/A"}`, "/F1 8.5 Tf", "0.25 0.3 0.4 rg");
  } else {
    drawText(55, 634, `Email : ${clientEmail || "N/A"}  |  Tel : ${clientPhone || "N/A"}`, "/F1 8.5 Tf", "0.25 0.3 0.4 rg");
  }
  drawText(55, 620, "Debiteur a jour de ses obligations de reglement pour ce paiement.", "/F1 8 Tf", "0.02 0.59 0.41 rg");

  // 5. Grand Cadre Montant Encaissé
  drawRect(40, 485, 515, 105, "0.95 0.99 0.97 rg", "0.65 0.88 0.75 RG", 1.5);
  drawText(55, 568, "MONTANT GLOBAL DU REGLEMENT ENCAISSE :", "/F2 10 Tf", "0.02 0.59 0.41 rg");
  drawText(55, 538, `${formatAmount(amount, curr)}`, "/F2 22 Tf", "0.02 0.59 0.41 rg");
  drawText(55, 512, "Modalite de reglement :", "/F2 8.5 Tf", "0.2 0.3 0.35 rg");
  drawText(165, 512, `${method}  |  Ref Operateur : ${txRef}`, "/F1 8.5 Tf", "0.1 0.15 0.2 rg");
  drawText(55, 498, "Compte beneficiaire credite :", "/F2 8.5 Tf", "0.2 0.3 0.35 rg");
  drawText(195, 498, `${beneficiary}`, "/F1 8.5 Tf", "0.1 0.15 0.2 rg");

  // 6. Tableau Récapitulatif de Ventilation
  const tableY = 460;
  drawRect(40, tableY - 20, 515, 20, "0.93 0.95 0.98 rg");
  drawText(50, tableY - 14, "DESIGNATION DE L'OPERATION", "/F2 8.5 Tf", "0.15 0.25 0.45 rg");
  drawText(310, tableY - 14, "CANAL DE PAIEMENT", "/F2 8.5 Tf", "0.15 0.25 0.45 rg");
  drawText(430, tableY - 14, "MONTANT PERCU", "/F2 8.5 Tf", "0.15 0.25 0.45 rg");

  drawRect(40, tableY - 55, 515, 35, null, "0.88 0.91 0.96 RG", 1);
  drawText(50, tableY - 33, `Reglement integral Facture ${invoiceRef}`, "/F2 9 Tf", "0.1 0.15 0.25 rg");
  drawText(50, tableY - 46, `Transfere et confirme via reseau telecom`, "/F1 7.5 Tf", "0.4 0.45 0.5 rg");
  drawText(310, tableY - 37, `${method}`, "/F1 8.5 Tf", "0.2 0.25 0.35 rg");
  drawText(430, tableY - 37, `${formatAmount(amount, curr)}`, "/F2 9.5 Tf", "0.02 0.59 0.41 rg");

  // 7. Bloc Certification & Tampon officiel
  drawRect(40, 240, 515, 140, "0.98 0.99 1 rg", "0.85 0.88 0.95 RG", 1);
  drawText(55, 360, "CERTIFICATION & QUITUS LIBERATOIRE", "/F2 10 Tf", "0.09 0.23 0.69 rg");
  drawText(
    55,
    342,
    "La societe soussignee atteste par la presente quittance avoir recu le montant specifie ci-dessus,",
    "/F1 8 Tf",
    "0.3 0.35 0.45 rg"
  );
  drawText(
    55,
    329,
    `au titre du reglement definitif de la facture ${invoiceRef}. La presente quittance confere plein`,
    "/F1 8 Tf",
    "0.3 0.35 0.45 rg"
  );
  drawText(
    55,
    316,
    "et entier desinteressement pour le montant encaisse aux termes de la reglementation commerciale OHADA.",
    "/F1 8 Tf",
    "0.3 0.35 0.45 rg"
  );

  // Cadre cachet / signature
  drawRect(340, 252, 200, 50, "1 1 1 rg", "0.02 0.59 0.41 RG", 1);
  drawText(350, 290, "CERTIFIE CONFORME ET ENCAISSE", "/F2 7.5 Tf", "0.02 0.59 0.41 rg");
  drawText(350, 277, `Par : ${recordedBy}`, "/F1 7.5 Tf", "0.2 0.3 0.35 rg");
  drawText(350, 262, `Date : ${payDate}  |  Visa Tresorerie`, "/F2 7.5 Tf", "0.02 0.59 0.41 rg");

  // 8. Bas de page officiel
  drawLine(40, 70, 555, 70, "0.85 0.88 0.94 RG", 1);
  drawText(
    40,
    55,
    "FacturX SaaS -- Quittance electronique infalsifiable emise selon les standards fiscaux OHADA / RDC (DGI).",
    "/F1 7.5 Tf",
    "0.45 0.5 0.6 rg"
  );
  drawText(
    40,
    42,
    `Identifiant unique d'audit : QUITTANCE-HASH-${receiptNum}-${Math.floor(100000 + Math.random() * 900000)}`,
    "/F2 7 Tf",
    "0.02 0.59 0.41 rg"
  );

  // Construction stream PDF-1.4
  const contentStream = commands.join("\n");
  const streamLength = contentStream.length;
  const pdfObjects = [];
  pdfObjects.push("%PDF-1.4");
  pdfObjects.push("%\xE2\xE3\xCF\xD3");
  pdfObjects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  pdfObjects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");
  pdfObjects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj"
  );
  pdfObjects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`);
  pdfObjects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj");
  pdfObjects.push("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj");

  const totalObjects = 6;
  const pdfStringWithoutXref = pdfObjects.join("\n") + "\n";
  const lines = pdfStringWithoutXref.split("\n");
  const offsets = [0];
  let currentOffset = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^\d+ 0 obj/)) offsets.push(currentOffset);
    currentOffset += line.length + 1;
  }
  const startXref = currentOffset;
  let xref = `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= totalObjects; i++) {
    const off = String(offsets[i] || 0).padStart(10, "0");
    xref += `${off} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;
  const finalPdfData = `${pdfStringWithoutXref}${xref}${trailer}`;

  try {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const blob = new Blob([finalPdfData], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Quittance_${receiptNum}_${clientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    return { success: true, pdfData: finalPdfData, size: finalPdfData.length };
  } catch (error) {
    console.error("Erreur lors de la génération de la quittance PDF:", error);
    return false;
  }
}

// Générateur PDF professionnel pour les Rapports et États Financiers
export function generateReportPdf({
  title = "SYNTHESE 360 DU PORTEFEUILLE CLIENTS & PROSPECTS",
  reportType = "all",
  companyInfo = {},
  userProfile = {},
  data = [],
  currency = "FC",
  auditId = "",
  printDate = "",
}) {
  const comp = companyInfo || {};
  const compName = comp.name || "HORIZON GROUPE";
  const compSubtitle = comp.subtitle || "Solutions Digitales & Facturation OHADA / RDC";
  const compAddress = comp.address
    ? `${comp.address}, ${comp.city || "Kinshasa"}, ${comp.country || "RDC"}`
    : "Boulevard du 30 Juin, Immeuble BCDC, Gombe, Kinshasa";
  const rccm = comp.rccm || "CD/KIN/RCCM/24-B-01420";
  const idNat = comp.idNat || "01-G4701-B89201";
  const nif = comp.nif || comp.ninea || "A2408912Z";
  const compTax = `RCCM : ${rccm}  |  Id. Nat : ${idNat}  |  NIF : ${nif}`;
  const compContact = `Tel : ${comp.phone || "+243 81 000 40 50"}  |  Email : ${comp.email || "contact@facturx.cd"}`;

  const currSym = comp.currencySymbol || getCurrencySymbol(currency) || currency || "FC";
  const actualAuditId = auditId || `AUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const actualPrintDate =
    printDate ||
    new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const operatorName = userProfile.name || "Administration FacturX";

  // Helpers pour placement absolu
  const addText = (cmds, x, y, text, font = "/F1 8.5 Tf", color = "0.2 0.25 0.35 rg") => {
    cmds.push(`BT ${font} ${color} ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
  };

  const addRect = (cmds, x, y, w, h, fill = null, stroke = null, lineWidth = 1) => {
    if (fill) cmds.push(`${fill} ${x} ${y} ${w} ${h} re f`);
    if (stroke) cmds.push(`${stroke} ${lineWidth} w ${x} ${y} ${w} ${h} re S`);
  };

  const addLine = (cmds, x1, y1, x2, y2, stroke = "0.85 0.88 0.94 RG", lineWidth = 1) => {
    cmds.push(`${stroke} ${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  // Pagination des lignes (12 lignes max par page pour confort visuel et bas de page certifié)
  const rowsPerPage = 12;
  const totalItems = data.length > 0 ? data.length : 1;
  const numPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const pages = [];

  const totalConsolidated = data.reduce(
    (acc, row) => acc + (row.totalAmount || row.total || 0),
    0
  );

  for (let pageIdx = 0; pageIdx < numPages; pageIdx++) {
    const cmds = [];
    const isFirstPage = pageIdx === 0;
    const isLastPage = pageIdx === numPages - 1;
    const pageRows = data.slice(pageIdx * rowsPerPage, (pageIdx + 1) * rowsPerPage);

    // 1. Bandeau supérieur bleu
    addRect(cmds, 0, 800, 595.28, 42, "0.09 0.23 0.69 rg");
    addText(cmds, 36, 816, `${compName.toUpperCase()} -- RAPPORT OFFICIEL DE GESTION`, "/F2 11 Tf", "1 1 1 rg");
    addText(cmds, 385, 816, "CERTIFIE CONFORME OHADA / DGI", "/F2 8.5 Tf", "0.85 0.92 1 rg");

    // 2. En-tête société
    addText(cmds, 36, 775, compName, "/F2 13 Tf", "0.1 0.15 0.25 rg");
    addText(cmds, 36, 762, compSubtitle, "/F2 8.5 Tf", "0.15 0.35 0.8 rg");
    addText(cmds, 36, 749, compAddress, "/F1 8 Tf", "0.35 0.4 0.5 rg");
    addText(cmds, 36, 737, compTax, "/F1 8 Tf", "0.35 0.4 0.5 rg");
    addText(cmds, 36, 725, compContact, "/F1 8 Tf", "0.35 0.4 0.5 rg");

    // Bloc Audit (droite)
    addRect(cmds, 375, 718, 184, 68, "0.96 0.97 0.99 rg", "0.85 0.88 0.94 RG", 0.8);
    addText(cmds, 385, 770, "CONFORME DGI / OHADA", "/F2 8 Tf", "0.09 0.5 0.25 rg");
    addText(cmds, 385, 755, `REF AUDIT : ${actualAuditId}`, "/F2 8.5 Tf", "0.09 0.23 0.69 rg");
    addText(cmds, 385, 742, `Date : ${actualPrintDate}`, "/F1 7.5 Tf", "0.35 0.4 0.5 rg");
    addText(cmds, 385, 730, `Operateur : ${operatorName}`, "/F1 7.5 Tf", "0.35 0.4 0.5 rg");
    addText(cmds, 385, 721, `Page ${pageIdx + 1} sur ${numPages}`, "/F1 7.5 Tf", "0.45 0.5 0.6 rg");

    // Séparateur
    addLine(cmds, 36, 710, 559, 710, "0.85 0.88 0.94 RG", 1);

    // 3. Titre du rapport
    addRect(cmds, 36, 670, 523, 32, "0.95 0.96 0.98 rg", "0.88 0.9 0.95 RG", 0.8);
    addText(cmds, 46, 688, title.toUpperCase(), "/F2 10.5 Tf", "0.09 0.15 0.3 rg");
    addText(cmds, 46, 676, "Etat d'inventaire consolide extrait du grand livre FacturX", "/F1 7.5 Tf", "0.4 0.45 0.55 rg");

    // 4. En-tête du tableau
    const tableTop = 658;
    addRect(cmds, 36, tableTop - 20, 523, 20, "0.92 0.94 0.98 rg", "0.85 0.88 0.94 RG", 0.8);
    addText(cmds, 42, tableTop - 14, "REF / ID", "/F2 8 Tf", "0.15 0.25 0.45 rg");
    addText(cmds, 105, tableTop - 14, "CLIENT / DEBITEUR", "/F2 8 Tf", "0.15 0.25 0.45 rg");
    addText(cmds, 235, tableTop - 14, "CONTACT & VILLE", "/F2 8 Tf", "0.15 0.25 0.45 rg");
    addText(cmds, 350, tableTop - 14, "ECHEANCE", "/F2 8 Tf", "0.15 0.25 0.45 rg");
    addText(cmds, 430, tableTop - 14, `MONTANT (${currSym})`, "/F2 8 Tf", "0.15 0.25 0.45 rg");
    addText(cmds, 502, tableTop - 14, "SITUATION", "/F2 8 Tf", "0.15 0.25 0.45 rg");

    // 5. Lignes de données
    let curY = tableTop - 20;
    if (pageRows.length > 0) {
      pageRows.forEach((row, idx) => {
        curY -= 22;
        if (idx % 2 === 1) {
          addRect(cmds, 36, curY, 523, 22, "0.98 0.98 0.99 rg");
        }
        addLine(cmds, 36, curY, 559, curY, "0.9 0.92 0.95 RG", 0.5);

        const rowRef = String(row.id || row.ref || `DOC-${pageIdx * rowsPerPage + idx + 1}`).slice(0, 14);
        const rowClient = String(row.clientName || row.name || "Client").slice(0, 26);
        const rowContact = String(row.contactPerson || row.phone || row.location || "--").slice(0, 24);
        const rowDue = String(row.dueDate || row.validUntil || row.issueDate || "--").slice(0, 18);
        const rowAmount = formatAmount(row.totalAmount || row.total || 0, currSym);
        const rowStatus = String(row.statusLabel || row.status || "En cours").slice(0, 18);

        addText(cmds, 42, curY + 7, rowRef, "/F2 8 Tf", "0.1 0.15 0.25 rg");
        addText(cmds, 105, curY + 7, rowClient, "/F2 8 Tf", "0.1 0.1 0.1 rg");
        addText(cmds, 235, curY + 7, rowContact, "/F1 7.5 Tf", "0.3 0.35 0.45 rg");
        addText(cmds, 350, curY + 7, rowDue, "/F1 7.5 Tf", "0.3 0.35 0.45 rg");
        addText(cmds, 430, curY + 7, rowAmount, "/F2 8 Tf", "0.1 0.15 0.3 rg");
        addText(cmds, 502, curY + 7, rowStatus, "/F1 7.5 Tf", "0.2 0.4 0.2 rg");
      });
    } else {
      curY -= 30;
      addText(cmds, 180, curY + 10, "Aucune donnee enregistree pour ce rapport.", "/F1 8.5 Tf", "0.5 0.5 0.5 rg");
    }

    // 6. Bloc Total & Certification (sur la dernière page)
    if (isLastPage) {
      const totalsY = Math.max(curY - 18, 175);

      // Bloc Total
      addRect(cmds, 36, totalsY - 48, 523, 46, "0.94 0.96 0.99 rg", "0.82 0.88 0.96 RG", 1);
      addText(cmds, 48, totalsY - 18, `Nombre total d'enregistrements : ${data.length}`, "/F2 8.5 Tf", "0.2 0.25 0.35 rg");
      addText(cmds, 48, totalsY - 32, "Certification : Conforme a l'Acte Uniforme OHADA portant sur le droit commercial.", "/F1 7.5 Tf", "0.4 0.45 0.55 rg");

      addText(cmds, 360, totalsY - 18, "TOTAL CONSOLIDE DU RAPPORT :", "/F2 8 Tf", "0.09 0.23 0.69 rg");
      addText(cmds, 360, totalsY - 34, `${formatAmount(totalConsolidated, currSym)}`, "/F2 13 Tf", "0.09 0.23 0.69 rg");

      // 7. Signatures et Cachet OHADA
      const signY = totalsY - 60;
      addLine(cmds, 36, signY, 559, signY, "0.85 0.88 0.94 RG", 0.8);
      addText(cmds, 36, signY - 14, "MENTIONS LEGALES & FISCALES", "/F2 7.5 Tf", "0.3 0.35 0.45 rg");
      addText(cmds, 36, signY - 26, "Document certifie conforme aux regles comptables du systeme comptable OHADA.", "/F1 7 Tf", "0.45 0.5 0.6 rg");
      addText(cmds, 36, signY - 37, `SECURE-HASH-OHADA-${actualAuditId}`, "/F1 6.5 Tf", "0.55 0.6 0.7 rg");

      addText(cmds, 385, signY - 14, "POUR LA DIRECTION FINANCIERE", "/F2 7.5 Tf", "0.3 0.35 0.45 rg");
      addRect(cmds, 385, signY - 42, 170, 22, "0.96 0.97 0.99 rg", "0.6 0.75 0.95 RG", 0.8);
      addText(cmds, 395, signY - 30, "[ Cachet Electronique & Signature FacturX ]", "/F2 7 Tf", "0.09 0.23 0.69 rg");
      addText(cmds, 385, signY - 50, `${compName} -- Service Recouvrement`, "/F1 6.5 Tf", "0.45 0.5 0.6 rg");
    }

    // Bas de page
    addLine(cmds, 36, 40, 559, 40, "0.88 0.9 0.94 RG", 0.8);
    addText(cmds, 36, 28, "FacturX SaaS -- Document electronique a valeur probante conforme OHADA / DGI.", "/F1 6.5 Tf", "0.5 0.55 0.65 rg");
    addText(cmds, 430, 28, `Page ${pageIdx + 1} / ${numPages} - Ref: ${actualAuditId}`, "/F1 6.5 Tf", "0.5 0.55 0.65 rg");

    pages.push({ commands: cmds });
  }

  // Assemblage du document PDF standard multi-pages
  const N = pages.length;
  const pdfObjects = [];
  pdfObjects.push("%PDF-1.4");
  pdfObjects.push("%\xE2\xE3\xCF\xD3");

  pdfObjects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");

  const font1Obj = 3 + N * 2;
  const font2Obj = 4 + N * 2;

  const kids = [];
  for (let i = 0; i < N; i++) {
    kids.push(`${3 + i * 2} 0 R`);
  }
  pdfObjects.push(`2 0 obj\n<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${N} >>\nendobj`);

  for (let i = 0; i < N; i++) {
    const pageObjNum = 3 + i * 2;
    const contentObjNum = 4 + i * 2;
    const contentStream = pages[i].commands.join("\n");
    const streamLength = contentStream.length;

    pdfObjects.push(
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 ${font1Obj} 0 R /F2 ${font2Obj} 0 R >> >> >>\nendobj`
    );
    pdfObjects.push(
      `${contentObjNum} 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`
    );
  }

  pdfObjects.push(
    `${font1Obj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj`
  );
  pdfObjects.push(
    `${font2Obj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj`
  );

  // Table des références croisées (xref)
  const totalObjects = 4 + N * 2;
  const pdfStringWithoutXref = pdfObjects.join("\n") + "\n";
  const lines = pdfStringWithoutXref.split("\n");

  const offsets = [0];
  let currentOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^\d+ 0 obj/)) {
      offsets.push(currentOffset);
    }
    currentOffset += line.length + 1;
  }

  const startXref = currentOffset;
  let xref = `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= totalObjects; i++) {
    const off = String(offsets[i] || 0).padStart(10, "0");
    xref += `${off} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;
  const finalPdfData = `${pdfStringWithoutXref}${xref}${trailer}`;

  try {
    const blob = new Blob([finalPdfData], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanFileName = title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 35);
    link.download = `Rapport_${cleanFileName}_${actualAuditId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Erreur génération PDF rapport:", error);
    return false;
  }
}

