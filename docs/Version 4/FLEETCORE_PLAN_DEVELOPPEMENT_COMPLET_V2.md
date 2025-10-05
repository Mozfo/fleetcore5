# FLEETCORE VTC - PLAN V3 CORRIGÉ

**Date de création:** 04/10/2025  
**Version:** 3.0 - Plan corrigé avec architecture backoffice + soft delete + webhooks  
**Basé sur:** FLEETCORE_PLAN_DEVELOPPEMENT_COMPLET V2 + Décisions architecturales validées  
**Statut:** PRÊT POUR EXÉCUTION

---

## 📋 CORRECTIONS MAJEURES V3

### Ce qui a changé par rapport à V2

**1. Architecture Multi-tenant Corrigée**

- ✅ Organisation dédiée "FleetCore Platform" pour super admins
- ✅ Séparation `/platform` (backoffice SaaS) vs `/dashboard` (clients)
- ✅ Rôles platform: `platform:super_admin`, `platform:commercial`, `platform:support`
- ✅ Pas d'accès cross-tenant direct (sauf impersonate avec audit)

**2. Workflow Invitation Client**

- ✅ Suppression `/en/register` public (devient route platform uniquement)
- ✅ Création `/en/accept-invitation` pour admins clients invités
- ✅ Company name PRÉ-REMPLI et GRISÉ (non modifiable)
- ✅ Process: Lead → Validation → Super admin crée org → Invitation email

**3. Soft Delete + Audit**

- ✅ Table `member` : colonnes `status`, `deleted_at`, `deleted_by`, `deletion_reason`
- ✅ Webhooks Clerk → Supabase pour sync users
- ✅ Workflow: Soft delete → Audit trail → Hard delete après 90 jours
- ✅ API `/api/webhooks/clerk` pour événements

**4. Tables Ajustées**

- ✅ Table `audit_logs` obligatoire dès Phase 1 (pas Phase 4)
- ✅ Colonnes soft delete sur toutes tables principales

---

## 📋 TABLE DES MATIÈRES

