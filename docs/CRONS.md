# FleetCore Cron Jobs

Documentation des crons - activation lors du passage en QAS avec Vercel Pro plan.

## Crons Actuels (Hobby Plan)

| Path                            | Schedule     | Description                       |
| ------------------------------- | ------------ | --------------------------------- |
| /api/cron/notifications/process | 0 6 \* \* \* | Traitement queue notifications    |
| /api/cron/opportunities/rotting | 0 8 \* \* \* | Detection opportunites stagnantes |

## Crons Fleet (Pro Plan requis)

### 1. Inspection Reminders

- **Path:** /api/cron/fleet/inspections
- **Schedule:** 0 7 \* \* \* (Daily 7h UTC)
- **Purpose:** Rappels inspections vehicules dues dans 7 jours
- **Table:** flt_vehicle_inspections
- **Flag:** reminder_sent
- **Notification:** fleet.vehicle.inspection_reminder

### 2. Insurance Expiry Alerts

- **Path:** /api/cron/fleet/insurance
- **Schedule:** 0 8 \* \* \* (Daily 8h UTC)
- **Purpose:** Alertes assurances expirant dans 30 jours
- **Table:** flt_vehicle_insurances
- **Flag:** renewal_notice_sent
- **Notification:** fleet.vehicle.insurance_expiry

### 3. Maintenance Notifications

- **Path:** /api/cron/fleet/maintenance
- **Schedule:** 0 6 \* \* \* (Daily 6h UTC)
- **Purpose:** Notifications maintenances prevues aujourd hui ou demain
- **Table:** flt_vehicle_maintenance
- **Flag:** metadata.notification_sent
- **Notification:** fleet.vehicle.maintenance_scheduled

## Fichiers Implementes

| Cron                  | Fichier                                     | Status    |
| --------------------- | ------------------------------------------- | --------- |
| Notifications Process | app/api/cron/notifications/process/route.ts | Actif     |
| Opportunities Rotting | app/api/cron/opportunities/rotting/route.ts | Actif     |
| Fleet Inspections     | app/api/cron/fleet/inspections/route.ts     | Code pret |
| Fleet Insurance       | app/api/cron/fleet/insurance/route.ts       | Code pret |
| Fleet Maintenance     | app/api/cron/fleet/maintenance/route.ts     | Code pret |

## Configuration Pro Plan (vercel.json)

Ajouter ces entrees dans vercel.json lors du passage en Pro:

```
{ "path": "/api/cron/fleet/inspections", "schedule": "0 7 * * *" }
{ "path": "/api/cron/fleet/insurance", "schedule": "0 8 * * *" }
{ "path": "/api/cron/fleet/maintenance", "schedule": "0 6 * * *" }
```

## Limites Vercel

| Plan  | Max Crons | Frequence Max |
| ----- | --------- | ------------- |
| Hobby | 2         | 1x par jour   |
| Pro   | 40        | 1x par minute |

## Test Manuel

Utiliser curl avec header Authorization Bearer CRON_SECRET sur les endpoints en local.

## Regles

- Schedule minute interdit sur Hobby plan
- Vercel rejette configs invalides sans message visible
- Tester localement avant deploiement
