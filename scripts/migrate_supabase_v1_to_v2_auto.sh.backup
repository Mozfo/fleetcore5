#!/bin/bash

#===============================================================================
# MIGRATION AUTOMATISÉE FLEETCORE V1 → V2 SUR SUPABASE
#
# Description: Applique les 13 fichiers SQL de Phase 1 dans l'ordre
# Mode: Semi-automatique (pause après chaque session)
# Durée: ~70 minutes
#
# Usage: ./scripts/migrate_supabase_v1_to_v2.sh
#===============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Utiliser PostgreSQL 17.6 (correpondant à version Supabase)
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

#===============================================================================
# CONFIGURATION
#===============================================================================

# URL Supabase
SUPABASE_URL="${DATABASE_URL:-}"

if [ -z "$SUPABASE_URL" ]; then
  echo "❌ ERREUR: Variable DATABASE_URL non définie"
  echo "Export: export DATABASE_URL='postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres'"
  exit 1
fi

# Dossier SQL (corrections ULTRATHINK: chemin exact)
SQL_DIR="docs/Migration_v1_v2/sql"

if [ ! -d "$SQL_DIR" ]; then
  echo "❌ ERREUR: Dossier SQL non trouvé: $SQL_DIR"
  echo "Vérifier que vous êtes dans /Users/mohamedfodil/Documents/fleetcore5/"
  exit 1
fi

# Fichiers SQL dans l'ordre (13 sessions)
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

# Tables critiques avec données (CORRECTION ULTRATHINK 1: 9 tables, PAS v_driver_profile)
CRITICAL_TABLES=(
  "adm_audit_logs"
  "adm_members"
  "adm_roles"
  "adm_tenants"
  "crm_leads"
  "dir_car_makes"
  "dir_car_models"
  "flt_vehicles"
  "rid_drivers"
)

# Fichiers logs
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="migration_supabase_${TIMESTAMP}.log"
ERROR_LOG="migration_errors_${TIMESTAMP}.log"
BACKUP_FILE="backup_supabase_production_${TIMESTAMP}.sql.gz"
PRE_COUNTS_FILE="pre_counts_critical.txt"

#===============================================================================
# FONCTIONS UTILITAIRES
#===============================================================================

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERREUR: $1" | tee -a "$LOG_FILE" "$ERROR_LOG"
}

success() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1" | tee -a "$LOG_FILE"
}

wait_user_confirmation() {
  local session=$1
  local message=$2

  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "⏸️  PAUSE - Session $session"
  echo "════════════════════════════════════════════════════════════════"
  echo "$message"
  echo ""
  echo "Options:"
  echo "  [ENTER]  Continuer avec session suivante"
  echo "  [s]      Skip (arrêter ici, pas de rollback)"
  echo "  [r]      Rollback (restaurer backup et quitter)"
  echo ""
  read -p "Votre choix: " choice

  case "$choice" in
    s|S)
      log "⏹️  Migration arrêtée par l'utilisateur (session $session)"
      exit 0
      ;;
    r|R)
      log "🔄 Rollback demandé par l'utilisateur"
      perform_rollback
      exit 1
      ;;
    *)
      log "▶️  Continuation vers session suivante..."
      ;;
  esac
}

perform_rollback() {
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "🔄 ROLLBACK EN COURS"
  echo "════════════════════════════════════════════════════════════════"

  if [ ! -f "$BACKUP_FILE" ]; then
    error "Fichier backup non trouvé: $BACKUP_FILE"
    echo "Impossible de restaurer automatiquement."
    exit 1
  fi

  log "Restauration du backup: $BACKUP_FILE"

  # Décompresser et restaurer
  if gunzip -c "$BACKUP_FILE" | psql "$SUPABASE_URL" >> "$LOG_FILE" 2>> "$ERROR_LOG"; then
    success "Backup restauré avec succès"
    log "Base de données revenue à l'état PRÉ-migration"
  else
    error "Échec de la restauration du backup"
    echo "Voir logs: $ERROR_LOG"
    exit 1
  fi
}

#===============================================================================
# VÉRIFICATIONS PRÉALABLES
#===============================================================================

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "MIGRATION FLEETCORE V1 → V2 - SUPABASE PRODUCTION"
echo "Mode: Semi-automatique (pause après chaque session)"
echo "════════════════════════════════════════════════════════════════"
echo ""

log "🔍 Vérifications préalables..."

# Vérifier connexion Supabase
if ! psql "$SUPABASE_URL" -c "SELECT 1;" &>/dev/null; then
  error "Impossible de se connecter à Supabase"
  echo "Vérifier DATABASE_URL et credentials"
  exit 1
fi
success "Connexion Supabase OK"

# Vérifier présence fichiers SQL
log "🔍 Vérification présence des 13 fichiers SQL..."
MISSING_FILES=0
for file in "${SQL_FILES[@]}"; do
  if [ ! -f "$SQL_DIR/$file" ]; then
    error "Fichier manquant: $file"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
done

if [ $MISSING_FILES -gt 0 ]; then
  error "$MISSING_FILES fichiers SQL manquants"
  exit 1
