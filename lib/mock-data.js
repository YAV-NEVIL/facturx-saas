// Données mockées haute fidélité pour le SaaS de facturation en Franc Congolais (CDF / FC) et devises internationales

// Devises disponibles
export const CURRENCIES = [
  { code: "CDF", symbol: "FC", name: "Franc Congolais (CDF / FC)", isDefault: true },
  { code: "USD", symbol: "$", name: "Dollar Américain (USD / $)" },
  { code: "EUR", symbol: "€", name: "Euro (EUR / €)" },
  { code: "GBP", symbol: "£", name: "Livre Sterling (GBP / £)" },
  { code: "XOF", symbol: "FCFA", name: "Franc CFA (XOF / XAF)" },
];

// Banques de référence en République Démocratique du Congo
export const CONGO_BANKS = [
  "Rawbank",
  "Equity BCDC",
  "TMB (Trust Merchant Bank)",
  "Sofibanque",
  "FBNBank RDC",
  "Ecobank RDC",
  "Standard Bank RDC",
  "Access Bank RDC",
  "UBA RDC",
  "Afriland First Bank CD",
  "Autre banque (saisie manuelle)",
];

// Répertoire des pays (priorité Afrique subsaharienne, RDC en tête, puis monde)
export const COUNTRIES = [
  // 1. République Démocratique du Congo en premier
  { code: "CD", name: "République Démocratique du Congo", dialCode: "+243", flag: "🇨🇩", defaultCity: "Kinshasa" },
  // 2. Autres pays d'Afrique
  { code: "CG", name: "Congo-Brazzaville", dialCode: "+242", flag: "🇨🇬", defaultCity: "Brazzaville" },
  { code: "SN", name: "Sénégal", dialCode: "+221", flag: "🇸🇳", defaultCity: "Dakar" },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", flag: "🇨🇮", defaultCity: "Abidjan" },
  { code: "CM", name: "Cameroun", dialCode: "+237", flag: "🇨🇲", defaultCity: "Douala" },
  { code: "GA", name: "Gabon", dialCode: "+241", flag: "🇬🇦", defaultCity: "Libreville" },
  { code: "GN", name: "Guinée", dialCode: "+224", flag: "🇬🇳", defaultCity: "Conakry" },
  { code: "ML", name: "Mali", dialCode: "+223", flag: "🇲🇱", defaultCity: "Bamako" },
  { code: "BJ", name: "Bénin", dialCode: "+229", flag: "🇧🇯", defaultCity: "Cotonou" },
  { code: "TG", name: "Togo", dialCode: "+228", flag: "🇹🇬", defaultCity: "Lomé" },
  { code: "BF", name: "Burkina Faso", dialCode: "+226", flag: "🇧🇫", defaultCity: "Ouagadougou" },
  { code: "NE", name: "Niger", dialCode: "+227", flag: "🇳🇪", defaultCity: "Niamey" },
  { code: "RW", name: "Rwanda", dialCode: "+250", flag: "🇷🇼", defaultCity: "Kigali" },
  { code: "BI", name: "Burundi", dialCode: "+257", flag: "🇧🇮", defaultCity: "Bujumbura" },
  { code: "TD", name: "Tchad", dialCode: "+235", flag: "🇹🇩", defaultCity: "N'Djaména" },
  { code: "CF", name: "Centrafrique", dialCode: "+236", flag: "🇨🇫", defaultCity: "Bangui" },
  { code: "AO", name: "Angola", dialCode: "+244", flag: "🇦🇴", defaultCity: "Luanda" },
  { code: "ZA", name: "Afrique du Sud", dialCode: "+27", flag: "🇿🇦", defaultCity: "Johannesburg" },
  { code: "NG", name: "Nigéria", dialCode: "+234", flag: "🇳🇬", defaultCity: "Lagos" },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪", defaultCity: "Nairobi" },
  { code: "MA", name: "Maroc", dialCode: "+212", flag: "🇲🇦", defaultCity: "Casablanca" },
  { code: "DZ", name: "Algérie", dialCode: "+213", flag: "🇩🇿", defaultCity: "Alger" },
  { code: "TN", name: "Tunisie", dialCode: "+216", flag: "🇹🇳", defaultCity: "Tunis" },
  // 3. International
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", defaultCity: "Paris" },
  { code: "BE", name: "Belgique", dialCode: "+32", flag: "🇧🇪", defaultCity: "Bruxelles" },
  { code: "CH", name: "Suisse", dialCode: "+41", flag: "🇨🇭", defaultCity: "Genève" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", defaultCity: "Montréal" },
  { code: "US", name: "États-Unis", dialCode: "+1", flag: "🇺🇸", defaultCity: "New York" },
  { code: "GB", name: "Royaume-Uni", dialCode: "+44", flag: "🇬🇧", defaultCity: "Londres" },
];

export const defaultCompanyInfo = {
  name: "",
  subtitle: "Entreprise gérée sous FacturX",
  tagline: "Facturation & Recouvrement B2B",
  initials: "FX",
  logoUrl: null,
  rccm: "",
  idNat: "",
  nif: "",
  ninea: "",
  address: "",
  bp: "",
  city: "Kinshasa",
  country: "République Démocratique du Congo",
  countryCode: "CD",
  phoneCountryCode: "+243",
  phoneDigits: "",
  phone: "",
  mobileCountryCode: "+243",
  mobileDigits: "",
  mobile: "",
  email: "",
  website: "",
  defaultCurrency: "Franc Congolais (CDF / FC)",
  currencySymbol: "FC",
  defaultVatRate: 0.16,
  bankName: "Rawbank",
  bankCustomName: "",
  iban: "",
  airtelCountryCode: "+243",
  airtelDigits: "",
  airtelMoneyNumber: "",
  orangeCountryCode: "+243",
  orangeDigits: "",
  orangeMoneyNumber: "",
  waveNumber: "",
};

export const defaultUserProfile = {
  fullName: "",
  email: "",
  role: "admin",
  avatarUrl: null,
  companyName: "",
  phone: "",
  accountCreatedDate: "",
};

// Récupère le symbole court de la devise
export function getCurrencySymbol(currency = "Franc Congolais (CDF / FC)") {
  if (!currency) return "FC";
  if (typeof currency === "string") {
    if (currency.includes("CDF") || currency.includes("Congolais") || currency === "FC") return "FC";
    if (currency.includes("USD") || currency.includes("Dollar") || currency === "$") return "$";
    if (currency.includes("EUR") || currency.includes("Euro") || currency === "€") return "€";
    if (currency.includes("GBP") || currency.includes("Livre") || currency === "£") return "£";
    if (currency.includes("CFA") || currency.includes("XOF") || currency.includes("XAF") || currency === "FCFA") return "FCFA";
  }
  return "FC";
}

// Formatage générique d'un montant avec la devise sélectionnée
export function formatAmount(amount, currency = "FC") {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `0 ${getCurrencySymbol(currency)}`;
  }
  const num = Math.round(amount);
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const symbol = getCurrencySymbol(currency);
  return `${formatted} ${symbol}`;
}

