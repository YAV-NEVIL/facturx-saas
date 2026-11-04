# FacturX — Documentation Technique & Guide d'Architecture (GEMINI.md)

Ce document constitue la référence exhaustive de l'application **FacturX**. Il récapitule l'objectif métier, toutes les fonctionnalités développées, l'arborescence du code, les choix technologiques, les décisions de design ainsi que les directives strictes destinées à tout futur modèle d'intelligence artificielle ou ingénieur intervenant sur la base de code.

---

## 1. Ce que l'application fait (Vue d'ensemble & Proposition de Valeur)

**FacturX** est une plateforme SaaS B2B complète de **facturation, gestion commerciale, recouvrement et reporting financier**, spécialement conçue et optimisée pour les entreprises opérant en **Afrique francophone subsaharienne** (République Démocratique du Congo, zone OHADA, zone UEMOA / CEMAC).

### Problématique résolue
Les entreprises de cette zone géographique sont souvent confrontées à deux écueils :
1. Des logiciels internationaux (QuickBooks, Stripe Invoicing, FreshBooks) inadaptés aux réalités locales (devises comme le Franc Congolais CDF ou le Franc CFA, identifiants fiscaux régionaux RCCM / Id. Nat / NIF / NINEA, paiements par Mobile Money).
2. L'usage de tableurs Excel manuels, fragiles, source d'erreurs de calcul, dépourvus d'alertes d'échéances et de suivi d'encaissement rigoureux.

