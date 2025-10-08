# FLEETCORE - STATUT ACTUEL DU PROJET

Date: 8 Octobre 2025
Branche: feat/v2-migration
Database: Supabase Zurich (eu-central-2)

## OBJECTIF GLOBAL

Migration Mumbai vers Zurich avec refonte V2 du modèle de données.
Plan de référence: docs/Version 2/fleetcore_restart_plan_en.md
Modèle final: 55 tables, 14 domaines

## STEP 0 - ÉTAT ACTUEL

### CE QUI EST TERMINÉ

1. Migration Zurich
   - Projet: joueofbaqjkrpjcailkx (eu-central-2)
   - Extensions: uuid-ossp, pgcrypto

2. Tables créées (3)
   - adm_tenants (remplace organization)
   - adm_members (remplace member)
   - crm_leads (remplace sys_demo_lead)
   - Migration: 20251007192021_v2_phase1_core_tables

3. Vues supprimées
   - organization, member, sys_demo_lead SUPPRIMÉES
   - Option B: migration directe sans vues

4. Code refactoré (10 fichiers)
   - app/api/webhooks/clerk/route.ts
   - app/adm/\*.tsx (4 fichiers)
   - app/api/demo-leads/\*.ts (4 fichiers)
   - lib/organization.ts
   - prisma/seed.ts

5. Pages fonctionnelles
   - /adm - Dashboard
   - /adm/leads - Liste leads
   - /adm/organizations - Liste tenants
   - /request-demo - Formulaire public

### BLOQUANTS STEP 0

#### 1. Webhook Clerk - VALIDÉ ✅

Status: **Production fonctionnelle - Zurich opérationnel**

- app/api/webhooks/clerk/route.ts:44 → clerk_organization_id ✅
- app/api/webhooks/clerk/route.ts:80,87,121,127 → clerk_organization_id ✅
- Merge commit: 776e66d
- Branch: main
- Deployment: Vercel Production (https://fleetcore5.vercel.app)

Tests effectués:

1. ✅ Créer org dans Clerk Dashboard → OK
2. ✅ Vérifier insertion dans Supabase **Zurich** adm_tenants → OK
3. ✅ Créer user dans org → Insertion dans Zurich adm_members → OK

**Migration Mumbai → Zurich COMPLÈTE**

#### 2. RLS Policies DÉSACTIVÉES

Problème: Risque sécurité - tenants peuvent lire données d'autres tenants

État:

- Aucune policy sur adm_tenants
- Aucune policy sur adm_members
- Aucune policy sur crm_leads
- Pas de middleware Prisma

Actions:

1. Créer script SQL avec policies RLS
2. Exécuter dans Supabase SQL Editor
3. Créer middleware Prisma (app.current_tenant_id)
4. Tester isolation tenant

#### 3. Processus fantômes

Problème: 12+ processus pnpm dev en background

Actions:

1. pkill -9 -f "pnpm dev"
2. lsof -ti:3000 | xargs kill -9
3. Redémarrer proprement

#### 4. Vercel env variables ✅ FAIT

Variables mises à jour sur Vercel (confirmé par user):

- DATABASE_URL → Zurich ✅
- DIRECT_URL → Zurich ✅
- NEXT_PUBLIC_SUPABASE_URL → Zurich ✅
- SUPABASE_SERVICE_ROLE_KEY → Zurich ✅

## STEP 1 (à venir après Step 0)

Tables à créer (11):

Administration (5):

- adm_roles
- adm_member_roles
- adm_audit_logs (compléter?)
- adm_provider_employees
- adm_tenant_lifecycle_events
- adm_invitations (CRITIQUE)

Reference (5):

- dir_car_makes
- dir_car_models
- dir_platforms
- dir_country_regulations
- dir_vehicle_classes

Documents (1):

- doc_documents

## CRITÈRES VALIDATION STEP 0

- [ ] Webhook Clerk fonctionne
- [ ] RLS activé et testé
- [ ] Formulaire démo fonctionne
- [ ] Backoffice fonctionne
- [ ] 1 seul processus pnpm dev
- [ ] Vercel DATABASE_URL = Zurich
- [ ] Clerk webhook configuré
- [ ] Commit Git propre

## RÉFÉRENCES

- Plan: docs/Version 2/fleetcore_restart_plan_en.md
- Spec: docs/Version 2/fleetcore_restart_functional_specification.md
- Schema: prisma/schema.prisma
- Supabase: https://supabase.com/dashboard/project/joueofbaqjkrpjcailkx
- Clerk: https://dashboard.clerk.com
- Vercel: https://vercel.com/dashboard

## DÉCISIONS PRISES

1. Option B: pas de vues de compatibilité
2. Vues Prisma abandonnées (instables)
3. RLS: stratégie app.current_tenant_id
4. Naming: préfixes domaine + snake_case

## LEÇONS APPRISES

1. @map() Prisma: nom schema = nom TypeScript
2. Turbopack cache: tuer processus + prisma generate
3. Webhooks Clerk: pas localhost (Vercel/ngrok)

Dernière mise à jour: 8 Octobre 2025
