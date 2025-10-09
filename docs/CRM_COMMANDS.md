# Commandes CRM Migration - Guide Rapide

## 1. Appliquer la Migration SQL

```bash
PGPASSWORD="jeXP1Ht3PzRlw8TH" psql \
  -h db.joueofbaqjkrpjcailkx.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f prisma/migrations/manual_fix_crm_internal_tables.sql
```

## 2. Régénérer Prisma Client

```bash
pnpm prisma:generate
```

## 3. Recharger les Seeds

```bash
pnpm prisma:seed
```

## 4. Vérifier les Tables

```bash
PGPASSWORD="jeXP1Ht3PzRlw8TH" psql \
  -h db.joueofbaqjkrpjcailkx.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'crm_leads' ORDER BY ordinal_position;"
```

## 5. Vérifier les Politiques RLS

```bash
PGPASSWORD="jeXP1Ht3PzRlw8TH" psql \
  -h db.joueofbaqjkrpjcailkx.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c "SELECT policyname, permissive FROM pg_policies WHERE schemaname = 'public' AND tablename = 'crm_leads';"
```

## Fichiers Créés

1. `prisma/migrations/manual_fix_crm_internal_tables.sql` - Migration SQL complète
2. `docs/CRM_MIGRATION_GUIDE.md` - Guide détaillé avec workflow
3. `docs/CRM_COMMANDS.md` - Ce fichier (commandes rapides)
4. `prisma/schema.prisma` - Mis à jour (crm_leads, crm_opportunities, crm_contracts)
5. `prisma/seed.ts` - Mis à jour (seeds sans tenant_id)

## Modifications Prisma Schema

- ✅ `crm_leads`: Supprimé tenant*id, ajouté full_name, fleet_size, qualification*_, utm\__
- ✅ `crm_opportunities`: Supprimé tenant_id, ajouté stage, probability
- ✅ `crm_contracts`: Supprimé tenant_id, ajouté lead_id, opportunity_id
- ✅ Relations vers `adm_provider_employees` pour audit trail
- ✅ Index uniques avec soft-delete awareness

## Services à Créer (TODO)

```
lib/services/crm/
├── leads.service.ts       - CRUD + qualify + convert
├── opportunities.service.ts - Pipeline management
└── contracts.service.ts    - Contract lifecycle
```

## API Routes à Créer (TODO)

```
app/api/crm/
├── leads/
│   ├── route.ts          - POST (create), GET (list)
│   ├── [id]/
│   │   ├── route.ts      - GET, PATCH, DELETE
│   │   ├── qualify/route.ts
│   │   ├── disqualify/route.ts
│   │   └── convert/route.ts
├── opportunities/
│   └── ...
└── contracts/
    └── ...
```

## Prochaines Étapes

1. ✅ Migration SQL appliquée
2. ✅ Prisma schema mis à jour
3. ✅ Seeds corrigés
4. ⏳ Créer services CRM (leads, opportunities, contracts)
5. ⏳ Créer API routes CRM
6. ⏳ Ajouter validation Zod
7. ⏳ Tester workflow complet
8. ⏳ Supprimer politiques RLS dev en production
