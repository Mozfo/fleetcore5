# FLEETCORE - ADDENDUM PLANNING JOUR 2

## Passage Auth Hosted vers Custom Flow Premium

---

## 📋 CONTEXTE DE LA MODIFICATION

### Situation au 23/09/2025 - 14h00

**État actuel du Jour 2 :**

- ✅ **COMPLÉTÉ :**
  - Setup Clerk Organizations
  - Migration webhook user.created → organization.created
  - Tables Tenant et User créées
  - RLS Supabase configuré et testé
  - Synchronisation clerk_org_id fonctionnelle

- ⚠️ **PROBLÈME IDENTIFIÉ :**
  - Pages auth actuelles utilisent composants Clerk hosted
  - Incompatible avec objectifs UI premium documentés
  - Niveau visé : Linear.app, Stripe Dashboard
  - Niveau actuel : Basique, non personnalisable

### Décision Architecture

**Passage de :** Composants Clerk hosted (`<SignIn />`, `<SignUp />`)  
**Vers :** Formulaires custom avec Clerk SDK  
**Raison :** Objectifs commerciaux premium ($500+/mois) nécessitent UI premium

---

## 🗓️ PLANNING RÉVISÉ - FIN JOUR 2

### 14h00-14h30 : Setup Shadcn/ui Minimal (30 min)

**Actions exactes :**

```bash
# 1. Initialiser Shadcn/ui
npx shadcn-ui@latest init
# Options à sélectionner :
# - Would you like to use TypeScript? → Yes
# - Which style? → Default
# - Base color? → Slate
# - CSS variables? → Yes

# 2. Installer composants essentiels auth
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
```

**Livrables attendus :**

- ✅ `components.json` créé à la racine
- ✅ `/components/ui/` avec 7 composants
- ✅ Variables CSS dans `app/globals.css`
- ✅ Configuration Tailwind mise à jour

---

### 14h30-16h30 : Formulaires Custom Auth (2h)

**Structure de dossiers à créer :**

```
app/
├── (auth)/                         # Route group pour isolation
│   ├── layout.tsx                  # Layout partagé pages auth
│   ├── login/
│   │   └── page.tsx                # Formulaire login custom
│   ├── register/
│   │   └── page.tsx                # Formulaire register custom
│   └── forgot-password/
│       └── page.tsx                # Formulaire reset password
├── sign-in/[[...sign-in]]/        # À SUPPRIMER après migration
└── sign-up/[[...sign-up]]/        # À SUPPRIMER après migration
```

**Stack technique à utiliser :**

```json
{
  "forms": "react-hook-form",
  "validation": "zod",
  "animations": "framer-motion",
  "auth": "@clerk/nextjs SDK",
  "styling": "tailwind + shadcn/ui"
}
```

**Fonctionnalités à implémenter :**

#### Page Login (`/app/(auth)/login/page.tsx`)

- Formulaire email + password
- Validation Zod temps réel
- Intégration `signIn.create()` de Clerk
- Gestion erreurs (invalid credentials, rate limit)
- Animation entrée avec Framer Motion
- Loading state pendant authentification
- Redirection post-login vers dashboard

#### Page Register (`/app/(auth)/register/page.tsx`)

- Formulaire complet (email, password, company)
- Validation password strength
- Intégration `signUp.create()` de Clerk
- Sélection organization/tenant
- Email verification flow
- Terms & conditions checkbox

#### Page Forgot Password (`/app/(auth)/forgot-password/page.tsx`)

- Formulaire email uniquement
- Intégration `signIn.create({ strategy: 'reset_password_email' })`
- Success state avec instructions
- Rate limiting indication

---

### 16h30-17h30 : Animations & Polish UI (1h)

**Animations à implémenter (Framer Motion) :**

```typescript
// 1. Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// 2. Form errors shake
const shakeVariants = {
  shake: { x: [-10, 10, -10, 10, 0], transition: { duration: 0.5 } },
};

// 3. Success feedback
const successVariants = {
  hidden: { scale: 0 },
  visible: { scale: 1, transition: { type: "spring" } },
};
```

**Micro-interactions à ajouter :**

- Focus states avec ring animation
- Hover effects sur buttons (scale + shadow)
- Input validation feedback (couleur + icône)
- Password visibility toggle avec transition
- Loading spinner custom
- Success checkmark animation

**Dark mode support :**

- Détection système préférence
- Toggle dans header auth
- Transitions smooth sans flash
- Variables CSS adaptatives

---

### 17h30-18h00 : Tests Multi-tenant & Validation (30 min)

**Tests à effectuer :**

1. **Création de comptes test :**
   - Créer 2 organizations dans Clerk Dashboard
   - Créer 2 users (1 par organization)