// Fonction de rétrocompatibilité conservant le nom formatFCFA mais s'adaptant à la devise
export function formatFCFA(amount, currency = "FC") {
  return formatAmount(amount, currency);
}

// Calcul des montants d'une facture
export function calculateInvoiceTotals(items = [], vatRate = 0.16) {
  const rate = typeof vatRate === "number" && Number.isFinite(vatRate) && vatRate >= 0 ? vatRate : 0.16;
  const safeItems = Array.isArray(items) ? items : [];
  const subtotal = safeItems.reduce((acc, item) => {
    const qty = Math.max(0, Number(item?.quantity) || 0);
    const price = Math.max(0, Number(item?.unitPrice) || 0);
    return acc + qty * price;
  }, 0);
  const vatAmount = Math.round(subtotal * rate);
  const total = subtotal + vatAmount;
  return { subtotal, vatAmount, vat: vatAmount, total };
}

// Calcul dynamique des statistiques du Dashboard
export function getDashboardMetrics(invoices) {
  let totalBilled = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let countBilled = invoices.length;
  let countPaid = 0;
  let countPending = 0;

  invoices.forEach((inv) => {
    const { total } = calculateInvoiceTotals(inv.items, inv.vatRate);
    totalBilled += total;

    if (inv.status === "payee") {
      totalPaid += total;
      countPaid += 1;
    } else if (inv.status === "en_attente" || inv.status === "envoyee") {
      totalPending += total;
      countPending += 1;
    }
  });

  const recoveryRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 1000) / 10 : 0;

  return {
    totalBilled,
    totalPaid,
    totalPending,
    recoveryRate,
    countBilled,
    countPaid,
    countPending,
  };
}