1. [État Actuel et Audit](#1-état-actuel-et-audit)
2. [Architecture Corrigée](#2-architecture-corrigée)
3. [Phase 0: Déblocage Critique](#3-phase-0-déblocage-critique)
4. [Phase 1: Fondations](#4-phase-1-fondations)
5. [Phase 2: Core VTC](#5-phase-2-core-vtc)
6. [Phase 3: Revenus & Finances](#6-phase-3-revenus--finances)
7. [Phase 4: Modules Avancés](#7-phase-4-modules-avancés)
8. [Phase 5: Production](#8-phase-5-production)
9. [Matrice des Dépendances](#9-matrice-des-dépendances)

---

## 1. ÉTAT ACTUEL ET AUDIT

### 1.1 Ce Qui Fonctionne ✅

**Infrastructure (Jour 1 - 100% Complété)**

- ✅ Next.js 15.5.3 configuré avec Turbopack
- ✅ Clerk Auth installé (@clerk/nextjs 6.32.2)
- ✅ Supabase connecté
- ✅ Prisma configuré (6.16.2)
- ✅ Vercel déployé (https://fleetcore5.vercel.app)
- ✅ Sentry monitoring configuré
- ✅ Git/GitHub configuré

**Pages Authentification (Jour 2 - Complété)**

- ✅ `/login` - Design premium, validations, animations
- ✅ `/register` - Formulaire inscription custom (À MODIFIER - voir V3)
- ✅ `/forgot-password` - Reset password flow
- ✅ `/reset-password` - Avec token validation

**Pages Marketing (Jour 2 - Complété)**

- ✅ `/request-demo` - Landing avec vidéo, métriques animées
- ✅ `/request-demo/form` - Formulaire multi-étapes

**Base de Données (Jour 2 - Partiellement Complété)**

- ✅ Table `organization` (4 records)
- ✅ Table `member` (MANQUE colonnes soft delete - À AJOUTER)
- ✅ Table `sys_demo_lead`
- ✅ Table `sys_demo_lead_activity`

**API Créées (Jour 2 - Partiellement Complété)**

- ✅ `/api/demo-leads` POST/GET - FONCTIONNE

---

### 1.2 Ce Qui Est BLOQUÉ ❌

**CRITIQUE - Build Ne Compile Pas**

| Fichier                                  | Problème                          | Impact                            |
| ---------------------------------------- | --------------------------------- | --------------------------------- |
| `/api/demo-leads/[id]/route.ts`          | **MANQUANT**                      | ❌ Impossible GET/PUT/DELETE lead |
| `/api/demo-leads/[id]/activity/route.ts` | **Syntaxe incorrecte** Next.js 15 | ❌ Transaction cassée             |
| `/api/demo-leads/[id]/accept/route.ts`   | **Syntaxe incorrecte** Clerk v6   | ❌ Conversion lead impossible     |

**Conséquence:** `pnpm build` ÉCHOUE - Aucun déploiement possible

---

### 1.3 Ce Qui Manque Complètement ⏳

**Architecture Multi-tenant (CRITIQUE)**

- ❌ Organisation "FleetCore Platform" non créée
- ❌ Rôles platform non définis
- ❌ Clerk Organizations activé mais mal configuré
- ❌ Pas de séparation `/platform` vs `/dashboard`
- ❌ Workflow invitation client non implémenté

**Soft Delete & Audit**

- ❌ Colonnes `status`, `deleted_at` manquantes sur `member`
- ❌ Table `audit_logs` non créée
- ❌ Webhooks Clerk → Supabase non configurés
- ❌ API `/api/webhooks/clerk` manquante

**UI/UX**

- ❌ Page `/platform/leads` (backoffice SaaS)
- ❌ Page `/en/accept-invitation` (pour clients invités)
- ❌ Formulaire register public à modifier

**Jour 3+ (Pas Commencé)**

- ❌ 35 tables VTC Spec V2
- ❌ Système paramétrage
- ❌ Tout le reste...

---

## 2. ARCHITECTURE CORRIGÉE

### 2.1 Structure Organizations Clerk

```
FleetCore Clerk Instance
│
├─ Organization: "FleetCore Platform" 🆕
│  │
│  ├─ Slug: "fleetcore-platform"
│  ├─ Members: Équipe interne FleetCore uniquement
│  │  ├─ [email protected] (platform:super_admin)
│  │  ├─ [email protected] (platform:commercial)
│  │  └─ [email protected] (platform:support)
│  │
│  ├─ Rôles Clerk:
│  │  ├─ platform:super_admin
│  │  │  └─ Permissions:
│  │  │     ├─ manage:leads (CRUD sys_demo_lead)
│  │  │     ├─ create:organizations
│  │  │     ├─ view:global_analytics
│  │  │     └─ impersonate:clients (avec audit)
│  │  │
│  │  ├─ platform:commercial
│  │  │  └─ Permissions:
│  │  │     ├─ manage:leads
│  │  │     └─ view:leads_analytics
│  │  │
│  │  └─ platform:support
│  │     └─ Permissions:
│  │        ├─ read:leads
│  │        ├─ view:client_orgs (liste uniquement)
│  │        └─ impersonate:clients (avec audit)
│  │
│  └─ Accès Routes:
│     ├─ /platform/dashboard
│     ├─ /platform/leads
│     ├─ /platform/organizations
│     └─ /platform/analytics
│
│
├─ Organization: "Dubai Premium Fleet LLC" (CLIENTS)
│  │
│  ├─ Slug: "dubai-premium-fleet"
│  ├─ Members: Admin + Users du client
│  │  ├─ [email protected] (org:admin)
│  │  ├─ [email protected] (org:manager)
│  │  └─ [email protected] (org:viewer)
│  │
│  ├─ Rôles Clerk:
│  │  ├─ org:admin (gérer org, users, véhicules, finances)
│  │  ├─ org:manager (opérations quotidiennes)
│  │  └─ org:viewer (lecture seule)
│  │
│  └─ Accès Routes:
│     ├─ /dashboard
│     ├─ /vehicles
│     ├─ /drivers
│     └─ /revenues
│     (TOUT scopé à LEUR org uniquement)
│
│
└─ Organization: "Paris VTC Services SARL" (CLIENTS)
   └─ [Même structure que Dubai]
```

---

### 2.2 Routing & Middleware

```typescript
// middleware.ts (version corrigée)

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes publiques (pas d'auth)
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/forgot-password(.*)",
  "/reset-password(.*)",
  "/request-demo(.*)",
  "/api/webhooks(.*)", // Webhooks Clerk
]);

// Routes plateforme (backoffice SaaS)
const isPlatformRoute = createRouteMatcher(["/platform(.*)"]);

// Routes clients (dashboard)
const isClientRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/vehicles(.*)",
  "/drivers(.*)",
  "/revenues(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId, orgSlug, orgRole } = await auth();

  // Route publique → Laisser passer
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Pas authentifié → Redirect login
  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ROUTES PLATEFORME
  if (isPlatformRoute(req)) {
    // Vérifier que user est dans org "FleetCore Platform"
    if (orgSlug !== "fleetcore-platform") {
      return NextResponse.redirect(
        new URL("/unauthorized?reason=not_platform_member", req.url)
      );
    }

    // Vérifier rôle platform
    if (!orgRole || !orgRole.startsWith("platform:")) {
      return NextResponse.redirect(
        new URL("/unauthorized?reason=missing_platform_role", req.url)
      );
    }

    return NextResponse.next();
  }

  // ROUTES CLIENTS
  if (isClientRoute(req)) {
    // Vérifier qu'une org est active
    if (!orgId) {
      return NextResponse.redirect(new URL("/select-organization", req.url));
    }

    // Vérifier que ce N'EST PAS l'org plateforme
    if (orgSlug === "fleetcore-platform") {
      return NextResponse.redirect(new URL("/platform/dashboard", req.url));
    }

    // Vérifier rôle org (org:admin, org:manager, org:viewer)
    if (!orgRole || !orgRole.startsWith("org:")) {
      return NextResponse.redirect(
        new URL("/unauthorized?reason=missing_org_role", req.url)
      );
    }

    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

---

### 2.3 Workflow Invitation Client (CORRIGÉ)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. LEAD GENERATION                                              │
├─────────────────────────────────────────────────────────────────┤
│ Client potentiel → /request-demo                                │
│ Formulaire → Insert sys_demo_lead (country, email, company)    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. QUALIFICATION COMMERCIALE                                     │
├─────────────────────────────────────────────────────────────────┤
│ Commercial FleetCore (platform:commercial)                       │
│ Accède à /platform/leads                                        │
│ Appelle lead, qualifie, ajoute activités                        │
│ Lead status: new → contacted → qualified                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. ENVOI FORMULAIRE COMPLET                                      │
├─────────────────────────────────────────────────────────────────┤
│ Commercial clique "Send onboarding form"                         │
│ Lead reçoit email avec lien unique:                              │
│ /onboarding/complete?token=[unique_token]                        │
│                                                                   │
│ Formulaire demande:                                              │
│ - Coordonnées société complètes                                  │
│ - SIRET/Trade License                                            │
│ - RIB/IBAN                                                       │
│ - Documents (Kbis, assurance flotte, etc.)                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. VALIDATION ÉQUIPE FLEETCORE                                   │
├─────────────────────────────────────────────────────────────────┤
│ Super admin vérifie documents                                    │
│ Valide conformité (SIRET, assurance, etc.)                       │
│ Lead status: qualified → validated                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CRÉATION ORGANISATION (SUPER ADMIN)                           │
├─────────────────────────────────────────────────────────────────┤
│ Super admin clique "Convert to Customer"                         │
│                                                                   │
│ API Backend FleetCore:                                           │
│ 1. Créer org dans Clerk:                                         │
│    const org = await clerkClient.organizations.create({         │
│      name: lead.company_name,                                    │
│      slug: generateSlug(lead.company_name),                      │
│      publicMetadata: {                                           │
│        country_code: lead.country_code,                          │
│        onboarded_at: new Date().toISOString()                    │
│      }                                                            │
│    });                                                            │
│                                                                   │
│ 2. Créer org dans Supabase:                                      │
│    INSERT INTO organization (                                    │
│      clerk_org_id,                                               │
│      name,                                                        │
│      country_code,                                               │
│      status                                                       │
│    ) VALUES (                                                     │
│      org.id,                                                      │
│      lead.company_name,                                          │
│      lead.country_code,                                          │
│      'active'                                                     │
│    );                                                             │
│                                                                   │
│ 3. Créer invitation Clerk pour admin client:                     │
│    await clerkClient.organizations.createInvitation({            │
│      organizationId: org.id,                                     │
│      emailAddress: lead.email,                                   │
│      role: 'org:admin',                                          │
│      publicMetadata: {                                           │
│        company_name: lead.company_name, // PRÉ-REMPLI           │
│        invitation_type: 'admin_onboarding'                       │
│      }                                                            │
│    });                                                            │
│                                                                   │
│ 4. Update lead:                                                  │
│    UPDATE sys_demo_lead SET                                      │
│      status = 'converted',                                       │
│      converted_at = NOW(),                                       │
│      converted_to_org_id = [clerk_org_id]                        │
│                                                                   │
│ 5. Lead reçoit EMAIL Clerk avec lien invitation                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. INSCRIPTION ADMIN CLIENT                                      │
├─────────────────────────────────────────────────────────────────┤
│ Admin client clique lien dans email                              │
│ Redirigé vers: /accept-invitation?token=[clerk_token]            │
│                                                                   │
│ Page affiche:                                                    │
│ - Company Name: "Dubai Premium Fleet" (GRISÉ, non modifiable)   │
│ - Email: [email protected] (PRÉ-REMPLI, non modifiable)  │
│ - Password: [input vide]                                         │
│ - Confirm Password: [input vide]                                 │
│                                                                   │
│ Après soumission:                                                │
│ 1. Clerk crée user                                               │
│ 2. Clerk assigne user à org avec role org:admin                  │
│ 3. Webhook Clerk → /api/webhooks/clerk                           │
│ 4. Backend FleetCore crée entry dans table member                │
│ 5. Redirect → /dashboard (org déjà active)                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. GESTION USERS PAR ADMIN CLIENT                                │
├─────────────────────────────────────────────────────────────────┤
│ Admin client peut inviter users:                                │
│ /settings/members → "Invite member"                              │
│                                                                   │
│ Formulaire:                                                      │
│ - Email                                                           │
│ - Role: org:manager / org:viewer                                 │
│                                                                   │
│ Invitation envoyée par Clerk (même flow étape 6)                │
│                                                                   │
│ LIMITATION:                                                       │
│ - Admin client NE PEUT PAS créer d'autres org:admin             │
│ - Pour ajouter admin → Demande au super admin FleetCore         │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.4 Soft Delete + Audit Trail

#### Table member (ajustée)

```sql
-- Migrations à ajouter à table member existante

ALTER TABLE member
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
-- Valeurs: 'active', 'inactive', 'deleted'

ALTER TABLE member
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE member
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES member(id);

ALTER TABLE member
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Index
CREATE INDEX IF NOT EXISTS idx_member_status
ON member(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_member_deleted
ON member(deleted_at)
WHERE deleted_at IS NOT NULL;
```

#### Table audit_logs (NOUVEAU - Phase 1, pas Phase 4)

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organization(id) ON DELETE CASCADE,

  -- Action
  action VARCHAR(100) NOT NULL, -- 'user.created', 'user.deleted', 'org.created', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'member', 'organization', 'vehicle', etc.
  entity_id TEXT NOT NULL, -- ID de l'entité (peut être UUID ou Clerk ID)

  -- Snapshot (données complètes AVANT modification)
  snapshot JSONB,

  -- Changes (APRÈS modification, si update)
  changes JSONB,

  -- Contexte
  performed_by UUID REFERENCES member(id), -- NULL si system/webhook
  performed_by_clerk_id TEXT, -- Clerk user ID si disponible
  ip_address INET,
  user_agent TEXT,

  -- Raison
  reason TEXT,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(performed_by, created_at DESC);
```

#### Webhooks Clerk → Supabase

```typescript
// app/api/webhooks/clerk/route.ts

import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  // Vérifier signature Clerk
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const eventType = evt.type;
  const eventData = evt.data;

  // GESTION ÉVÉNEMENTS
  switch (eventType) {
    // ============================================
    // USER EVENTS
    // ============================================
    case "user.created":
      await handleUserCreated(eventData);
      break;

    case "user.updated":
      await handleUserUpdated(eventData);
      break;

    case "user.deleted":
      await handleUserDeleted(eventData);
      break;

    // ============================================
    // ORGANIZATION EVENTS
    // ============================================
    case "organization.created":
      await handleOrganizationCreated(eventData);
      break;

    case "organization.updated":
      await handleOrganizationUpdated(eventData);
      break;

    case "organization.deleted":
      await handleOrganizationDeleted(eventData);
      break;

    // ============================================
    // ORGANIZATION MEMBERSHIP EVENTS
    // ============================================
    case "organizationMembership.created":
      await handleMembershipCreated(eventData);
      break;

    case "organizationMembership.updated":
      await handleMembershipUpdated(eventData);
      break;

    case "organizationMembership.deleted":
      await handleMembershipDeleted(eventData);
      break;

    default:
      console.log(`Unhandled event type: ${eventType}`);
  }

  return new Response("Webhook processed", { status: 200 });
}

// ============================================
// HANDLERS
// ============================================

async function handleUserCreated(data: any) {
  // User créé dans Clerk → Créer dans Supabase si membre d'une org
  // (Géré par organizationMembership.created)

  // Audit log
  await db.audit_logs.create({
    data: {
      action: "user.created",
      entity_type: "clerk_user",
      entity_id: data.id,
      snapshot: data,
      performed_by: null, // Système
      reason: "User created in Clerk",
    },
  });
}

async function handleUserUpdated(data: any) {
  // Sync données user dans member
  const existingMember = await db.member.findUnique({
    where: { clerk_user_id: data.id },
  });

  if (existingMember) {
    await db.member.update({
      where: { id: existingMember.id },
      data: {
        email: data.email_addresses?.[0]?.email_address,
        first_name: data.first_name,
        last_name: data.last_name,
        updated_at: new Date(),
      },
    });

    // Audit log
    await db.audit_logs.create({
      data: {
        tenant_id: existingMember.tenant_id,
        action: "user.updated",
        entity_type: "member",
        entity_id: existingMember.id,
        snapshot: existingMember,
        changes: {
          email: data.email_addresses?.[0]?.email_address,
          first_name: data.first_name,
          last_name: data.last_name,
        },
        performed_by: null,
        reason: "Synced from Clerk user.updated webhook",
      },
    });
  }
}

async function handleUserDeleted(data: any) {
  // SOFT DELETE
  const existingMember = await db.member.findUnique({
    where: { clerk_user_id: data.id },
  });

  if (existingMember) {
    // Snapshot complet AVANT soft delete
    const snapshot = { ...existingMember };

    // Soft delete
    await db.member.update({
      where: { id: existingMember.id },
      data: {
        status: "deleted",
        deleted_at: new Date(),
        deleted_by: null, // Système
        deletion_reason: "Deleted from Clerk (webhook user.deleted)",
        updated_at: new Date(),
      },
    });

    // Audit log
    await db.audit_logs.create({
      data: {
        tenant_id: existingMember.tenant_id,
        action: "user.deleted",
        entity_type: "member",
        entity_id: existingMember.id,
        snapshot: snapshot, // Données complètes AVANT suppression
        performed_by: null,
        reason: "User deleted from Clerk",
        metadata: {
          clerk_user_id: data.id,
          clerk_deleted_at: data.deleted_at || new Date().toISOString(),
        },
      },
    });
  }
}

async function handleOrganizationCreated(data: any) {
  // Organization créée dans Clerk → Créer dans Supabase
  await db.organization.create({
    data: {
      clerk_org_id: data.id,
      name: data.name,
      slug: data.slug,
      country_code: data.public_metadata?.country_code || "AE",
      status: "active",
    },
  });

  // Audit log
  await db.audit_logs.create({
    data: {
      action: "organization.created",
      entity_type: "organization",
      entity_id: data.id,
      snapshot: data,
      performed_by: null,
      reason: "Organization created in Clerk",
    },
  });
}

async function handleOrganizationUpdated(data: any) {
  // Sync org dans Supabase
  const existingOrg = await db.organization.findUnique({
    where: { clerk_org_id: data.id },
  });

  if (existingOrg) {
    await db.organization.update({
      where: { id: existingOrg.id },
      data: {
        name: data.name,
        slug: data.slug,
        updated_at: new Date(),
      },
    });

    // Audit log
    await db.audit_logs.create({
      data: {
        tenant_id: existingOrg.id,
        action: "organization.updated",
        entity_type: "organization",
        entity_id: existingOrg.id,
        snapshot: existingOrg,
        changes: {
          name: data.name,
          slug: data.slug,
        },
        performed_by: null,
        reason: "Synced from Clerk organization.updated webhook",
      },
    });
  }
}

async function handleOrganizationDeleted(data: any) {
  // SOFT DELETE organization
  const existingOrg = await db.organization.findUnique({
    where: { clerk_org_id: data.id },
  });

  if (existingOrg) {
    // Snapshot
    const snapshot = { ...existingOrg };

    // Soft delete
    await db.organization.update({
      where: { id: existingOrg.id },
      data: {
        status: "deleted",
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Audit log
    await db.audit_logs.create({
      data: {
        tenant_id: existingOrg.id,
        action: "organization.deleted",
        entity_type: "organization",
        entity_id: existingOrg.id,
        snapshot: snapshot,
        performed_by: null,
        reason: "Organization deleted from Clerk",
      },
    });
  }
}

async function handleMembershipCreated(data: any) {
  // User ajouté à une org → Créer entry dans member
  const org = await db.organization.findUnique({
    where: { clerk_org_id: data.organization.id },
  });

  if (!org) {
    console.error(`Organization ${data.organization.id} not found in Supabase`);
    return;
  }

  // Vérifier si member existe déjà
  const existingMember = await db.member.findFirst({
    where: {
      clerk_user_id: data.public_user_data.user_id,
      tenant_id: org.id,
    },
  });

  if (!existingMember) {
    // Créer member
    await db.member.create({
      data: {
        tenant_id: org.id,
        clerk_user_id: data.public_user_data.user_id,
        email: data.public_user_data.identifier,
        first_name: data.public_user_data.first_name,
        last_name: data.public_user_data.last_name,
        role: data.role, // org:admin, org:manager, etc.
        status: "active",
      },
    });

    // Audit log
    await db.audit_logs.create({
      data: {
        tenant_id: org.id,
        action: "membership.created",
        entity_type: "member",
        entity_id: data.public_user_data.user_id,
        snapshot: data,
        performed_by: null,
        reason: "User added to organization in Clerk",
      },
    });
  }
}

async function handleMembershipUpdated(data: any) {
  // Rôle changé dans Clerk → Sync dans member
  const org = await db.organization.findUnique({
    where: { clerk_org_id: data.organization.id },
  });

  if (!org) return;

  const existingMember = await db.member.findFirst({
    where: {
      clerk_user_id: data.public_user_data.user_id,
      tenant_id: org.id,
    },
  });

  if (existingMember) {
    await db.member.update({
      where: { id: existingMember.id },
      data: {
        role: data.role,
        updated_at: new Date(),
      },
    });

    // Audit log
    await db.audit_logs.create({
      data: {
        tenant_id: org.id,
        action: "membership.updated",
        entity_type: "member",
        entity_id: existingMember.id,
        snapshot: existingMember,
        changes: { role: data.role },
        performed_by: null,
        reason: "Role updated in Clerk",
      },
    });
  }
}

async function handleMembershipDeleted(data: any) {
  // User retiré de l'org → SOFT DELETE
  const org = await db.organization.findUnique({
    where: { clerk_org_id: data.organization.id },
  });

  if (!org) return;

  const existingMember = await db.member.findFirst({
    where: {
      clerk_user_id: data.public_user_data.user_id,
      tenant_id: org.id,
    },
  });

  if (existingMember) {
    const snapshot = { ...existingMember };

    // Soft delete
    await db.member.update({
      where: { id: existingMember.id },
      data: {
        status: "deleted",
        deleted_at: new Date(),
        deleted_by: null,
        deletion_reason: "Removed from organization in Clerk",
        updated_at: new Date(),
      },
    });

    // Audit log
    await db.audit_logs.create({
      data: {
        tenant_id: org.id,
        action: "membership.deleted",
        entity_type: "member",
        entity_id: existingMember.id,
        snapshot: snapshot,
        performed_by: null,
        reason: "User removed from organization in Clerk",
      },
    });
  }
}
```

---

### 2.5 Hard Delete Scheduler (Optionnel - Après 90 jours)

```typescript
// scripts/cleanup-soft-deleted.ts
// Exécuter via cron job (ex: chaque nuit)

import { db } from "@/lib/db";

async function cleanupSoftDeleted() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Trouver members soft deleted depuis 90+ jours
  const toDelete = await db.member.findMany({
    where: {
      status: "deleted",
      deleted_at: {
        lte: ninetyDaysAgo,
      },
    },
  });

  console.log(`Found ${toDelete.length} members to hard delete`);

  for (const member of toDelete) {
    // Vérifier qu'un snapshot existe dans audit_logs
    const auditExists = await db.audit_logs.findFirst({
      where: {
        entity_type: "member",
        entity_id: member.id,
        action: "user.deleted",
      },
    });

    if (!auditExists) {
      console.warn(
        `No audit log for member ${member.id}, skipping hard delete`
      );
      continue;
    }

    // HARD DELETE
    await db.member.delete({
      where: { id: member.id },
    });

    // Log final
    await db.audit_logs.create({
      data: {
        tenant_id: member.tenant_id,
        action: "user.hard_deleted",
        entity_type: "member",
        entity_id: member.id,
        reason: "Automated cleanup after 90 days soft delete",
        metadata: {
          original_deleted_at: member.deleted_at,
          hard_deleted_at: new Date(),
        },
      },
    });

    console.log(`Hard deleted member ${member.id}`);
  }
}

cleanupSoftDeleted()
  .then(() => console.log("Cleanup completed"))
  .catch((err) => console.error("Cleanup failed:", err))
  .finally(() => process.exit());
```

---

## 3. PHASE 0: DÉBLOCAGE CRITIQUE

**Durée:** 2h  
**Objectif:** Build compile + APIs fonctionnelles  
**Bloqueur:** Build cassé = RIEN ne peut avancer

### Tâche 1: Corriger APIs Lead Management (1h)

#### A. Créer fichier manquant (15 min)

**Action Claude Code:**

```
ULTRATHINK

Créer /app/api/demo-leads/[id]/route.ts

Implémentation Next.js 15:
- params DOIT être Promise<{ id: string }>
- await params
- await auth()

Code:
- GET: récupérer lead avec activités (include sys_demo_lead_activity)
- PUT: update lead
- DELETE: soft delete lead (status = 'deleted')

Validation:
- Compiler sans erreur
- Types TypeScript corrects
```

**Checkpoint:**

```bash
ls -la app/api/demo-leads/[id]/route.ts
# Fichier doit exister
```

---

#### B. Corriger activity route (30 min)

**Action Claude Code:**

```
ULTRATHINK

Corriger /app/api/demo-leads/[id]/activity/route.ts

Problèmes:
1. params non async
2. auth() pas await
3. Transaction atomique mal faite

Syntaxe correcte:
{ params }: { params: Promise<{ id: string }> }
const { id } = await params;
const { userId } = await auth();

Transaction:
- Créer activity
- Si outcome = "qualified" → MAJ lead.status + qualified_date
- Si outcome = "accepted/refused" → MAJ lead.status

Validation:
- Build compile
```

**Checkpoint:**

```bash
cat app/api/demo-leads/[id]/activity/route.ts | grep "await params"
# Doit afficher la ligne
```

---

#### C. Corriger accept route (30 min)

**Action Claude Code:**

```
ULTRATHINK

Corriger /app/api/demo-leads/[id]/accept/route.ts

Syntaxe Clerk v6:
const clerk = await clerkClient();
const org = await clerk.organizations.create({ ... });

Flow:
1. Récupérer lead (status = "accepted")
2. Créer org Clerk
3. Créer org Supabase
4. Créer invitation Clerk (role: org:admin)
5. Update lead (status = "converted")

Validation:
- Build compile
- Types corrects
```

**Checkpoint:**

```bash
cat app/api/demo-leads/[id]/accept/route.ts | grep "await clerkClient()"
# Doit afficher la ligne
```

---

### Tâche 2: Page Admin Leads Basique (30 min)

**Action Claude Code:**

```
ULTRATHINK

Créer /app/platform/leads/page.tsx

UI basique (sera améliorée Phase 1):
- Liste leads (DataTable)
- Filtres: status, country
- Actions: View, Accept

Validation:
- Page accessible /platform/leads
- Affiche données
```

**Checkpoint:**

```bash
# Naviguer http://localhost:3000/platform/leads
# Doit afficher page
```

---

### ✅ DEFINITION OF DONE - PHASE 0

**Critères obligatoires:**

- [ ] `pnpm build` passe
- [ ] 4 APIs testables:
  - [ ] GET /api/demo-leads
  - [ ] GET /api/demo-leads/[id]
  - [ ] POST /api/demo-leads/[id]/activity
  - [ ] POST /api/demo-leads/[id]/accept
- [ ] Page /platform/leads accessible
- [ ] Git commit

**Validation:**

```bash
pnpm build
# ✅ Doit réussir
```

---

## 4. PHASE 1: FONDATIONS

**Durée:** J3-J5 (3 jours)  
**Objectif:** Architecture multi-tenant + UI + Database + Paramètres + Soft Delete  
**Prérequis:** Phase 0 terminée

---

### 4.1 JOUR 3: Multi-tenant Corrigé + UI

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Matin (4h) - Configuration Multi-tenant

##### 3.1 Clerk Dashboard - Organisation Platform (1h MANUEL)

**Tâche Manuel:**

```
1. Se connecter https://dashboard.clerk.com
2. Sélectionner projet FleetCore
3. Organizations > Create organization
   - Name: "FleetCore Platform"
   - Slug: "fleetcore-platform"
   - Save

4. Roles & Permissions > Create role:

   Rôle: platform:super_admin
   - Permissions:
     ✓ manage:leads
     ✓ create:organizations
     ✓ view:analytics
     ✓ impersonate:clients

   Rôle: platform:commercial
   - Permissions:
     ✓ manage:leads
     ✓ view:analytics

   Rôle: platform:support
   - Permissions:
     ✓ read:leads
     ✓ impersonate:clients

5. Members > Add member
   - Email: [votre email]
   - Organization: FleetCore Platform
   - Role: platform:super_admin
```

**Checkpoint:**

```bash
# Vérifier dans Clerk Dashboard
# Organizations > FleetCore Platform
# ✅ Existe
# ✅ Vous êtes membre avec role platform:super_admin
```

---

##### 3.2 Webhooks Clerk (30 min MANUEL + CODE)

**Tâche Manuel:**

```
1. Clerk Dashboard > Webhooks
2. Add Endpoint
3. Endpoint URL: https://fleetcore5.vercel.app/api/webhooks/clerk
   (ou https://[votre-url]/api/webhooks/clerk)

4. Subscribe to events:
   ✓ user.created
   ✓ user.updated
   ✓ user.deleted
   ✓ organization.created
   ✓ organization.updated
   ✓ organization.deleted
   ✓ organizationMembership.created
   ✓ organizationMembership.updated
   ✓ organizationMembership.deleted

5. Copier Signing Secret
6. Ajouter à .env.local:
   CLERK_WEBHOOK_SECRET="whsec_xxxxx"
```

**Action Claude Code:**

```
ULTRATHINK

Créer /app/api/webhooks/clerk/route.ts

Code complet fourni dans Section 2.4

Validation:
- Endpoint testable
- Vérification signature Svix
```

**Checkpoint:**

```bash
# Tester webhook localement
curl -X POST http://localhost:3000/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'

# Doit retourner 400 (signature manquante) - NORMAL
```

---

##### 3.3 Middleware Routing (1h)

**Action Claude Code:**

```
ULTRATHINK

Créer /middleware.ts

Code complet fourni dans Section 2.2

Fonctionnalités:
- Routes publiques (/, /login, /request-demo)
- Routes platform (/platform/*) → vérifier org = fleetcore-platform
- Routes clients (/dashboard/*) → vérifier org ≠ fleetcore-platform
- Redirections appropriées

Validation:
- Compiler
- Tester redirections
```

**Checkpoint:**

```bash
# Test 1: Non authentifié → /platform/leads
# ✅ Redirect /login

# Test 2: User client → /platform/leads
# ✅ Redirect /unauthorized

# Test 3: Super admin → /dashboard
# ✅ Redirect /platform/dashboard

# Test 4: Super admin → /platform/leads
# ✅ Accès OK
```

---

##### 3.4 Page Accept Invitation (1h30)

**Action Claude Code:**

```
ULTRATHINK

Modifier /app/(auth)/register/page.tsx

Transformer en page accept-invitation:
- Récupérer token invitation depuis URL
- Appeler Clerk pour vérifier invitation
- Afficher company name (PRÉ-REMPLI, GRISÉ)
- Afficher email (PRÉ-REMPLI, GRISÉ)
- Champs: password, confirm password uniquement

Flow:
1. User clique lien email Clerk
2. Clerk redirect vers cette page avec token
3. Page affiche formulaire
4. Submit → Clerk.signUp.create() avec token
5. Redirect /dashboard

Validation:
- Formulaire compile
- Company name non éditable
```

**Route:**

```
/accept-invitation?__clerk_ticket=[token]
```

---

#### Après-midi (4h) - UI Components

##### 3.5 Shadcn/ui (1h)

**Action Claude Code:**

```
ULTRATHINK

Installation Shadcn/ui:

1. npx shadcn@latest init
2. Installer composants:
   - button, card, table, dialog
   - select, badge, dropdown-menu
   - separator, toast, form
   - input, label

Validation:
- components/ui/ créé
- Build compile
```

**Checkpoint:**

```bash
ls -la components/ui/
# ✅ Doit afficher 12+ fichiers
```

---

##### 3.6 Layout Principal (2h)

**Action Claude Code:**

```
ULTRATHINK

Créer layouts:

1. /app/(platform)/layout.tsx
   - Sidebar navigation platform
   - Header avec org switcher
   - Links: /platform/dashboard, /platform/leads, /platform/organizations

2. /app/(dashboard)/layout.tsx
   - Sidebar navigation client
   - Header avec org switcher
   - Links: /dashboard, /vehicles, /drivers, /revenues

Validation:
- Navigation fonctionne
- Org switcher visible
- Responsive
```

---

##### 3.7 Dashboard Platform (1h)

**Action Claude Code:**

```
ULTRATHINK

Créer /app/(platform)/dashboard/page.tsx

Métriques:
- Total leads
- Leads qualified
- Active organizations
- Revenue (placeholder)

Validation:
- Page accessible
- Métriques affichées
```

---

### ✅ DEFINITION OF DONE - JOUR 3

**Critères obligatoires:**

- [ ] Org "FleetCore Platform" créée dans Clerk
- [ ] Rôles platform définis
- [ ] Webhooks configurés
- [ ] Middleware routing fonctionne
- [ ] Page accept-invitation créée
- [ ] Shadcn/ui installé
- [ ] Layouts créés
- [ ] Build compile
- [ ] Git commit

**Validation:**

```bash
pnpm build
# ✅ Succès

# Test routing
# ✅ /platform/leads → OK pour super admin
# ✅ /dashboard → KO pour super admin (redirect /platform/dashboard)
```

---

### 4.2 JOUR 4: Database Schema + Soft Delete

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Matin (4h) - Prisma Schema

##### 4.1 Ajouter Colonnes Soft Delete (1h)

**Action Claude Code:**

```
ULTRATHINK

Modifier /prisma/schema.prisma

Tables à ajuster:
- member
- organization
- sys_demo_lead

Ajouter colonnes:
  status        String    @default("active") @db.VarChar(50)
  deleted_at    DateTime? @db.Timestamptz(6)
  deleted_by    String?   @db.Uuid
  deletion_reason String? @db.Text

Validation:
- npx prisma validate
- npx prisma format
```

---

##### 4.2 Créer Table audit_logs (30 min)

**Action Claude Code:**

```
ULTRATHINK

Ajouter model audit_logs dans schema.prisma

Code fourni dans Section 2.4

Validation:
- npx prisma validate
```

---

##### 4.3 Import 31 Tables VTC (2h)

**Action Claude Code:**

```
ULTRATHINK

Ajouter 31 tables manquantes depuis FLEETCORE_VTC_SPECIFICATION_V2_COMPLETE.md

Tables:
- system_parameters, parameter_audit, sequences
- documents, notifications, custom_fields, custom_field_values
- vehicles, vehicle_assignments, vehicle_maintenance, etc.
- drivers, driver_platforms, driver_documents, etc.
- employers, platform_configurations, revenue_imports, etc.

Process:
1. Copier chaque table depuis spec
2. Adapter syntaxe Prisma
3. Définir relations
4. Ajouter index

Validation:
- npx prisma validate
- Compter models: 35 total
```

**Checkpoint:**

```bash
cat prisma/schema.prisma | grep "^model " | wc -l
# ✅ Doit afficher: 35
```

---

##### 4.4 Validation Schema (30 min)

**Checkpoint:**

```bash
npx prisma validate
# ✅ The schema.prisma file is valid

npx prisma format
# ✅ Formatted

npx prisma generate
# ✅ Generated Prisma Client (35 models)
```

---

#### Après-midi (4h) - Migration + Seed

##### 4.5 Créer Migration (1h)

**Action Claude Code:**

```
ULTRATHINK

Créer migration Supabase:

npx prisma migrate dev --name add_35_tables_soft_delete_audit

Validation:
- Migration créée dans prisma/migrations/
- Appliquée à Supabase
```

**Checkpoint:**

```bash
ls prisma/migrations/
# ✅ Doit afficher dossier migration

npx prisma studio
# ✅ Ouvrir Prisma Studio
# ✅ Vérifier 35 tables visibles
```

---

##### 4.6 Seed Data (3h)

**Action Claude Code:**

```
ULTRATHINK

Créer /prisma/seed.ts

Données à insérer:

1. Organization "FleetCore Platform"
   - clerk_org_id: [copier depuis Clerk]
   - name: "FleetCore Platform"
   - slug: "fleetcore-platform"
   - status: "active"

2. Organization test "Dubai Fleet"
   - Test tenant

3. System parameters (13+ params UAE + France)
   - Copier depuis FLEETCORE_VTC_SPECIFICATION_V2_COMPLETE.md

4. Test data:
   - 5 vehicles
   - 5 drivers
   - 3 sys_demo_lead

Validation:
- npx prisma db seed
- Données insérées
```

**Checkpoint:**

```bash
npx prisma db seed
# ✅ Seed completed

npx prisma studio
# ✅ Vérifier données présentes
```

---

### ✅ DEFINITION OF DONE - JOUR 4

**Critères obligatoires:**

- [ ] 35 tables créées
- [ ] Colonnes soft delete ajoutées
- [ ] Table audit_logs créée
- [ ] Migration appliquée
- [ ] Seed data chargé
- [ ] Prisma Studio accessible
- [ ] Build compile
- [ ] Git commit

**Validation:**

```bash
pnpm build
# ✅ Succès

npx prisma studio
# ✅ 35 tables visibles
# ✅ Données seed présentes
```

---

### 4.3 JOUR 5: Système Paramétrage

**Durée:** 8h  
**Priorité:** 🟡 Important

#### Matin (4h) - ParameterService

**Action Claude Code:**

```
ULTRATHINK

Créer /lib/services/parameter.service.ts

Fonctionnalités:
- getParameter(key, context) → Hiérarchie tenant > country > global
- setParameter(key, value, scope)
- validateValue(value, data_type, validation_rules)
- audit trail des changements

Validation:
- Service compile
- Tests unitaires passent
```

---

#### Après-midi (4h) - API + UI

**Action Claude Code:**

```
ULTRATHINK

Créer:
1. /app/api/v1/parameters/route.ts
   - GET: liste params
   - PUT: update param

2. /app/(platform)/settings/parameters/page.tsx
   - UI admin parameters
   - Édition inline
   - Audit trail visible

Validation:
- API testable
- UI accessible
```

---

### ✅ DEFINITION OF DONE - PHASE 1

**Récapitulatif Phase 1 (J3-J5):**

- [x] Multi-tenant configuré
- [x] Webhooks Clerk actifs
- [x] Soft delete implémenté
- [x] 35 tables créées
- [x] Système paramétrage OK
- [x] Build compile
- [x] Git clean

**Validation globale:**

```bash
pnpm build
# ✅ Succès

# Test multi-tenant
# ✅ Super admin accède /platform
# ✅ Client accède /dashboard
# ✅ Isolation données vérifiée
```

---

## 5. PHASE 2: CORE VTC

**Durée:** J6-J10 (5 jours)  
**Objectif:** Vehicles + Drivers + Assignments + Import Revenus  
**Prérequis:** Phase 1 OK

### Résumé Phase 2

**Jour 6: Repository Pattern**

- BaseRepository class
- Core repositories (Tenant, User, Document, Audit)

**Jour 7: Module Véhicules**

- VehicleRepository + VehicleService
- API CRUD véhicules
- UI liste + formulaire

**Jour 8: Module Drivers**

- DriverRepository + DriverService
- API CRUD drivers
- UI liste + formulaire

**Jour 9: Assignments**

- AssignmentService
- API assign vehicle ↔ driver
- Règles: 1 driver = 1 vehicle actif max

**Jour 10: Import Revenus**

- PlatformImportService
- API import CSV/JSON
- Parser Uber/Careem/Bolt

### Checkpoints Phase 2

**Fin J10:**

- [ ] CRUD complets (vehicles, drivers)
- [ ] Assignments fonctionnels
- [ ] Import revenu testé
- [ ] Build compile

---

## 6. PHASE 3: REVENUS & FINANCES

**Durée:** J11-J15 (5 jours)  
**Objectif:** Calcul balances + Paiements + Réconciliation  
**Prérequis:** Phase 2 OK

### Résumé Phase 3

**Jour 11: Calcul Balances**

- BalanceCalculationService
- Formule: net = revenue - commission - deductions

**Jour 12: Déductions**

- Rental vehicles, fines, fuel advances
- API + UI déductions

**Jour 13: Paiements**

- PaymentService
- Générer driver_payments
- Export batch

**Jour 14: Réconciliation**

- ReconciliationService
- Comparer revenus déclarés vs calculés

**Jour 15: Tests Finance**

- Tests E2E flow complet
- Validation calculs

---

## 7. PHASE 4: MODULES AVANCÉS

**Durée:** J16-J22 (7 jours)  
**Objectif:** Maintenance + Scoring + Analytics  
**Prérequis:** Phase 3 OK

### Résumé Phase 4

**J16-J17: Maintenance Véhicules**

- Preventive maintenance
- Vehicle inspections
- Alerts

**J18-J19: Driver Scoring**

- Performance metrics
- Scoring system
- Leaderboard

**J20-J21: Analytics**

- Dashboard KPIs
- Charts (Recharts)
- Reports PDF

**J22: Notifications**

- Email (Resend)
- Push notifications

---

## 8. PHASE 5: PRODUCTION

**Durée:** J23-J30 (8 jours)  
**Objectif:** Tests + Docs + Déploiement  
**Prérequis:** Phase 4 OK

### Résumé Phase 5

**J23-J25: Tests**

- Tests unitaires (Jest)
- Tests E2E (Playwright)
- Coverage > 70%

**J26: Security Audit**

- Auth flow
- RLS Supabase
- API protection

**J27: Documentation**

- README complet
- API docs
- User manual

**J28: Staging**

- Deploy staging Vercel
- Tests production-like

**J29: Formation**

- Training admin
- Support docs

**J30: Go-Live**

- Deploy production
- Monitoring actif

---

## 9. MATRICE DES DÉPENDANCES

```
PHASE 0 (Déblocage)
└─> PHASE 1 (Fondations)
    ├─> Multi-tenant (J3)
    ├─> Database (J4)
    └─> Paramètres (J5)
        └─> PHASE 2 (Core VTC)
            ├─> Véhicules (J6-J7)
            ├─> Drivers (J8)
            └─> Assignments (J9)
                └─> PHASE 3 (Revenus)
                    ├─> Import (J11)
                    ├─> Calculs (J12-J13)
                    └─> Paiements (J14-J15)
                        └─> PHASE 4 (Avancé)
                            └─> PHASE 5 (Production)
```

**Règles:**

- ❌ Impossible J8 sans J5 (paramètres)
- ❌ Impossible J11 sans J9 (assignments)
- ✅ Possible J10 parallèle J9 (tests)

---

## 10. CRITÈRES DE VALIDATION

### Checkpoints Quotidiens

**Chaque soir:**

- [ ] `pnpm build` passe
- [ ] `pnpm lint` sans erreurs
- [ ] Git commit descriptif
- [ ] Note bloqueurs lendemain

### Checkpoints Hebdomadaires

**Fin semaine 1 (J5):**

- [ ] Phase 1 complète
- [ ] Multi-tenant validé
- [ ] Zéro hardcoding

**Fin semaine 2 (J10):**

- [ ] CRUD complets
- [ ] Import revenus OK

### Critères Go/No-Go

**Avant Phase 2:**

- ✅ Build compile
- ✅ 35 tables créées
- ✅ Paramètres opérationnels

**Avant Phase 3:**

- ✅ Vehicles CRUD OK
- ✅ Drivers CRUD OK
- ✅ Assignments fonctionnels

**Avant Production:**

- ✅ Tests E2E passent
- ✅ Security audit OK
- ✅ Documentation complète

---

## CONCLUSION

**Ce plan V3 corrige TOUS les points identifiés:**

1. ✅ Architecture backoffice Platform séparée
2. ✅ Workflow invitation client complet
3. ✅ Soft delete + audit trail
4. ✅ Webhooks Clerk → Supabase
5. ✅ Routing /platform vs /dashboard
6. ✅ Rôles platform distincts

**Prochaine étape:** Exécution Phase 0 (2h)

**Document vivant:** Sera mis à jour quotidiennement avec progrès réels.

---

**Version:** 3.0  
**Dernière mise à jour:** 04/10/2025  
**Statut:** PRÊT POUR EXÉCUTION  
**Auteur:** Plan corrigé FleetCore V3
