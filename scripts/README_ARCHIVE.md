# FleetCore V1 - Scripts d'Archive

## 📦 Fichiers Disponibles

### 1. `archive-fleetcore.sh`
Script principal pour créer une archive TAR complète de FleetCore V1 (code + database).

### 2. `verify-archive.sh`
Script de vérification pour valider l'intégrité d'une archive créée.

## 🚀 Utilisation

### Créer une Archive Complète

```bash
./scripts/archive-fleetcore.sh
```

**Résultat :** `fleetcore_v1_YYYYMMDD_HHMMSS.tar.gz`

### Vérifier une Archive

```bash
./scripts/verify-archive.sh fleetcore_v1_20251023_143000.tar.gz
```

## 📋 Contenu de l'Archive

```
fleetcore_v1_YYYYMMDD_HHMMSS.tar.gz
├── code/                          # Source code complet
├── database/                      # DB schema + data
├── metadata.json                  # Version info
└── RESTORE.md                     # Instructions de restauration
```

## ✅ Pré-requis

- `.env.local` avec `DATABASE_URL` configuré
- `pg_dump` installé (pour export database)
- Node.js et pnpm installés

## 🔄 Restauration

Voir le fichier `RESTORE.md` inclus dans l'archive.

Quick start:
```bash
tar -xzf fleetcore_v1_*.tar.gz
cd code/
pnpm install
# Configure .env.local
psql $DATABASE_URL < ../database/fleetcore_v1_schema.sql
pnpm dev
```