fi
success "Tous les 13 fichiers SQL présents"

#===============================================================================
# BACKUP PRÉ-MIGRATION
#===============================================================================

echo ""
log "💾 Création backup PRÉ-migration..."

if pg_dump "$SUPABASE_URL" | gzip > "$BACKUP_FILE"; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  success "Backup créé: $BACKUP_FILE ($BACKUP_SIZE)"
else
  error "Échec création backup"
  exit 1
fi

#===============================================================================
# COMPTAGE PRÉ-MIGRATION (9 TABLES CRITIQUES)
#===============================================================================

echo ""
log "📊 Comptage tables critiques AVANT migration (9 tables)..."

# Effacer fichier précédent si existe
> "$PRE_COUNTS_FILE"

TOTAL_ROWS=0
for table in "${CRITICAL_TABLES[@]}"; do
  COUNT=$(psql "$SUPABASE_URL" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ')

  if [ -z "$COUNT" ]; then
    COUNT=0
  fi

  log "   - $table: $COUNT lignes"
  echo "$table|$COUNT" >> "$PRE_COUNTS_FILE"
  TOTAL_ROWS=$((TOTAL_ROWS + COUNT))
done

success "Total lignes à préserver: $TOTAL_ROWS"
log "Compteurs sauvegardés dans: $PRE_COUNTS_FILE"

#===============================================================================
# ÉTAT BASE AVANT MIGRATION
#===============================================================================

echo ""
log "📊 État base AVANT migration..."

TABLES_BEFORE=$(psql "$SUPABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')
ENUMS_BEFORE=$(psql "$SUPABASE_URL" -t -c "SELECT COUNT(*) FROM pg_type WHERE typtype='e';" | tr -d ' ')
FK_BEFORE=$(psql "$SUPABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_schema='public';" | tr -d ' ')

log "Tables avant: $TABLES_BEFORE"
log "Enums avant: $ENUMS_BEFORE"
log "FK avant: $FK_BEFORE"

#===============================================================================
# MIGRATION SESSION PAR SESSION
#===============================================================================

echo ""
log "🚀 DÉBUT MIGRATION V1 → V2"
log "═══════════════════════════════════════════════════════════"

START_TIME=$(date +%s)

for i in "${!SQL_FILES[@]}"; do
  SESSION=$i
  FILE="${SQL_FILES[$i]}"
  FILEPATH="$SQL_DIR/$FILE"

  echo ""
  log "────────────────────────────────────────────────────────"
  log "📁 Session $SESSION/12: $FILE"
  log "────────────────────────────────────────────────────────"

  # Mesurer temps session
  SESSION_START=$(date +%s)

  # Appliquer fichier SQL (CORRECTION ULTRATHINK: GATEWAY 2 déjà dans SQL)
  log "🔄 Application en cours..."

  # Exécuter SQL et capturer output
  SQL_OUTPUT=$(psql "$SUPABASE_URL" -f "$FILEPATH" 2>&1 | tee -a "$LOG_FILE")
  SQL_EXIT_CODE=$?

  # Vérifier si GATEWAY 2 est présent dans le fichier SQL
  if grep -q "GATEWAY 2 COMPLETED" "$FILEPATH"; then
    # Fichiers 10-13: GATEWAY 2 requis
    if echo "$SQL_OUTPUT" | grep -q "GATEWAY 2 COMPLETED"; then
      SESSION_END=$(date +%s)
      SESSION_DURATION=$((SESSION_END - SESSION_START))
      success "Session $SESSION complétée en ${SESSION_DURATION}s (GATEWAY 2 validé)"
    else
      error "Échec Session $SESSION: GATEWAY 2 non trouvé dans output"
      echo "$SQL_OUTPUT" >> "$ERROR_LOG"
      echo ""
      echo "❌ GATEWAY 2 attendu mais non trouvé dans output"
      read -p "Restaurer backup? [y/N]: " rollback_choice
      if [[ "$rollback_choice" =~ ^[Yy]$ ]]; then
        perform_rollback
      fi
      exit 1
    fi
  else
    # Fichiers 01-09: Pas de GATEWAY 2, vérifier juste exit code
    if [ $SQL_EXIT_CODE -eq 0 ]; then
      SESSION_END=$(date +%s)
      SESSION_DURATION=$((SESSION_END - SESSION_START))
      success "Session $SESSION complétée en ${SESSION_DURATION}s (psql exit 0)"
    else
      error "Échec Session $SESSION: psql exit code $SQL_EXIT_CODE"
      echo "$SQL_OUTPUT" >> "$ERROR_LOG"
      echo ""
      echo "❌ DERNIÈRES ERREURS:"
      tail -20 "$ERROR_LOG"
      echo ""
      echo "🔄 ROLLBACK RECOMMANDÉ"
      read -p "Restaurer backup? [y/N]: " rollback_choice
      if [[ "$rollback_choice" =~ ^[Yy]$ ]]; then
        perform_rollback
      fi
      exit 1
    fi
  fi

  # Vérifier état après session
  TABLES_NOW=$(psql "$SUPABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')
  log "📊 Tables actuelles: $TABLES_NOW"

  # Pause pour confirmation utilisateur (MODE SEMI-AUTOMATIQUE)
  if [ $SESSION -lt 12 ]; then
    wait_user_confirmation $SESSION "Session $SESSION/$((${#SQL_FILES[@]} - 1)) terminée avec succès."
  fi
done

#===============================================================================
# ÉTAT BASE APRÈS MIGRATION
#===============================================================================

echo ""
log "═══════════════════════════════════════════════════════════"
log "📊 État base APRÈS migration..."
log "═══════════════════════════════════════════════════════════"

TABLES_AFTER=$(psql "$SUPABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')
ENUMS_AFTER=$(psql "$SUPABASE_URL" -t -c "SELECT COUNT(*) FROM pg_type WHERE typtype='e';" | tr -d ' ')
FK_AFTER=$(psql "$SUPABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_schema='public';" | tr -d ' ')

log "Tables après: $TABLES_AFTER (avant: $TABLES_BEFORE)"
log "Enums après: $ENUMS_AFTER (avant: $ENUMS_BEFORE)"
log "FK après: $FK_AFTER (avant: $FK_BEFORE)"

# Calculer différences
TABLES_ADDED=$((TABLES_AFTER - TABLES_BEFORE))
ENUMS_ADDED=$((ENUMS_AFTER - ENUMS_BEFORE))
FK_ADDED=$((FK_AFTER - FK_BEFORE))

echo ""
log "📈 Évolution:"
log "   +$TABLES_ADDED tables"
log "   +$ENUMS_ADDED enums"
log "   +$FK_ADDED foreign keys"

#===============================================================================
# VÉRIFICATION INTÉGRITÉ POST-MIGRATION (9 TABLES CRITIQUES)
#===============================================================================

echo ""
log "🔍 Vérification intégrité données (9 tables critiques)..."

DATA_LOSS_DETECTED=0

while IFS='|' read -r table count_before; do
  COUNT_AFTER=$(psql "$SUPABASE_URL" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ')

  if [ -z "$COUNT_AFTER" ]; then
    COUNT_AFTER=0
  fi

  DIFF=$((COUNT_AFTER - count_before))

  if [ $COUNT_AFTER -eq $count_before ]; then
    log "✅ $table: $COUNT_AFTER lignes (identique)"
  elif [ $COUNT_AFTER -gt $count_before ]; then
    log "⚠️  $table: $COUNT_AFTER lignes (avant: $count_before, +$DIFF)"
  else
    error "$table: $COUNT_AFTER lignes (avant: $count_before, $DIFF) - PERTE DE DONNÉES"
    DATA_LOSS_DETECTED=1
  fi
done < "$PRE_COUNTS_FILE"

if [ $DATA_LOSS_DETECTED -eq 1 ]; then
  error "PERTE DE DONNÉES DÉTECTÉE - ROLLBACK REQUIS"
  echo ""
  read -p "Restaurer backup? [y/N]: " rollback_choice

  if [[ "$rollback_choice" =~ ^[Yy]$ ]]; then
    perform_rollback
  fi

  exit 1
fi

success "Aucune perte de données détectée"

#===============================================================================
# RÉSUMÉ FINAL
#===============================================================================

END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))
MINUTES=$((TOTAL_DURATION / 60))
SECONDS=$((TOTAL_DURATION % 60))

echo ""
log "═══════════════════════════════════════════════════════════"
log "🎉 MIGRATION V1 → V2 TERMINÉE"
log "═══════════════════════════════════════════════════════════"
log "Durée totale: ${MINUTES}m ${SECONDS}s"
log "Sessions réussies: 13/13"
log "Backup: $BACKUP_FILE"
log "Log complet: $LOG_FILE"

#===============================================================================
# INFORMATION POST-MIGRATION (CORRECTION ULTRATHINK 3)
#===============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "ℹ️  INFORMATIONS IMPORTANTES POST-MIGRATION"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ Phase 1 (Structures) COMPLÉTÉE"
echo ""
echo "État actuel des tables avec données (9 tables):"
echo "  - Colonnes V1 existantes: Données PRÉSERVÉES ✅"
echo "  - Nouvelles colonnes V2: NULL ou DEFAULT (NORMAL) ⚠️"
echo ""
echo "Détails colonnes V2:"
echo "  - Colonnes avec DEFAULT: Remplies automatiquement"
echo "    Exemple: metadata = {}, created_at = now()"
echo ""
echo "  - Colonnes sans DEFAULT: NULL"
echo "    Exemple: business_type = NULL, notes = NULL"
echo ""
echo "⚠️  Les valeurs NULL sont NORMALES après Phase 1 (structures)."
echo ""
echo "Prochaines étapes:"
echo "  1. Exécuter: scripts/post_migration_validation.sql"
echo "  2. Session 14: Migration Données V1→V2 (remplir colonnes NULL)"
echo "  3. Session 15: Création indexes avec soft delete"
echo "  4. Session 16: Cleanup colonnes V1 + RENAME _v2"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

success "Migration terminée avec succès ! 🎊"

exit 0