// Données initiales des factures ancrées en République Démocratique du Congo (RDC / Kinshasa / Lubumbashi)
export const initialInvoices = [
  {
    id: "FAC-2026-089",
    clientName: "Congo Mining & Logistics SARL",
    contactPerson: "M. Patrick Kalala (Directeur Financier)",
    clientEmail: "finances@congomining.cd",
    clientPhone: "+243 99 492 10 20",
    address: "Boulevard Kamanyola, Quartier Industriel",
    location: "Lubumbashi, Haut-Katanga, RDC",
    taxId: "CD/LSH/RCCM/22-B-0412 • NIF: A1908421K",
    issueDate: "21/10/2026",
    dueDate: "05/11/2026",
    status: "payee", // payée
    items: [
      { description: "Audit sécurité & infrastructure cloud", quantity: 1, unitPrice: 4200000 },
      { description: "Configuration pare-feu & liaisons VPN sécurisées", quantity: 2, unitPrice: 980000 },
    ],
    vatRate: 0.16, // 16% TVA RDC
    notes: "Règlement effectué par virement bancaire Rawbank.",
    reminders: [
      {
        id: 1,
        date: "20/10/2026 15:40",
        channel: "email",
        author: "Aminata Traoré",
        note: "Facture initiale transmise avec RIB Rawbank joint",
        status: "Envoyé",
      },
    ],
  },
  {
    id: "FAC-2026-088-B",
    clientName: "Kinshasa Digital Hub SAS",
    contactPerson: "M. Jean-Marc Ilunga (Responsable Opérations)",
    clientEmail: "compta@kinshasadigital.cd",
    clientPhone: "+243 81 654 32 10",
    address: "Avenue Colonel Lukusa, Immeuble Future Tower",
    location: "Kinshasa, Gombe, RDC",
    taxId: "CD/KIN/RCCM/23-B-0891 • NIF: A2109432M",
    issueDate: "20/10/2026",
    dueDate: "03/11/2026",
    status: "envoyee", // envoyée hier
    items: [
      { description: "Déploiement plateforme SaaS & serveurs dédiés", quantity: 1, unitPrice: 2800000 },
      { description: "Formation des équipes comptables et support", quantity: 2, unitPrice: 750000 },
    ],
    vatRate: 0.16,
    notes: "Facture envoyée hier par email avec copie à la direction générale.",
    reminders: [
      {
        id: 1,
        date: "20/10/2026 11:20",
        channel: "email",
        author: "Système FacturX",
        note: "Facture transmise avec accusé de réception",
        status: "Délivré",
      },
    ],
  },
  {
    id: "FAC-2026-088",
    clientName: "Katanga Telecom & Infra",
    contactPerson: "Mme Clarisse Mwamba (Chef Comptable)",
    clientEmail: "finance@katangatelecom.cd",
    clientPhone: "+243 97 894 51 23",
    address: "Avenue Laurent-Désiré Kabila",
    location: "Kolwezi, Lualaba, RDC",
    taxId: "CD/KLZ/RCCM/21-B-0245 • NIF: A2004512P",
    issueDate: "19/10/2026",
    dueDate: "02/11/2026",
    status: "envoyee", // envoyée
    items: [
      { description: "Licences logicielles Entreprise (12 mois)", quantity: 15, unitPrice: 350000 },
      { description: "Maintenance réseau & supervision 24/7", quantity: 1, unitPrice: 1100000 },
    ],
    vatRate: 0.16,
    notes: "Facture transmise au service financier le 19/10/2026.",
    reminders: [
      {
        id: 1,
        date: "19/10/2026 09:30",
        channel: "email",
        author: "Système FacturX",
        note: "Envoi initial de la facture par email sécurisé",
        status: "Délivré",
      },
    ],
  },
  {
    id: "FAC-2026-087",
    clientName: "Grands Lacs Agro-Industrie",
    contactPerson: "M. Dieudonné Kivuila (Directeur Général)",
    clientEmail: "direction@grandslacs-agro.cd",
    clientPhone: "+243 90 458 91 20",
    address: "Route de Sake, Quartier Himbi",
    location: "Goma, Nord-Kivu, RDC",
    taxId: "CD/GMA/RCCM/20-B-0118 • NIF: A1809321X",
    issueDate: "14/10/2026",
    dueDate: "20/10/2026",
    status: "en_attente", // en retard / en attente
    items: [
      { description: "Intégration capteurs IoT pour silos de stockage", quantity: 1, unitPrice: 6500000 },
      { description: "Module de reporting export douanier", quantity: 1, unitPrice: 1800000 },
    ],
    vatRate: 0.16,
    notes: "Échéance dépassée de 1 jour. Relance téléphonique recommandée.",
    reminders: [
      {
        id: 1,
        date: "18/10/2026 11:15",
        channel: "email",
        author: "Système FacturX",
        note: "Rappel automatique avant échéance (J-2)",
        status: "Délivré",
      },
      {
        id: 2,
        date: "20/10/2026 16:30",
        channel: "whatsapp",
        author: "Service Recouvrement",
        note: "Message WhatsApp envoyé au DG concernant l'échéance du jour",
        status: "Lu",
      },
    ],
  },
  {
    id: "FAC-2026-086",
    clientName: "Bralima Distribution Kinshasa",
    contactPerson: "M. Serge Bopili (Chef de Projet)",
    clientEmail: "facturation@bralima-distrib.cd",
    clientPhone: "+243 82 120 33 44",
    address: "Avenue des Brasseries, Barumbu",
    location: "Kinshasa, RDC",
    taxId: "CD/KIN/RCCM/19-B-0089 • NIF: A1704201W",
    issueDate: "12/10/2026",
    dueDate: "26/10/2026",
    status: "payee", // payée
    items: [
      { description: "Système de traçabilité des livraisons logistiques", quantity: 1, unitPrice: 9500000 },
      { description: "Formation chauffeurs & tablettes mobiles", quantity: 5, unitPrice: 400000 },
    ],
    vatRate: 0.16,
    notes: "Payé par virement bancaire Equity BCDC.",
    reminders: [
      {
        id: 1,
        date: "12/10/2026 10:00",
        channel: "email",
        author: "Système FacturX",
        note: "Émission facture et notification bancaire",
        status: "Délivré",
      },
    ],
  },
  {
    id: "FAC-2026-085",
    clientName: "Société Commerciale du Congo (SOCOCI)",
    contactPerson: "Mme Pauline Tshala (Directrice des Achats)",
    clientEmail: "achats@sococi.cd",
    clientPhone: "+243 99 442 21 10",
    address: "Avenue du Commerce, Quartier Commercial",
    location: "Kinshasa, RDC",
    taxId: "CD/KIN/RCCM/22-B-0731 • NIF: A2203109Q",
    issueDate: "08/10/2026",
    dueDate: "22/10/2026",
    status: "en_attente",
    items: [
      { description: "Terminal point de vente connectés (POS)", quantity: 4, unitPrice: 1950000 },
      { description: "Paramétrage passerelle Airtel & Orange Money", quantity: 1, unitPrice: 1200000 },
    ],
    vatRate: 0.16,
    notes: "En attente de validation du bon de commande interne.",
    reminders: [
      {
        id: 1,
        date: "15/10/2026 14:00",
        channel: "email",
        author: "Aminata Traoré",
        note: "Demande de confirmation d'approbation budgétaire",
        status: "Délivré",
      },
    ],
  },
  {
    id: "FAC-2026-084",
    clientName: "Matadi Port Transit SARL",
    contactPerson: "M. Roger Nzuzi (Directeur Général)",
    clientEmail: "transit@matadiport.cd",
    clientPhone: "+243 85 550 99 88",
    address: "Zone Portuaire, Quai Ango-Ango",
    location: "Matadi, Kongo-Central, RDC",
    taxId: "CD/MAT/RCCM/21-B-0190 • NIF: A2105820T",
    issueDate: "05/10/2026",
    dueDate: "19/10/2026",
    status: "brouillon",
    items: [
      { description: "Logiciel de gestion de dédouanement et manifestes", quantity: 1, unitPrice: 4800000 },
      { description: "Abonnement support annuel prioritaire", quantity: 1, unitPrice: 1500000 },
    ],
    vatRate: 0.16,
    notes: "Brouillon en cours de révision tarifaire.",
    reminders: [],
  },
  {
    id: "FAC-2026-083",
    clientName: "Bukavu Tech Innovations",
    contactPerson: "M. Aimé Cibalonza (Responsable IT)",
    clientEmail: "it@bukavutech.cd",
    clientPhone: "+243 97 123 45 67",
    address: "Avenue Patrice Lumumba, Ibanda",
    location: "Bukavu, Sud-Kivu, RDC",
    taxId: "CD/BKV/RCCM/23-B-0044 • NIF: A2308190Y",
    issueDate: "01/10/2026",
    dueDate: "15/10/2026",
    status: "payee",
    items: [
      { description: "Mise en place infrastructure réseau sans fil", quantity: 1, unitPrice: 3200000 },
      { description: "Passerelle de paiement Airtel Money & M-Pesa", quantity: 1, unitPrice: 1600000 },
    ],
    vatRate: 0.16,
    notes: "Paiement confirmé par virement Airtel Money Pro.",
    reminders: [
      {
        id: 1,
        date: "01/10/2026 12:00",
        channel: "email",
        author: "Système FacturX",
        note: "Facture émise avec lien de paiement instantané",
        status: "Délivré",
      },
    ],
  },
];

