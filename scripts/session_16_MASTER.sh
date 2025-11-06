#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# SESSION 16 - MASTER ORCHESTRATION SCRIPT
# ═══════════════════════════════════════════════════════════════════════════
# Exécute les 5 phases de migration V1→V2 avec validations automatiques
# Usage: ./session_16_MASTER.sh --env=dev|prod --mode=auto|manual
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════════════════════
# VARIABLES GLOBALES
# ═══════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ENV=""
MODE=""
LOG_FILE=""
DATABASE_URL=""

# ═══════════════════════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════════════════════

log() {
  echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}[$(date +%H:%M:%S)] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[$(date +%H:%M:%S)] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
  echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_title() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
  echo -e "${BLUE}  $1${NC}" | tee -a "$LOG_FILE"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n" | tee -a "$LOG_FILE"
}

# ═══════════════════════════════════════════════════════════════════════════
# PARSING ARGUMENTS
# ═══════════════════════════════════════════════════════════════════════════

parse_arguments() {
  if [ $# -eq 0 ]; then
    echo "Usage: $0 --env=dev|prod --mode=auto|manual"
    echo ""
    echo "Options:"
    echo "  --env=dev|prod    Environnement cible (dev=local/staging, prod=Supabase)"
    echo "  --mode=auto       Validation automatique entre phases (recommandé pour dev)"
    echo "  --mode=manual     Validation manuelle (confirmation humaine, requis pour prod)"
    echo ""
    echo "Exemples:"
    echo "  $0 --env=dev --mode=auto      # Test automatique sur DB dev"
    echo "  $0 --env=prod --mode=manual   # Production avec confirmations"
    exit 1
  fi

  for arg in "$@"; do
    case $arg in
      --env=*)
        ENV="${arg#*=}"
        ;;
      --mode=*)
        MODE="${arg#*=}"
        ;;
      *)
        log_error "Argument inconnu: $arg"
        exit 1
        ;;
    esac
  done

  # Validation arguments
  if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
    log_error "ENV doit être 'dev' ou 'prod'"
    exit 1
  fi

  if [[ "$MODE" != "auto" && "$MODE" != "manual" ]]; then
    log_error "MODE doit être 'auto' ou 'manual'"
    exit 1
  fi

  # Sécurité: Forcer --mode=manual pour production
  if [[ "$ENV" == "prod" && "$MODE" == "auto" ]]; then
    log_warning "PRODUCTION détectée: Forçage --mode=manual pour sécurité"
    MODE="manual"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION ENVIRONNEMENT
# ═══════════════════════════════════════════════════════════════════════════

setup_environment() {
  LOG_FILE="${SCRIPT_DIR}/../logs/session_16_${ENV}_${TIMESTAMP}.log"
  mkdir -p "$(dirname "$LOG_FILE")"

  log_title "SESSION 16 - MIGRATION V1→V2"
  log "Environnement: $ENV"
  log "Mode: $MODE"
  log "Log: $LOG_FILE"
  log "Timestamp: $TIMESTAMP"

  # Configuration DATABASE_URL
  if [[ "$ENV" == "dev" ]]; then
    DATABASE_URL="${DATABASE_URL_DEV:-postgresql://postgres@localhost:5432/fleetcore}"
    log "DATABASE_URL: $DATABASE_URL (local/dev)"
  else
    if [ -z "${DATABASE_URL_PROD:-}" ]; then
      log_error "Variable DATABASE_URL_PROD non définie!"
      log_error "Exporter: export DATABASE_URL_PROD='postgresql://postgres.xxx@aws-1-eu-central-2.pooler.supabase.com:5432/postgres'"
      exit 1
    fi
    DATABASE_URL="$DATABASE_URL_PROD"
    log "DATABASE_URL: *** (Supabase masqué)"
  fi

  # Vérification connexion
  log "Vérification connexion DB..."
  if ! PGPASSWORD="" psql "$DATABASE_URL" -c "SELECT 1" &>/dev/null; then
    log_error "Impossible de se connecter à la DB!"
    exit 1
  fi
  log_success "Connexion DB OK"
}

# ═══════════════════════════════════════════════════════════════════════════
# CONFIRMATION MANUELLE (MODE MANUAL)
# ═══════════════════════════════════════════════════════════════════════════

