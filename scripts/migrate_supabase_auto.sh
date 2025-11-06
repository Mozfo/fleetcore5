#!/bin/bash
#===============================================================================
# MIGRATION AUTOMATISÉE FLEETCORE V1 → V2 - SUPABASE PRODUCTION
# Mode: AUTOMATIQUE (arrêt si erreur)
# Durée: ~42 minutes
#===============================================================================

set -e  # EXIT SI ERREUR
set -u  # EXIT si variable non définie

# PostgreSQL 17.6
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

# URL Supabase
DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ]; then
  echo "❌ DATABASE_URL non définie"
  exit 1
fi

# Fichiers SQL
SQL_DIR="docs/Migration_v1_v2/sql"
SQL_FILES=(
  "01_shared_enums.sql"
  "02_adm_structure.sql"
  "03_dir_structure.sql"
  "04_doc_structure.sql"
  "05_crm_structure.sql"
  "06_bil_structure.sql"
  "07_sup_structure.sql"
  "08_rid_structure.sql"
  "09_flt_structure.sql"
  "10_sch_structure.sql"
  "11_trp_structure.sql"
  "12_rev_structure.sql"
  "13_fin_structure.sql"
)

# Tables critiques (9)
CRITICAL_TABLES=(
  "adm_audit_logs" "adm_members" "adm_roles" "adm_tenants"
  "crm_leads" "dir_car_makes" "dir_car_models"
  "flt_vehicles" "rid_drivers"
)

# Logs
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="migration_auto_${TIMESTAMP}.log"
BACKUP_FILE="backup_auto_${TIMESTAMP}.sql.gz"
COUNTS_FILE="pre_counts_${TIMESTAMP}.txt"

echo "════════════════════════════════════════════════════════"
echo "MIGRATION AUTOMATISÉE V1 → V2"
echo "════════════════════════════════════════════════════════"

# BACKUP
echo "[$(date '+%H:%M:%S')] 💾 Backup..."
pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date '+%H:%M:%S')] ✅ Backup: $BACKUP_FILE ($BACKUP_SIZE)"

# COMPTAGE PRÉ-MIGRATION
echo "[$(date '+%H:%M:%S')] 📊 Comptage données..."
> "$COUNTS_FILE"
TOTAL_ROWS=0
for table in "${CRITICAL_TABLES[@]}"; do
  COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')
  echo "$table|$COUNT" >> "$COUNTS_FILE"
  TOTAL_ROWS=$((TOTAL_ROWS + COUNT))
  echo "   - $table: $COUNT lignes"
done
echo "[$(date '+%H:%M:%S')] ✅ Total à préserver: $TOTAL_ROWS lignes"

# ÉTAT AVANT
TABLES_BEFORE=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public';" | tr -d ' ')
ENUMS_BEFORE=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_type WHERE typtype='e';" | tr -d ' ')
FK_BEFORE=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_schema='public';" | tr -d ' ')

echo "[$(date '+%H:%M:%S')] État AVANT: $TABLES_BEFORE tables, $ENUMS_BEFORE enums, $FK_BEFORE FK"
echo ""
echo "════════════════════════════════════════════════════════"
echo "🚀 DÉBUT MIGRATION (13 sessions)"
echo "════════════════════════════════════════════════════════"

START_TIME=$(date +%s)

# EXÉCUTER 13 SESSIONS
for i in "${!SQL_FILES[@]}"; do
  FILE="${SQL_FILES[$i]}"
  FILEPATH="$SQL_DIR/$FILE"

  echo ""
  echo "────────────────────────────────────────────────────────"
  echo "[$(date '+%H:%M:%S')] Session $i/12: $FILE"
  echo "────────────────────────────────────────────────────────"

  SESSION_START=$(date +%s)

  # EXÉCUTER SQL
  if psql "$DB_URL" -f "$FILEPATH" >> "$LOG_FILE" 2>&1; then
    SESSION_END=$(date +%s)
    DURATION=$((SESSION_END - SESSION_START))
    echo "[$(date '+%H:%M:%S')] ✅ Session $i complétée en ${DURATION}s"

    # Vérifier comptage tables
    TABLES_NOW=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public';" | tr -d ' ')
    echo "[$(date '+%H:%M:%S')] 📊 Tables: $TABLES_NOW"
  else
    echo ""
    echo "❌ ERREUR Session $i: $FILE"
    echo "Voir log: $LOG_FILE"
    echo ""
    tail -30 "$LOG_FILE"
    echo ""
    echo "🔄 ROLLBACK: gunzip -c $BACKUP_FILE | psql \"\$DB_URL\""
    exit 1
  fi
done

# ÉTAT APRÈS
echo ""
echo "════════════════════════════════════════════════════════"
echo "📊 ÉTAT APRÈS MIGRATION"
echo "════════════════════════════════════════════════════════"

TABLES_AFTER=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public';" | tr -d ' ')
ENUMS_AFTER=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_type WHERE typtype='e';" | tr -d ' ')
FK_AFTER=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_schema='public';" | tr -d ' ')

echo "Tables: $TABLES_AFTER (avant: $TABLES_BEFORE) → +$((TABLES_AFTER - TABLES_BEFORE))"
echo "Enums: $ENUMS_AFTER (avant: $ENUMS_BEFORE) → +$((ENUMS_AFTER - ENUMS_BEFORE))"
echo "FK: $FK_AFTER (avant: $FK_BEFORE) → +$((FK_AFTER - FK_BEFORE))"

# VÉRIFIER INTÉGRITÉ DONNÉES
echo ""
echo "🔍 Vérification intégrité données..."
DATA_LOSS=0
while IFS='|' read -r table count_before; do
  COUNT_AFTER=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')
  if [ $COUNT_AFTER -ne $count_before ]; then
    echo "❌ $table: $COUNT_AFTER (avant: $count_before)"
    DATA_LOSS=1
  else
    echo "✅ $table: $COUNT_AFTER lignes"
  fi
done < "$COUNTS_FILE"

if [ $DATA_LOSS -eq 1 ]; then
  echo ""
  echo "❌ PERTE DE DONNÉES DÉTECTÉE"
  echo "🔄 ROLLBACK: gunzip -c $BACKUP_FILE | psql \"\$DB_URL\""
  exit 1
fi

END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))
MINUTES=$((TOTAL_DURATION / 60))
SECONDS=$((TOTAL_DURATION % 60))

echo ""
echo "════════════════════════════════════════════════════════"
echo "🎉 MIGRATION TERMINÉE AVEC SUCCÈS"
echo "════════════════════════════════════════════════════════"
echo "Durée: ${MINUTES}m ${SECONDS}s"
echo "Sessions: 13/13 ✅"
echo "Backup: $BACKUP_FILE"
echo "Log: $LOG_FILE"
echo ""
echo "ℹ️  Colonnes V2: NULL = NORMAL (Phase 1)"
echo "Prochaine étape: Session 14 (Migration Données)"
echo "════════════════════════════════════════════════════════"

exit 0
