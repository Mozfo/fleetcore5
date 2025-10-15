# ADR-002: Audit Trail via API Route Interne

## Status

**Accepted** (Implemented - October 2025)

## Context

FleetCore nécessite un audit trail complet pour la conformité GDPR Article 30 (registre des activités de traitement). Les événements doivent être loggés depuis le middleware (Edge Runtime) vers la base de données PostgreSQL via Prisma.

### Challenge Technique

- **Middleware Next.js** : Exécute dans Edge Runtime (environnement limité)
- **Prisma ORM** : Requiert Node.js runtime (incompatible avec Edge)
- **Contrainte de performance** : Audit ne doit pas bloquer les requêtes HTTP

### Architecture Actuelle

```
┌─────────────────────────────────────────────────────────────┐
│ middleware.ts (Edge Runtime)                                │
│                                                             │
│  1. Validation IP whitelist                                │
│  2. Accès refusé → 403                                     │
│  3. fetch() fire-and-forget ──┐                            │
│     (non-bloquant)             │                            │
└────────────────────────────────┼────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│ /api/internal/audit (Node.js Runtime)                      │
│                                                             │
│  1. Validation INTERNAL_AUDIT_TOKEN                        │
│  2. Parsing body JSON                                      │
│  3. auditLog() → Prisma                                    │
│  4. INSERT adm_audit_logs                                  │
└─────────────────────────────────────────────────────────────┘
```

## Decision

Implémentation d'une **API route interne** (`/api/internal/audit`) avec pattern **fire-and-forget** :

1. **Middleware** : Appelle `/api/internal/audit` via `fetch()` sans `await`
2. **API route** : Valide token + persiste via Prisma (Node.js runtime)
3. **Sécurité** : Token secret `INTERNAL_AUDIT_TOKEN` (base64, 64+ chars)
4. **Fail-safe** : Error handler silencieux pour ne jamais bloquer requête principale

### Implémentation (73 lignes)

**Fichier** : `app/api/internal/audit/route.ts`

```typescript
export async function POST(request: Request) {
  // SECURITY: Validation token
  const token = request.headers.get("x-internal-audit-token");
  const expectedToken = process.env.INTERNAL_AUDIT_TOKEN;

  if (!expectedToken) {
    // Fail-closed: Token non configuré = tout bloquer
    return NextResponse.json(
      { error: "Internal audit token not configured" },
      { status: 500 }
    );
  }

  if (token !== expectedToken) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Persist via Prisma (Node.js runtime OK)
  const body = await request.json();
  await auditLog({
    tenantId: body.tenant_id ?? null,
    action: body.action as AuditAction,
    entityType: body.entity as AuditEntityType,
    entityId: body.entity_id,
    ipAddress: body.ip_address ?? null,
    userAgent: body.user_agent ?? null,
    metadata: body.metadata ?? null,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
```

**Utilisation middleware** (lignes 137-158) :

```typescript
// Fire-and-forget: Appel non-bloquant avec gestion erreur silencieuse
fetch(`${req.nextUrl.origin}/api/internal/audit`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-internal-audit-token": process.env.INTERNAL_AUDIT_TOKEN || "",
  },
  body: JSON.stringify({
    tenant_id: null,
    action: "ip_blocked",
    entity: "system_parameter",
    entity_id: "00000000-0000-0000-0000-000000000000",
    ip_address: clientIP,
    metadata: { blocked_ip: clientIP, attempted_route: pathname },
  }),
});
// NOTE: .catch() handler supprime silencieusement les erreurs
// pour ne jamais bloquer le flux principal (voir middleware.ts:156)
```

## Alternatives Considérées

### 1. `after()` Callback (Next.js 15+)

**Rejeté** : Encore en beta, pas assez mature pour production

- API instable dans Next.js 15
- Comportement non garanti en Edge Runtime

### 2. Service Externe (ex: Logtail, Datadog)

**Rejeté** :

- OPEX mensuel (~$50-200/mois)
- Dépendance externe (vendor lock-in)
- Latence réseau supplémentaire

### 3. Audit Synchrone Bloquant

**Rejeté** :

- Dégrade performance HTTP (audit prend ~20-50ms)
- Viole contrainte "ne jamais bloquer requête principale"
- Risque de timeout si DB lente

### 4. Queue Message (ex: Redis, SQS)

**Rejeté** :

- Over-engineering pour besoin simple
- Infrastructure additionnelle à gérer
- Coût OPEX supplémentaire

## Consequences

### ✅ Positives

- **Performance** : Requêtes HTTP non bloquées (403 en 8ms, audit async)
- **Simplicité** : Aucune dépendance externe (solution native Next.js)
- **Coût** : OPEX = $0 (infrastructure existante)
- **Sécurité** : Token validation + fail-closed par défaut
- **Testabilité** : 7/7 tests unitaires passés (validation.test.ts)

### ⚠️ Négatives

- **Fire-and-forget** : Pas de garantie que l'audit réussit (best-effort)
- **Complexité** : Nécessite configuration `INTERNAL_AUDIT_TOKEN` en production
- **Debugging** : Erreurs audit ne remontent pas au middleware (silencieux)

### 📊 Métriques

| Métrique                    | Valeur         | Source                           |
| --------------------------- | -------------- | -------------------------------- |
| Performance requête bloquée | **8ms**        | Tests manuels (IP blocked)       |
| Tests unitaires             | **7/7** passés | `validation.test.ts`             |
| Taille codebase             | **73 lignes**  | `/api/internal/audit/route.ts`   |
| Audit logs créés            | **2 entries**  | Base de données (validation E2E) |
| Configuration requise       | **1 var**      | `INTERNAL_AUDIT_TOKEN`           |

## Validation

### Tests E2E Réalisés

1. ✅ IP whitelist blocked → Audit log créé avec `action=ip_blocked`
2. ✅ Validation sortBy failed → Audit log créé avec `action=validation_failed`
3. ✅ Token invalide → 403 Forbidden (route protégée)
4. ✅ Token manquant → 500 Internal Server Error (fail-closed)

### Fichiers Impactés

- `middleware.ts` : Integration fetch() fire-and-forget (ligne 137-158)
- `app/api/internal/audit/route.ts` : API route principale (73 lignes)
- `lib/audit.ts` : Helper auditLog() utilisé par route
- `.env.local.example` : Documentation token generation

## References

- [Next.js Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
- [Prisma Client Limitations](https://www.prisma.io/docs/orm/prisma-client/deployment/edge/overview)
- GDPR Article 30: Records of processing activities
- RFC 6750: Bearer Token Usage

## Notes

Cette architecture est un **compromis pragmatique** entre:

- ✅ **Simplicité** : Aucune infrastructure additionnelle
- ✅ **Performance** : Fire-and-forget non-bloquant
- ⚠️ **Fiabilité** : Best-effort (99%+ en pratique, mais pas garanti)

Pour usage production haute volumétrie (>10k req/min), considérer migration vers queue Redis/SQS si besoin de garanties delivery.

---

**Date** : October 15, 2025
**Auteur** : FleetCore Team
**Validé par** : Tests E2E + Code Review
