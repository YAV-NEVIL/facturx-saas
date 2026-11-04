# Directives du Projet FacturX (AGENTS.md)

Ce fichier définit les règles fondamentales et le **Design System officiel** de l'application FacturX.
Toutes les pages de l'application **doivent obligatoirement** partager ce même design system pour garantir une expérience 100% cohérente et haute fidélité.

---

## 🎨 1. Design System & Palette de Couleurs

### Surfaces & Structure
- **Fond de page global** : `#F6F8FC` (`bg-[#F6F8FC]`) — obligatoire sur toutes les vues.
- **Cartes & Conteneurs** : `#FFFFFF` (`bg-white rounded-2xl border border-slate-100 shadow-sm`).
- **Surfaces secondaires / Entêtes** : `#F8FAFC` (`bg-slate-50`).
- **Séparateurs** : `border-slate-100` ou `divide-slate-100`.

### Couleurs de Marque & Navigation
- **Bleu Primaire (CTA & Actions)** : `#2563EB` (`bg-blue-600 hover:bg-blue-700 text-white`).
- **Sidebar Gradient** : Dégradé vertical `from-[#1A44B8] via-[#163DA9] to-[#112F85]`.
- **Onglet actif Sidebar** : `bg-[#2D60FF] text-white shadow-lg shadow-blue-900/40`.
- **Onglet inactif Sidebar** : `text-blue-100/80 hover:text-white hover:bg-white/10`.

### Statuts des Factures (Badges Pilules)
- **Payée** : `bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]` (pastille `#16A34A`)
- **Envoyée** : `bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]` (pastille `#EA580C`)
- **En retard** : `bg-[#FFE4E6] text-[#BE123C] border-[#FECDD3]` (pastille `#E11D48`)
- **Brouillon** : `bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]` (pastille `#64748B`)

---

## ✍️ 2. Typographie & Tailles de Police

- **Police unique** : `Plus Jakarta Sans` (`font-sans` avec variable `--font-jakarta`).
- **Hiérarchie de tailles & graisses** :
  - **KPIs (Grands chiffres)** : `text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900`
  - **Titres de Page (H1)** : `text-2xl font-bold tracking-tight text-slate-900`
  - **Titres Modales & Cartes (H2)** : `text-xl font-bold text-slate-900`
  - **Sous-titres & Intitulés** : `text-base font-bold text-slate-900`
  - **Corps de texte standard** : `text-sm font-medium text-slate-700`
  - **Texte secondaire / Emails / Dates** : `text-sm text-slate-500`
  - **Labels de formulaire** : `text-xs font-semibold text-slate-600 uppercase tracking-wider`
  - **Entêtes de colonnes** : `text-xs font-semibold text-slate-500 uppercase tracking-wider`
  - **Badges de statut** : `text-xs font-bold rounded-full px-3 py-1`
  - **Raccourcis & Micro-labels** : `text-[10px] font-bold`

---

## 📐 3. Structure & Gabarit Commun à Toutes les Pages

Toutes les pages de FacturX doivent obligatoirement respecter l'architecture suivante :
1. **Sidebar à gauche** : largeur fixe `w-64` (cachée sur mobile avec tiroir coulissant).
2. **Header sticky en haut** : `sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 py-3.5` avec barre de recherche (raccourci `Ctrl+K`), sélecteur de date/période, notifications et profil.
3. **Zone Principale** : `lg:pl-64 min-h-screen bg-[#F6F8FC]` avec `main` en `p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8`.
4. **Header de page** : Titre H1 + description à gauche, boutons d'action majeurs à droite (Créer, Exporter, etc.).
5. **Rangée de cartes statistiques (KPIs)** : Grille responsive `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6`.
6. **Conteneur Principal / Table** : Carte blanche `bg-white rounded-2xl border border-slate-100 shadow-sm`.

---

## 💼 4. Règles Métier & Données (Zone FCFA / UEMOA)

- **Monnaie** : Toujours formater avec `formatFCFA(montant)` (ex: `2 500 000 FCFA`).
- **TVA** : Taux légal standard de **18%** (`0.18`), toujours détailler HT, TVA et TTC.
- **Dates** : Format français `JJ/MM/AAAA` (ex: `21/10/2026`).
- **Données d'entreprise** : Conserver systématiquement les champs fiscaux locaux (**NINEA**, **RCCM**).

---

> *Consulter le guide complet dans [.agents/rules/design-system.md](file:///c:/Users/IR%20KIOVI/Desktop/fact%20app/.agents/rules/design-system.md).*
