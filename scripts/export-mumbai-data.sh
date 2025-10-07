#!/bin/bash

# FleetCore V1 → V2 Migration
# Export critical data from Mumbai Supabase instance
# Date: October 7, 2025

set -e  # Exit on error

echo "🔄 FleetCore Mumbai Data Export"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    echo "Create .env.local with DATABASE_URL pointing to Mumbai"
    exit 1
fi

# Load DATABASE_URL from .env.local
export $(grep DATABASE_URL .env.local | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not set${NC}"
    exit 1
fi

echo -e "${YELLOW}📍 Source: Mumbai (aws-1-ap-south-1)${NC}"
echo ""

# Create backups directory
BACKUP_DIR="backups/mumbai_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}📁 Backup directory: $BACKUP_DIR${NC}"
echo ""

# Function to export table data
export_table() {
    local table=$1
    echo -n "Exporting $table... "

    if npx prisma db execute --stdin <<EOF
\copy (SELECT * FROM "$table") TO '$BACKUP_DIR/${table}_data.csv' WITH CSV HEADER
EOF
    then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        echo -e "${YELLOW}⚠️  Table $table may not exist or is empty${NC}"
    fi
}

# Export schema only (no data)
echo "📋 Exporting database schema..."
pg_dump "$DATABASE_URL" --schema-only -f "$BACKUP_DIR/schema_only.sql" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  pg_dump not available, using Prisma instead${NC}"
    npx prisma migrate diff \
        --from-empty \
        --to-schema-datamodel prisma/schema.prisma \
        --script > "$BACKUP_DIR/schema_only.sql"
}
echo -e "${GREEN}✓ Schema exported${NC}"
echo ""

# Export critical tables data
echo "📊 Exporting table data..."
echo ""

# Core tables (must preserve)
export_table "organization"
export_table "member"
export_table "sys_demo_lead"
export_table "sys_demo_lead_activity"

echo ""
echo "📦 Optional tables (for reference)..."
echo ""

# ADM tables (some will be discarded in V2)
export_table "adm_audit_logs"
export_table "adm_system_parameters"
export_table "adm_employers"

# FLT tables (test data)
export_table "flt_vehicles"
export_table "flt_vehicle_assignments"

# RID tables (test data)
export_table "rid_drivers"
export_table "rid_driver_platforms"

# REV tables (test data)
export_table "rev_revenue_imports"
export_table "rev_driver_revenues"

echo ""
echo -e "${GREEN}✅ Export completed!${NC}"
echo ""
echo "📁 Files created in: $BACKUP_DIR"
ls -lh "$BACKUP_DIR"
echo ""

# Create import script for Zurich
cat > "$BACKUP_DIR/import_to_zurich.sh" <<'IMPORT_SCRIPT'
#!/bin/bash

# FleetCore V2 - Import Mumbai data to Zurich
# Run this AFTER creating V2 schema in Zurich

set -e

echo "🔄 Importing Mumbai data to Zurich..."
echo ""

# Check if .env.local.zurich exists
if [ ! -f .env.local.zurich ]; then
    echo "❌ Error: .env.local.zurich not found"
    echo "Create this file with DATABASE_URL pointing to Zurich"
    exit 1
fi

# Load Zurich DATABASE_URL
export $(grep DATABASE_URL .env.local.zurich | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env.local.zurich"
    exit 1
fi

echo "📍 Target: Zurich (eu-central-1)"
echo ""

# Import to new table names (V2)
echo "Importing to adm_tenants (from organization)..."
psql "$DATABASE_URL" -c "\copy adm_tenants FROM 'organization_data.csv' WITH CSV HEADER"

echo "Importing to adm_members (from member)..."
psql "$DATABASE_URL" -c "\copy adm_members FROM 'member_data.csv' WITH CSV HEADER"

echo "Importing to crm_leads (from sys_demo_lead)..."
psql "$DATABASE_URL" -c "\copy crm_leads FROM 'sys_demo_lead_data.csv' WITH CSV HEADER"

# Optional: Import sys_demo_lead_activity if keeping it
# echo "Importing sys_demo_lead_activity..."
# psql "$DATABASE_URL" -c "\copy sys_demo_lead_activity FROM 'sys_demo_lead_activity_data.csv' WITH CSV HEADER"

echo ""
echo "✅ Import completed!"
echo ""
echo "⚠️  Note: You may need to adjust column mappings if schema differs"
echo "⚠️  Test queries before proceeding with full migration"
IMPORT_SCRIPT

chmod +x "$BACKUP_DIR/import_to_zurich.sh"

echo -e "${YELLOW}📝 Import script created: $BACKUP_DIR/import_to_zurich.sh${NC}"
echo ""
echo -e "${GREEN}🎉 Backup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Create Supabase project in Zurich (eu-central-1)"
echo "2. Apply V2 schema migrations"
echo "3. Run $BACKUP_DIR/import_to_zurich.sh"
echo ""
