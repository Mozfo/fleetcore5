# Tech Debt - Phase 6

## 🔴 CRITIQUE: Refactoring Audit Logs Système

**Problème actuel:**

- Tenant système fake (`00000000-0000-0000-0000-000000000000`)
- Événements système mélangés avec tenant logs
- Pas aligné best practices industry

**Solution recommandée:**

- Créer table séparée `system_audit_logs`
- Migrer événements système existants
- Cleanup tenant fake

**Effort estimé:** 45 minutes

**Priorité:** Moyenne (fonctionne, mais pas propre)

**Ressources:**

- Research: Best practices multi-tenant audit logging
- Pattern: Séparation system vs tenant logs
- Référence: Frontegg, ABP.IO, AWS multi-tenant guides
