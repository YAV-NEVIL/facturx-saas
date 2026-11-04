# Règle : Design System Officiel & Cohérence UI de FacturX

> **Obligation absolue** : Toutes les pages actuelles et futures de l'application **FacturX** (Tableau de bord, Factures, Clients, Devis & Estimations, Paiements, Analytique, Rapports, Mon Entreprise, Paramètres) **DOIVENT STRICTEMENT** appliquer ce Design System. Aucune divergence de couleur, de police, de taille ou de mise en page n'est tolérée.

---

## 1. Identité & Philosophie Visuelle

- **Nom de marque** : **FacturX** (`Factur` en blanc/ardoise, `X` en bleu vibrant `#2D60FF` ou `text-brand-500`).
- **Thématique** : SaaS FinTech B2B ultra-moderne, épuré, institutionnel et haute fidélité, optimisé pour les devises d'Afrique francophone (**FCFA / XOF & XAF**).
- **Ambiance générale** : Fond d'application doux et lumineux (`#F6F8FC`), cartes blanches pures avec bordures ultra-fines (`border-slate-100` ou `border-slate-200/80`), accents cobalt/bleu royal, et typographie géométrique soignée.

---

## 2. Palette de Couleurs Officielles

Toutes les interfaces doivent utiliser exclusivement ces codes de couleurs et classes Tailwind :

### 2.1 Arrière-plans & Surfaces
| Élément | Code Couleur Hex | Classe Tailwind | Utilisation |
| :--- | :--- | :--- | :--- |
| **Fond Global Page** | `#F6F8FC` | `bg-[#F6F8FC]` | Background de toute l'application |
| **Surface Carte / Modal** | `#FFFFFF` | `bg-white` | Conteneurs, tableaux, modales, widgets |
| **Fond Secondaire / Hover** | `#F8FAFC` | `bg-slate-50` / `hover:bg-slate-50` | Entêtes de tableau, inputs au repos, boutons secondaires |
| **Bordure Standard** | `#F1F5F9` / `#E2E8F0` | `border-slate-100` / `border-slate-200` | Séparateurs, bordures de cartes et d'inputs |
| **Backdrop Modal** | `rgba(15, 23, 42, 0.60)` | `bg-slate-900/60 backdrop-blur-sm` | Arrière-plan flouté pour modales |

### 2.2 Couleurs de Marque (Brand Blues)
| Rôle | Code Hex | Classe Tailwind | Utilisation |
| :--- | :--- | :--- | :--- |
| **Primary Brand (Boutons)** | `#2563EB` / `#2D68E2` | `bg-blue-600 hover:bg-blue-700` | CTA principaux, boutons d'action, accents |
| **Accent Vif** | `#2D60FF` | `bg-[#2D60FF]` | Onglet actif de la sidebar, focus vibrant |
| **Sidebar Gradient Début** | `#1A44B8` | `from-[#1A44B8]` | En-tête de la barre latérale |
| **Sidebar Gradient Milieu**| `#163DA9` | `via-[#163DA9]` | Corps de la barre latérale |
| **Sidebar Gradient Fin**   | `#112F85` | `to-[#112F85]` | Pied de la barre latérale |
| **Fond Bleu Léger (Soft)** | `#EEF4FD` | `bg-blue-50 text-blue-700` | Badges info, icônes bleues d'en-tête |

### 2.3 Typographie & Niveaux de Gris
| Rôle | Code Hex | Classe Tailwind | Utilisation |
| :--- | :--- | :--- | :--- |
| **Texte Principal / Titres** | `#0F172A` | `text-slate-900` | Titres H1, H2, noms d'entreprises, montants |
| **Texte Standard / Corps**   | `#334155` | `text-slate-700` | Valeurs de champs, paragraphes |
| **Texte Secondaire**         | `#64748B` | `text-slate-500` | Labels, dates, sous-titres, colonnes de tableau |
| **Texte Muet / Icônes**      | `#94A3B8` | `text-slate-400` | Placeholders, icônes secondaires |

### 2.4 Couleurs de Statut Sémantiques (Badges & Indicateurs)
Les badges d'état doivent toujours être en style **Pilule (`rounded-full`)**, texte en majuscule semi-gras avec point indicateur pulsant ou solide :

