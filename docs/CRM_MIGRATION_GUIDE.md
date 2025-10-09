# Guide de Migration CRM - Tables Internes FleetCore

**Date**: 9 octobre 2025
**Objectif**: Transformer les tables CRM multi-tenant en tables internes FleetCore

---

## Contexte

Les tables `crm_leads`, `crm_opportunities` et `crm_contracts` étaient incorrectement définies comme tables multi-tenant avec `tenant_id`. Ces tables sont destinées à l'équipe commerciale FleetCore pour gérer les prospects AVANT qu'ils ne deviennent clients. Un prospect n'a pas de `tenant_id` tant qu'il n'a pas signé et que son organisation n'a pas été créée dans `adm_tenants`.

---

## Étapes de Migration

### 1. Appliquer la migration SQL

```bash
# Appliquer le script SQL de migration
PGPASSWORD="jeXP1Ht3PzRlw8TH" psql -h db.joueofbaqjkrpjcailkx.supabase.co -p 5432 -U postgres -d postgres -f prisma/migrations/manual_fix_crm_internal_tables.sql
```

**Ce script effectue**:

- Suppression des colonnes `tenant_id` des 3 tables CRM
- Ajout des colonnes métier (qualification*score, utm*\*, etc.)
- Création des ENUMs pour status/stage
- Mise en place des index uniques (email, contract_reference) avec soft-delete
- Configuration RLS pour accès provider_staff uniquement
- Triggers `updated_at`

### 2. Régénérer le Prisma Client

```bash
pnpm prisma:generate
```

### 3. Recharger les seeds

```bash
pnpm prisma:seed
```

---

## Structure Finale des Tables

### crm_leads (Table Interne FleetCore)

**Colonnes**:

- `id` (UUID, PK)
- `full_name` (String)
- `email` (String, UNIQUE active)
- `phone` (String?)
- `demo_company_name` (String?)
- `country_code` (String?, 2 chars)
- `fleet_size` (String?)
- `current_software` (String?)
- `message` (Text?)
- `status` (ENUM: new, contacted, qualified, disqualified, converted)
- `assigned_to` (UUID? → adm_provider_employees)
- `qualification_score` (Int?, 0-100)
- `qualification_notes` (Text?)
- `qualified_date` (DateTime?)
- `converted_date` (DateTime?)
- `utm_source`, `utm_medium`, `utm_campaign` (String?)
- `metadata` (JSONB, default {})
- Audit trail complet

**RLS**: Accès uniquement pour `adm_provider_employees` avec status='active'

### crm_opportunities (Pipeline de Ventes)

**Colonnes**:

- `id` (UUID, PK)
- `lead_id` (UUID, FK → crm_leads)
- `stage` (ENUM: prospect, proposal, negotiation, closed_won, closed_lost)
- `expected_value` (Decimal?)
- `close_date` (Date?)
- `assigned_to` (UUID? → adm_provider_employees)
- `probability` (Int?, 0-100)
- `metadata` (JSONB)
- Audit trail complet

**RLS**: Accès uniquement pour `adm_provider_employees`

### crm_contracts (Contrats Signés)

**Colonnes**:

- `id` (UUID, PK)
- `lead_id` (UUID? → crm_leads)
- `opportunity_id` (UUID? → crm_opportunities)
- `contract_reference` (String, UNIQUE active)
- `contract_date`, `effective_date`, `expiry_date` (Date)
- `total_value` (Decimal)
- `currency` (CHAR(3), default EUR)
- `status` (ENUM: draft, pending_signature, active, suspended, expired, terminated)
- `metadata` (JSONB)
- Audit trail complet

**RLS**: Accès uniquement pour `adm_provider_employees`

---

## Workflow Lead → Tenant

### 1. Lead Creation (Status: new)

```typescript
// POST /api/crm/leads
const lead = await prisma.crm_leads.create({
  data: {
    full_name,
    email,
    phone,
    demo_company_name,
    country_code,
    fleet_size,
    message,
    status: "new",
    utm_source,
    utm_medium,
    utm_campaign,
    metadata: {},
  },
});

// Log audit
await auditLog({
  action: "create",
  entityType: "crm_lead",
  entityId: lead.id,
  userId: currentUserId,
});
```

### 2. Lead Qualification (Status: new → qualified)

```typescript
// PATCH /api/crm/leads/:id/qualify
const lead = await prisma.crm_leads.update({
  where: { id: leadId },
  data: {
    status: "qualified",
    qualification_score: 85,
    qualification_notes: "Strong fit, budget confirmed",
    qualified_date: new Date(),
    assigned_to: salesRepId,
  },
});
```

### 3. Opportunity Creation

```typescript
// POST /api/crm/opportunities
const opportunity = await prisma.crm_opportunities.create({
  data: {
    lead_id: leadId,
    stage: "proposal",
    expected_value: 50000,
    close_date: futureDate,
    probability: 60,
    assigned_to: salesRepId,
  },
});
```

### 4. Contract & Conversion (Status: qualified → converted)

```typescript
// POST /api/crm/leads/:id/convert
await prisma.$transaction(async (tx) => {
  // 1. Créer le contrat
  const contract = await tx.crm_contracts.create({
    data: {
      lead_id: leadId,
      opportunity_id: opportunityId,
      contract_reference: "CNT-2025-001",
      contract_date: new Date(),
      effective_date: new Date(),
      total_value: 50000,
      currency: "EUR",
      status: "pending_signature",
    },
  });

  // 2. Marquer le lead comme converti
  await tx.crm_leads.update({
    where: { id: leadId },
    data: {
      status: "converted",
      converted_date: new Date(),
    },
  });

  // 3. Créer l'organisation dans adm_tenants
  const tenant = await tx.adm_tenants.create({
    data: {
      name: lead.demo_company_name,
      country_code: lead.country_code,
      default_currency: contract.currency,
      // clerk_organization_id sera rempli après création Clerk
    },
  });

  // 4. Déclencher création organisation Clerk
  await createClerkOrganization({
    name: tenant.name,
    tenantId: tenant.id,
    contactEmail: lead.email,
  });

  return { contract, tenant };
});
```

