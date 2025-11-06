# SESSION 16 - GUIDE TEST ENVIRONNEMENT DEV

Guide pour tester la migration V1→V2 sur environnement dev/local avant production.

**Durée estimée totale**: 3-4 heures

---

## PRÉ-REQUIS

- PostgreSQL 17+ installé localement
- Backup production Supabase récent
- Node.js + pnpm installés
- Scripts Session 16 (phase 0-5, validations, rollback, MASTER.sh)

---

## ÉTAPE 1: CLONER PRODUCTION → DEV

### Créer DB test locale

```bash
createdb fleetcore_test
psql -d fleetcore_test -c "SELECT version();"
```

### Restaurer backup production

```bash
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -d fleetcore_test \
  ~/path/to/supabase_prod_backup.dump
```

### Vérifier données restaurées

```bash
psql -d fleetcore_test -c "
SELECT COUNT(*) FROM rid_drivers;
SELECT COUNT(*) FROM flt_vehicles;
SELECT COUNT(*) FROM information_schema.columns WHERE column_name LIKE '%_v2';
"
```

Résultats attendus: Données cohérentes, 34 colonnes _v2 présentes.

---

## ÉTAPE 2: EXÉCUTER MIGRATION

### Configuration

```bash
export DATABASE_URL_DEV="postgresql://postgres@localhost:5432/fleetcore_test"
cd /Users/mohamedfodil/Documents/fleetcore5
```

### Lancer MASTER.sh

```bash
./scripts/session_16_MASTER.sh --env=dev --mode=auto
```

Le script va exécuter:
1. **Phase 0**: Préparation + backup (10 min)
2. **Phase 1**: Cleanup _v2 (10 min)
3. **Phase 2**: Attributs (20 min)
4. **Phase 3**: Index (60 min)
5. **Phase 4**: Relations (15 min)
6. **Phase 5**: Validation (15 min)

### Monitoring

```bash
# Terminal séparé pour logs
tail -f logs/session_16_dev_*.log
```

---

## ÉTAPE 3: VALIDATIONS POST-MIGRATION

### Checks DB

```bash
psql "$DATABASE_URL_DEV" << 'EOF'

-- Colonnes _v2 restantes (attendu: 0)
SELECT COUNT(*) FROM information_schema.columns
WHERE column_name LIKE '%_v2';

-- Colonnes ENUM (attendu: ≥34)
SELECT COUNT(*) FROM information_schema.columns
WHERE data_type = 'USER-DEFINED';

-- UNIQUE indexes (attendu: 8)
SELECT COUNT(*) FROM pg_indexes
WHERE indexdef LIKE '%UNIQUE%' AND indexdef LIKE '%deleted_at IS NULL%';

-- Performance indexes (attendu: ≥25)
SELECT COUNT(*) FROM pg_indexes
WHERE indexname LIKE 'idx_%' AND indexdef NOT LIKE '%UNIQUE%';

-- FK (attendu: 1)
SELECT COUNT(*) FROM information_schema.table_constraints
WHERE constraint_name = 'fk_crm_contracts_lead';

-- Triggers (attendu: 9)
SELECT COUNT(*) FROM information_schema.triggers
WHERE trigger_name LIKE '%updated_at%';

EOF
```

### Checks Application

```bash
export DATABASE_URL="$DATABASE_URL_DEV"
npx prisma generate
pnpm build
DATABASE_URL="$DATABASE_URL_DEV" pnpm dev
```

Tests manuels à effectuer:
- Login Dashboard
- Créer Driver
- Créer Trip
- Filtrer par status
- Rechercher Vehicle

---

## ÉTAPE 4: DÉCISION GO/NO-GO PRODUCTION

### Critères GO (tous requis)

- [ ] Migration dev complétée sans erreur
- [ ] 0 colonnes _v2 restantes
- [ ] 34+ colonnes ENUM
- [ ] 8 UNIQUE indexes créés
- [ ] 25+ performance indexes créés
- [ ] 1 FK créée
- [ ] 9 triggers créés
- [ ] Intégrité données vérifiée
- [ ] Application build sans erreur
- [ ] Tests manuels passent
- [ ] Durée acceptable (<150 min)

### Si tous les critères sont GO

Planifier exécution production avec `--env=prod --mode=manual`.

### Si un critère est NO-GO

**NE PAS EXÉCUTER EN PRODUCTION.**

Analyser logs complets, identifier cause racine, documenter findings.
Consulter `logs/session_16_analyse_complete_attributs.md` pour détails.

---

## ÉTAPE 5: EXÉCUTION PRODUCTION

### Pré-exécution

- Fenêtre maintenance planifiée
- Utilisateurs notifiés
- Mode maintenance activé
- Backup production vérifié

### Commande

```bash
export DATABASE_URL_PROD="<production-url>"
./scripts/session_16_MASTER.sh --env=prod --mode=manual
```

Mode manuel = confirmation humaine entre chaque phase.

### Post-exécution

- Vérifier logs production
- Tests smoke application
- Désactiver mode maintenance
- Monitoring J+7

---

## ROLLBACK

En cas d'échec, MASTER.sh déclenche rollback automatique.

Si rollback automatique échoue:

```bash
pg_restore \
  --clean \
  --if-exists \
  -d <database-url> \
  backup_session_16_pre_[TIMESTAMP].dump
```

**CRITICAL**: Backup pré-migration doit être disponible et vérifié.

---

## RÉFÉRENCES

- Analyse complète: `logs/session_16_analyse_complete_attributs.md`
- Scripts phases: `scripts/session_16_phase*.sql`
- Validations: `scripts/session_16_validations_inter_phases.sql`
- Rollback: `scripts/session_16_ROLLBACK.sql`
- Orchestration: `scripts/session_16_MASTER.sh`

---

## NOTES

- **Dev**: `--mode=auto` pour validation automatique
- **Prod**: `--mode=manual` forcé pour sécurité
- **Durée Phase 3**: Variable selon volume données (40-80 min)
- **CONCURRENTLY**: Index créés sans bloquer tables
- **Logs**: Centralisés dans `logs/session_16_<env>_<timestamp>.log`