- **PAYÉE / SUCCÈS** :
  - Fond : `#DCFCE7` (`bg-[#DCFCE7]`)
  - Texte : `#15803D` (`text-[#15803D]`)
  - Bordure : `#BBF7D0` (`border-[#BBF7D0]`)
  - Point indicateur : `#16A34A` (`bg-[#16A34A]`)
- **ENVOYÉE / EN COURS** :
  - Fond : `#FFEDD5` (`bg-[#FFEDD5]`)
  - Texte : `#C2410C` (`text-[#C2410C]`)
  - Bordure : `#FED7AA` (`border-[#FED7AA]`)
  - Point indicateur : `#EA580C` (`bg-[#EA580C]`)
- **EN RETARD / ÉCHÉANCE DÉPASSÉE** :
  - Fond : `#FFE4E6` (`bg-[#FFE4E6]`)
  - Texte : `#BE123C` (`text-[#BE123C]`)
  - Bordure : `#FECDD3` (`border-[#FECDD3]`)
  - Point indicateur : `#E11D48` (`bg-[#E11D48]`)
- **BROUILLON / ARCHIVÉ / NEUTRE** :
  - Fond : `#F1F5F9` (`bg-[#F1F5F9]`)
  - Texte : `#475569` (`text-[#475569]`)
  - Bordure : `#E2E8F0` (`border-[#E2E8F0]`)
  - Point indicateur : `#64748B` (`bg-[#64748B]`)

---

## 3. Typographie & Échelle de Texte

- **Police unique obligatoire** : `Plus Jakarta Sans` (`font-sans` configuré avec `--font-jakarta`).
- **Chiffres financiers & Codes** : `Plus Jakarta Sans` en `font-bold` ou `font-extrabold` avec `tracking-tight` ; `font-mono` pour les identifiants techniques (`FAC-2026-089`, IBAN, NINEA).

### Échelle Typographique Standardisée
| Niveau | Taille (px / rem) | Graisse (Weight) | Classes Tailwind | Utilisation |
| :--- | :--- | :--- | :--- | :--- |
| **KPI Chiffre Choc** | 28px - 32px (`2xl/3xl`)| Extrabold (800) | `text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900` | Montants totaux des cartes stats |
| **Titre Page H1** | 24px (`2xl`) | Extrabold (800) / Bold (700) | `text-2xl font-bold tracking-tight text-slate-900` | Titre principal de chaque page |
| **Titre Modal / H2** | 20px (`xl`) | Bold (700) | `text-xl font-bold tracking-tight text-slate-900` | Titres des fenêtres modales et sections |
| **Titre Carte / H3** | 16px (`base`) | Bold (700) | `text-base font-bold text-slate-900` | Titres internes de cartes / tableaux |
| **Corps Standard** | 14px (`sm`) | Medium (500) | `text-sm font-medium text-slate-700` | Lignes de tableau, valeurs d'input |
| **Texte Secondaire**| 13px - 14px (`sm`)| Regular (400) | `text-sm text-slate-500` | Descriptions, emails, adresses |
| **Labels Formulaire**| 12px (`xs`) | Semibold (600) | `text-xs font-semibold text-slate-600 uppercase tracking-wider` | Étiquettes au-dessus des inputs |
| **En-têtes Tableau** | 11px - 12px (`xs`) | Semibold (600) | `text-xs font-semibold text-slate-500 uppercase tracking-wider` | Colonnes `<th>` |
| **Badges / Tags** | 11px - 12px (`xs`) | Bold (700) | `text-xs font-bold` | Statuts (PAYÉE, EN RETARD...) |
| **Micro-mentions** | 10px | Bold (700) / Medium | `text-[10px] font-bold uppercase tracking-wider` | Raccourcis claviers `Ctrl+K`, timestamps |

---

## 4. Structure & Gabarit Obligatoire des Pages

