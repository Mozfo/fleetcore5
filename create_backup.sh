#!/bin/bash
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_supabase_production_v17_${TIMESTAMP}.sql.gz"
pg_dump "postgresql://postgres.joueofbaqjkrpjcailkx:jeXP1Ht3PzRlw8TH@aws-1-eu-central-2.pooler.supabase.com:5432/postgres" | gzip > "$BACKUP_FILE"
ls -lh "$BACKUP_FILE"