2. **Validation isolation :**

   ```sql
   -- Vérifier dans Supabase
   SELECT * FROM "Tenant";
   SELECT * FROM "User";
   -- Confirmer tenant_id différents
   ```

3. **Vérification JWT :**
   - Inspecter JWT dans DevTools
   - Confirmer présence de `org_id`
   - Vérifier metadata custom

4. **Tests fonctionnels :**
   - [ ] Login successful → redirect dashboard
   - [ ] Login failed → error message approprié
   - [ ] Register → email verification
   - [ ] Forgot password → email envoyé
   - [ ] Multi-tenant isolation confirmée

---

## 📊 IMPACT SUR LE PLANNING GLOBAL

### Modifications Planning Original

| Jour              | Tâches Original        | Tâches Révisées              | Δ Temps |
| ----------------- | ---------------------- | ---------------------------- | ------- |
| **J2**            | Pages auth hosted (1h) | Pages auth custom (4h)       | **+3h** |
| **J3 Matin**      | Install Shadcn complet | Install partiel (60% fait)   | **-1h** |
| **J3 Après-midi** | Dashboard + Layout     | Layout uniquement            | **-1h** |
| **J4 Matin**      | Tables core            | Dashboard (reporté) + Tables | **+1h** |
| **J4-J30**        | Inchangé               | Inchangé                     | **0h**  |

**Impact total projet : +3h sur 720h (0.4%)**

### Points de Raccordement

**Ce qui est déjà fait pour J3 :**

- ✅ Shadcn/ui initialisé (40% du travail J3)
- ✅ Composants form/input/button prêts
- ✅ Patterns de code établis

**Ce qui reste pour J3 :**

- Composants table, dialog, dropdown
- Layout principal (sidebar + header)
- Navigation avec breadcrumbs
- Dashboard reporté au J4

---

## ✅ CRITÈRES DE VALIDATION FIN JOUR 2

### Checklist Technique

- [ ] 3 pages auth fonctionnelles sans Clerk hosted
- [ ] Animations Framer Motion intégrées
- [ ] Validation forms temps réel avec Zod
- [ ] Gestion erreurs complète
- [ ] Dark mode supporté

### Checklist Qualité

- [ ] Performance : Animations 60 FPS
- [ ] Responsive : Mobile → Desktop
- [ ] Accessibility : Keyboard navigation
- [ ] UX : Loading states clairs
- [ ] Design : Cohérent niveau premium

### Checklist Sécurité

- [ ] Multi-tenant isolation vérifiée
- [ ] JWT avec org_id confirmé
- [ ] Rate limiting en place
- [ ] CSRF protection active
- [ ] Validation côté serveur

---

## 🚀 COMMANDES QUICK START

```bash
# 1. Setup initial
cd fleetcore5
npx shadcn-ui@latest init

# 2. Add components
npx shadcn-ui@latest add button input label card form toast alert

# 3. Install dependencies
pnpm add react-hook-form zod @hookform/resolvers framer-motion

# 4. Create auth structure
mkdir -p app/\(auth\)/{login,register,forgot-password}
touch app/\(auth\)/layout.tsx

# 5. Start dev server
pnpm dev
```

---

## 📝 NOTES IMPORTANTES

### Décisions d'Architecture

1. **Route groups** : `(auth)` pour isolation claire
2. **Validation** : Zod partagé frontend/backend
3. **State** : React Hook Form (pas de state management global pour auth)
4. **Animations** : Framer Motion (standard industrie)

### Risques Identifiés

- **Temps** : 3h supplémentaires mais rattrapables sur J3-J4
- **Complexité** : Plus de code mais maintenable
- **Clerk SDK** : Documentation à suivre précisément

### Bénéfices Long Terme

- **Cohérence** : Design System applicable partout
- **Performance** : Contrôle total sur le bundle
- **Évolution** : Personnalisation illimitée
- **Commercial** : UI premium = pricing premium justifié

---

## 🔗 RESSOURCES

### Documentation Essentielle

- [Clerk Custom Flows](https://clerk.com/docs/custom-flows/overview)
- [Shadcn/ui Forms](https://ui.shadcn.com/docs/components/form)
- [React Hook Form](https://react-hook-form.com/)
- [Framer Motion](https://www.framer.com/motion/)

### Exemples de Référence

- [Linear.app Login](https://linear.app/login)
- [Stripe Dashboard Auth](https://dashboard.stripe.com/login)
- [Vercel Login](https://vercel.com/login)

---

**Document généré le :** 23/09/2025 - 14h00  
**Version :** 1.0.0  
**Statut :** APPROUVÉ POUR EXÉCUTION  
**Auteur :** Assistant IA - Révision Planning FleetCore  
**Prochaine révision :** Fin Jour 2 (18h00) pour validation