### Rôle de FacturX
FacturX unifie l'ensemble du cycle de vente et de trésorerie au sein d'une interface haute fidélité :
- **Émission de devis et estimations** commerciales avec cycle d'approbation et conversion instantanée en facture.
- **Facturation conforme** aux exigences légales régionales (calcul automatique HT, TVA 16% / 18%, TTC, mentions obligatoires).
- **Gestion de la relation client (CRM léger)** avec fiches profil 360°, suivi des encours et historique complet.
- **Suivi et enregistrement des règlements** multi-canaux (Virement bancaire, Airtel Money, Orange Money, Wave, Chèque, Espèces) avec génération automatique de reçus/quittances d'encaissement.
- **Relance multi-canaux proactive** des factures impayées (WhatsApp pré-rédigé, Email type, SMS, journal d'appels).
- **Analytique financière et prévisions de trésorerie** avec DSO (Délai Moyen de Paiement), simulation d'impact de recouvrement et courbes de trésorerie dynamiques.
- **Génération de rapports comptables et déclarations fiscales de TVA** prêts à l'audit, exportables en Excel (XLSX) et PDF.
- **Persistance locale garantie à 100%** côté navigateur via le `localStorage`, ne nécessitant pas de configuration complexe de base de données pour fonctionner immédiatement.

---

## 2. Toutes les fonctionnalités implémentées (Inventaire par Module)

L'application est structurée en **9 modules majeurs** accessibles depuis la barre de navigation latérale unifiée, enrichis de modales contextuelles et de générateurs de documents.

### 2.1 Tableau de Bord (Dashboard)
- **Cartes KPIs principales (`StatsCards.jsx`)** :
  - *Total Facturé* : Cumul de toutes les factures TTC avec taux de croissance.
  - *Total Encaissé* : Montant global perçu et taux d'encaissement.
  - *Factures en attente / en retard* : Volume financier en souffrance et nombre de dossiers concernés.
  - *Taux de Recouvrement* : Ratio pourcentage avec code couleur d'alerte.
- **Widget de Prévision de Trésorerie (`DashboardForecast.jsx`)** :
  - Horizon prévisionnel à 30, 60 ou 90 jours.
  - Calcul probabiliste des encaissements attendus selon les dates d'échéance.
  - Analyse d'exposition au risque d'impayés.
- **Factures Récentes (`DashboardRecentInvoices.jsx`)** :
  - Liste chronologique des dernières opérations émises avec statuts visuels et raccourcis d'actions rapides.
- **Barre d'indicateurs de conversion (`InvoiceMetricsBar.jsx`)**.

### 2.2 Gestion des Factures (Module Factures - `InvoiceTable.jsx`)
- **Création de facture complète (`CreateInvoiceModal.jsx`)** :
  - Sélection d'un client existant ou création rapide à la volée.
  - Ajout, modification et suppression dynamique de lignes d'articles (Prestation, Quantité, Prix unitaire, Total ligne).
  - Taux de TVA paramétrable (16% RDC standard, 18% UEMOA ou 0% exonéré).
  - Gestion des conditions de règlement, dates d'émission et d'échéance.
  - Champs de notes et instructions de paiement bancaire / Mobile Money.
- **Édition et mise à jour de facture (`EditInvoiceModal.jsx`)**.
- **Tableau de bord des factures** :
  - Recherche textuelle en direct (par numéro, nom client, contact, montant).
  - Filtres par statut : *Tous*, *Payée*, *Envoyée*, *En retard*, *Brouillon*.
  - Tri multi-colonnes (Date décroissante/croissante, Montant, Échéance, Client).
  - Pagination dynamique avec choix du nombre de lignes (5, 10, 25).
- **Actions par ligne de facture** :
  - Aperçu détaillé avec mise en page facture papier (`InvoiceDetailModal.jsx`).
  - Marquage direct comme payée en 1 clic.
  - Enregistrement d'un règlement partiel ou total (`RecordPaymentModal.jsx`).
  - Lancement d'une relance client ciblée (`ClientReminderModal.jsx`).
  - Impression directe et téléchargement PDF instantané (`lib/pdf-generator.js`).
  - Suppression sécurisée avec modale de confirmation (`ConfirmationModal.jsx`).
- **Export universel des factures (`ExportModal.jsx`)** :
  - Exportation native en feuille de calcul Excel (`.xlsx`), fichier CSV ou format brut JSON.

### 2.3 CRM Clients (Module Clients)
- **Répertoire complet des clients** :
  - Double mode d'affichage : Grille de cartes visuelles ou Tableau tabulaire dense.
  - Recherche instantanée par nom d'entreprise, responsable, email, ville, téléphone.
  - Filtres : Clients débiteurs (avec impayés), clients à jour, prospects actifs.
- **Création et Édition de client (`CreateClientModal.jsx`, `EditClientModal.jsx`)** :
  - Raison sociale et nom du responsable commercial/financier.
  - Identifiants légaux : NIF / NINEA, RCCM.
  - Coordonnées : Email, adresse physique, ville.
  - Saisie téléphonique internationale intelligente (`PhoneCountryInput.jsx` et `CountrySelect.jsx`) avec drapeau et indicatif pays automatique (+243, +221, +225, +33, etc.).
- **Tiroir de Profil Client 360° (`ClientProfileDrawer.jsx`)** :
  - Vue latérale coulissante affichant le profil financier complet du client.
  - Total facturé à ce client, total déjà réglé et reste à recouvrer.
  - Historique de toutes les factures associées au client avec statut.
  - Bouton d'action directe pour créer une nouvelle facture pré-assignée à ce client.
  - Raccourci vers la modale de relance client.

### 2.4 Pipeline Devis & Estimations (Module Devis - `QuotesPipelineView.jsx`)
- **Vue Pipeline Commercial & Suivi des Devis** :
  - Mode Kanban par étape d'avancement : *Brouillon*, *En attente*, *Accepté*, *Expiré*, *Refusé*.
  - Mode Liste tabulaire pour audit rapide.
  - Métriques clés du pipeline : Volume devisé global, volume en attente de signature, volume accepté, taux de conversion commercial (%).
- **Création de devis (`CreateQuoteModal.jsx`)** :
  - Structure similaire aux factures avec durée de validité (ex: 30 jours), mentions d'offre commerciale.
- **Détail et consultation du devis (`QuoteDetailModal.jsx`)** :
  - Visualisation haute fidélité du devis.
  - **Conversion en facture en 1 clic** : Génère automatiquement une facture `FAC-2026-xxx` à partir du devis accepté, sans ressaisie, avec transfert intégral des articles et conditions.
  - Export PDF et impression du devis.
  - Export de l'ensemble des devis vers Excel XLSX.

### 2.5 Suivi des Règlements & Quittances (Module Paiements - `PaymentsView.jsx`)
- **Journal général des encaissements** :
  - Liste de toutes les transactions perçues avec ID unique de transaction.
  - Ventilation graphique par canaux : *Virements bancaires*, *Mobile Money* (Airtel Money, Orange Money, Wave), *Chèques / Espèces*.
- **Enregistrement d'un paiement (`RecordPaymentModal.jsx`)** :
  - Sélection de la facture cible.
  - Affichage en temps réel du montant total de la facture, du montant déjà payé et du **reliquat restant**.
  - Possibilité de règlement partiel ou total : si le solde est soldé, la facture passe automatiquement au statut `payee`.
  - Date de valeur, canal de règlement, numéro de référence de transaction bancaire ou télécom.
- **Édition et suppression de paiements (`EditPaymentModal.jsx`)**.
- **Quittance / Reçu de Paiement officiel (`PaymentReceiptModal.jsx`)** :
  - Modale au design officiel avec filigrane "RÈGLEMENT ENCAISSÉ".
  - Mentions légales de l'entreprise, coordonnées du débiteur, facture liée, mode de paiement.
  - Tampon et signature certifiée intégrés.
  - Boutons pour impression et téléchargement PDF du reçu.

### 2.6 Analytique & Trésorerie Avancée (`AnalyticsView.jsx`)
- **Visualisations graphiques interactives** :
  - Courbes SVG de trésorerie avec moteur d'animation fluide en continu (`requestAnimationFrame`) créant une onde dynamique vivante.
  - Détection dynamique de survol souris (`mouseCoords`) affichant les points et valeurs exactes.
  - Sélecteur de métriques : Facturé seul, Encaissé seul, ou Facturé vs Encaissé.
  - Donut interactif SVG représentant la répartition par statut de facturation avec survol dynamique des segments.
  - Alternance temporelle : Vue mensuelle (historique sur 6 mois) ou vue hebdomadaire.
- **Simulateur décisionnel de trésorerie** :
  - Outil interactif permettant de faire varier le gain de recouvrement ciblé (ex: +25%) et la réduction du DSO (ex: -4 jours).
  - Calcul immédiat des liquidités additionnelles injectées dans l'entreprise.
- **Relance Express 1-Clic intégrée** :
  - Sélection rapide d'une facture à relancer depuis la vue analytique.
  - Choix du canal (WhatsApp, Email, SMS, Téléphone) avec texte pré-généré et ouverture directe du protocole `whatsapp://send` ou `mailto:`.
- **Tableau analytique des performances** avec recherche, filtres et export Excel.

### 2.7 Rapports Financiers & Déclarations Fiscales (`ReportsView.jsx`)
- **5 types de rapports officiels** :
  1. *Synthèse globale & Balance de Trésorerie* : Situation générale des créances et encaissements.
  2. *Recouvrement & Créances en retard* : Segmentation par urgence (*Critique* > 30 jours, *Modéré* 15-30 jours, *Récent* < 15 jours).
  3. *Factures en attente & Échéancier prévisionnel*.
  4. *Pipeline Devis & Opportunités commerciales*.
  5. *Journal Fiscal TVA & Déclarations DGI / UEMOA* : Chiffre d'affaires HT, base taxable, TVA collectée au taux de 16% / 18%, montants exonérés.
- **Aperçu Officiel avant impression (`ReportPreviewModal.jsx`)** :
  - Mise en page normée avec en-tête d'entreprise, date d'édition, tableau de synthèse et visa de l'auditeur.
- **Moteur d'exportation dédié** :
  - Fonctions XLSX spécialisées par type de rapport (`exportRecoveryReportToXLSX`, `exportFiscalReportToXLSX`, etc.).
  - Téléchargement du rapport au format PDF via `generateReportPdf`.

### 2.8 Fiche Entreprise (Module Mon Entreprise)
- Gestion complète de la structure juridique :
  - Raison sociale, sous-titre commercial, devise principale.
  - Identifiants légaux : RCCM, Id. Nat, NIF (Numéro d'Impôt), NINEA.
  - Siège social, boîte postale (BP), ville, pays.
  - Téléphone fixe et mobile avec indicatif international.
  - Email officiel, site internet.
- Coordonnées bancaires locales complètes :
  - Sélection parmi les banques de premier ordre de la région (Rawbank, Equity BCDC, TMB, Sofibanque, Ecobank, etc.) ou saisie libre.
  - Numéro de compte / IBAN.
  - Numéros de comptes marchands Mobile Money (Airtel Money, Orange Money, Wave).
- Téléversement du Logo d'entreprise :
  - Support de fichiers image locaux via `FileReader` en `data:image/...;base64`.
  - Aperçu instantané et répercussion immédiate sur tous les documents (factures, devis, quittances, rapports).

### 2.9 Paramètres Système & Personnalisation (`SettingsView.jsx`)
Le module de configuration est découpé en **8 sous-onglets spécialisés** :
1. **Apparence & Thème** : Mode Clair (Light), Mode Sombre (Dark), Mode Système (auto-détection OS), couleur d'accentuation, densité de l'interface.
2. **Facturation & Fiscalité** : Devise principale (CDF, XOF/XAF, USD, EUR, GBP), multi-devises avec taux de change manuels, taux de TVA par défaut (16% ou 18%), retenue à la source, préfixes de numérotation (`FAC-2026-`, `DEV-2026-`, `REC-2026-`), conditions de paiement par défaut, taux des pénalités de retard.
3. **Mon Entreprise** : Redirection et synchronisation avec les informations de la société.
4. **Profil Administrateur** : Nom, email, rôle (Head Admin), avatar, date de création de compte.
5. **Notifications & Alertes** : Activation/désactivation des rappels automatiques par Email, WhatsApp, notifications sonores et push.
6. **Sécurité & Accès** : Authentification à deux facteurs (2FA), historique des sessions actives, journal de sécurité.
7. **Équipe & Collaborateurs** : Liste des membres avec rôles d'accès (*Administrateur*, *Comptable*, *Commercial*), modale d'invitation.
8. **Données & Sauvegarde** :
   - *Sauvegarde intégrale JSON* : Télécharge instantanément un fichier `.json` contenant l'intégralité de la base de données (factures, clients, devis, règlements, profil).
   - *Restauration JSON* : Permet de recharger un fichier de sauvegarde pour restaurer l'état de l'application.
   - *Réinitialisation d'usine* : Remet à zéro toutes les données pour réinitialiser les données de démonstration après confirmation.

### 2.10 Utilitaires & Composants Transversaux
- **Générateur PDF natif en JavaScript pur (`lib/pdf-generator.js`)** :
  - Générateur respectant la norme standard **PDF-1.4**.
  - **Zéro dépendance lourde externe** (pas de node-canvas, pas de bundle Webpack lourd).
  - Génère des flux binaires PDF vectoriels propres téléchargeables directement dans le navigateur sous forme de Blob URL pour les factures, devis, quittances et rapports.
- **Centre de Recherche & Raccourcis Clavier** :
  - Barre de recherche globale dans l'en-tête accessible via le raccourci clavier `Ctrl + K`.
- **Sélecteur de Date & Calendrier Interactif (`CalendarDropdown.jsx`)** :
  - Sélections rapides : *Aujourd'hui*, *7 derniers jours*, *30 derniers jours*, *Ce mois-ci*, *Ce trimestre*, *Cette année*, ou sélection de date personnalisée sur mini-calendrier.
- **Centre de Notifications (`Header.jsx`)** :
  - Menu déroulant avec pastilles de sévérité (succès de paiement, retard de facture, transmission d'email).

---

## 3. Structure des Fichiers & Arborescence

```text
fact app/
├── .agents/                               # Directives IA et règles du projet
│   └── rules/
│       └── design-system.md               # Guide officiel et strict du Design System FacturX
├── AGENTS.md                              # Résumé des règles fondamentales du projet
├── GEMINI.md                              # Document présent de référence technique
├── README.md                              # Guide de démarrage Next.js standard
├── package.json                           # Dépendances et scripts npm
├── next.config.mjs                        # Configuration Next.js
├── tailwind.config.js                     # Configuration Tailwind (palette brand, sidebar, fonts)
├── postcss.config.mjs                     # Pipeline PostCSS
├── jsconfig.json                          # Alias de chemin TypeScript / JavaScript (@/*)
│
├── app/                                   # Architecture Next.js App Router
│   ├── favicon.ico                        # Icône de l'application
│   ├── globals.css                        # Styles globaux, variables CSS, Dark mode & @media print
│   ├── layout.js                          # Root layout, injection de la police Plus Jakarta Sans
│   └── page.js                            # Composant maître (State central, routage par onglets, localStorage)
│
├── components/                            # Ensemble des composants React modulaires (30 fichiers)
│   │
│   ├── [Structure & Navigation]
│   ├── Sidebar.jsx                        # Barre latérale dégradée bleue, navigation par onglets, badge
│   ├── Header.jsx                         # En-tête sticky avec recherche, calendrier, notifications, profil
│   ├── CalendarDropdown.jsx               # Dropdown sélecteur de période et calendrier
│   │
│   ├── [Tableau de bord & KPIs]
│   ├── StatsCards.jsx                     # 4 cartes statistiques majeures du dashboard
│   ├── DashboardForecast.jsx              # Widget prévisionnel de trésorerie sur 30-90 jours
│   ├── DashboardRecentInvoices.jsx        # Liste des factures récentes sur le dashboard
│   ├── InvoiceMetricsBar.jsx              # Barre de métriques rapides
│   │
│   ├── [Factures]
│   ├── InvoiceTable.jsx                   # Tableau principal des factures (recherche, filtres, tri, pagination)
│   ├── CreateInvoiceModal.jsx             # Fenêtre modale de création d'une facture (lignes dynamiques)
│   ├── EditInvoiceModal.jsx               # Fenêtre modale de modification d'une facture
│   ├── InvoiceDetailModal.jsx             # Modale d'aperçu pleine page d'une facture avec actions
│   │
│   ├── [Clients]
│   ├── CreateClientModal.jsx              # Modale de création d'un nouveau client
│   ├── EditClientModal.jsx                # Modale de modification de client
│   ├── ClientProfileDrawer.jsx            # Tiroir latéral 360° profil client et historique
│   ├── ClientReminderModal.jsx            # Modale de relance client multi-canaux (WhatsApp, Email, etc.)
│   ├── PhoneCountryInput.jsx              # Champ de saisie téléphonique international avec indicatif
│   ├── CountrySelect.jsx                  # Sélecteur de pays avec drapeaux
│   │
│   ├── [Devis & Pipeline]
│   ├── QuotesPipelineView.jsx             # Vue Pipeline des devis (modes Kanban & Tableau)
│   ├── CreateQuoteModal.jsx               # Modale d'émission de devis commercial
│   ├── QuoteDetailModal.jsx               # Consultation de devis et conversion en 1 clic vers facture
│   │
│   ├── [Paiements & Règlements]
│   ├── PaymentsView.jsx                   # Vue complète du registre des encaissements
│   ├── RecordPaymentModal.jsx             # Modale d'enregistrement de règlement et calcul du solde
│   ├── EditPaymentModal.jsx               # Modale d'édition d'une transaction de paiement
│   ├── PaymentReceiptModal.jsx            # Quittance / Reçu officiel de paiement avec tampon
│   │
│   ├── [Analytique, Rapports & Paramètres]
│   ├── AnalyticsView.jsx                  # Vue analytique (ondes SVG interactives, DSO, simulateur)
│   ├── ReportsView.jsx                    # Vue des 5 rapports financiers et fiscaux
│   ├── ReportPreviewModal.jsx             # Modale d'aperçu d'impression de rapport officiel
│   ├── SettingsView.jsx                   # Panneau de configuration (8 onglets)
│   │
│   └── [Modales Communes]
│       ├── ConfirmationModal.jsx          # Modale générique de confirmation / action destructive
│       └── ExportModal.jsx                # Modale d'export universel (Excel, CSV, JSON)
│
└── lib/                                   # Utilitaires métier et générateurs de données
    ├── mock-data.js                       # Modèles de données, helpers de calculs, banques, devises, pays
    ├── export-utils.js                    # Fonctions d'exportation Excel XLSX (SheetJS), CSV, JSON
    └── pdf-generator.js                   # Moteur autonome de génération de documents PDF-1.4 en JS pur
```

---

## 4. Technologies Utilisées

| Domaine | Technologie | Version / Détail | Rôle |
| :--- | :--- | :--- | :--- |
| **Framework Web** | [Next.js](https://nextjs.org/) | `14.2.15` (App Router) | Structure applicative React, SSR initial, routage client, optimisation des polices. |
| **Bibliothèque UI** | [React](https://react.dev/) | `^18.3.1` | Moteur de rendu réactif basé sur les composants et Hooks (`useState`, `useEffect`, `useMemo`, `useRef`). |
| **Moteur de Style** | [Tailwind CSS](https://tailwindcss.com/) | `^3.4.1` | Système de design utilitaire, variables de thèmes, gestion fine du Dark Mode (`darkMode: "class"`). |
| **Typographie** | [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | via `next/font/google` | Police unique obligatoire, assurant un rendu moderne, géométrique et lisible. |
| **Iconographie** | [Lucide React](https://lucide.dev/) | `^0.460.0` | Pack de plus de 50 icônes vectorielles cohérentes pour toute l'interface. |
| **Export Excel** | [xlsx (SheetJS)](https://sheetjs.com/) | `^0.18.5` | Génération client native de fichiers de classeurs Excel `.xlsx` multi-colonnes. |
| **Moteur PDF** | JavaScript Pur natif | Spécification PDF-1.4 | Moteur personnalisé sans dépendance externe générant des flux vectoriels A4 téléchargeables. |
| **Persistance** | Navigateur LocalStorage | API native Web Storage | Stockage persistant sans latence de toutes les mutations (invoices, clients, quotes, payments, company). |

---

## 5. Décisions de Design (Design System & Philosophie UI/UX)

Toutes les interfaces de l'application répondent aux règles strictes du **Design System FacturX** documenté dans [.agents/rules/design-system.md](file:///c:/Users/IR%20KIOVI/Desktop/fact%20app/.agents/rules/design-system.md).

### 5.1 Palette Chromatique Fondatrice
- **Fond d'application (`Background`)** : `#F6F8FC` (`bg-[#F6F8FC]`). L'utilisation d'un blanc pur (`#FFFFFF`) pour le fond de page global est un anti-pattern proscrit.
- **Surfaces et Conteneurs (`Cards`)** : `#FFFFFF` (`bg-white rounded-2xl border border-slate-100 shadow-sm`).
- **Surfaces Secondaires & En-têtes** : `#F8FAFC` (`bg-slate-50`).
- **Sidebar Gradient** : Dégradé vertical institutionnel `from-[#1A44B8] via-[#163DA9] to-[#112F85]`.
- **Onglet Actif Sidebar** : Bleu cobalt vibrant `#2D60FF` avec ombre portée bleutée `shadow-lg shadow-blue-900/40`.
- **Bouton Primaire (CTA)** : `#2563EB` (`bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-xl`).

### 5.2 Sémantique des Badges de Statut (Style Pilule Obligatoire)
Tous les badges de statuts utilisent impérativement la forme pilule (`rounded-full px-3 py-1 text-xs font-bold`) accompagnée d'un point indicateur coloré :
- **Payée / Accepté / Succès** : Fond `#DCFCE7`, Texte `#15803D`, Bordure `#BBF7D0`, Pastille `#16A34A`.
- **Envoyée / En attente** : Fond `#FFEDD5`, Texte `#C2410C`, Bordure `#FED7AA`, Pastille `#EA580C`.
- **En retard / Échéance dépassée / Refusé** : Fond `#FFE4E6`, Texte `#BE123C`, Bordure `#FECDD3`, Pastille `#E11D48`.
- **Brouillon / Neutre** : Fond `#F1F5F9`, Texte `#475569`, Bordure `#E2E8F0`, Pastille `#64748B`.

### 5.3 Typographie et Rayons de Courbure
- **Police unique** : `Plus Jakarta Sans`. Aucune autre typographie ne doit être injectée.
- **Grands KPIs** : `text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900`.
- **Labels et En-têtes de tableau** : `text-xs font-semibold text-slate-500 uppercase tracking-wider`.
- **Rayons de courbure (Border Radius)** :
  - Boutons et Inputs : `rounded-xl`.
  - Cartes et Tableaux : `rounded-2xl`.
  - Modales et Tiroirs : `rounded-3xl` ou `rounded-2xl`.
  - **Règle absolue** : Aucun angle vif (`rounded-none` est formellement interdit).

### 5.4 Ergonomie & Architecture de Page Commune
Chaque écran de FacturX obéit à la même disposition structurelle :
1. **Sidebar fixe à gauche** : Largeur fixe `w-64` (dissimulée sur mobile avec tiroir coulissant et backdrop flouté).
2. **Header sticky en haut** : `sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 py-3.5` incluant la recherche globale, le sélecteur temporel, les notifications et le profil.
3. **Zone de contenu principal** : `lg:pl-64 min-h-screen bg-[#F6F8FC]` avec conteneur `main` centré en `max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8`.
4. **Header de page** : Titre H1 + description à gauche, boutons d'actions contextuels à droite.
5. **Rangée de cartes statistiques (KPIs)** en grille responsive `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6`.
6. **Carte principale** contenant les filtres de recherche et la table de données.

---

## 6. Instructions pour un Futur Modèle d'IA (Directives de Développement)

Tout modèle d'IA intervenant sur ce projet doit se conformer aux consignes suivantes :

### 6.1 Respect Absolu du Design System & Règles UI
- **Ne modifiez jamais la palette fondamentale** : Conservez toujours `#F6F8FC` pour le fond, le gradient de la sidebar et les classes de statut sémantiques.
- **N'ajoutez pas de bibliothèques CSS tierces** (ex: Tailwind v4 incompatible, styled-components, Bootstrap). Utilisez exclusivement Tailwind CSS avec les classes utilitaires déjà configurées.
- **Ne remplacez pas la police de caractères**.
- **Veillez au support du Dark Mode** : Toute nouvelle classe ou conteneur ajouté doit tenir compte des sélecteurs de `app/globals.css` (ex: `html.dark .bg-white`, etc.).

### 6.2 Règles de Calcul & Logique Métier Régionale
- **Formatage monétaire** : Utilisez toujours les fonctions helpers `formatAmount(montant, devise)` ou `formatFCFA(montant)` provenant de `@/lib/mock-data`. Ne formatez jamais un montant avec un `$` ou un `€` en dur sans passer par la devise active de l'entreprise.
- **Calculs de totaux de factures** : Utilisez systématiquement `calculateInvoiceTotals(items, vatRate)`. Ne recalculez pas de sous-totaux de manière ad-hoc dans les composants pour éviter les écarts d'arrondis.
- **Taux de TVA par défaut** : Le taux par défaut est de 16% (RDC / standard DGI) ou 18% (zone UEMOA). Ne fixez jamais de TVA à 20% (taux européen) sans demande explicite.
- **Identifiants légaux africains** : Préservez impérativement les mentions de **RCCM**, **Id. Nat**, **NIF** et **NINEA** dans les formulaires et générateurs de documents.

### 6.3 Gestion de l'État & Persistance (LocalStorage)
L'application fonctionne actuellement avec une persistance client complète via `localStorage` dans `app/page.js` :
- `facturx_invoices_v3` : Liste des factures.
- `facturx_clients_v3` : Liste des clients.
- `facturx_quotes_v3` : Liste des devis commerciaux.
- `facturx_payments_v3` : Liste des encaissements.
- `facturx_company_info_v3` : Paramètres légaux de la société.
- `facturx_user_profile_v3` : Profil utilisateur.

**Consigne clé** : Si vous ajoutez un nouveau champ à une entité (par exemple un champ `discount` sur les devis ou une nouvelle catégorie de client), veillez à :
1. Définir une valeur par défaut dans `@/lib/mock-data.js`.
2. Gérer la rétrocompatibilité lors du chargement depuis `localStorage` (ne pas supposer que les données existantes de l'utilisateur contiennent déjà le nouveau champ).
3. Mettre à jour les fonctions d'export (`lib/export-utils.js`) et de génération PDF (`lib/pdf-generator.js`) correspondantes.

### 6.4 Moteur PDF & Exports (Zéro Dépendance Lourde)
- L'application dispose déjà d'un moteur PDF vectoriel natif dans `lib/pdf-generator.js`. **N'installez pas de dépendances lourdes** telles que `jspdf`, `pdfmake`, `html2canvas` ou `puppeteer`. Si vous devez ajouter un nouveau type de document imprimable, enrichissez `lib/pdf-generator.js` en vous appuyant sur les helpers existants (`drawText`, `drawRect`, `escapePdfText`).
- Pour tout export tabulaire, utilisez la bibliothèque `xlsx` déjà présente via les fonctions centralisées dans `lib/export-utils.js`.

### 6.5 Découpage des Composants & Performance
- Lorsque vous implémentez une nouvelle fonctionnalité complexe ou une nouvelle vue, créez un composant dédié dans le dossier `components/` plutôt que d'alourdir `app/page.js`.
- Respectez la convention de nommage `PascalCase` pour les fichiers de composants (ex: `NewFeatureModal.jsx`).
- Tous les composants comportant des états ou des interactions utilisateur doivent comporter la directive `"use client";` en première ligne.

---

*Document généré pour la gouvernance technique du projet FacturX. Dernière mise à jour : 24 Octobre 2026.*
