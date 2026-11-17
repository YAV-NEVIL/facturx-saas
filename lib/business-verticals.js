/**
 * Configuration officielle des Types d'Entreprises / Verticales Métier FacturX
 * Chaque verticale dispose de sa propre interface opérationnelle et se termine
 * systématiquement par le module unifié de Gestion de Facturation & Encaissement.
 */

export const BUSINESS_VERTICALS = [
  {
    id: "b2b_services",
    label: "Services, Industrie & Gros Commerce",
    shortLabel: "B2B & Services",
    subtitle: "Prestations de services, Agences, Industrie, BTP, Grossistes",
    description:
      "Interface B2B complète : Devis, Pipeline commercial, Factures normalisées DGI, Recouvrement & Rapports OHADA.",
    defaultSector: "Commerce Général & Services B2B",
    badge: "Disponible",
    accentBg: "bg-blue-50",
    accentText: "text-blue-700",
    accentBorder: "border-blue-200",
    workflowSteps: [
      "Prospect & Devis",
      "Validation client",
      "Gestion de Facturation DGI",
      "Encaissement & Quittance",
    ],
  },
  {
    id: "ecommerce",
    label: "E-Commerce & Vente en Ligne",
    shortLabel: "E-Commerce",
    subtitle: "Boutiques en ligne, Vente WhatsApp / Réseaux sociaux, Livraisons",
    description:
      "Interface E-Commerce dédiée : Catalogue produits & stock, Commandes, Suivi livraisons + Facturation normalisée automatique à la fin.",
    defaultSector: "Commerce Général & Services B2B",
    badge: "Actif",
    accentBg: "bg-indigo-50",
    accentText: "text-indigo-700",
    accentBorder: "border-indigo-200",
    workflowSteps: [
      "Catalogue & Stock",
      "Commande client",
      "Préparation & Livraison",
      "Gestion de Facturation & Reçu",
    ],
  },
  {
    id: "restaurant",
    label: "Restauration, Fast-Food & Bar",
    shortLabel: "Restauration",
    subtitle: "Restaurants, Cafés, Lounges, Traiteurs, Livraison repas",
    description:
      "Interface Restauration : Plan de salle & tables, Prise de commande rapide, Cuisine (KDS) + Gestion de Facturation & Additions.",
    defaultSector: "Agroalimentaire & Distribution",
    badge: "Facturation Active",
    accentBg: "bg-amber-50",
    accentText: "text-amber-700",
    accentBorder: "border-amber-200",
    workflowSteps: [
      "Salle & Tables",
      "Commande Cuisine (KDS)",
      "Service & Addition",
      "Gestion de Facturation & Encaissement",
    ],
  },
  {
    id: "hotel",
    label: "Hôtellerie & Hébergement",
    shortLabel: "Hôtellerie",
    subtitle: "Hôtels, Appart-hôtels, Auberges, Résidences meublées",
    description:
      "Interface Hôtellerie : Chambres & disponibilités, Check-in / Check-out, Folio extras + Gestion de Facturation de séjour.",
    defaultSector: "Commerce Général & Services B2B",
    badge: "Facturation Active",
    accentBg: "bg-purple-50",
    accentText: "text-purple-700",
    accentBorder: "border-purple-200",
    workflowSteps: [
      "Réservation & Check-in",
      "Séjour & Chambres",
      "Extras & Folio",
      "Gestion de Facturation Check-out",
    ],
  },
  {
    id: "retail_pos",
    label: "Petit Commerce & Détail (POS)",
    shortLabel: "Petit Commerce",
    subtitle: "Boutiques de quartier, Supérettes, Pharmacies, Quincailleries",
    description:
      "Interface Caisse Rapide (POS) : Vente au comptoir en 2 clics, Stock & alertes rupture, Crédits clients + Gestion de Facturation & Z de caisse.",
    defaultSector: "Commerce Général & Services B2B",
    badge: "Facturation Active",
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-700",
    accentBorder: "border-emerald-200",
    workflowSteps: [
      "Stock & Articles",
      "Passage en Caisse (POS)",
      "Cash / Mobile Money",
      "Gestion de Facturation & Z de Caisse",
    ],
  },
];

export function getBusinessVerticalConfig(verticalId) {
  return (
    BUSINESS_VERTICALS.find((v) => v.id === verticalId) || BUSINESS_VERTICALS[0]
  );
}

export function isClassicB2BVertical(verticalId) {
  return !verticalId || verticalId === "b2b_services";
}

