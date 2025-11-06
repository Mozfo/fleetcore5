-- ============================================
-- FLEETCORE V2 MIGRATION - PHASE 1: STRUCTURES
-- Module: SHARED (Enums globaux)
-- Session: 0/13
-- Date: 3 Novembre 2025
-- ============================================
-- Enums créés: 5
-- Tables modifiées: 0
-- Nouvelles tables: 0
-- Total tables module: 0
-- ============================================


-- ============================================
-- SECTION 1: ENUMS GLOBAUX
-- ============================================
-- Ces 5 enums sont utilisés par TOUS les modules
-- Ils DOIVENT être créés AVANT toute table
-- ============================================

-- Enum 1: lifecycle_status
-- Description: Statut du cycle de vie générique pour les entités (actif, inactif, déprécié)
-- Utilisation: Utilisé par DIR (car_makes, platforms, vehicle_classes) et ADM (tenant_vehicle_classes)
-- Valeurs:
--   - active: Entité active et utilisable
--   - inactive: Entité temporairement désactivée
--   - deprecated: Entité dépréciée, maintenue pour compatibilité historique
DO $$ BEGIN
  CREATE TYPE lifecycle_status AS ENUM ('active', 'inactive', 'deprecated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 2: tenant_status
-- Description: Statut du tenant (organisation cliente)
-- Utilisation: Utilisé par ADM (tenants), BIL (facturation), tous les modules lisent le statut tenant
-- Valeurs:
--   - trialing: Période d'essai gratuite
--   - active: Tenant actif et payant
--   - suspended: Suspendu (impayés ou violation des conditions)
--   - past_due: En retard de paiement mais accès maintenu temporairement
--   - cancelled: Tenant annulé/terminé définitivement
DO $$ BEGIN
  CREATE TYPE tenant_status AS ENUM ('trialing', 'active', 'suspended', 'past_due', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 3: audit_severity
-- Description: Niveau de sévérité des logs d'audit
-- Utilisation: Utilisé par ADM (audit_logs) et tous les modules générant des logs d'audit
-- Valeurs:
--   - info: Information, événement normal
--   - warning: Avertissement, situation à surveiller
--   - error: Erreur, problème nécessitant attention
--   - critical: Critique, incident majeur nécessitant action immédiate
DO $$ BEGIN
  CREATE TYPE audit_severity AS ENUM ('info', 'warning', 'error', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 4: audit_category
-- Description: Catégorie fonctionnelle des logs d'audit
-- Utilisation: Utilisé par ADM (audit_logs) pour classifier les événements auditables
-- Valeurs:
--   - security: Événements de sécurité (authentification, autorisation, accès)
--   - financial: Événements financiers (paiements, factures, transactions)
--   - compliance: Événements de conformité/légal (contrats, régulations)
--   - operational: Événements opérationnels (CRUD, workflows métier)
DO $$ BEGIN
  CREATE TYPE audit_category AS ENUM ('security', 'financial', 'compliance', 'operational');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 5: performed_by_type
-- Description: Type d'acteur ayant effectué une action
-- Utilisation: Utilisé par ADM (tenant_lifecycle_events), FIN (transactions), tous modules pour traçabilité
-- Valeurs:
--   - system: Action système automatique (job, trigger, automation)
--   - employee: Action effectuée par un employé FleetCore (provider_employee)
--   - api: Action effectuée via API externe (integration, webhook)
DO $$ BEGIN
  CREATE TYPE performed_by_type AS ENUM ('system', 'employee', 'api');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ============================================
-- SECTION 2: GATEWAY 2 - VALIDATION POST-GÉNÉRATION
-- ============================================

-- STATISTIQUES GÉNÉRÉES:
-- Enums créés: 5
-- Tables modifiées: 0
-- Nouvelles tables: 0
-- FK internes créées: 0
-- FK externes créées: 0
-- FK futures documentées: 0
-- Indexes documentés: 0
-- Total lignes SQL exécutables: 25

-- VÉRIFICATIONS AUTOMATIQUES:
-- [✓] Aucun DROP TABLE/COLUMN/TYPE dans le code exécutable
-- [✓] Aucun ALTER COLUMN TYPE dans le code exécutable
-- [✓] Aucun RENAME dans le code exécutable
-- [✓] Tous les IF NOT EXISTS présents (N/A pour enums - géré par EXCEPTION)
-- [✓] Tous les noms en snake_case:
--     - lifecycle_status ✓
--     - tenant_status ✓
--     - audit_severity ✓
--     - audit_category ✓
--     - performed_by_type ✓
-- [✓] Syntaxe DO $$ BEGIN ... EXCEPTION END $$; utilisée pour tous les enums
-- [✓] 5 enums créés exactement (lifecycle_status, tenant_status, audit_severity, audit_category, performed_by_type)
-- [✓] Valeurs enum correspondent à shared.prisma:
--     - LifecycleStatus: active, inactive, deprecated
--     - TenantStatus: trialing, active, suspended, past_due, cancelled
--     - AuditSeverity: info, warning, error, critical
--     - AuditCategory: security, financial, compliance, operational
--     - PerformedByType: system, employee, api
-- [✓] Commentaires descriptifs présents pour chaque enum
-- [✓] Utilisation documentée pour chaque enum

-- VÉRIFICATIONS SPÉCIFIQUES SESSION 0:
-- [✓] Aucune table créée (session enums uniquement)
-- [✓] Aucune FK créée (aucune table à référencer)
-- [✓] Aucun index créé (aucune table sur laquelle indexer)
-- [✓] Fichier 100% idempotent (applicable plusieurs fois sans erreur)
-- [✓] Aucune dépendance (première session, base de données V1 inchangée)

-- POINTS D'ATTENTION:
-- AUCUN - Cette session est simple et sans risque:
--   - Uniquement des enums PostgreSQL
--   - Aucune modification de données
--   - Aucune modification de tables existantes
--   - Syntaxe idempotente (EXCEPTION WHEN duplicate_object)
--   - Peut être appliqué sans impact sur la base V1

-- NOTES D'IMPLÉMENTATION:
-- Ces enums sont fondamentaux pour tout le système V2.
-- Ils DOIVENT être créés AVANT toute autre migration (sessions 1-12).
-- Modules dépendants:
--   - lifecycle_status: DIR (02), ADM (03)
--   - tenant_status: ADM (03), BIL (06), tous les modules (lecture)
--   - audit_severity: ADM (03), tous modules (logs audit)
--   - audit_category: ADM (03), tous modules (logs audit)
--   - performed_by_type: ADM (03), FIN (12), tous modules (traçabilité actions)

-- ============================================
-- FIN DU FICHIER
-- Session 0/13 complétée
-- Prochaine session: 1/13 - Module DIR (Référentiels)
-- ============================================
