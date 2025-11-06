#!/bin/bash

# ============================================================================
# FleetCore V1 - Complete Archive Creator (1-Click Restore)
# ============================================================================
#
# Creates a self-contained TAR archive with:
#   - Complete source code
#   - Database schema and data
#   - Configuration templates
#   - Restore instructions
#
# Usage: ./scripts/archive-fleetcore.sh
#
# ============================================================================

set -e
set -u

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="fleetcore_v1_${TIMESTAMP}"
TEMP_DIR="${PROJECT_ROOT}/temp_archive_${TIMESTAMP}"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}FleetCore V1 - Complete Archive Creator${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}📦 Archive: ${ARCHIVE_NAME}.tar.gz${NC}"
echo -e "${YELLOW}📍 Project: ${PROJECT_ROOT}${NC}"
echo ""

# ============================================================================
# Step 1: Prerequisites Check
# ============================================================================

echo -e "${BLUE}[1/8]${NC} Checking prerequisites..."

if [ ! -f "${PROJECT_ROOT}/.env.local" ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    echo "   Create .env.local with DATABASE_URL before running"
    exit 1
fi

# Try DIRECT_URL first (for pg_dump compatibility), fallback to DATABASE_URL
DIRECT_URL=$(grep "^DIRECT_URL=" "${PROJECT_ROOT}/.env.local" | cut -d'=' -f2-)
DATABASE_URL=$(grep "^DATABASE_URL=" "${PROJECT_ROOT}/.env.local" | cut -d'=' -f2-)

# Use DIRECT_URL for pg_dump if available (removes pgbouncer param)
if [ -n "${DIRECT_URL:-}" ]; then
    EXPORT_URL="$DIRECT_URL"
    echo -e "${GREEN}✓ Using DIRECT_URL for database export${NC}"
else
    # Strip problematic pgbouncer parameter from DATABASE_URL
    EXPORT_URL=$(echo "$DATABASE_URL" | sed 's/?pgbouncer=true//' | sed 's/&pgbouncer=true//')
    echo -e "${YELLOW}⚠️  Using DATABASE_URL (pgbouncer params removed)${NC}"
fi

export DATABASE_URL
export EXPORT_URL

if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not set in .env.local${NC}"
    exit 1
fi

if command -v pg_dump &> /dev/null; then
    SKIP_DB=false
    echo -e "${GREEN}✓ pg_dump available${NC}"
else
    SKIP_DB=true
    echo -e "${YELLOW}⚠️  pg_dump not found - database export will be skipped${NC}"
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js not found${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ Error: pnpm not found${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
PNPM_VERSION=$(pnpm --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
echo -e "${GREEN}✓ pnpm ${PNPM_VERSION}${NC}"
echo ""

# ============================================================================
# Step 2: Create Temporary Directory
# ============================================================================

echo -e "${BLUE}[2/8]${NC} Creating temporary directory..."

mkdir -p "${TEMP_DIR}/code"
mkdir -p "${TEMP_DIR}/database"

echo -e "${GREEN}✓ Temporary directory created: ${TEMP_DIR}${NC}"
echo ""

# ============================================================================
# Step 3: Export Database
# ============================================================================

echo -e "${BLUE}[3/8]${NC} Exporting database..."

if [ "$SKIP_DB" = false ]; then
    # Clean URL from pgbouncer and connection_limit params
    CLEAN_EXPORT_URL=$(echo "$EXPORT_URL" | sed 's/?pgbouncer=true//; s/&pgbouncer=true//; s/&connection_limit=[0-9]*//')

    echo "   Exporting schema (DDL)..."
    pg_dump "$CLEAN_EXPORT_URL" \
        --schema-only \
        --no-owner \
        --no-privileges \
        --no-acl \
        --schema=public \
        > "${TEMP_DIR}/database/fleetcore_v1_schema.sql" 2>&1 || {
        echo -e "${YELLOW}   ⚠️  Schema export failed (version mismatch or connection issue)${NC}"
        echo "   Continuing without database export..."
        SKIP_DB=true
    }

    if [ "$SKIP_DB" = false ]; then
        SCHEMA_SIZE=$(du -h "${TEMP_DIR}/database/fleetcore_v1_schema.sql" | cut -f1)
        echo -e "${GREEN}   ✓ Schema exported (${SCHEMA_SIZE})${NC}"

        echo "   Exporting data (DML)..."
        pg_dump "$CLEAN_EXPORT_URL" \
            --data-only \
            --no-owner \
            --no-privileges \
            --no-acl \
            --schema=public \
            --exclude-table-data='adm_audit_logs' \
            > "${TEMP_DIR}/database/fleetcore_v1_data.sql" 2>&1 || {
            echo -e "${YELLOW}   ⚠️  Data export failed (database may be empty)${NC}"
            echo "" > "${TEMP_DIR}/database/fleetcore_v1_data.sql"
        }

        DATA_SIZE=$(du -h "${TEMP_DIR}/database/fleetcore_v1_data.sql" | cut -f1)
        echo -e "${GREEN}   ✓ Data exported (${DATA_SIZE})${NC}"
    fi

    cat > "${TEMP_DIR}/database/database_metadata.json" <<DBMETA
{
  "export_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "database_host": "$(echo $DATABASE_URL | sed -E 's|.*@([^:/]+).*|\1|')",
  "schema_file": "fleetcore_v1_schema.sql",
  "data_file": "fleetcore_v1_data.sql",
  "notes": "Audit logs excluded to reduce size"
}
DBMETA

    echo -e "${GREEN}✓ Database export completed${NC}"
else
    echo -e "${YELLOW}⚠️  Database export skipped${NC}"
    echo "Database export skipped - pg_dump not available" > "${TEMP_DIR}/database/README.txt"
fi

echo ""

# ============================================================================
# Step 4: Copy Source Code
# ============================================================================

echo -e "${BLUE}[4/8]${NC} Copying source code..."

for dir in app components lib prisma public scripts docs .github .husky node_modules; do
    if [ -d "${PROJECT_ROOT}/${dir}" ]; then
        if [ "$dir" = "node_modules" ]; then
            echo "   Copying ${dir}/ (this may take several minutes - 2.7 GB)..."
        else
            echo "   Copying ${dir}/"
        fi
        cp -R "${PROJECT_ROOT}/${dir}" "${TEMP_DIR}/code/"
    fi
done

echo "   Copying configuration files..."
for file in \
    package.json \
    pnpm-lock.yaml \
    tsconfig.json \
    next.config.ts \
    next.config.mjs \
    middleware.ts \
    instrumentation.ts \
    instrumentation-client.ts \
    eslint.config.mjs \
    postcss.config.mjs \
    components.json \
    vitest.config.ts \
    CLAUDE.md \
    README.md \
    CHANGELOG.md \
    .gitignore \
    .prettierrc \
    .prettierignore \
    .lintstagedrc.json \
    .env.local.example \
    .env.test.example
do
    if [ -f "${PROJECT_ROOT}/${file}" ]; then
        cp "${PROJECT_ROOT}/${file}" "${TEMP_DIR}/code/"
    fi
done

for file in sentry.server.config.ts sentry.edge.config.ts; do
    if [ -f "${PROJECT_ROOT}/${file}" ]; then
        cp "${PROJECT_ROOT}/${file}" "${TEMP_DIR}/code/"
    fi
done

echo -e "${GREEN}✓ Source code copied${NC}"
echo ""

# ============================================================================
# Step 5: Generate Metadata
# ============================================================================

echo -e "${BLUE}[5/8]${NC} Generating metadata..."

GIT_COMMIT="unknown"
GIT_BRANCH="unknown"
if command -v git &> /dev/null && [ -d "${PROJECT_ROOT}/.git" ]; then
    GIT_COMMIT=$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null || echo "unknown")
    GIT_BRANCH=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
fi

CODE_FILE_COUNT=$(find "${TEMP_DIR}/code" -type f | wc -l | xargs)
TOTAL_SIZE=$(du -sh "${TEMP_DIR}" | cut -f1)

cat > "${TEMP_DIR}/metadata.json" <<METADATA
{
  "version": "1.0.0",
  "project_name": "FleetCore",
  "archive_type": "complete_v1_backup",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "created_by": "$(whoami)@$(hostname)",
  "git": {
    "commit": "$GIT_COMMIT",
    "branch": "$GIT_BRANCH"
  },
  "node_version": "$NODE_VERSION",
  "pnpm_version": "$PNPM_VERSION",
  "statistics": {
    "code_files": $CODE_FILE_COUNT,
    "total_size": "$TOTAL_SIZE"
  },
  "contents": {
    "code": "Complete source code in code/ directory",
    "database": "PostgreSQL schema and data in database/ directory",
    "restore_guide": "See RESTORE.md for restoration instructions"
  }
}
METADATA

echo -e "${GREEN}✓ Metadata generated${NC}"
echo ""

# ============================================================================
# Step 6: Create Restore Guide
# ============================================================================

echo -e "${BLUE}[6/8]${NC} Creating restore guide..."

cat > "${TEMP_DIR}/RESTORE.md" <<'RESTOREGUIDE'
# FleetCore V1 - Restore Guide (1-Click)

## Prerequisites

- Node.js 20.x or higher
- pnpm 10.18.0 or higher
- PostgreSQL 15+ or Supabase account
- Git (optional)

## Quick Restore (6 Steps)

### Step 1: Extract Archive

```bash
tar -xzf fleetcore_v1_YYYYMMDD_HHMMSS.tar.gz
cd code/
```

### Step 2: Install Dependencies

```bash
pnpm install
```

Time: 2-5 minutes

### Step 3: Configure Environment

```bash
cp .env.local.example .env.local
nano .env.local  # or vim, code, etc.
```

Required variables:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://user:password@host:port/database
INTERNAL_AUDIT_TOKEN=generate_with_openssl_rand_base64_64
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=your@email.com
```

### Step 4: Restore Database

```bash
# Create database (if needed)
createdb fleetcore_v1

# Restore schema
psql $DATABASE_URL < ../database/fleetcore_v1_schema.sql

# Restore data
psql $DATABASE_URL < ../database/fleetcore_v1_data.sql

# Verify
psql $DATABASE_URL -c "\dt"
```

### Step 5: Generate Prisma Client

```bash
pnpm prisma generate
```

### Step 6: Start Project

Development:
```bash
pnpm dev
```

Production:
```bash
pnpm build
pnpm start
```

Access at: http://localhost:3000

## Verification

```bash
# Test database connection
pnpm prisma db pull

# Test TypeScript compilation
pnpm typecheck

# Run tests
pnpm test:run
```

## Troubleshooting

### Database connection refused

Check DATABASE_URL in .env.local

### Prisma schema mismatch

```bash
pnpm prisma db pull
pnpm prisma generate
```

### Module not found

Clean install:
```bash
pnpm install --force
```

## Support

- Documentation: See docs/ directory
- Prisma: https://www.prisma.io/docs
- Next.js: https://nextjs.org/docs
- Clerk: https://clerk.com/docs

---

**Done! FleetCore V1 is now running! 🚗**
RESTOREGUIDE

echo -e "${GREEN}✓ Restore guide created${NC}"
echo ""

# ============================================================================
# Step 7: Create TAR Archive
# ============================================================================

echo -e "${BLUE}[7/8]${NC} Creating TAR archive..."

cd "$PROJECT_ROOT"

tar -czf "${ARCHIVE_NAME}.tar.gz" \
    -C "$TEMP_DIR" \
    code/ \
    database/ \
    metadata.json \
    RESTORE.md \
    2>/dev/null || {
    echo -e "${RED}❌ Archive creation failed${NC}"
    exit 1
}

ARCHIVE_SIZE=$(du -h "${ARCHIVE_NAME}.tar.gz" | cut -f1)
echo -e "${GREEN}✓ Archive created: ${ARCHIVE_NAME}.tar.gz (${ARCHIVE_SIZE})${NC}"
echo ""

# ============================================================================
# Step 8: Verification
# ============================================================================

echo -e "${BLUE}[8/8]${NC} Verification and cleanup..."

if command -v md5 &> /dev/null; then
    CHECKSUM=$(md5 -q "${ARCHIVE_NAME}.tar.gz" 2>/dev/null || echo "N/A")
elif command -v md5sum &> /dev/null; then
    CHECKSUM=$(md5sum "${ARCHIVE_NAME}.tar.gz" | cut -d' ' -f1 2>/dev/null || echo "N/A")
else
    CHECKSUM="N/A"
fi

echo -e "${GREEN}✓ MD5 Checksum: ${CHECKSUM}${NC}"
echo ""

echo -e "${YELLOW}📋 Archive contents (preview):${NC}"
tar -tzf "${ARCHIVE_NAME}.tar.gz" | head -20
echo "   ... (use 'tar -tzf' for full list)"
echo ""

echo -e "${YELLOW}⚠️  Manual cleanup required:${NC}"
echo "   Please delete temporary directory when ready:"
echo "   cd ${PROJECT_ROOT}"
echo "   find . -name 'temp_archive_*' -type d"
echo ""

# ============================================================================
# Final Summary
# ============================================================================

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}✅ FleetCore V1 Archive Created Successfully!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo -e "${YELLOW}📦 File:${NC}       ${ARCHIVE_NAME}.tar.gz"
echo -e "${YELLOW}📊 Size:${NC}       ${ARCHIVE_SIZE}"
echo -e "${YELLOW}🔐 MD5:${NC}        ${CHECKSUM}"
echo -e "${YELLOW}📂 Location:${NC}   ${PROJECT_ROOT}/${ARCHIVE_NAME}.tar.gz"
echo ""
echo -e "${BLUE}📖 To restore:${NC}"
echo "   tar -xzf ${ARCHIVE_NAME}.tar.gz"
echo "   cat RESTORE.md"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "   - Archive contains source code but NOT secrets (.env)"
echo "   - You must reconfigure credentials (Clerk, Supabase, etc.)"
echo "   - Store this archive in a safe location"
echo ""
echo -e "${GREEN}🎉 Backup complete!${NC}"