// Fichier des clients par défaut (ancré en RDC et Afrique)
export const defaultClients = [
  {
    name: "Congo Mining & Logistics SARL",
    contactPerson: "M. Patrick Kalala (Directeur Financier)",
    email: "finances@congomining.cd",
    phone: "+243 99 492 10 20",
    address: "Boulevard Kamanyola, Quartier Industriel",
    location: "Lubumbashi, Haut-Katanga, RDC",
    taxId: "CD/LSH/RCCM/22-B-0412 • NIF: A1908421K",
  },
  {
    name: "Kinshasa Digital Hub SAS",
    contactPerson: "M. Jean-Marc Ilunga (Responsable Opérations)",
    email: "compta@kinshasadigital.cd",
    phone: "+243 81 654 32 10",
    address: "Avenue Colonel Lukusa, Immeuble Future Tower",
    location: "Kinshasa, Gombe, RDC",
    taxId: "CD/KIN/RCCM/23-B-0891 • NIF: A2109432M",
  },
  {
    name: "Katanga Telecom & Infra",
    contactPerson: "Mme Clarisse Mwamba (Chef Comptable)",
    email: "finance@katangatelecom.cd",
    phone: "+243 97 894 51 23",
    address: "Avenue Laurent-Désiré Kabila",
    location: "Kolwezi, Lualaba, RDC",
    taxId: "CD/KLZ/RCCM/21-B-0245 • NIF: A2004512P",
  },
  {
    name: "Grands Lacs Agro-Industrie",
    contactPerson: "M. Dieudonné Kivuila (Directeur Général)",
    email: "direction@grandslacs-agro.cd",
    phone: "+243 90 458 91 20",
    address: "Route de Sake, Quartier Himbi",
    location: "Goma, Nord-Kivu, RDC",
    taxId: "CD/GMA/RCCM/20-B-0118 • NIF: A1809321X",
  },
  {
    name: "Bralima Distribution Kinshasa",
    contactPerson: "M. Serge Bopili (Chef de Projet)",
    email: "facturation@bralima-distrib.cd",
    phone: "+243 82 120 33 44",
    address: "Avenue des Brasseries, Barumbu",
    location: "Kinshasa, RDC",
    taxId: "CD/KIN/RCCM/19-B-0089 • NIF: A1704201W",
  },
  {
    name: "Société Commerciale du Congo (SOCOCI)",
    contactPerson: "Mme Pauline Tshala (Directrice des Achats)",
    email: "achats@sococi.cd",
    phone: "+243 99 442 21 10",
    address: "Avenue du Commerce, Quartier Commercial",
    location: "Kinshasa, RDC",
    taxId: "CD/KIN/RCCM/22-B-0731 • NIF: A2203109Q",
  },
  {
    name: "Matadi Port Transit SARL",
    contactPerson: "M. Roger Nzuzi (Directeur Général)",
    email: "transit@matadiport.cd",
    phone: "+243 85 550 99 88",
    address: "Zone Portuaire, Quai Ango-Ango",
    location: "Matadi, Kongo-Central, RDC",
    taxId: "CD/MAT/RCCM/21-B-0190 • NIF: A2105820T",
  },
  {
    name: "Bukavu Tech Innovations",
    contactPerson: "M. Aimé Cibalonza (Responsable IT)",
    email: "it@bukavutech.cd",
    phone: "+243 97 123 45 67",
    address: "Avenue Patrice Lumumba, Ibanda",
    location: "Bukavu, Sud-Kivu, RDC",
    taxId: "CD/BKV/RCCM/23-B-0044 • NIF: A2308190Y",
  },
];