Toute nouvelle page ajoutée à FacturX **doit respecter ce schéma structurel** :

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR FIXE GAUCHE (w-64)            │  HEADER STICKY EN HAUT               │
│  - Logo FacturX + icône Receipt         │  - Barre de recherche + Ctrl+K       │
│  - Navigation (Tableau de bord,        │  - Sélecteur de date / calendrier    │
│    Factures, Clients, Devis, etc.)     │  - Notifications (cloche)            │
│  - Badge compteur factures             │  - Profil utilisateur / Entreprise   │
│  - Bouton Créer Facture                ├──────────────────────────────────────┤
│  - Carte Support / Déconnexion         │  MAIN CONTENT (p-4 sm:p-6 lg:p-8)    │
│                                        │  1. Page Header (Titre + Actions)    │
│                                        │  2. Row de Cartes Stats (KPIs)       │
│                                        │  3. Card Blanche Principale          │
│                                        │     (Filtres + Tableau / Contenu)    │
│                                        │  4. Modals (Création, Édition, etc.) │
└────────────────────────────────────────┴──────────────────────────────────────┘
```

### Règles de Mise en Page (Layout Rules)
1. **Conteneur Page** : `min-h-screen bg-[#F6F8FC] flex`.
2. **Zone de Contenu Principal** : `lg:pl-64 flex-1 flex flex-col min-w-0`.
3. **Zone `main`** : `p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8`.
4. **Header de Section** : Toujours inclure à gauche le titre H1 + description, et à droite les boutons d'action (ex: *Ajouter*, *Exporter*, *Filtrer*).

---

## 5. Composants UI & Formats Standards

### 5.1 Boutons
- **Bouton Primaire (Action Majeure)** :
  ```jsx
  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
  ```
- **Bouton Secondaire (Contour / Neutre)** :
  ```jsx
  className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 active:scale-95 transition-all flex items-center gap-2"
  ```
- **Bouton Destructif (Supprimer)** :
  ```jsx
  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
  ```
- **Bouton Icône (Actions discrètes)** :
  ```jsx
  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
  ```

### 5.2 Formulaires & Champs de Saisie
- **Conteneur de champ** : `space-y-1.5`
- **Label** : `block text-xs font-semibold text-slate-700 uppercase tracking-wider`
- **Input / Select** :
  ```jsx
  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
  ```

### 5.3 Cartes & Tableaux
- **Conteneur de Carte Standard** :
  ```jsx
  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
  ```
- **Tableau** :
  - En-tête : `bg-slate-50/80 border-b border-slate-100` avec des `<th>` en `text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-4`.
  - Lignes `<tr>` : `border-b border-slate-100 hover:bg-slate-50/60 transition-colors`.
  - Cellules `<td>` : `py-4 px-4 text-sm text-slate-700 align-middle`.

### 5.4 Modales (Dialogues)
- **Overlay** : `fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4`
- **Fenêtre Modal** : `bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden`
- **Header Modal** : `px-6 py-5 border-b border-slate-100 flex items-center justify-between`
- **Body Modal** : `p-6 overflow-y-auto space-y-5`
- **Footer Modal** : `px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3`

---

## 6. Règles Métier & Régionales (UEMOA / FCFA)

1. **Devise & Affichage** :
   - Toujours formater les montants avec `formatFCFA(montant)` (ex: `1 500 000 FCFA`).
   - Ne jamais utiliser le symbole `$`, `€` ou laisser un nombre sans suffixe `FCFA`.
2. **Taux de TVA** :
   - Taux légal standard : **18%** (`vatRate: 0.18`).
   - Afficher clairement le sous-total **HT**, la **TVA (18%)** et le total **TTC**.
3. **Format des Dates** :
   - Toujours au format francophone `JJ/MM/AAAA` (ex: `21/10/2026`).
4. **Mentions Fiscales Régionales** :
   - Conserver systématiquement les champs **NINEA** et **RCCM** sur les documents et formulaires d'entreprise.

---

## 7. Ce qu'il est STRICTEMENT INTERDIT de faire (Anti-Patterns)

- ❌ Ne jamais changer la police de caractères (ne pas insérer Arial, Times, Roboto ou de polices tierces hors `Plus Jakarta Sans`).
- ❌ Ne jamais utiliser d'angles vifs (`rounded-none`). Tout élément doit avoir au minimum `rounded-lg`, et préférablement `rounded-xl` ou `rounded-2xl`.
- ❌ Ne jamais utiliser de fond blanc pur pour le fond de page global (garder impérativement `#F6F8FC`).
- ❌ Ne jamais créer une page sans la `Sidebar` unifiée et le `Header` standard.
- ❌ Ne jamais inventer de nouvelles couleurs de statuts arbitraires sans respecter la table sémantique du point 2.4.
