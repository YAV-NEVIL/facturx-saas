import * as XLSX from "xlsx";
import { calculateInvoiceTotals } from "./mock-data.js";

/**
 * Prépare les lignes de données des factures pour l'exportation
 */
export function prepareInvoiceExportData(invoices) {
  const getStatusLabel = (status) => {
    switch (status) {
      case "payee":
        return "Payée";
      case "envoyee":
        return "Envoyée";
      case "en_attente":
        return "En retard";
      case "brouillon":
      default:
        return "Brouillon";
    }
  };

  return invoices.map((inv) => {
    const { subtotal, vatAmount, total } = calculateInvoiceTotals(inv.items, inv.vatRate);
    const itemsCount = Array.isArray(inv.items) ? inv.items.length : 0;
    const itemsDescription = Array.isArray(inv.items)
      ? inv.items.map((it) => `${it.description || ""} (x${it.quantity || 1})`).join(" | ")
      : "";

    return {
      "N° Facture": inv.id || "",
      "Client": inv.clientName || "",
      "Contact": inv.contactPerson || "",
      "Email Client": inv.clientEmail || "",
      "Téléphone": inv.clientPhone || "",
      "Localisation": inv.location || "",
      "Date Émission": inv.issueDate || "",
      "Date Échéance": inv.dueDate || "",
      "Montant HT (FCFA)": subtotal || 0,
      "Taux TVA": `${Math.round((inv.vatRate ?? 0.16) * 100)}%`,
      "Montant TVA (FCFA)": vatAmount || 0,
      "Montant Total TTC (FCFA)": total || 0,
      "Statut": getStatusLabel(inv.status),
      "Nombre d'articles": itemsCount,
      "Détail des prestations": itemsDescription,
      "Notes": inv.notes || "",
    };
  });
}

/**
 * Exporte les factures au format Excel XLSX et déclenche le téléchargement du navigateur
 */
export function exportToXLSX(invoices, fileName = "Factures_FacturX.xlsx") {
  try {
    const data = prepareInvoiceExportData(invoices);
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ajuster la largeur automatique des colonnes
    const columnWidths = [
      { wch: 16 }, // N° Facture
      { wch: 28 }, // Client
      { wch: 26 }, // Contact
      { wch: 26 }, // Email
      { wch: 18 }, // Téléphone
      { wch: 22 }, // Localisation
      { wch: 14 }, // Date Émission
      { wch: 14 }, // Date Échéance
      { wch: 20 }, // HT
      { wch: 10 }, // TVA
      { wch: 20 }, // TVA montant
      { wch: 22 }, // Total TTC
      { wch: 14 }, // Statut
      { wch: 16 }, // Nb articles
      { wch: 45 }, // Prestations
      { wch: 35 }, // Notes
    ];
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Factures");

    // Déclenche le téléchargement immédiat par le navigateur
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'exportation XLSX:", error);
    throw error;
  }
}

/**
 * Exporte les factures au format CSV (compatible Excel avec BOM UTF-8 et séparateur point-virgule)
 */
export function exportToCSV(invoices, fileName = "Factures_FacturX.csv") {
  try {
    const data = prepareInvoiceExportData(invoices);
    if (data.length === 0) return false;

    const headers = Object.keys(data[0]);

    // Échappement pour CSV avec délimiteur point-virgule et protection contre l'injection de formules (CWE-1236)
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvRows = [];
    csvRows.push(headers.map(escapeCSV).join(";"));

    for (const row of data) {
      const values = headers.map((header) => escapeCSV(row[header]));
      csvRows.push(values.join(";"));
    }

    // Ajout du BOM UTF-8 (\uFEFF) pour qu'Excel ouvre le fichier avec les accents correctement
    const csvContent = "\uFEFF" + csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Erreur lors de l'exportation CSV:", error);
    throw error;
  }
}

/**
 * Exporte l'ensemble du répertoire des entreprises clientes avec indicateurs de facturation
 */