// Répertoire initial des Devis & Estimations Chiffrées
export const initialQuotes = [
  {
    id: "DEV-2026-001",
    clientName: "Congo Mining & Logistics SARL",
    contactPerson: "M. Patrick Kalala (Directeur Financier)",
    clientEmail: "finances@congomining.cd",
    clientPhone: "+243 99 492 10 20",
    address: "Boulevard Kamanyola, Quartier Industriel",
    location: "Lubumbashi, Haut-Katanga, RDC",
    taxId: "CD/LSH/RCCM/22-B-0412 • NIF: A1908421K",
    issueDate: "20/10/2026",
    validUntil: "20/11/2026",
    status: "en_attente", // en_attente, accepte, refuse, expire
    items: [
      { description: "Mise à niveau infrastructure ERP & serveurs cloud", quantity: 1, unitPrice: 12500000 },
      { description: "Formation des équipes comptables & logistiques (5 sessions)", quantity: 5, unitPrice: 650000 },
      { description: "Assistance technique & infogérance dédiée (6 mois)", quantity: 1, unitPrice: 4200000 },
    ],
    vatRate: 0.16,
    notes: "Offre valable 30 jours. Acompte de 40% à la validation du devis, solde à la livraison finale.",
  },
  {
    id: "DEV-2026-002",
    clientName: "Kinshasa Digital Hub SAS",
    contactPerson: "M. Jean-Marc Ilunga (Responsable Opérations)",
    clientEmail: "compta@kinshasadigital.cd",
    clientPhone: "+243 81 654 32 10",
    address: "Avenue Colonel Lukusa, Immeuble Future Tower",
    location: "Kinshasa, Gombe, RDC",
    taxId: "CD/KIN/RCCM/23-B-0891 • NIF: A2109432M",
    issueDate: "18/10/2026",
    validUntil: "18/11/2026",
    status: "accepte",
    items: [
      { description: "Refonte portail web transactionnel & passerelle Mobile Money", quantity: 1, unitPrice: 7800000 },
      { description: "Module de réconciliation automatique des paiements Wave / Orange", quantity: 1, unitPrice: 2400000 },
    ],
    vatRate: 0.16,
    notes: "Devis validé par bon de commande n° BC-KDH-2026-44. Prêt pour facturation.",
  },
  {
    id: "DEV-2026-003",
    clientName: "Katanga Telecom & Infra",
    contactPerson: "Mme Clarisse Mwamba (Chef Comptable)",
    clientEmail: "finance@katangatelecom.cd",
    clientPhone: "+243 97 894 51 23",
    address: "Avenue Laurent-Désiré Kabila",
    location: "Kolwezi, Lualaba, RDC",
    taxId: "CD/KLZ/RCCM/21-B-0245 • NIF: A2004512P",
    issueDate: "15/10/2026",
    validUntil: "15/11/2026",
    status: "en_attente",
    items: [
      { description: "Audit de sécurité réseau fibre optique & tests d'intrusion", quantity: 1, unitPrice: 5600000 },
      { description: "Licences antivirus entreprise (50 postes)", quantity: 50, unitPrice: 65000 },
    ],
    vatRate: 0.16,
    notes: "Présentation technique effectuée auprès de la direction générale. En attente de signature.",
  },
  {
    id: "DEV-2026-004",
    clientName: "Bukavu Tech Innovations",
    contactPerson: "M. Aimé Cibalonza (Responsable IT)",
    clientEmail: "it@bukavutech.cd",
    clientPhone: "+243 97 123 45 67",
    address: "Avenue Patrice Lumumba, Ibanda",
    location: "Bukavu, Sud-Kivu, RDC",
    taxId: "CD/BKV/RCCM/23-B-0044 • NIF: A2308190Y",
    issueDate: "05/10/2026",
    validUntil: "20/10/2026",
    status: "expire",
    items: [
      { description: "Déploiement réseau sans fil sécurisé campus", quantity: 1, unitPrice: 3800000 },
    ],
    vatRate: 0.16,
    notes: "Validité dépassée. Relance commerciale à effectuer pour réactualisation des prix.",
  },
  {
    id: "DEV-2026-005",
    clientName: "Matadi Port Transit SARL",
    contactPerson: "M. Roger Nzuzi (Directeur Général)",
    clientEmail: "transit@matadiport.cd",
    clientPhone: "+243 85 550 99 88",
    address: "Zone Portuaire, Quai Ango-Ango",
    location: "Matadi, Kongo-Central, RDC",
    taxId: "CD/MAT/RCCM/21-B-0190 • NIF: A2105820T",
    issueDate: "12/10/2026",
    validUntil: "12/11/2026",
    status: "accepte",
    items: [
      { description: "Système de pesée automatisée & liaison douanière", quantity: 1, unitPrice: 8900000 },
      { description: "Imprimantes thermiques industrielles de connaissements", quantity: 3, unitPrice: 450000 },
    ],
    vatRate: 0.16,
    notes: "Bon pour accord reçu le 16/10/2026.",
  },
];