manual_confirmation() {
  local phase=$1
  local validation_result=$2

  if [[ "$MODE" == "auto" ]]; then
    return 0
  fi

  echo ""
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}  VALIDATION MANUELLE REQUISE - PHASE $phase${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "Résultat validation automatique:"
  echo "$validation_result"
  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo "  [G] GO     - Continuer vers phase suivante"
  echo "  [N] NO-GO  - Annuler et rollback"
  echo "  [L] LOGS   - Afficher logs complets"
  echo ""

  while true; do
    read -p "Décision [G/N/L]: " decision
    case $decision in
      [Gg])
        log_success "Validation manuelle: GO - Phase $(($phase + 1))"
        return 0
        ;;
      [Nn])
        log_error "Validation manuelle: NO-GO - Annulation"
        rollback_phase "$phase"
        exit 1
        ;;
      [Ll])
        echo ""
        tail -n 50 "$LOG_FILE"
        echo ""
        ;;
      *)
        echo "Option invalide. Entrer G, N ou L."
        ;;
    esac
  done
}

# ═══════════════════════════════════════════════════════════════════════════
# EXÉCUTION PHASE SQL
# ═══════════════════════════════════════════════════════════════════════════

execute_phase() {
  local phase_num=$1
  local phase_name=$2
  local phase_script=$3

  log_title "PHASE $phase_num: $phase_name"

  if [ ! -f "$phase_script" ]; then
    log_error "Script introuvable: $phase_script"
    exit 1
  fi

  log "Exécution: $phase_script"

  local output
  if output=$(psql "$DATABASE_URL" -f "$phase_script" 2>&1); then
    log_success "Phase $phase_num complétée"
    echo "$output" >> "$LOG_FILE"
    return 0
  else
    log_error "Phase $phase_num échouée!"
    echo "$output" | tee -a "$LOG_FILE"
    return 1
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# VALIDATION INTER-PHASE
# ═══════════════════════════════════════════════════════════════════════════

validate_phase() {
  local phase=$1

  log "Validation GO/NO-GO Phase $phase..."

  local validation_script="${SCRIPT_DIR}/session_16_validations_inter_phases.sql"

  if [ ! -f "$validation_script" ]; then
    log_error "Script validation introuvable: $validation_script"
    exit 1
  fi

  local output
  if output=$(psql "$DATABASE_URL" -f "$validation_script" --var phase="$phase" 2>&1); then
    if echo "$output" | grep -q "❌ NO-GO"; then
      log_error "Validation échouée - NO-GO détecté"
      echo "$output" | tee -a "$LOG_FILE"

      manual_confirmation "$phase" "$output"
      return $?
    else
      log_success "Validation Phase $phase: GO ✅"
      echo "$output" >> "$LOG_FILE"

      manual_confirmation "$phase" "$output"
      return $?
    fi
  else
    log_error "Erreur lors de la validation Phase $phase"
    echo "$output" | tee -a "$LOG_FILE"
    return 1
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# ROLLBACK AUTOMATIQUE
# ═══════════════════════════════════════════════════════════════════════════

rollback_phase() {
  local phase=$1

  log_error "Rollback Phase $phase..."

  local rollback_script="${SCRIPT_DIR}/session_16_ROLLBACK.sql"

  if [ ! -f "$rollback_script" ]; then
    log_error "Script rollback introuvable!"
    log_error "Rollback manuel requis - Consulter backup_session_16_pre_*.dump"
    return 1
  fi

  log "Exécution: $rollback_script --var phase=$phase"

  if psql "$DATABASE_URL" -f "$rollback_script" --var phase="$phase" 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Rollback Phase $phase complété"
    return 0
  else
    log_error "Rollback Phase $phase échoué!"
    log_error "RESTORE BACKUP REQUIS: pg_restore backup_session_16_pre_*.dump"
    return 1
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# BACKUP PRÉ-MIGRATION
# ═══════════════════════════════════════════════════════════════════════════

create_backup() {
  log_title "BACKUP PRÉ-MIGRATION"

  local backup_file="${SCRIPT_DIR}/../backup_session_16_pre_${TIMESTAMP}.dump"

  log "Création backup: $backup_file"

  if pg_dump "$DATABASE_URL" -Fc --file="$backup_file" 2>&1 | tee -a "$LOG_FILE"; then
    local size=$(du -h "$backup_file" | cut -f1)
    log_success "Backup créé: $backup_file ($size)"
    return 0
  else
    log_error "Échec création backup!"
    log_error "ARRÊT - Backup requis avant migration"
    exit 1
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# PIPELINE PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════

main() {
  parse_arguments "$@"
  setup_environment

  # Confirmation finale pour PROD
  if [[ "$ENV" == "prod" ]]; then
    echo ""
    echo -e "${RED}⚠️⚠️⚠️  ATTENTION: ENVIRONNEMENT PRODUCTION  ⚠️⚠️⚠️${NC}"
    echo ""
    echo "Vous êtes sur le point de modifier la base de données PRODUCTION Supabase."
    echo "Toutes les phases seront exécutées avec validation manuelle."
    echo ""
    read -p "Confirmer exécution sur PROD? (taper 'YES' en majuscules): " confirm
    if [[ "$confirm" != "YES" ]]; then
      log_error "Exécution annulée par l'utilisateur"
      exit 1
    fi
    log_success "Confirmation PROD reçue"
  fi

  # Phase 0: Préparation + Backup
  create_backup

  if ! execute_phase 0 "Préparation" "${SCRIPT_DIR}/session_16_phase0_preparation.sql"; then
    log_error "Phase 0 échouée - Pré-conditions non remplies"
    exit 1
  fi

  if ! validate_phase 0; then
    log_error "Validation Phase 0 échouée - ARRÊT"
    exit 1
  fi

  # Phase 1: Cleanup _v2
  if ! execute_phase 1 "Cleanup _v2" "${SCRIPT_DIR}/session_16_phase1_cleanup_v2.sql"; then
    log_error "Phase 1 échouée"
    rollback_phase 1
    exit 1
  fi

  if ! validate_phase 1; then
    log_error "Validation Phase 1 échouée - Rollback Phase 1"
    rollback_phase 1
    exit 1
  fi

  # Phase 2: Attributs
  if ! execute_phase 2 "Attributs" "${SCRIPT_DIR}/session_16_phase2_attributs.sql"; then
    log_error "Phase 2 échouée"
    rollback_phase 2
    exit 1
  fi

  if ! validate_phase 2; then
    log_error "Validation Phase 2 échouée - Rollback Phase 2"
    rollback_phase 2
    exit 1
  fi

  # Phase 3: Index Performance
  if ! execute_phase 3 "Index Performance" "${SCRIPT_DIR}/session_16_phase3_index.sql"; then
    log_error "Phase 3 échouée"
    rollback_phase 3
    exit 1
  fi

  if ! validate_phase 3; then
    log_error "Validation Phase 3 échouée - Rollback Phase 3"
    rollback_phase 3
    exit 1
  fi

  # Phase 4: Relations
  if ! execute_phase 4 "Relations" "${SCRIPT_DIR}/session_16_phase4_relations.sql"; then
    log_error "Phase 4 échouée"
    rollback_phase 4
    exit 1
  fi

  if ! validate_phase 4; then
    log_error "Validation Phase 4 échouée - Rollback Phase 4"
    rollback_phase 4
    exit 1
  fi

  # Phase 5: Validation Finale
  if ! execute_phase 5 "Validation Finale" "${SCRIPT_DIR}/session_16_phase5_validation.sql"; then
    log_error "Phase 5 échouée - Validation finale incomplète"
    log_warning "DB en état stable, mais vérifications finales échouées"
    exit 1
  fi

  # Backup post-migration
  log_title "BACKUP POST-MIGRATION"
  local backup_post="${SCRIPT_DIR}/../backup_session_16_post_${TIMESTAMP}.dump"
  log "Création backup post-migration: $backup_post"
  pg_dump "$DATABASE_URL" -Fc --file="$backup_post" 2>&1 | tee -a "$LOG_FILE"

  # SUCCESS!
  log_title "🎉 SESSION 16 COMPLÉTÉE AVEC SUCCÈS! 🎉"
  log_success "Migration V1→V2 100% terminée"
  log_success "Environnement: $ENV"
  log_success "Mode: $MODE"
  log_success "Durée: Voir timestamps dans $LOG_FILE"
  echo ""
  log "Prochaines étapes:"
  log "  1. Vérifier logs: $LOG_FILE"
  log "  2. Tester application: npm run dev"
  log "  3. Monitoring performance index (J+7)"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# EXÉCUTION
# ═══════════════════════════════════════════════════════════════════════════

main "$@"