---

## API Endpoints à Créer/Mettre à Jour

### Leads

- `POST /api/crm/leads` - Créer un lead (formulaire public)
- `GET /api/crm/leads` - Liste des leads (provider_staff only)
- `GET /api/crm/leads/:id` - Détails d'un lead
- `PATCH /api/crm/leads/:id` - Mettre à jour un lead
- `PATCH /api/crm/leads/:id/qualify` - Qualifier un lead
- `PATCH /api/crm/leads/:id/disqualify` - Disqualifier un lead
- `POST /api/crm/leads/:id/convert` - Convertir lead → tenant
- `DELETE /api/crm/leads/:id` - Soft-delete un lead

### Opportunities

- `POST /api/crm/opportunities` - Créer une opportunity
- `GET /api/crm/opportunities` - Liste des opportunities
- `PATCH /api/crm/opportunities/:id` - Mettre à jour stage/value
- `DELETE /api/crm/opportunities/:id` - Soft-delete

### Contracts

- `POST /api/crm/contracts` - Créer un contrat
- `GET /api/crm/contracts` - Liste des contrats
- `PATCH /api/crm/contracts/:id` - Mettre à jour status
- `PATCH /api/crm/contracts/:id/activate` - Activer contrat

---

## Services à Créer

### lib/services/crm/leads.service.ts

```typescript
export class LeadsService {
  async createLead(data: CreateLeadDto): Promise<crm_leads> {
    // Vérifier unicité email
    const existing = await prisma.crm_leads.findFirst({
      where: { email: data.email, deleted_at: null },
    });

    if (existing) {
      throw new Error("Lead with this email already exists");
    }

    const lead = await prisma.crm_leads.create({ data });

    await auditLog({
      action: "create",
      entityType: "crm_lead",
      entityId: lead.id,
    });

    return lead;
  }

  async qualifyLead(id: string, data: QualifyLeadDto) {
    const lead = await prisma.crm_leads.update({
      where: { id },
      data: {
        status: "qualified",
        qualification_score: data.score,
        qualification_notes: data.notes,
        qualified_date: new Date(),
        assigned_to: data.assignedTo,
      },
    });

    await auditLog({
      action: "qualify",
      entityType: "crm_lead",
      entityId: id,
      changes: data,
    });

    return lead;
  }

  async convertLead(id: string): Promise<ConversionResult> {
    // Transaction complexe lead → tenant
    // Voir exemple ci-dessus
  }
}
```

### lib/services/crm/opportunities.service.ts

```typescript
export class OpportunitiesService {
  async createOpportunity(data: CreateOpportunityDto) {
    const opportunity = await prisma.crm_opportunities.create({ data });

    await auditLog({
      action: "create",
      entityType: "crm_opportunity",
      entityId: opportunity.id,
    });

    return opportunity;
  }

  async updateStage(id: string, stage: OpportunityStage) {
    const opportunity = await prisma.crm_opportunities.update({
      where: { id },
      data: { stage },
    });

    await auditLog({
      action: "update_stage",
      entityType: "crm_opportunity",
      entityId: id,
      changes: { stage },
    });

    return opportunity;
  }
}
```

---

## Checklist de Migration

- [ ] Appliquer migration SQL
- [ ] Régénérer Prisma Client
- [ ] Tester seeds (devrait fonctionner sans erreur)
- [ ] Créer services CRM (leads, opportunities, contracts)
- [ ] Créer/Mettre à jour API routes CRM
- [ ] Ajouter validation Zod pour tous les endpoints
- [ ] Tester workflow complet: lead → qualified → opportunity → contract → tenant
- [ ] Activer RLS production (supprimer temp_allow_all policies)
- [ ] Mettre à jour frontend pour utiliser nouvelle structure
- [ ] Documenter API (OpenAPI spec)

---

## Points d'Attention

1. **RLS Development Policies**: Les politiques `temp_allow_all_*_dev` doivent être supprimées en production
2. **Clerk Organization Sync**: La conversion lead → tenant doit déclencher création Clerk org
3. **Audit Logging**: Chaque opération CRM doit être auditée
4. **Email Uniqueness**: Index unique sur email avec soft-delete awareness
5. **Provider Staff Access**: Seuls les employés FleetCore (`adm_provider_employees`) ont accès aux tables CRM
6. **Tenant Isolation**: Les clients finaux (tenant members) NE DOIVENT PAS voir les tables CRM

---

## Questions Fréquentes

**Q: Que faire des leads existants avec tenant_id ?**
R: La migration SQL supprime automatiquement la colonne. Les données historiques sont préservées.

**Q: Comment gérer les leads convertis ?**
R: Le champ `converted_date` est rempli, et la relation vers `adm_tenants` se fait via le contrat + l'email du contact.

**Q: Peut-on réassigner un lead ?**
R: Oui, via `assigned_to` qui pointe vers `adm_provider_employees`.

**Q: Les tenants peuvent-ils créer des leads ?**
R: Non, seul le formulaire public et les provider_staff peuvent créer des leads.

---

**Date de création**: 9 octobre 2025
**Version**: 1.0
**Auteur**: Architecture Team FleetCore