export function exportClientsToXLSX(clients, invoices = [], fileName = "Repertoire_Clients_FacturX.xlsx") {
  try {
    const data = clients.map((c) => {
      const clientInvs = (invoices || []).filter(
        (inv) => inv.clientName && inv.clientName.toLowerCase() === c.name.toLowerCase()
      );
      const invoiceCount = clientInvs.length;
      const totalAmount = clientInvs.reduce((acc, inv) => {
        const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
        return acc + total;
      }, 0);
      const pendingCount = clientInvs.filter((i) => i.status !== "payee").length;

      return {
        "Raison Sociale": c.name || "",
        "Interlocuteur": c.contactPerson || "",
        "Téléphone Direct": c.phone || "",
        "Email Officiel": c.email || "",
        "Adresse": c.address || "",
        "Ville / Localisation": c.location || "",
        "Identifiant Fiscal (RCCM/NIF)": c.taxId || "",
        "Nombre de Factures": invoiceCount,
        "Total Facturé (TTC)": totalAmount,
        "Factures Impayées": pendingCount,
        "Situation": pendingCount > 0 ? "Factures en attente" : invoiceCount > 0 ? "100% À jour" : "Aucune facture émise",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 32 }, // Raison Sociale
      { wch: 28 }, // Interlocuteur
      { wch: 22 }, // Téléphone
      { wch: 30 }, // Email
      { wch: 32 }, // Adresse
      { wch: 24 }, // Ville
      { wch: 25 }, // Identifiant fiscal
      { wch: 20 }, // Nombre de factures
      { wch: 22 }, // Total facturé
      { wch: 20 }, // Factures impayées
      { wch: 22 }, // Situation
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Repertoire_Clients");
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'exportation des clients:", error);
    throw error;
  }
}

/**
 * Exporte l'ensemble des devis et estimations chiffrées au format Excel XLSX
 */
export function exportQuotesToXLSX(quotes, fileName = "Devis_Estimations_FacturX.xlsx") {
  try {
    const data = (quotes || []).map((q) => {
      const { subtotal, vat, total } = calculateInvoiceTotals(q.items, q.vatRate);
      const getStatusLabel = (s) => {
        switch (s) {
          case "accepte":
            return "Accepté / Validé";
          case "en_attente":
            return "En négociation";
          case "refuse":
            return "Refusé";
          case "expire":
            return "Validité Dépassée";
          default:
            return "Brouillon";
        }
      };

      return {
        "N° Devis": q.id || "",
        "Client": q.clientName || "",
        "Interlocuteur": q.contactPerson || "",
        "Email Client": q.clientEmail || "",
        "Téléphone Direct": q.clientPhone || "",
        "Localisation": q.location || "",
        "Date d'Émission": q.issueDate || "",
        "Date de Validité": q.validUntil || "",
        "Montant HT (FC/FCFA)": subtotal || 0,
        "Taux TVA": `${Math.round((q.vatRate ?? 0.16) * 100)}%`,
        "Montant TVA (FC/FCFA)": vat || 0,
        "Total TTC (FC/FCFA)": total || 0,
        "Statut Commercial": getStatusLabel(q.status),
        "Conditions & Modalités": q.notes || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 16 }, // N° Devis
      { wch: 28 }, // Client
      { wch: 26 }, // Interlocuteur
      { wch: 26 }, // Email
      { wch: 20 }, // Téléphone
      { wch: 24 }, // Localisation
      { wch: 16 }, // Date d'Émission
      { wch: 16 }, // Date de Validité
      { wch: 20 }, // Montant HT
      { wch: 12 }, // Taux TVA
      { wch: 18 }, // Montant TVA
      { wch: 20 }, // Total TTC
      { wch: 22 }, // Statut
      { wch: 35 }, // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Devis_Estimations");
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'exportation des devis:", error);
    throw error;
  }
}

/**
 * Exporte le journal officiel des encaissements et règlements au format Excel XLSX
 */
export function exportPaymentsToXLSX(payments, fileName = "Journal_Encaissements_FacturX.xlsx") {
  try {
    const data = (payments || []).map((p) => {
      return {
        "N° Quittance / Reçu": p.receiptNumber || p.id || "",
        "Réf Facture": p.invoiceId || "",
        "Client Débiteur": p.clientName || "",
        "Contact / Représentant": p.contactPerson || "",
        "Téléphone": p.clientPhone || "",
        "Email Client": p.clientEmail || "",
        "Identifiant Fiscal": p.clientTaxId || "",
        "Date d'Encaissement": p.paymentDate || "",
        "Heure": p.paymentTime || "",
        "Montant Encaissé (TTC)": p.amount || 0,
        "Devise": p.currency || "FC",
        "Mode de Règlement": p.paymentMethod || "",
        "Banque / Opérateur": p.bankName || "",
        "Réf Transaction / Bordereau": p.transactionRef || "",
        "Compte Crédité": p.beneficiaryAccount || "",
        "Statut": p.status === "valide" ? "Validé / Encaissé" : "En rapprochement",
        "Opérateur de Saisie": p.recordedBy || "",
        "Notes & Justificatifs": p.note || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 22 }, // N° Quittance
      { wch: 16 }, // Réf Facture
      { wch: 32 }, // Client
      { wch: 28 }, // Contact
      { wch: 20 }, // Téléphone
      { wch: 26 }, // Email
      { wch: 30 }, // NIF/RCCM
      { wch: 18 }, // Date
      { wch: 10 }, // Heure
      { wch: 22 }, // Montant
      { wch: 10 }, // Devise
      { wch: 28 }, // Mode de règlement
      { wch: 22 }, // Banque / Opérateur
      { wch: 24 }, // Réf Transaction
      { wch: 40 }, // Compte Crédité
      { wch: 20 }, // Statut
      { wch: 22 }, // Opérateur
      { wch: 38 }, // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal_Encaissements");
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'exportation des règlements:", error);
    throw error;
  }
}

/**
 * Exporte l'analyse financière complète sous forme de classeur Excel multi-feuilles
 */
export function exportAnalyticsToXLSX(invoices = [], payments = [], quotes = [], companyInfo = {}, fileName = "Rapport_Analytique_FacturX.xlsx") {
  try {
    const workbook = XLSX.utils.book_new();

    // 1. Feuille Synthèse des KPIs
    let totalBilled = 0;
    let totalPaid = 0;
    let totalOverdue = 0;
    let totalPending = 0;

    invoices.forEach((inv) => {
      const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
      totalBilled += total;
      if (inv.status === "payee") {
        totalPaid += total;
      } else if (inv.status === "en_attente") {
        totalOverdue += total;
      } else if (inv.status === "envoyee") {
        totalPending += total;
      }
    });

    const recoveryRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) + "%" : "0%";

    const kpiData = [
      { "Indicateur Clé": "Entreprise", "Valeur": companyInfo.name || "HORIZON GROUPE" },
      { "Indicateur Clé": "Devise de Référence", "Valeur": companyInfo.defaultCurrency || "Franc Congolais (CDF / FC)" },
      { "Indicateur Clé": "Date d'Extraction", "Valeur": new Date().toLocaleDateString("fr-FR") },
      { "Indicateur Clé": "Nombre Total de Factures", "Valeur": invoices.length },
      { "Indicateur Clé": "Chiffre d'Affaires Global Facturé TTC", "Valeur": totalBilled },
      { "Indicateur Clé": "Montant Total Encaissé", "Valeur": totalPaid },
      { "Indicateur Clé": "Taux de Recouvrement Global", "Valeur": recoveryRate },
      { "Indicateur Clé": "Créances en Retard Critique", "Valeur": totalOverdue },
      { "Indicateur Clé": "Factures en Cours (Dans les Délais)", "Valeur": totalPending },
      { "Indicateur Clé": "Nombre de Devis en Pipeline", "Valeur": quotes.length },
      { "Indicateur Clé": "Nombre d'Encaissements Validés", "Valeur": payments.length },
    ];

    const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
    kpiSheet["!cols"] = [{ wch: 38 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, kpiSheet, "Synthese_Performance");

    // 2. Feuille Factures Détaillées
    const invoiceRows = invoices.map((inv) => {
      const { subtotal, vat, total } = calculateInvoiceTotals(inv.items, inv.vatRate);
      let statutText = "Brouillon";
      if (inv.status === "payee") statutText = "Payée";
      else if (inv.status === "envoyee") statutText = "Envoyée (En cours)";
      else if (inv.status === "en_attente") statutText = "En retard";

      return {
        "N° Facture": inv.id,
        "Client": inv.clientName,
        "Date Émission": inv.issueDate,
        "Date Échéance": inv.dueDate,
        "Montant HT": subtotal,
        "TVA": vat,
        "Total TTC": total,
        "Statut": statutText,
        "Email": inv.clientEmail,
        "Téléphone": inv.clientPhone,
        "Notes": inv.notes || "",
      };
    });

    const invSheet = XLSX.utils.json_to_sheet(invoiceRows);
    invSheet["!cols"] = [
      { wch: 16 },
      { wch: 32 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 20 },
      { wch: 22 },
      { wch: 26 },
      { wch: 20 },
      { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(workbook, invSheet, "Analyse_Factures");

    // 3. Feuille Créances en retard (action immédiate)
    const overdueInvoices = invoices.filter((i) => i.status === "en_attente");
    if (overdueInvoices.length > 0) {
      const overdueRows = overdueInvoices.map((inv) => {
        const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
        return {
          "N° Facture": inv.id,
          "Client": inv.clientName,
          "Contact": inv.contactPerson || "",
          "Téléphone": inv.clientPhone || "",
          "Email": inv.clientEmail || "",
          "Date Échéance Dépassée": inv.dueDate,
          "Montant Dû TTC": total,
          "Dernière Relance": (inv.reminders && inv.reminders.length > 0) ? `${inv.reminders[inv.reminders.length - 1].date} (${inv.reminders[inv.reminders.length - 1].channel})` : "Aucune",
          "Recommandation": "Relancer immédiatement par WhatsApp & Appel",
        };
      });
      const overdueSheet = XLSX.utils.json_to_sheet(overdueRows);
      overdueSheet["!cols"] = [
        { wch: 16 },
        { wch: 30 },
        { wch: 26 },
        { wch: 18 },
        { wch: 26 },
        { wch: 22 },
        { wch: 20 },
        { wch: 28 },
        { wch: 40 },
      ];
      XLSX.utils.book_append_sheet(workbook, overdueSheet, "Impayes_Et_Retards");
    }

    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'exportation analytique XLSX:", error);
    throw error;
  }
}

/**
 * Exporte le Rapport Officiel de Recouvrement & Relances Clients (Créances Échues)
 */
export function exportRecoveryReportToXLSX(overdueInvoices = [], companyInfo = {}, fileName = "Rapport_Recouvrement_FacturX.xlsx") {
  try {
    const workbook = XLSX.utils.book_new();

    const data = overdueInvoices.map((inv) => {
      const { subtotal, vatAmount, total } = calculateInvoiceTotals(inv.items, inv.vatRate);
      const lastReminder = (inv.reminders && inv.reminders.length > 0)
        ? `${inv.reminders[inv.reminders.length - 1].date} (${inv.reminders[inv.reminders.length - 1].channel})`
        : "Aucune relance";

      return {
        "N° Facture": inv.id || "",
        "Raison Sociale Client": inv.clientName || "",
        "Contact Débiteur": inv.contactPerson || "",
        "Téléphone Direct": inv.clientPhone || "",
        "Email Officiel": inv.clientEmail || "",
        "Localisation": inv.location || "",
        "Date d'Émission": inv.issueDate || "",
        "Date d'Échéance": inv.dueDate || "",
        "Montant HT": subtotal || 0,
        "TVA": vatAmount || 0,
        "Total Échu TTC": total || 0,
        "Dernière Relance": lastReminder,
        "Niveau d'Urgence": "Critique - Recouvrement Immédiat",
        "Action Recommandée": "Appel téléphonique & Relance WhatsApp avec RIB",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 16 }, // N° Facture
      { wch: 32 }, // Raison Sociale
      { wch: 28 }, // Contact
      { wch: 20 }, // Téléphone
      { wch: 28 }, // Email
      { wch: 22 }, // Localisation
      { wch: 15 }, // Date Émission
      { wch: 15 }, // Date Échéance
      { wch: 18 }, // HT
      { wch: 14 }, // TVA
      { wch: 20 }, // Total Échu
      { wch: 28 }, // Dernière Relance
      { wch: 32 }, // Niveau d'urgence
      { wch: 42 }, // Action recommandée
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Recouvrement_Impayes");
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'exportation du rapport de recouvrement:", error);
    throw error;
  }
}

/**
 * Exporte le Rapport des Encaissements & Règlements en Attente (Prévisionnel Trésorerie)
 */
export function exportPendingPaymentsReportToXLSX(pendingInvoices = [], companyInfo = {}, fileName = "Rapport_Encaissements_En_Attente_FacturX.xlsx") {
  try {
    const workbook = XLSX.utils.book_new();

    const data = pendingInvoices.map((inv) => {
      const { subtotal, vatAmount, total } = calculateInvoiceTotals(inv.items, inv.vatRate);

      return {
        "N° Facture": inv.id || "",
        "Client": inv.clientName || "",
        "Interlocuteur": inv.contactPerson || "",
        "Téléphone": inv.clientPhone || "",
        "Email Client": inv.clientEmail || "",
        "Date Émission": inv.issueDate || "",
        "Date Échéance Prévue": inv.dueDate || "",
        "Montant HT": subtotal || 0,
        "TVA": vatAmount || 0,
        "Montant Attendu TTC": total || 0,
        "Statut": "Envoyée (Dans les délais)",
        "Notes": inv.notes || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 16 }, // N° Facture
      { wch: 32 }, // Client
      { wch: 26 }, // Interlocuteur
      { wch: 20 }, // Téléphone
      { wch: 28 }, // Email
      { wch: 15 }, // Émission
      { wch: 22 }, // Échéance
      { wch: 18 }, // HT
      { wch: 14 }, // TVA
      { wch: 22 }, // Attendu TTC
      { wch: 24 }, // Statut
      { wch: 35 }, // Notes
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Encaissements_En_Attente");
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'exportation des encaissements en attente:", error);
    throw error;
  }
}

/**
 * Exporte la Déclaration Fiscale & Bilan Certifié OHADA / DGI
 */
export function exportFiscalReportToXLSX(invoices = [], companyInfo = {}, fileName = "Declaration_Fiscale_OHADA_FacturX.xlsx") {
  try {
    const workbook = XLSX.utils.book_new();

    // Calculs de synthèse fiscale détaillée
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;
    let totalEncaisséTTC = 0;
    let baseTaxable16 = 0;
    let tva16 = 0;
    let baseTaxable18 = 0;
    let tva18 = 0;
    let baseExoneree = 0;
    let tvaExigibleEncaissee = 0;

    const invoiceLines = invoices.map((inv) => {
      const { subtotal, vatAmount, total } = calculateInvoiceTotals(inv.items, inv.vatRate);
      const rate = typeof inv.vatRate === "number" ? inv.vatRate : 0.16;

      totalHT += subtotal;
      totalTVA += vatAmount;
      totalTTC += total;

      if (rate >= 0.17) {
        baseTaxable18 += subtotal;
        tva18 += vatAmount;
      } else if (rate > 0) {
        baseTaxable16 += subtotal;
        tva16 += vatAmount;
      } else {
        baseExoneree += subtotal;
      }

      if (inv.status === "payee") {
        totalEncaisséTTC += total;
        tvaExigibleEncaissee += vatAmount;
      }

      return {
        "N° Facture": inv.id || "",
        "Date Facturation": inv.issueDate || "",
        "Client Débiteur": inv.clientName || "",
        "Identifiant Fiscal (NIF/RCCM)": inv.taxId || "",
        "Base Imposable HT": subtotal || 0,
        "Taux TVA Légale": `${Math.round(rate * 100)}%`,
        "TVA Collectée": vatAmount || 0,
        "Total Facturé TTC": total || 0,
        "Statut Encaissement": inv.status === "payee" ? "Encaissé (TVA exigible)" : "À recouvrer",
      };
    });

    // Feuille 1 : Bilan Récapitulatif Fiscal
    const fiscalSummary = [
      { "Rubrique Fiscale OHADA / DGI": "Entreprise Émettrice", "Valeur / Montant": companyInfo.name || "HORIZON GROUPE" },
      { "Rubrique Fiscale OHADA / DGI": "Numéro d'Impôt (NIF / NINEA)", "Valeur / Montant": companyInfo.nif || companyInfo.ninea || "A2408912Z" },
      { "Rubrique Fiscale OHADA / DGI": "Numéro RCCM", "Valeur / Montant": companyInfo.rccm || "CD/KIN/RCCM/24-B-01420" },
      { "Rubrique Fiscale OHADA / DGI": "Identifiant National", "Valeur / Montant": companyInfo.idNat || "01-G4701-B89201" },
      { "Rubrique Fiscale OHADA / DGI": "Date de Déclaration", "Valeur / Montant": new Date().toLocaleDateString("fr-FR") },
      { "Rubrique Fiscale OHADA / DGI": "Chiffre d'Affaires Brut Global HT", "Valeur / Montant": totalHT },
      { "Rubrique Fiscale OHADA / DGI": "• Base Taxable à 16% (RDC / DGI)", "Valeur / Montant": baseTaxable16 },
      { "Rubrique Fiscale OHADA / DGI": "• TVA Collectée à 16%", "Valeur / Montant": tva16 },
      { "Rubrique Fiscale OHADA / DGI": "• Base Taxable à 18% (UEMOA)", "Valeur / Montant": baseTaxable18 },
      { "Rubrique Fiscale OHADA / DGI": "• TVA Collectée à 18%", "Valeur / Montant": tva18 },
      { "Rubrique Fiscale OHADA / DGI": "• Ventes Exonérées (0% TVA)", "Valeur / Montant": baseExoneree },
      { "Rubrique Fiscale OHADA / DGI": "TVA Globale Collectée (Facturée)", "Valeur / Montant": totalTVA },
      { "Rubrique Fiscale OHADA / DGI": "Chiffre d'Affaires Global TTC", "Valeur / Montant": totalTTC },
      { "Rubrique Fiscale OHADA / DGI": "TVA Exigible Décaissable (Sur Encaissements)", "Valeur / Montant": tvaExigibleEncaissee },
      { "Rubrique Fiscale OHADA / DGI": "Total Encaissé (TTC)", "Valeur / Montant": totalEncaisséTTC },
      { "Rubrique Fiscale OHADA / DGI": "Reste à Recouvrer TTC", "Valeur / Montant": totalTTC - totalEncaisséTTC },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(fiscalSummary);
    summarySheet["!cols"] = [{ wch: 42 }, { wch: 32 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Bilan_Fiscal_Synthese");

    // Feuille 2 : Journal des Factures avec TVA
    const detailSheet = XLSX.utils.json_to_sheet(invoiceLines);
    detailSheet["!cols"] = [
      { wch: 16 },
      { wch: 18 },
      { wch: 32 },
      { wch: 28 },
      { wch: 20 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(workbook, detailSheet, "Journal_Ventes_TVA");

    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'exportation fiscale XLSX:", error);
    throw error;
  }
}

/**
 * Exporte le Rapport Global du Portefeuille 360° (Clients Confirmés, Débiteurs et Prospects)
 */
export function exportGlobalPortfolioReportToXLSX(portfolioData = [], companyInfo = {}, fileName = "Rapport_Portefeuille_Clients_FacturX.xlsx") {
  try {
    const workbook = XLSX.utils.book_new();

    const data = portfolioData.map((p) => {
      return {
        "Raison Sociale": p.name || "",
        "Type de Profil": p.profileType || "",
        "Interlocuteur Principal": p.contactPerson || "",
        "Téléphone Direct": p.phone || "",
        "Email Officiel": p.email || "",
        "Localisation": p.location || "",
        "Identifiant Fiscal": p.taxId || "",
        "Nombre Factures": p.invoiceCount || 0,
        "Nombre Devis": p.quoteCount || 0,
        "Total Facturé TTC": p.totalBilled || 0,
        "Total Encaissé": p.totalPaid || 0,
        "Solde Restant Dû": p.balanceDue || 0,
        "Indice Solvabilité": p.solvencyScore || "Non évalué",
        "Statut Global": p.statusLabel || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 32 }, // Raison Sociale
      { wch: 22 }, // Type de profil
      { wch: 28 }, // Interlocuteur
      { wch: 20 }, // Téléphone
      { wch: 28 }, // Email
      { wch: 24 }, // Localisation
      { wch: 26 }, // Id fiscal
      { wch: 16 }, // Nb factures
      { wch: 14 }, // Nb devis
      { wch: 20 }, // Total Facturé
      { wch: 20 }, // Total Encaissé
      { wch: 20 }, // Solde Restant Dû
      { wch: 20 }, // Indice Solvabilité
      { wch: 24 }, // Statut
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Portefeuille_Clients_360");
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'exportation du portefeuille clients:", error);
    throw error;
  }
}

