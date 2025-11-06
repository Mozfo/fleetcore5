#!/bin/bash

# ============================================================================
# FleetCore V1 - Vérification d'Archive TAR
# ============================================================================
#
# USAGE:
#   ./scripts/verify-archive.sh fleetcore_v1_YYYYMMDD_HHMMSS.tar.gz
#
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ $# -eq 0 ]; then
    echo "Usage: $0 <archive.tar.gz>"
    exit 1
fi

ARCHIVE="$1"

if [ ! -f "$ARCHIVE" ]; then
    echo -e "${RED}❌ Archive not found: $ARCHIVE${NC}"
    exit 1
fi

echo "🔍 Vérification de l'archive: $ARCHIVE"
echo ""

# Size
SIZE=$(du -h "$ARCHIVE" | cut -f1)
echo -e "${YELLOW}📊 Taille:${NC} $SIZE"

# MD5 checksum
if command -v md5 &> /dev/null; then
    CHECKSUM=$(md5 -q "$ARCHIVE")
elif command -v md5sum &> /dev/null; then
    CHECKSUM=$(md5sum "$ARCHIVE" | cut -d' ' -f1)
else
    CHECKSUM="N/A"
fi
echo -e "${YELLOW}🔐 MD5:${NC} $CHECKSUM"
echo ""

# List contents
echo -e "${YELLOW}📋 Contenu:${NC}"
tar -tzf "$ARCHIVE" | head -30
echo ""

# Check critical files
echo -e "${YELLOW}✅ Fichiers critiques:${NC}"
for file in "RESTORE.md" "metadata.json" "code/package.json" "database/fleetcore_v1_schema.sql"; do
    if tar -tzf "$ARCHIVE" | grep -q "$file"; then
        echo -e "   ${GREEN}✓${NC} $file"
    else
        echo -e "   ${RED}✗${NC} $file (missing)"
    fi
done
echo ""

echo -e "${GREEN}✅ Vérification terminée${NC}"