// Historique officiel et initial des règlements & encaissements
export const initialPayments = [
  {
    id: "PAY-2026-089",
    receiptNumber: "REC-2026-089",
    invoiceId: "FAC-2026-089",
    clientName: "Congo Mining & Logistics SARL",
    contactPerson: "M. Patrick Kalala (Directeur Financier)",
    clientEmail: "finances@congomining.cd",
    clientPhone: "+243 99 492 10 20",
    clientTaxId: "CD/LSH/RCCM/22-B-0412 • NIF: A1908421K",
    amount: 7268800,
    currency: "FC",
    paymentDate: "05/11/2026",
    paymentTime: "14:32",
    paymentMethod: "Virement Bancaire",
    channel: "virement",
    bankName: "Rawbank",
    transactionRef: "VIR-RAW-884920",
    beneficiaryAccount: "Entreprise - Rawbank Compte Courant CDF (0100 1000 0123 4567 89)",
    status: "valide",
    note: "Règlement complet facture audit de sécurité infrastructure cloud.",
    recordedBy: "Direction Financière",
  },
  {
    id: "PAY-2026-086",
    receiptNumber: "REC-2026-086",
    invoiceId: "FAC-2026-086",
    clientName: "Bralima Distribution Kinshasa",
    contactPerson: "M. Serge Bopili (Chef de Projet)",
    clientEmail: "facturation@bralima-distrib.cd",
    clientPhone: "+243 82 120 33 44",
    clientTaxId: "CD/KIN/RCCM/19-B-0089 • NIF: A1704201W",
    amount: 13570000,
    currency: "FC",
    paymentDate: "26/10/2026",
    paymentTime: "11:15",
    paymentMethod: "Virement Bancaire",
    channel: "virement",
    bankName: "Equity BCDC",
    transactionRef: "VIR-EQT-2026-9931",
    beneficiaryAccount: "Entreprise - Rawbank Compte Courant CDF (0100 1000 0123 4567 89)",
    status: "valide",
    note: "Règlement traçabilité livraisons logistiques et terminaux.",
    recordedBy: "Direction Financière",
  },
  {
    id: "PAY-2026-083",
    receiptNumber: "REC-2026-083",
    invoiceId: "FAC-2026-083",
    clientName: "Bukavu Tech Innovations",
    contactPerson: "M. Aimé Cibalonza (Responsable IT)",
    clientEmail: "it@bukavutech.cd",
    clientPhone: "+243 97 123 45 67",
    clientTaxId: "CD/BKV/RCCM/23-B-0044 • NIF: A2308190Y",
    amount: 5664000,
    currency: "FC",
    paymentDate: "15/10/2026",
    paymentTime: "16:45",
    paymentMethod: "Mobile Money - Airtel Money",
    channel: "mobile_airtel",
    bankName: "Airtel Money Pro",
    transactionRef: "AT-MOM-24098177",
    beneficiaryAccount: "+243 99 820 40 50 (Airtel Money Entreprise)",
    status: "valide",
    note: "Paiement direct passerelle Mobile Money validé instantanément.",
    recordedBy: "Direction Financière",
  },
  {
    id: "PAY-2026-079",
    receiptNumber: "REC-2026-079",
    invoiceId: "FAC-2026-079",
    clientName: "Société Commerciale du Congo (SOCOCI)",
    contactPerson: "Mme Pauline Tshala (Directrice des Achats)",
    clientEmail: "achats@sococi.cd",
    clientPhone: "+243 99 442 21 10",
    clientTaxId: "CD/KIN/RCCM/22-B-0731 • NIF: A2203109Q",
    amount: 8450000,
    currency: "FC",
    paymentDate: "02/10/2026",
    paymentTime: "10:20",
    paymentMethod: "Mobile Money - Orange Money",
    channel: "mobile_orange",
    bankName: "Orange Money RDC",
    transactionRef: "OM-CD-8910243",
    beneficiaryAccount: "+243 89 820 40 50 (Orange Money Entreprise)",
    status: "valide",
    note: "Acompte d'installation et déploiement logiciel de gestion commerciale.",
    recordedBy: "Direction Financière",
  },
  {
    id: "PAY-2026-077",
    receiptNumber: "REC-2026-077",
    invoiceId: "FAC-2026-077",
    clientName: "Kinshasa Digital Hub SAS",
    contactPerson: "M. Jean-Marc Ilunga (Responsable Opérations)",
    clientEmail: "compta@kinshasadigital.cd",
    clientPhone: "+243 81 654 32 10",
    clientTaxId: "CD/KIN/RCCM/23-B-0891 • NIF: A2109432M",
    amount: 4988000,
    currency: "FC",
    paymentDate: "28/09/2026",
    paymentTime: "15:10",
    paymentMethod: "Mobile Money - M-Pesa",
    channel: "mobile_mpesa",
    bankName: "Vodacom M-Pesa",
    transactionRef: "MP-883109-VX",
    beneficiaryAccount: "+243 81 000 40 50 (M-Pesa Entreprise)",
    status: "valide",
    note: "Règlement hébergement haute disponibilité et licences annuelles.",
    recordedBy: "Aminata Traoré",
  },
  {
    id: "PAY-2026-074",
    receiptNumber: "REC-2026-074",
    invoiceId: "FAC-2026-074",
    clientName: "Katanga Telecom & Infra",
    contactPerson: "Mme Clarisse Mwamba (Chef Comptable)",
    clientEmail: "finance@katangatelecom.cd",
    clientPhone: "+243 97 894 51 23",
    clientTaxId: "CD/KLZ/RCCM/21-B-0245 • NIF: A2004512P",
    amount: 11200000,
    currency: "FC",
    paymentDate: "18/09/2026",
    paymentTime: "09:40",
    paymentMethod: "Virement Bancaire",
    channel: "virement",
    bankName: "TMB (Trust Merchant Bank)",
    transactionRef: "VIR-TMB-77192",
    beneficiaryAccount: "Entreprise - Rawbank Compte Courant CDF",
    status: "valide",
    note: "Paiement travaux de câblage fibre et interconnexion sites distants.",
    recordedBy: "Direction Financière",
  },
  {
    id: "PAY-2026-071",
    receiptNumber: "REC-2026-071",
    invoiceId: "FAC-2026-071",
    clientName: "Matadi Port Transit SARL",
    contactPerson: "M. Roger Nzuzi (Directeur Général)",
    clientEmail: "transit@matadiport.cd",
    clientPhone: "+243 85 550 99 88",
    clientTaxId: "CD/MAT/RCCM/21-B-0190 • NIF: A2105820T",
    amount: 3200000,
    currency: "FC",
    paymentDate: "10/09/2026",
    paymentTime: "12:05",
    paymentMethod: "Chèque Bancaire",
    channel: "cheque",
    bankName: "Rawbank",
    transactionRef: "CHQ-RAW-004921",
    beneficiaryAccount: "Remis à l'encaissement agence Gombe",
    status: "valide",
    note: "Chèque certifié déposé et crédité sur compte courant.",
    recordedBy: "Direction Financière",
  },
  {
    id: "PAY-2026-068",
    receiptNumber: "REC-2026-068",
    invoiceId: "FAC-2026-068",
    clientName: "Grands Lacs Agro-Industrie",
    contactPerson: "M. Dieudonné Kivuila (Directeur Général)",
    clientEmail: "direction@grandslacs-agro.cd",
    clientPhone: "+243 90 458 91 20",
    clientTaxId: "CD/GMA/RCCM/20-B-0118 • NIF: A1809321X",
    amount: 2750000,
    currency: "FC",
    paymentDate: "04/09/2026",
    paymentTime: "16:20",
    paymentMethod: "Mobile Money - Wave",
    channel: "mobile_wave",
    bankName: "Wave Digital",
    transactionRef: "WAV-SN-994102",
    beneficiaryAccount: "+243 99 820 40 50",
    status: "valide",
    note: "Paiement direct Wave QR Code.",
    recordedBy: "Aminata Traoré",
  },
];

// Convertisseur de montant en lettres françaises (pour les quittances officielles)
export function numberToFrenchWords(number) {
  if (number === 0) return "zéro";
  if (!number || isNaN(number)) return "";

  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingts", "quatre-vingt-dix"];

  function convertGroup(n) {
    let result = "";
    const h = Math.floor(n / 100);
    const rest = n % 100;

    if (h > 0) {
      if (h === 1) {
        result += "cent";
      } else {
        result += units[h] + " cents";
      }
      if (rest > 0) result += " ";
    }

    if (rest > 0) {
      if (rest < 10) {
        result += units[rest];
      } else if (rest < 20) {
        result += teens[rest - 10];
      } else if (rest < 70) {
        const t = Math.floor(rest / 10);
        const u = rest % 10;
        if (u === 1 && t < 8) {
          result += tens[t] + " et un";
        } else if (u > 0) {
          result += tens[t] + "-" + units[u];
        } else {
          result += tens[t];
        }
      } else if (rest < 80) {
        const u = rest - 60;
        if (u === 11) {
          result += "soixante et onze";
        } else {
          result += "soixante-" + teens[u - 10];
        }
      } else if (rest < 100) {
        const u = rest - 80;
        if (u === 0) {
          result += "quatre-vingts";
        } else if (u < 10) {
          result += "quatre-vingt-" + units[u];
        } else {
          result += "quatre-vingt-" + teens[u - 10];
        }
      }
    }
    return result;
  }

  let n = Math.floor(number);
  let parts = [];

  const milliards = Math.floor(n / 1000000000);
  if (milliards > 0) {
    parts.push(convertGroup(milliards) + (milliards > 1 ? " milliards" : " milliard"));
    n %= 1000000000;
  }

  const millions = Math.floor(n / 1000000);
  if (millions > 0) {
    parts.push(convertGroup(millions) + (millions > 1 ? " millions" : " million"));
    n %= 1000000;
  }

  const milliers = Math.floor(n / 1000);
  if (milliers > 0) {
    if (milliers === 1) {
      parts.push("mille");
    } else {
      parts.push(convertGroup(milliers) + " mille");
    }
    n %= 1000;
  }

  if (n > 0 || parts.length === 0) {
    parts.push(convertGroup(n));
  }

  return parts.join(" ").trim();
}

