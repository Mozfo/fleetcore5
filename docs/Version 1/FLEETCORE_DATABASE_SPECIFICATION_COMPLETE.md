# FLEETCORE DATABASE SPECIFICATION - VERSION COMPLÈTE

## 1. VUE D'ENSEMBLE

### 1.1 Architecture Multi-Tenant

- **Isolation** : Chaque tenant a ses propres données via tenant_id
- **Hiérarchie** : Superadmin → Tenant → Users → Opérations
- **Paramétrage** : Tout est configurable sans toucher au code

### 1.2 Domaines Fonctionnels

1. **CORE** : Système de base (11 tables)
2. **FLEET** : Gestion véhicules (10 tables)
3. **VTC** : Opérations chauffeurs (10 tables)
4. **RENTAL** : Location véhicules (11 tables)
5. **FINANCE** : Facturation et paiements (12 tables)
6. **COMPLIANCE** : Conformité légale (3 tables)

**TOTAL : 57 TABLES**

---

## 2. DOMAINE CORE - SYSTÈME DE BASE

### Table 2.1: `superadmins`

**Fonction** : Administrateurs de la plateforme (éditeur logiciel)

```sql
id: UUID PRIMARY KEY
email: VARCHAR(255) UNIQUE NOT NULL
password_hash: VARCHAR(255) NOT NULL
full_name: VARCHAR(255) NOT NULL
is_active: BOOLEAN DEFAULT true
last_login_at: TIMESTAMPTZ
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_superadmins_email (email)
```

### Table 2.2: `tenants`

**Fonction** : Sociétés clientes utilisant la plateforme

```sql
id: UUID PRIMARY KEY
name: VARCHAR(255) NOT NULL -- "FleetDubai LLC"
subdomain: VARCHAR(100) UNIQUE NOT NULL -- "fleetdubai"
country_code: VARCHAR(2) NOT NULL -- 'AE', 'FR'
currency: VARCHAR(3) NOT NULL -- 'AED', 'EUR'
timezone: VARCHAR(50) NOT NULL -- 'Asia/Dubai'
business_type: VARCHAR(50) NOT NULL -- 'vtc', 'rental', 'both'
subscription_plan: VARCHAR(50) DEFAULT 'trial'
subscription_expires_at: DATE
is_active: BOOLEAN DEFAULT true
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

UNIQUE idx_tenants_subdomain (subdomain)
INDEX idx_tenants_active (is_active)
```

### Table 2.3: `users`

**Fonction** : Employés du backoffice des tenants

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
email: VARCHAR(255) NOT NULL
password_hash: VARCHAR(255) NOT NULL
first_name: VARCHAR(100) NOT NULL
last_name: VARCHAR(100) NOT NULL
phone: VARCHAR(50)
role: VARCHAR(50) NOT NULL -- 'admin', 'fleet_manager', 'finance_manager', 'agent'
permissions: JSONB DEFAULT '{}' -- Permissions détaillées
is_active: BOOLEAN DEFAULT true
last_login_at: TIMESTAMPTZ
password_changed_at: TIMESTAMPTZ
failed_login_attempts: INTEGER DEFAULT 0
locked_until: TIMESTAMPTZ
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

UNIQUE idx_users_tenant_email (tenant_id, email)
INDEX idx_users_role (role)
```

### Table 2.4: `system_parameters`

**Fonction** : Paramétrage universel de toutes les règles métier

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
country_code: VARCHAR(2) -- NULL pour global tenant
module: VARCHAR(50) NOT NULL -- 'legal', 'finance', 'vtc', 'fleet', 'validation'
category: VARCHAR(100) NOT NULL -- 'identity_format', 'tax_rules', 'expenses'
parameter_key: VARCHAR(255) NOT NULL
parameter_value: JSONB NOT NULL
parameter_type: VARCHAR(20) NOT NULL -- 'regex', 'number', 'percentage', 'boolean', 'json'
is_active: BOOLEAN DEFAULT true
valid_from: DATE
valid_to: DATE
created_by: UUID REFERENCES users(id)
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

UNIQUE idx_params_unique (tenant_id, country_code, module, category, parameter_key)
INDEX idx_params_lookup (tenant_id, module, category)
```

### Table 2.5: `parameter_audit`

**Fonction** : Historique des modifications de paramètres

```sql
id: UUID PRIMARY KEY
parameter_id: UUID REFERENCES system_parameters(id)
tenant_id: UUID REFERENCES tenants(id)
changed_by: UUID REFERENCES users(id)
old_value: JSONB
new_value: JSONB
change_reason: TEXT
changed_at: TIMESTAMPTZ NOT NULL

INDEX idx_param_audit_parameter (parameter_id)
INDEX idx_param_audit_date (changed_at)
```

### Table 2.6: `sequences`

**Fonction** : Génération de numéros uniques (factures, contrats)

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
sequence_type: VARCHAR(50) NOT NULL -- 'invoice', 'contract', 'quote'
prefix: VARCHAR(10) -- 'INV-', 'CTR-'
suffix: VARCHAR(10)
current_value: INTEGER NOT NULL DEFAULT 0
year: INTEGER -- Pour reset annuel
month: INTEGER -- Pour reset mensuel
last_updated: TIMESTAMPTZ
created_at: TIMESTAMPTZ NOT NULL

UNIQUE idx_sequences_unique (tenant_id, sequence_type, year, month)
```

### Table 2.7: `documents`

**Fonction** : Stockage centralisé de tous documents

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
entity_type: VARCHAR(50) NOT NULL -- 'vehicle', 'driver', 'contract', 'invoice'
entity_id: UUID NOT NULL
document_type: VARCHAR(50) NOT NULL -- 'license', 'insurance', 'photo'
document_name: VARCHAR(255) NOT NULL
file_url: VARCHAR(500) NOT NULL
file_size: INTEGER -- En bytes
mime_type: VARCHAR(100)
expiry_date: DATE -- Pour documents avec expiration
is_verified: BOOLEAN DEFAULT false
verified_by: UUID REFERENCES users(id)
verified_at: TIMESTAMPTZ
metadata: JSONB DEFAULT '{}'
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_documents_entity (entity_type, entity_id)
INDEX idx_documents_expiry (tenant_id, expiry_date)
```

### Table 2.8: `notifications`

**Fonction** : Système de notifications multi-canal

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
user_id: UUID REFERENCES users(id)
notification_type: VARCHAR(50) NOT NULL -- 'expiry_alert', 'payment_due', 'maintenance'
channel: VARCHAR(20) NOT NULL -- 'email', 'sms', 'push', 'in_app'
recipient_email: VARCHAR(255)
recipient_phone: VARCHAR(50)
subject: VARCHAR(255)
content: TEXT NOT NULL
metadata: JSONB DEFAULT '{}'
status: VARCHAR(50) DEFAULT 'pending' -- 'pending', 'sent', 'failed', 'read'
scheduled_for: TIMESTAMPTZ
sent_at: TIMESTAMPTZ
read_at: TIMESTAMPTZ
error_message: TEXT
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_notifications_user (user_id, status)
INDEX idx_notifications_scheduled (scheduled_for)
```

### Table 2.9: `audit_logs`

**Fonction** : Traçabilité complète des actions

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
user_id: UUID REFERENCES users(id)
entity_type: VARCHAR(50) NOT NULL
entity_id: UUID
action: VARCHAR(50) NOT NULL -- 'create', 'update', 'delete', 'view'
old_values: JSONB
new_values: JSONB
changes: JSONB -- Différences calculées
ip_address: VARCHAR(45)
user_agent: TEXT
session_id: VARCHAR(100)
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_audit_entity (entity_type, entity_id)
INDEX idx_audit_user_date (user_id, created_at)
```

### Table 2.10: `custom_fields`

**Fonction** : Champs personnalisés par entité

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
entity_type: VARCHAR(50) NOT NULL -- 'vehicle', 'driver', 'customer'
field_name: VARCHAR(50) NOT NULL
field_label: VARCHAR(100) NOT NULL
field_type: VARCHAR(20) NOT NULL -- 'text', 'number', 'date', 'select', 'boolean'
field_config: JSONB NOT NULL -- Options, validations
is_required: BOOLEAN DEFAULT false
display_order: INTEGER DEFAULT 0
is_active: BOOLEAN DEFAULT true
created_at: TIMESTAMPTZ NOT NULL

UNIQUE idx_custom_fields_unique (tenant_id, entity_type, field_name)
```

### Table 2.11: `custom_field_values`

**Fonction** : Valeurs des champs personnalisés

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
custom_field_id: UUID REFERENCES custom_fields(id) ON DELETE CASCADE
entity_id: UUID NOT NULL
value: JSONB NOT NULL
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

UNIQUE idx_custom_values_unique (custom_field_id, entity_id)
INDEX idx_custom_values_entity (entity_id)
```

---

## 3. DOMAINE FLEET - GESTION VÉHICULES

### Table 3.1: `vehicles`

**Fonction** : Parc automobile complet

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
vin: VARCHAR(17) UNIQUE NOT NULL
registration_number: VARCHAR(20) -- Plaque immatriculation
registration_emirate: VARCHAR(20) -- Dubai, Abu Dhabi, etc.
-- Propriété
ownership_type: VARCHAR(50) NOT NULL -- 'tenant', 'driver', 'employer'
owner_driver_id: UUID REFERENCES drivers(id) -- Si ownership_type = 'driver'
owner_employer_id: UUID REFERENCES employers(id) -- Si ownership_type = 'employer'
-- Caractéristiques
make: VARCHAR(50) NOT NULL -- Toyota, Tesla
model: VARCHAR(50) NOT NULL -- Camry, Model 3
variant: VARCHAR(50) -- SE, XLE
year: INTEGER NOT NULL
color: VARCHAR(30)
-- Motorisation
fuel_type: VARCHAR(20) NOT NULL -- 'petrol', 'diesel', 'electric', 'hybrid_petrol'
engine_capacity_cc: INTEGER -- 2000cc
battery_capacity_kwh: DECIMAL(10,2) -- Pour électrique
fuel_tank_capacity_liters: DECIMAL(10,2)
transmission: VARCHAR(20) -- 'manual', 'automatic'
-- Capacité
seats: INTEGER NOT NULL
doors: INTEGER
cargo_volume_liters: INTEGER
-- Véhicule autonome
is_autonomous: BOOLEAN DEFAULT false
autonomous_level: INTEGER -- 0-5 SAE levels
ai_system: VARCHAR(100) -- 'Waymo', 'Tesla FSD'
operating_employer_id: UUID REFERENCES employers(id) -- Qui opère si autonome
-- Données comptables
purchase_date: DATE
purchase_price: DECIMAL(10,2)
purchase_mileage: INTEGER
current_value: DECIMAL(10,2) -- Valeur comptable
depreciation_method: VARCHAR(20) -- 'linear', 'declining'
residual_value: DECIMAL(10,2)
-- État actuel
status: VARCHAR(50) DEFAULT 'available' -- 'available', 'assigned', 'maintenance', 'sold'
current_mileage: INTEGER DEFAULT 0
location: VARCHAR(50) -- 'dubai', 'paris'
parking_location: VARCHAR(255)
-- Émissions
co2_emissions_gkm: DECIMAL(10,2) -- Grammes CO2/km
euro_standard: VARCHAR(10) -- 'EURO_6'
-- Métadonnées
tags: JSONB DEFAULT '[]' -- Tags libres
notes: TEXT
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ
sold_at: TIMESTAMPTZ
disposal_reason: VARCHAR(100)

INDEX idx_vehicles_status (tenant_id, status)
INDEX idx_vehicles_owner (owner_driver_id, owner_employer_id)
```

### Table 3.2: `vehicle_assignments`

**Fonction** : Affectations véhicules aux drivers

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
vehicle_id: UUID REFERENCES vehicles(id)
driver_id: UUID REFERENCES drivers(id)
assignment_type: VARCHAR(20) -- 'primary', 'temporary', 'backup'
assigned_from: TIMESTAMPTZ NOT NULL
assigned_to: TIMESTAMPTZ -- NULL si en cours
rental_rate: DECIMAL(10,2) -- Si driver paie location
deposit_amount: DECIMAL(10,2)
mileage_start: INTEGER NOT NULL
mileage_end: INTEGER
fuel_level_start: INTEGER -- Pourcentage
fuel_level_end: INTEGER
condition_start: JSONB -- Photos et état
condition_end: JSONB
status: VARCHAR(50) DEFAULT 'active' -- 'active', 'completed', 'cancelled'
cancelled_reason: TEXT
created_by: UUID REFERENCES users(id)
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_assignments_vehicle (vehicle_id, assigned_from)
INDEX idx_assignments_driver (driver_id, status)
CHECK (assigned_to IS NULL OR assigned_to > assigned_from)
```

### Table 3.3: `vehicle_maintenance`

**Fonction** : Entretien et maintenance programmés

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
vehicle_id: UUID REFERENCES vehicles(id)
maintenance_type: VARCHAR(50) NOT NULL -- 'oil_change', 'tire_rotation', 'brake_service'
maintenance_category: VARCHAR(50) -- 'preventive', 'corrective', 'emergency'
scheduled_date: DATE
scheduled_mileage: INTEGER
performed_date: DATE
performed_mileage: INTEGER
performed_by: VARCHAR(255) -- Garage/Technicien
cost_parts: DECIMAL(10,2)
cost_labor: DECIMAL(10,2)
cost_total: DECIMAL(10,2)
invoice_number: VARCHAR(50)
warranty_claim: BOOLEAN DEFAULT false
next_due_date: DATE
next_due_mileage: INTEGER
notes: TEXT
documents: JSONB DEFAULT '[]' -- Liens vers documents
status: VARCHAR(50) DEFAULT 'scheduled' -- 'scheduled', 'completed', 'skipped'
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_maintenance_vehicle_date (vehicle_id, scheduled_date)
INDEX idx_maintenance_status (status)
```

### Table 3.4: `vehicle_inspections`

**Fonction** : Contrôles techniques et inspections

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
vehicle_id: UUID REFERENCES vehicles(id)
inspection_type: VARCHAR(50) NOT NULL -- 'annual', 'pre_rental', 'post_accident'
inspection_date: DATE NOT NULL
inspector_name: VARCHAR(255)
inspector_company: VARCHAR(255)
mileage_at_inspection: INTEGER
result: VARCHAR(20) NOT NULL -- 'passed', 'failed', 'conditional'
issues_found: JSONB DEFAULT '[]'
repairs_required: JSONB DEFAULT '[]'
certificate_number: VARCHAR(100)
valid_until: DATE
next_inspection_date: DATE NOT NULL
cost: DECIMAL(10,2)
notes: TEXT
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_inspections_vehicle (vehicle_id, inspection_date)
INDEX idx_inspections_expiry (valid_until)
```

### Table 3.5: `insurance_policies`

**Fonction** : Polices d'assurance véhicules

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
vehicle_id: UUID REFERENCES vehicles(id)
policy_number: VARCHAR(50) UNIQUE NOT NULL
insurance_company: VARCHAR(255) NOT NULL
insurance_type: VARCHAR(50) NOT NULL -- 'comprehensive', 'third_party'
coverage_details: JSONB -- Détails couverture
start_date: DATE NOT NULL
end_date: DATE NOT NULL
premium_amount: DECIMAL(10,2) NOT NULL
premium_frequency: VARCHAR(20) -- 'annual', 'quarterly'
deductible_amount: DECIMAL(10,2)
broker_name: VARCHAR(255)
broker_commission: DECIMAL(10,2)
is_active: BOOLEAN DEFAULT true
renewal_status: VARCHAR(50) -- 'pending', 'renewed', 'cancelled'
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_insurance_vehicle (vehicle_id, is_active)
INDEX idx_insurance_expiry (end_date)
```

### Table 3.6: `insurance_claims`

**Fonction** : Sinistres et réclamations

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
policy_id: UUID REFERENCES insurance_policies(id)
vehicle_id: UUID REFERENCES vehicles(id)
driver_id: UUID REFERENCES drivers(id) -- Qui conduisait
claim_number: VARCHAR(50) UNIQUE NOT NULL
incident_date: TIMESTAMPTZ NOT NULL
incident_location: VARCHAR(255)
incident_description: TEXT
police_report_number: VARCHAR(50)
claim_amount: DECIMAL(10,2)
approved_amount: DECIMAL(10,2)
deductible_paid: DECIMAL(10,2)
status: VARCHAR(50) DEFAULT 'reported' -- 'reported', 'processing', 'approved', 'rejected', 'settled'
rejection_reason: TEXT
settlement_date: DATE
repair_workshop: VARCHAR(255)
repair_cost: DECIMAL(10,2)
documents: JSONB DEFAULT '[]'
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_claims_vehicle (vehicle_id)
INDEX idx_claims_status (status)
```

### Table 3.7: `fuel_transactions`

**Fonction** : Consommation carburant et recharge

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
vehicle_id: UUID REFERENCES vehicles(id)
driver_id: UUID REFERENCES drivers(id)
transaction_type: VARCHAR(20) NOT NULL -- 'fuel', 'charging'
transaction_date: TIMESTAMPTZ NOT NULL
-- Pour carburant
fuel_type: VARCHAR(20) -- 'petrol_95', 'petrol_98', 'diesel'
quantity_liters: DECIMAL(10,2)
price_per_liter: DECIMAL(10,2)
-- Pour électrique
kwh_charged: DECIMAL(10,2)
price_per_kwh: DECIMAL(10,2)
charging_duration_minutes: INTEGER
charging_type: VARCHAR(20) -- 'slow', 'fast', 'superfast'
-- Commun
total_amount: DECIMAL(10,2) NOT NULL
odometer_reading: INTEGER NOT NULL
fuel_card_number: VARCHAR(50)
station_name: VARCHAR(255)
station_location: VARCHAR(255)
-- Lien frais employé
is_employee_expense: BOOLEAN DEFAULT false
expense_id: UUID REFERENCES employee_expenses(id)
-- Calculs
distance_since_last: INTEGER -- Calculé
consumption_rate: DECIMAL(10,2) -- L/100km ou kWh/100km
co2_emissions_kg: DECIMAL(10,2) -- Calculé
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_fuel_vehicle_date (vehicle_id, transaction_date)
INDEX idx_fuel_driver (driver_id)
```

### Table 3.8: `vehicle_fines`

**Fonction** : Amendes et infractions

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
vehicle_id: UUID REFERENCES vehicles(id)
fine_type: VARCHAR(50) NOT NULL -- 'speeding', 'parking', 'red_light'
fine_number: VARCHAR(50) UNIQUE
fine_date: TIMESTAMPTZ NOT NULL
fine_time: TIME
fine_location: VARCHAR(255)
speed_limit: INTEGER -- Si excès vitesse
actual_speed: INTEGER
fine_amount: DECIMAL(10,2) NOT NULL
points_deducted: INTEGER DEFAULT 0
-- Responsabilité
responsible_type: VARCHAR(20) -- 'driver', 'customer', 'unknown'
responsible_id: UUID -- driver_id ou customer_id
identification_method: VARCHAR(50) -- 'assignment', 'gps', 'declaration'
identified_date: DATE
-- Paiement
due_date: DATE NOT NULL
paid_date: DATE
paid_amount: DECIMAL(10,2)
paid_by: VARCHAR(20) -- 'company', 'driver', 'customer'
payment_reference: VARCHAR(100)
-- Déduction
deducted_from_salary: BOOLEAN DEFAULT false
deduction_id: UUID REFERENCES driver_deductions(id)
-- Contestation
contested: BOOLEAN DEFAULT false
contest_result: VARCHAR(50) -- 'upheld', 'reduced', 'cancelled'
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_fines_vehicle_date (vehicle_id, fine_date)
INDEX idx_fines_responsible (responsible_type, responsible_id)
INDEX idx_fines_payment (paid_date)
```

### Table 3.9: `tolls`

**Fonction** : Péages et Salik

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
vehicle_id: UUID REFERENCES vehicles(id)
driver_id: UUID REFERENCES drivers(id)
toll_type: VARCHAR(50) NOT NULL -- 'salik', 'darb', 'telepeage'
toll_gate: VARCHAR(100) -- Nom du péage
toll_date: DATE NOT NULL
toll_time: TIME NOT NULL
amount: DECIMAL(10,2) NOT NULL
tag_number: VARCHAR(50) -- Numéro tag Salik
is_employee_expense: BOOLEAN DEFAULT false
expense_id: UUID REFERENCES employee_expenses(id)
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_tolls_vehicle_date (vehicle_id, toll_date)
INDEX idx_tolls_driver (driver_id)
```

### Table 3.10: `vehicle_ownership_history`

**Fonction** : Historique propriété véhicules

```sql
id: UUID PRIMARY KEY
vehicle_id: UUID REFERENCES vehicles(id)
ownership_type: VARCHAR(50) NOT NULL -- 'tenant', 'driver', 'employer'
owner_id: UUID -- driver_id ou employer_id
ownership_start: DATE NOT NULL
ownership_end: DATE
acquisition_type: VARCHAR(50) -- 'purchase', 'lease', 'transfer'
acquisition_price: DECIMAL(10,2)
disposal_type: VARCHAR(50) -- 'sale', 'transfer', 'scrap'
disposal_price: DECIMAL(10,2)
documents: JSONB DEFAULT '[]'
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_ownership_vehicle (vehicle_id, ownership_start)
```

---

## 4. DOMAINE VTC - OPÉRATIONS CHAUFFEURS

### Table 4.1: `employers`

**Fonction** : Sociétés employant des drivers

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
employer_code: VARCHAR(50) UNIQUE NOT NULL
company_name: VARCHAR(255) NOT NULL
trade_license: VARCHAR(100) NOT NULL
tax_id: VARCHAR(50) -- VAT number
license_type: VARCHAR(50) -- Type licence VTC
license_number: VARCHAR(100)
license_expiry: DATE
-- Contact
email: VARCHAR(255) NOT NULL
phone: VARCHAR(50) NOT NULL
address: JSONB NOT NULL
contact_person: VARCHAR(255)
-- Financier
bank_account: VARCHAR(100)
bank_name: VARCHAR(255)
receives_driver_revenue: BOOLEAN DEFAULT true
commission_rate: DECIMAL(5,2) -- Commission société
-- Status
status: VARCHAR(50) DEFAULT 'active'
onboarding_date: DATE
termination_date: DATE
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_employers_status (tenant_id, status)
```

### Table 4.2: `drivers`

**Fonction** : Chauffeurs (toujours personnes physiques)

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
driver_code: VARCHAR(50) UNIQUE NOT NULL
driver_type: VARCHAR(20) NOT NULL DEFAULT 'human' -- 'human', 'virtual'
-- Identité (NULL si virtual)
first_name: VARCHAR(100)
last_name: VARCHAR(100)
date_of_birth: DATE
nationality: VARCHAR(2)
national_id: VARCHAR(100)
passport_number: VARCHAR(50)
visa_number: VARCHAR(50)
visa_expiry: DATE
-- Contact
email: VARCHAR(255)
phone: VARCHAR(50) NOT NULL
address: JSONB
emergency_contact: JSONB
-- Permis
license_number: VARCHAR(50)
license_type: VARCHAR(50) -- Type permis
license_issue_date: DATE
license_expiry: DATE NOT NULL
license_points: INTEGER DEFAULT 24 -- UAE: 24, FR: 12
-- Emploi
employment_type: VARCHAR(20) NOT NULL -- 'employee', 'freelance', 'contractor'
employer_id: UUID REFERENCES employers(id)
hire_date: DATE
termination_date: DATE
-- VTC
vtc_license_number: VARCHAR(100)
vtc_license_expiry: DATE
commission_rate: DECIMAL(5,2) -- Commission driver
daily_target: DECIMAL(10,2) -- Objectif quotidien
weekly_target: DECIMAL(10,2)
-- Driver virtuel (2026)
vehicle_id: UUID REFERENCES vehicles(id) -- Si virtual, lien au véhicule autonome
ai_model: VARCHAR(100) -- 'Waymo', 'Tesla FSD'
max_vehicles: INTEGER DEFAULT 1 -- 1 pour human, N pour virtual
-- Status
status: VARCHAR(50) DEFAULT 'active' -- 'active', 'suspended', 'terminated'
suspension_reason: TEXT
suspension_date: DATE
rating: DECIMAL(3,2) -- Note moyenne
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_drivers_employer (employer_id)
INDEX idx_drivers_status (tenant_id, status)
INDEX idx_drivers_type (driver_type)
```

### Table 4.3: `driver_platforms`

**Fonction** : Liens drivers avec plateformes VTC

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
driver_id: UUID REFERENCES drivers(id)
platform: VARCHAR(50) NOT NULL -- 'uber', 'bolt', 'careem'
platform_driver_id: VARCHAR(100) NOT NULL -- ID sur la plateforme
platform_email: VARCHAR(255)
platform_phone: VARCHAR(50)
account_status: VARCHAR(50) -- 'active', 'suspended', 'blocked'
rating: DECIMAL(3,2) -- Note sur la plateforme
total_trips: INTEGER DEFAULT 0
joined_date: DATE
is_active: BOOLEAN DEFAULT true
documents_verified: BOOLEAN DEFAULT false
badge_number: VARCHAR(50) -- Numéro badge Uber/Careem
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

UNIQUE idx_driver_platform (driver_id, platform)
INDEX idx_platforms_driver (driver_id)
```

### Table 4.4: `platform_configurations`

**Fonction** : Configuration accès plateformes

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
platform: VARCHAR(50) NOT NULL -- 'uber', 'bolt', 'careem'
api_url: VARCHAR(500)
api_key: VARCHAR(500) -- Encrypted
api_secret: VARCHAR(500) -- Encrypted
client_id: VARCHAR(255)
webhook_url: VARCHAR(500)
webhook_secret: VARCHAR(255)
import_method: VARCHAR(20) NOT NULL -- 'api', 'csv', 'email', 'manual'
import_frequency: VARCHAR(20) -- 'realtime', 'hourly', 'daily', 'weekly'
auto_import: BOOLEAN DEFAULT false
last_import_at: TIMESTAMPTZ
next_import_at: TIMESTAMPTZ
is_active: BOOLEAN DEFAULT true
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

UNIQUE idx_platform_config (tenant_id, platform)
```

### Table 4.5: `revenue_imports`

**Fonction** : Traçabilité imports revenus

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
platform: VARCHAR(50) NOT NULL
import_method: VARCHAR(20) NOT NULL -- 'api', 'csv', 'manual'
import_date: TIMESTAMPTZ NOT NULL
file_name: VARCHAR(255)
file_url: VARCHAR(500)
period_start: DATE NOT NULL
period_end: DATE NOT NULL
total_trips: INTEGER DEFAULT 0
total_drivers: INTEGER DEFAULT 0
gross_amount: DECIMAL(10,2)
net_amount: DECIMAL(10,2)
status: VARCHAR(50) DEFAULT 'processing' -- 'processing', 'completed', 'failed'
processed_records: INTEGER DEFAULT 0
failed_records: INTEGER DEFAULT 0
error_log: JSONB DEFAULT '[]'
imported_by: UUID REFERENCES users(id)
created_at: TIMESTAMPTZ NOT NULL
completed_at: TIMESTAMPTZ

INDEX idx_imports_date (import_date)
INDEX idx_imports_platform (platform, period_start)
```

### Table 4.6: `platform_revenues`

**Fonction** : Revenus détaillés des plateformes

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
import_batch_id: UUID REFERENCES revenue_imports(id)
driver_id: UUID REFERENCES drivers(id)
vehicle_id: UUID REFERENCES vehicles(id)
platform: VARCHAR(50) NOT NULL
-- Transaction
trip_id: VARCHAR(100) UNIQUE NOT NULL
trip_date: DATE NOT NULL
trip_time: TIME NOT NULL
pickup_time: TIMESTAMPTZ
dropoff_time: TIMESTAMPTZ
-- Localisation
pickup_location: VARCHAR(255)
pickup_latitude: DECIMAL(10,8)
pickup_longitude: DECIMAL(11,8)
dropoff_location: VARCHAR(255)
dropoff_latitude: DECIMAL(10,8)
dropoff_longitude: DECIMAL(11,8)
-- Métriques
distance_km: DECIMAL(10,2)
duration_minutes: INTEGER
wait_time_minutes: INTEGER
-- Financier
fare_amount: DECIMAL(10,2) -- Tarif client
surge_amount: DECIMAL(10,2) -- Surge pricing
tips_amount: DECIMAL(10,2)
gross_amount: DECIMAL(10,2) NOT NULL -- Total brut
platform_commission: DECIMAL(10,2) -- Commission plateforme
platform_fee: DECIMAL(10,2) -- Frais plateforme
net_amount: DECIMAL(10,2) NOT NULL -- Net pour driver
-- Paiement
payment_method: VARCHAR(50) -- 'cash', 'card', 'wallet'
cash_collected: DECIMAL(10,2) -- Si cash
-- Récepteur revenus
revenue_recipient_type: VARCHAR(20) NOT NULL -- 'driver', 'employer'
revenue_recipient_id: UUID NOT NULL
-- Statut
trip_status: VARCHAR(50) -- 'completed', 'cancelled'
cancellation_reason: VARCHAR(255)
is_disputed: BOOLEAN DEFAULT false
dispute_reason: TEXT
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_revenues_driver_date (driver_id, trip_date)
INDEX idx_revenues_vehicle_date (vehicle_id, trip_date)
INDEX idx_revenues_batch (import_batch_id)
```

### Table 4.7: `driver_deductions`

**Fonction** : Déductions sur revenus drivers

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
-- Récepteur de la déduction
deduction_recipient_type: VARCHAR(20) NOT NULL -- 'driver', 'employer'
deduction_recipient_id: UUID NOT NULL
-- Détails
deduction_type: VARCHAR(50) NOT NULL -- 'vehicle_rental', 'fuel', 'fine', 'insurance', 'advance'
deduction_category: VARCHAR(50) -- 'fixed', 'variable', 'penalty'
amount: DECIMAL(10,2) NOT NULL
currency: VARCHAR(3) DEFAULT 'AED'
period_start: DATE NOT NULL
period_end: DATE NOT NULL
description: TEXT
-- Référence
reference_type: VARCHAR(50) -- 'vehicle_assignment', 'fine', 'fuel_transaction'
reference_id: UUID
-- Paiement
is_paid: BOOLEAN DEFAULT false
paid_date: DATE
balance_id: UUID REFERENCES driver_balances(id)
created_by: UUID REFERENCES users(id)
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_deductions_recipient (deduction_recipient_type, deduction_recipient_id)
INDEX idx_deductions_period (period_start, period_end)
INDEX idx_deductions_type (deduction_type)
```

### Table 4.8: `driver_balances`

**Fonction** : Soldes périodiques drivers

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
driver_id: UUID REFERENCES drivers(id)
employer_id: UUID REFERENCES employers(id) -- Si employé
period_type: VARCHAR(20) NOT NULL -- 'weekly', 'monthly'
period_start: DATE NOT NULL
period_end: DATE NOT NULL
-- Revenus
total_trips: INTEGER DEFAULT 0
gross_revenue: DECIMAL(10,2) NOT NULL DEFAULT 0
platform_commission: DECIMAL(10,2) DEFAULT 0
net_revenue: DECIMAL(10,2) NOT NULL DEFAULT 0
cash_collected: DECIMAL(10,2) DEFAULT 0
-- Déductions
vehicle_rental: DECIMAL(10,2) DEFAULT 0
fuel_cost: DECIMAL(10,2) DEFAULT 0
fines: DECIMAL(10,2) DEFAULT 0
other_deductions: DECIMAL(10,2) DEFAULT 0
total_deductions: DECIMAL(10,2) NOT NULL DEFAULT 0
-- Solde
previous_balance: DECIMAL(10,2) DEFAULT 0 -- Report période précédente
net_balance: DECIMAL(10,2) NOT NULL
final_payment: DECIMAL(10,2) -- Après ajustements
-- Validation
status: VARCHAR(50) DEFAULT 'draft' -- 'draft', 'pending', 'approved', 'paid'
approved_by: UUID REFERENCES users(id)
approved_at: TIMESTAMPTZ
notes: TEXT
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_balances_driver_period (driver_id, period_start)
INDEX idx_balances_status (status)
UNIQUE idx_balance_unique (driver_id, period_start, period_end)
```

### Table 4.9: `driver_payments`

**Fonction** : Paiements effectués aux drivers

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
driver_id: UUID REFERENCES drivers(id)
employer_id: UUID REFERENCES employers(id) -- Si via employer
balance_id: UUID REFERENCES driver_balances(id)
payment_type: VARCHAR(50) NOT NULL -- 'salary', 'reimbursement', 'bonus'
amount: DECIMAL(10,2) NOT NULL
currency: VARCHAR(3) DEFAULT 'AED'
payment_method: VARCHAR(50) NOT NULL -- 'bank_transfer', 'cash', 'check'
payment_date: DATE NOT NULL
-- Détails bancaires
bank_name: VARCHAR(255)
account_number: VARCHAR(100)
transfer_reference: VARCHAR(100)
-- Validation
processed_by: UUID REFERENCES users(id)
receipt_number: VARCHAR(50)
notes: TEXT
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_driver_payments_driver (driver_id, payment_date)
INDEX idx_driver_payments_balance (balance_id)
```

### Table 4.10: `employee_expenses`

**Fonction** : Frais employés à rembourser

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
driver_id: UUID REFERENCES drivers(id)
employer_id: UUID REFERENCES employers(id)
vehicle_id: UUID REFERENCES vehicles(id)
expense_type: VARCHAR(50) NOT NULL -- 'fuel', 'cleaning', 'toll', 'parking', 'maintenance'
expense_date: DATE NOT NULL
amount: DECIMAL(10,2) NOT NULL
currency: VARCHAR(3) DEFAULT 'AED'
receipt_number: VARCHAR(50)
receipt_url: VARCHAR(500)
vendor_name: VARCHAR(255)
description: TEXT
-- Remboursement
reimbursement_status: VARCHAR(50) DEFAULT 'pending' -- 'pending', 'approved', 'rejected', 'paid'
reimbursement_percentage: DECIMAL(5,2) DEFAULT 100
reimbursed_amount: DECIMAL(10,2)
rejection_reason: TEXT
-- Validation
submitted_at: TIMESTAMPTZ NOT NULL
approved_by: UUID REFERENCES users(id)
approved_at: TIMESTAMPTZ
paid_at: TIMESTAMPTZ
payment_reference: VARCHAR(100)
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_expenses_driver (driver_id, expense_date)
INDEX idx_expenses_status (reimbursement_status)
```

---

## 5. DOMAINE RENTAL - LOCATION VÉHICULES

### Table 5.1: `customers`

**Fonction** : Clients location (personnes ou sociétés)

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
customer_code: VARCHAR(50) UNIQUE NOT NULL
customer_type: VARCHAR(20) NOT NULL -- 'individual', 'company'
-- Si Individual
first_name: VARCHAR(100)
last_name: VARCHAR(100)
date_of_birth: DATE
nationality: VARCHAR(2)
national_id: VARCHAR(100)
passport_number: VARCHAR(50)
-- Si Company
company_name: VARCHAR(255)
trade_license: VARCHAR(100)
tax_id: VARCHAR(50) -- VAT Number
registration_number: VARCHAR(100)
signatory_name: VARCHAR(255) -- Signataire autorisé
signatory_title: VARCHAR(100)
-- Contact
email: VARCHAR(255) NOT NULL
phone: VARCHAR(50) NOT NULL
mobile: VARCHAR(50)
fax: VARCHAR(50)
website: VARCHAR(255)
-- Adresse
address: JSONB NOT NULL
billing_address: JSONB
-- Financier
credit_limit: DECIMAL(10,2) DEFAULT 0
payment_terms: INTEGER DEFAULT 0 -- Jours crédit
payment_method: VARCHAR(50) -- 'cash', 'transfer', 'card'
bank_name: VARCHAR(255)
bank_account: VARCHAR(100)
deposit_required: BOOLEAN DEFAULT true
-- Classification
customer_category: VARCHAR(50) -- 'vip', 'regular', 'new'
industry_type: VARCHAR(100) -- Pour companies
company_size: VARCHAR(20) -- 'small', 'medium', 'large'
-- Status
status: VARCHAR(50) DEFAULT 'active' -- 'active', 'blocked', 'blacklisted'
block_reason: TEXT
acquisition_source: VARCHAR(50) -- 'website', 'phone', 'walkin', 'referral'
acquisition_date: DATE
last_contract_date: DATE
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_customers_type (customer_type)
INDEX idx_customers_status (tenant_id, status)
```

### Table 5.2: `leads`

**Fonction** : Prospects commerciaux

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
lead_source: VARCHAR(50) NOT NULL -- 'website', 'phone', 'referral', 'event'
lead_type: VARCHAR(20) -- 'individual', 'company'
-- Contact
company_name: VARCHAR(255)
contact_name: VARCHAR(255) NOT NULL
contact_title: VARCHAR(100)
contact_email: VARCHAR(255) NOT NULL
contact_phone: VARCHAR(50) NOT NULL
-- Besoin
fleet_size: INTEGER -- Nombre véhicules souhaités
vehicle_type: VARCHAR(100) -- Type souhaité
rental_duration: INTEGER -- Durée en mois
budget_range: VARCHAR(50)
required_date: DATE
-- Qualification
lead_score: INTEGER -- 0-100
lead_status: VARCHAR(50) DEFAULT 'new' -- 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'
qualification_notes: TEXT
loss_reason: VARCHAR(100)
competitor_won: VARCHAR(255)
-- Suivi
assigned_to: UUID REFERENCES users(id)
last_contact_date: DATE
next_action_date: DATE
next_action_type: VARCHAR(50)
-- Conversion
converted_to_customer_id: UUID REFERENCES customers(id)
conversion_date: DATE
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_leads_status (lead_status)
INDEX idx_leads_assigned (assigned_to)
```

### Table 5.3: `quotes`

**Fonction** : Devis location

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
quote_number: VARCHAR(50) UNIQUE NOT NULL
customer_id: UUID REFERENCES customers(id)
lead_id: UUID REFERENCES leads(id)
quote_date: DATE NOT NULL
valid_until: DATE NOT NULL
-- Durée
rental_type: VARCHAR(50) NOT NULL -- 'daily', 'weekly', 'monthly', 'long_term'
rental_duration: INTEGER NOT NULL -- En jours/mois selon type
start_date: DATE
end_date: DATE
-- Financier
subtotal: DECIMAL(10,2) NOT NULL
discount_percentage: DECIMAL(5,2) DEFAULT 0
discount_amount: DECIMAL(10,2) DEFAULT 0
tax_rate: DECIMAL(5,2) NOT NULL
tax_amount: DECIMAL(10,2) NOT NULL
total_amount: DECIMAL(10,2) NOT NULL
deposit_amount: DECIMAL(10,2) DEFAULT 0
-- Options
include_insurance: BOOLEAN DEFAULT true
include_maintenance: BOOLEAN DEFAULT false
include_replacement: BOOLEAN DEFAULT false
additional_drivers: INTEGER DEFAULT 0
-- Status
status: VARCHAR(50) DEFAULT 'draft' -- 'draft', 'sent', 'negotiation', 'accepted', 'rejected', 'expired'
sent_date: DATE
accepted_date: DATE
rejection_reason: TEXT
-- Création
created_by: UUID REFERENCES users(id)
approved_by: UUID REFERENCES users(id)
notes: TEXT
terms_conditions: TEXT
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_quotes_customer (customer_id)
INDEX idx_quotes_status (status)
```

### Table 5.4: `quote_items`

**Fonction** : Lignes de devis

```sql
id: UUID PRIMARY KEY
quote_id: UUID REFERENCES quotes(id) ON DELETE CASCADE
vehicle_category: VARCHAR(50) NOT NULL -- 'sedan', 'suv', 'van'
vehicle_make: VARCHAR(50) -- Marque souhaitée
vehicle_model: VARCHAR(50) -- Modèle souhaité
quantity: INTEGER NOT NULL DEFAULT 1
rate_type: VARCHAR(20) NOT NULL -- 'daily', 'weekly', 'monthly'
rate_amount: DECIMAL(10,2) NOT NULL
total_days: INTEGER NOT NULL
subtotal: DECIMAL(10,2) NOT NULL
-- Options véhicule
with_driver: BOOLEAN DEFAULT false
driver_rate: DECIMAL(10,2) DEFAULT 0
fuel_policy: VARCHAR(50) -- 'full_to_full', 'prepaid'
mileage_limit: INTEGER -- KM inclus
excess_mileage_rate: DECIMAL(10,2)
-- Accessoires
accessories: JSONB DEFAULT '[]' -- GPS, siège bébé, etc.
accessories_cost: DECIMAL(10,2) DEFAULT 0
notes: TEXT
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_quote_items_quote (quote_id)
```

### Table 5.5: `contracts`

**Fonction** : Contrats de location

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
contract_number: VARCHAR(50) UNIQUE NOT NULL
customer_id: UUID REFERENCES customers(id)
quote_id: UUID REFERENCES quotes(id)
contract_type: VARCHAR(20) NOT NULL -- 'rental', 'lease', 'rent_to_own'
-- Dates
start_date: DATE NOT NULL
end_date: DATE NOT NULL
actual_start_date: DATE
actual_end_date: DATE
duration_days: INTEGER NOT NULL -- Calculé
-- Financier
monthly_amount: DECIMAL(10,2)
total_amount: DECIMAL(10,2) NOT NULL
deposit_amount: DECIMAL(10,2) DEFAULT 0
deposit_status: VARCHAR(50) -- 'pending', 'paid', 'refunded', 'forfeited'
-- Signature
signature_date: DATE
signed_by_customer: VARCHAR(255)
signed_by_company: VARCHAR(255)
signature_method: VARCHAR(50) -- 'physical', 'electronic'
contract_url: VARCHAR(500)
-- Status
status: VARCHAR(50) DEFAULT 'draft' -- 'draft', 'active', 'expired', 'terminated', 'renewed'
termination_date: DATE
termination_reason: TEXT
renewal_contract_id: UUID REFERENCES contracts(id)
-- Conditions
payment_terms: INTEGER DEFAULT 0
late_fee_percentage: DECIMAL(5,2) DEFAULT 5
grace_period_days: INTEGER DEFAULT 3
terms_conditions: TEXT
special_conditions: TEXT
created_by: UUID REFERENCES users(id)
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_contracts_customer (customer_id)
INDEX idx_contracts_status (status)
INDEX idx_contracts_dates (start_date, end_date)
```

### Table 5.6: `contract_vehicles`

**Fonction** : Véhicules assignés aux contrats

```sql
id: UUID PRIMARY KEY
contract_id: UUID REFERENCES contracts(id) ON DELETE CASCADE
vehicle_id: UUID REFERENCES vehicles(id)
-- Tarification
monthly_rate: DECIMAL(10,2) NOT NULL
daily_rate: DECIMAL(10,2)
deposit_amount: DECIMAL(10,2) DEFAULT 0
-- Kilométrage
mileage_limit_monthly: INTEGER
mileage_limit_total: INTEGER
excess_mileage_rate: DECIMAL(10,2)
mileage_at_start: INTEGER
mileage_at_return: INTEGER
excess_mileage_charge: DECIMAL(10,2)
-- Dates
delivery_date: DATE
delivery_time: TIME
delivery_location: VARCHAR(255)
return_date: DATE
return_time: TIME
return_location: VARCHAR(255)
-- Carburant
fuel_at_delivery: INTEGER -- Pourcentage
fuel_at_return: INTEGER
fuel_charge: DECIMAL(10,2)
-- Status
status: VARCHAR(50) DEFAULT 'reserved' -- 'reserved', 'delivered', 'returned'
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_contract_vehicles_contract (contract_id)
INDEX idx_contract_vehicles_vehicle (vehicle_id)
```

### Table 5.7: `check_in_out`

**Fonction** : États des lieux véhicules

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
contract_vehicle_id: UUID REFERENCES contract_vehicles(id)
check_type: VARCHAR(10) NOT NULL -- 'out', 'in'
check_date: TIMESTAMPTZ NOT NULL
-- État véhicule
mileage: INTEGER NOT NULL
fuel_level: INTEGER NOT NULL -- Pourcentage
-- Condition
exterior_condition: JSONB -- Dommages extérieurs
interior_condition: JSONB -- État intérieur
tires_condition: JSONB -- État pneus
-- Documents
documents_checked: JSONB -- Registration, insurance, etc.
accessories_checked: JSONB -- Spare wheel, tools, etc.
-- Photos
photos: JSONB DEFAULT '[]' -- URLs photos
-- Remarques
customer_remarks: TEXT
agent_remarks: TEXT
customer_signature: VARCHAR(500) -- Signature URL
agent_signature: VARCHAR(500)
-- Responsable
performed_by: UUID REFERENCES users(id)
customer_name: VARCHAR(255)
customer_id_verified: BOOLEAN DEFAULT false
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_checkinout_contract (contract_vehicle_id)
INDEX idx_checkinout_date (check_date)
```

### Table 5.8: `contract_amendments`

**Fonction** : Modifications de contrats

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
contract_id: UUID REFERENCES contracts(id)
amendment_number: VARCHAR(50) UNIQUE NOT NULL
amendment_type: VARCHAR(50) NOT NULL -- 'extension', 'vehicle_change', 'rate_change'
amendment_date: DATE NOT NULL
effective_date: DATE NOT NULL
-- Détails changement
old_value: JSONB NOT NULL
new_value: JSONB NOT NULL
reason: TEXT
financial_impact: DECIMAL(10,2) -- Impact financier
-- Approbation
requested_by: UUID REFERENCES users(id)
approved_by: UUID REFERENCES users(id)
approval_date: DATE
status: VARCHAR(50) DEFAULT 'pending' -- 'pending', 'approved', 'rejected'
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_amendments_contract (contract_id)
```

### Table 5.9: `driver_customer_links`

**Fonction** : Liens driver-customer pour réconciliation

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
driver_id: UUID REFERENCES drivers(id)
customer_id: UUID REFERENCES customers(id)
link_type: VARCHAR(50) NOT NULL -- 'same_person', 'driver_works_for_customer'
verified: BOOLEAN DEFAULT false
verified_by: UUID REFERENCES users(id)
verified_at: TIMESTAMPTZ
created_at: TIMESTAMPTZ NOT NULL

UNIQUE idx_driver_customer (driver_id, customer_id)
```

### Table 5.10: `employer_customer_links`

**Fonction** : Liens employer-customer

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
employer_id: UUID REFERENCES employers(id)
customer_id: UUID REFERENCES customers(id)
link_type: VARCHAR(50) NOT NULL -- 'same_company'
verified: BOOLEAN DEFAULT false
verified_by: UUID REFERENCES users(id)
verified_at: TIMESTAMPTZ
created_at: TIMESTAMPTZ NOT NULL

UNIQUE idx_employer_customer (employer_id, customer_id)
```

### Table 5.11: `reservations`

**Fonction** : Réservations futures

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
customer_id: UUID REFERENCES customers(id)
vehicle_category: VARCHAR(50) NOT NULL
pickup_date: DATE NOT NULL
pickup_time: TIME
pickup_location: VARCHAR(255)
return_date: DATE NOT NULL
return_time: TIME
return_location: VARCHAR(255)
status: VARCHAR(50) DEFAULT 'pending' -- 'pending', 'confirmed', 'cancelled'
confirmation_number: VARCHAR(50)
notes: TEXT
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_reservations_dates (pickup_date, return_date)
INDEX idx_reservations_customer (customer_id)
```

---

## 6. DOMAINE FINANCE - GESTION FINANCIÈRE

### Table 6.1: `invoices`

**Fonction** : Factures émises

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
invoice_number: VARCHAR(50) UNIQUE NOT NULL
invoice_type: VARCHAR(50) NOT NULL -- 'rental', 'service', 'penalty', 'deposit'
-- Client
customer_id: UUID REFERENCES customers(id)
contract_id: UUID REFERENCES contracts(id)
-- Dates
invoice_date: DATE NOT NULL
period_start: DATE
period_end: DATE
due_date: DATE NOT NULL
-- Montants
subtotal: DECIMAL(10,2) NOT NULL
discount_amount: DECIMAL(10,2) DEFAULT 0
tax_rate: DECIMAL(5,2) NOT NULL
tax_amount: DECIMAL(10,2) NOT NULL
total_amount: DECIMAL(10,2) NOT NULL
-- Paiement
paid_amount: DECIMAL(10,2) DEFAULT 0
balance_due: DECIMAL(10,2) NOT NULL
status: VARCHAR(50) DEFAULT 'draft' -- 'draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'
-- Envoi
sent_date: DATE
sent_method: VARCHAR(50) -- 'email', 'post', 'hand'
reminder_count: INTEGER DEFAULT 0
last_reminder_date: DATE
-- Documents
pdf_url: VARCHAR(500)
notes: TEXT
internal_notes: TEXT
created_by: UUID REFERENCES users(id)
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_invoices_customer (customer_id)
INDEX idx_invoices_status (status)
INDEX idx_invoices_due (due_date)
```

### Table 6.2: `invoice_items`

**Fonction** : Lignes de facture

```sql
id: UUID PRIMARY KEY
invoice_id: UUID REFERENCES invoices(id) ON DELETE CASCADE
item_type: VARCHAR(50) NOT NULL -- 'rental', 'mileage', 'fuel', 'damage', 'fine'
description: VARCHAR(500) NOT NULL
quantity: DECIMAL(10,2) NOT NULL DEFAULT 1
unit_price: DECIMAL(10,2) NOT NULL
discount_percentage: DECIMAL(5,2) DEFAULT 0
amount: DECIMAL(10,2) NOT NULL
tax_rate: DECIMAL(5,2)
tax_amount: DECIMAL(10,2)
total_amount: DECIMAL(10,2) NOT NULL
reference_type: VARCHAR(50) -- Type entité liée
reference_id: UUID -- ID entité liée
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_invoice_items_invoice (invoice_id)
```

### Table 6.3: `payments`

**Fonction** : Paiements reçus

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
payment_number: VARCHAR(50) UNIQUE NOT NULL
customer_id: UUID REFERENCES customers(id)
payment_date: DATE NOT NULL
amount: DECIMAL(10,2) NOT NULL
currency: VARCHAR(3) DEFAULT 'AED'
payment_method: VARCHAR(50) NOT NULL -- 'cash', 'transfer', 'card', 'check'
-- Détails méthode
bank_name: VARCHAR(255)
check_number: VARCHAR(50)
card_last_digits: VARCHAR(4)
transfer_reference: VARCHAR(100)
-- Traitement
status: VARCHAR(50) DEFAULT 'pending' -- 'pending', 'confirmed', 'bounced', 'refunded'
confirmed_date: DATE
confirmation_reference: VARCHAR(100)
-- Notes
notes: TEXT
receipt_number: VARCHAR(50)
receipt_url: VARCHAR(500)
collected_by: UUID REFERENCES users(id)
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_payments_customer (customer_id)
INDEX idx_payments_date (payment_date)
INDEX idx_payments_status (status)
```

### Table 6.4: `payment_allocations`

**Fonction** : Affectation paiements aux factures

```sql
id: UUID PRIMARY KEY
payment_id: UUID REFERENCES payments(id) ON DELETE CASCADE
invoice_id: UUID REFERENCES invoices(id)
allocated_amount: DECIMAL(10,2) NOT NULL
allocation_date: DATE NOT NULL
notes: TEXT
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_allocations_payment (payment_id)
INDEX idx_allocations_invoice (invoice_id)
```

### Table 6.5: `credit_notes`

**Fonction** : Avoirs émis

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
credit_note_number: VARCHAR(50) UNIQUE NOT NULL
customer_id: UUID REFERENCES customers(id)
invoice_id: UUID REFERENCES invoices(id) -- Facture d'origine
credit_date: DATE NOT NULL
amount: DECIMAL(10,2) NOT NULL
tax_amount: DECIMAL(10,2)
total_amount: DECIMAL(10,2) NOT NULL
reason: VARCHAR(255) NOT NULL
reason_details: TEXT
status: VARCHAR(50) DEFAULT 'draft' -- 'draft', 'approved', 'applied'
applied_to_invoice_id: UUID REFERENCES invoices(id)
applied_date: DATE
approved_by: UUID REFERENCES users(id)
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_credit_notes_customer (customer_id)
INDEX idx_credit_notes_invoice (invoice_id)
```

### Table 6.6: `deposits`

**Fonction** : Gestion des cautions

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
contract_id: UUID REFERENCES contracts(id)
customer_id: UUID REFERENCES customers(id)
deposit_type: VARCHAR(20) NOT NULL -- 'blocked', 'authorization'
amount: DECIMAL(10,2) NOT NULL
currency: VARCHAR(3) DEFAULT 'AED'
payment_method: VARCHAR(50) NOT NULL -- 'card', 'transfer', 'cash'
-- Blocage/Autorisation
transaction_reference: VARCHAR(100)
authorization_code: VARCHAR(50)
card_last_digits: VARCHAR(4)
-- Status
status: VARCHAR(50) DEFAULT 'held' -- 'held', 'released', 'forfeited', 'partial'
held_date: DATE NOT NULL
released_date: DATE
released_amount: DECIMAL(10,2)
forfeited_amount: DECIMAL(10,2)
forfeit_reason: TEXT
-- Documents
receipt_number: VARCHAR(50)
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_deposits_contract (contract_id)
INDEX idx_deposits_customer (customer_id)
INDEX idx_deposits_status (status)
```

### Table 6.7: `bank_accounts`

**Fonction** : Comptes bancaires société

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
account_name: VARCHAR(255) NOT NULL
bank_name: VARCHAR(255) NOT NULL
branch_name: VARCHAR(255)
account_number: VARCHAR(50) NOT NULL
iban: VARCHAR(50)
swift_code: VARCHAR(20)
currency: VARCHAR(3) NOT NULL
account_type: VARCHAR(50) -- 'current', 'savings'
is_primary: BOOLEAN DEFAULT false
is_active: BOOLEAN DEFAULT true
opening_date: DATE
opening_balance: DECIMAL(10,2) DEFAULT 0
current_balance: DECIMAL(10,2) DEFAULT 0
last_reconciled_date: DATE
created_at: TIMESTAMPTZ NOT NULL

UNIQUE idx_bank_accounts (tenant_id, account_number)
```

### Table 6.8: `bank_transactions`

**Fonction** : Transactions bancaires

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
bank_account_id: UUID REFERENCES bank_accounts(id)
transaction_date: DATE NOT NULL
value_date: DATE NOT NULL
transaction_type: VARCHAR(50) -- 'credit', 'debit'
description: VARCHAR(500)
reference: VARCHAR(100)
debit_amount: DECIMAL(10,2)
credit_amount: DECIMAL(10,2)
balance: DECIMAL(10,2)
-- Réconciliation
is_reconciled: BOOLEAN DEFAULT false
reconciled_with_type: VARCHAR(50) -- 'payment', 'invoice', 'expense'
reconciled_with_id: UUID
reconciliation_date: DATE
reconciled_by: UUID REFERENCES users(id)
-- Import
import_batch: VARCHAR(50)
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_bank_trans_account_date (bank_account_id, transaction_date)
INDEX idx_bank_trans_reconciled (is_reconciled)
```

### Table 6.9: `financial_reconciliations`

**Fonction** : Réconciliation driver-customer

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
reconciliation_date: DATE NOT NULL
period_start: DATE NOT NULL
period_end: DATE NOT NULL
-- Entités liées
driver_id: UUID REFERENCES drivers(id)
customer_id: UUID REFERENCES customers(id)
employer_id: UUID REFERENCES employers(id)
link_id: UUID -- driver_customer_links ou employer_customer_links
-- Calculs Driver/Employer
driver_revenue: DECIMAL(10,2) NOT NULL -- Revenus VTC
driver_deductions: DECIMAL(10,2) NOT NULL -- Déductions
driver_balance: DECIMAL(10,2) NOT NULL -- Net driver
-- Calculs Customer
customer_invoices: DECIMAL(10,2) NOT NULL -- Factures dues
customer_payments: DECIMAL(10,2) NOT NULL -- Paiements reçus
customer_balance: DECIMAL(10,2) NOT NULL -- Solde customer
-- Réconciliation
offset_amount: DECIMAL(10,2) NOT NULL -- Montant compensé
final_driver_payment: DECIMAL(10,2) NOT NULL -- Paiement final driver
final_customer_balance: DECIMAL(10,2) NOT NULL -- Balance finale customer
-- Validation
status: VARCHAR(50) DEFAULT 'draft' -- 'draft', 'pending', 'approved', 'processed'
calculation_details: JSONB -- Détail des calculs
approved_by: UUID REFERENCES users(id)
approved_at: TIMESTAMPTZ
processed_at: TIMESTAMPTZ
notes: TEXT
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_reconciliations_period (period_start, period_end)
INDEX idx_reconciliations_driver (driver_id)
INDEX idx_reconciliations_customer (customer_id)
```

### Table 6.10: `account_statements`

**Fonction** : Relevés de compte

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
entity_type: VARCHAR(20) NOT NULL -- 'customer', 'driver', 'employer'
entity_id: UUID NOT NULL
statement_number: VARCHAR(50) UNIQUE NOT NULL
period_start: DATE NOT NULL
period_end: DATE NOT NULL
-- Soldes
opening_balance: DECIMAL(10,2) NOT NULL
total_debits: DECIMAL(10,2) NOT NULL
total_credits: DECIMAL(10,2) NOT NULL
closing_balance: DECIMAL(10,2) NOT NULL
-- Détail
transaction_count: INTEGER DEFAULT 0
transactions: JSONB -- Détail des mouvements
-- Envoi
generated_date: DATE NOT NULL
sent_date: DATE
sent_to_email: VARCHAR(255)
pdf_url: VARCHAR(500)
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_statements_entity (entity_type, entity_id)
INDEX idx_statements_period (period_start, period_end)
```

### Table 6.11: `collection_actions`

**Fonction** : Actions de recouvrement

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
customer_id: UUID REFERENCES customers(id)
invoice_id: UUID REFERENCES invoices(id)
action_type: VARCHAR(50) NOT NULL -- 'reminder', 'call', 'visit', 'legal', 'write_off'
action_date: DATE NOT NULL
amount_due: DECIMAL(10,2) NOT NULL
days_overdue: INTEGER NOT NULL
-- Action effectuée
performed_by: UUID REFERENCES users(id)
contact_person: VARCHAR(255)
contact_method: VARCHAR(50) -- 'email', 'phone', 'letter', 'visit'
-- Résultat
result: VARCHAR(50) -- 'promised', 'partial', 'disputed', 'no_response'
promise_date: DATE
promise_amount: DECIMAL(10,2)
dispute_reason: TEXT
-- Suivi
next_action: VARCHAR(50)
next_action_date: DATE
notes: TEXT
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_collection_customer (customer_id)
INDEX idx_collection_invoice (invoice_id)
INDEX idx_collection_date (action_date)
```

### Table 6.12: `expense_rules`

**Fonction** : Règles remboursement frais

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
employer_id: UUID REFERENCES employers(id) -- NULL = règles tenant par défaut
expense_type: VARCHAR(50) NOT NULL -- 'fuel', 'cleaning', 'toll'
is_reimbursable: BOOLEAN DEFAULT true
reimbursement_percentage: DECIMAL(5,2) DEFAULT 100
max_amount_daily: DECIMAL(10,2)
max_amount_monthly: DECIMAL(10,2)
requires_receipt: BOOLEAN DEFAULT true
auto_approve_below: DECIMAL(10,2)
approval_required: BOOLEAN DEFAULT true
effective_from: DATE NOT NULL
effective_to: DATE
created_at: TIMESTAMPTZ NOT NULL

UNIQUE idx_expense_rules (tenant_id, employer_id, expense_type, effective_from)
```

---

## 7. DOMAINE COMPLIANCE - CONFORMITÉ

### Table 7.1: `regulatory_reports`

**Fonction** : Rapports réglementaires

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
report_type: VARCHAR(50) NOT NULL -- 'VAT', 'TVA', 'WPS', 'DAS2', 'CORPORATE_TAX'
jurisdiction: VARCHAR(2) NOT NULL -- 'AE', 'FR'
period_type: VARCHAR(20) -- 'monthly', 'quarterly', 'annual'
period_year: INTEGER NOT NULL
period_month: INTEGER
period_quarter: INTEGER
-- Données
total_revenue: DECIMAL(10,2)
taxable_amount: DECIMAL(10,2)
tax_amount: DECIMAL(10,2)
employee_count: INTEGER
data_details: JSONB NOT NULL -- Données structurées du rapport
-- Soumission
due_date: DATE NOT NULL
preparation_date: DATE
submission_date: DATE
submission_reference: VARCHAR(100)
submission_method: VARCHAR(50) -- 'online', 'paper'
-- Status
status: VARCHAR(50) DEFAULT 'draft' -- 'draft', 'ready', 'submitted', 'accepted', 'rejected'
rejection_reason: TEXT
-- Documents
file_url: VARCHAR(500)
prepared_by: UUID REFERENCES users(id)
submitted_by: UUID REFERENCES users(id)
notes: TEXT
created_at: TIMESTAMPTZ NOT NULL
updated_at: TIMESTAMPTZ

INDEX idx_regulatory_period (period_year, period_month)
INDEX idx_regulatory_type (report_type, jurisdiction)
INDEX idx_regulatory_status (status)
```

### Table 7.2: `tax_declarations`

**Fonction** : Déclarations fiscales

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
tax_type: VARCHAR(50) NOT NULL -- 'VAT', 'TVA', 'CORPORATE', 'PAYROLL'
period_year: INTEGER NOT NULL
period_month: INTEGER
period_quarter: INTEGER
-- Calculs
gross_revenue: DECIMAL(10,2) NOT NULL
taxable_revenue: DECIMAL(10,2) NOT NULL
deductible_expenses: DECIMAL(10,2)
taxable_amount: DECIMAL(10,2) NOT NULL
tax_rate: DECIMAL(5,2) NOT NULL
tax_amount: DECIMAL(10,2) NOT NULL
-- Input/Output VAT
input_vat: DECIMAL(10,2)
output_vat: DECIMAL(10,2)
vat_payable: DECIMAL(10,2)
-- Paiement
payment_due_date: DATE
payment_date: DATE
payment_reference: VARCHAR(100)
payment_amount: DECIMAL(10,2)
-- Soumission
declaration_date: DATE
declaration_reference: VARCHAR(100)
status: VARCHAR(50) DEFAULT 'draft'
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_tax_period (period_year, period_month)
INDEX idx_tax_type (tax_type)
```

### Table 7.3: `legal_archives`

**Fonction** : Archivage légal documents

```sql
id: UUID PRIMARY KEY
tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
document_type: VARCHAR(50) NOT NULL -- 'invoice', 'contract', 'statement'
document_id: UUID NOT NULL
document_date: DATE NOT NULL
archive_date: DATE NOT NULL
retention_period_years: INTEGER NOT NULL -- 7 ans France, 5 ans UAE
destruction_due_date: DATE NOT NULL
destruction_date: DATE
storage_location: VARCHAR(255) -- 'cloud', 'physical'
file_url: VARCHAR(500)
file_hash: VARCHAR(255) -- Hash SHA256 pour intégrité
metadata: JSONB
created_at: TIMESTAMPTZ NOT NULL

INDEX idx_archives_document (document_type, document_id)
INDEX idx_archives_destruction (destruction_due_date)
```

---

## 8. RELATIONS ENTRE TABLES

### 8.1 Relations Core

```
tenants --< users
tenants --< system_parameters --< parameter_audit
tenants --< sequences
tenants --< documents (via entity_type/entity_id)
tenants --< custom_fields --< custom_field_values
users --< notifications
users --< audit_logs
```

### 8.2 Relations Fleet

```
tenants --< vehicles
vehicles --< vehicle_assignments >-- drivers
vehicles --< vehicle_maintenance
vehicles --< vehicle_inspections
vehicles --< insurance_policies --< insurance_claims
vehicles --< fuel_transactions
vehicles --< vehicle_fines
vehicles --< tolls
vehicles --< vehicle_ownership_history
```

### 8.3 Relations VTC

```
tenants --< employers
employers --< drivers --< driver_platforms
drivers --< vehicle_assignments
drivers --< platform_revenues
drivers --< driver_deductions
drivers --< driver_balances --< driver_payments
drivers --< employee_expenses
employers --< employee_expenses
revenue_imports --< platform_revenues
```

### 8.4 Relations Rental

```
tenants --< customers
customers --< leads
customers --< quotes --< quote_items
customers --< contracts --< contract_vehicles >-- vehicles
contract_vehicles --< check_in_out
contracts --< contract_amendments
drivers >--< driver_customer_links >--< customers
employers >--< employer_customer_links >--< customers
```

### 8.5 Relations Finance

```
customers --< invoices --< invoice_items
customers --< payments --< payment_allocations >-- invoices
customers --< credit_notes
customers --< deposits
bank_accounts --< bank_transactions
financial_reconciliations >-- drivers
financial_reconciliations >-- customers
financial_reconciliations >-- employers
customers --< account_statements
customers --< collection_actions
employers --< expense_rules
```

### 8.6 Relations Compliance

```
tenants --< regulatory_reports
tenants --< tax_declarations
tenants --< legal_archives
```

---

## 9. CONTRAINTES MÉTIER CRITIQUES

### 9.1 Véhicules

- Un véhicule ne peut avoir qu'UN assignment actif à la fois
- Si `is_autonomous = true`, un driver virtuel est créé automatiquement
- Changement de propriété nécessite historisation dans `vehicle_ownership_history`

### 9.2 Drivers

- Un driver ne peut avoir qu'UN véhicule actif à la fois
- Si `employment_type = 'employee'`, `employer_id` obligatoire
- Si pays France ET freelance, employer obligatoire (société)
- Driver virtuel : `driver_type = 'virtual'`, tous champs humains = NULL

### 9.3 Revenus

- Si driver employé : revenus vont à l'employer
- Si driver freelance UAE : revenus au driver direct
- Commission appliquée selon ownership véhicule

### 9.4 Réconciliation

- Seulement si lien existe dans `driver_customer_links` ou `employer_customer_links`
- Offset automatique si paramétré dans `system_parameters`
- Maximum déduction configurable

### 9.5 Amendes

- Responsable par défaut : dernier assignment à la date de l'amende
- Si customer louait : customer responsable
- GPS tracking prévu en Lot 2 pour identification précise

### 9.6 Cautions

- Type (blocked/authorization) selon paramètres tenant
- Montant : pourcentage ou fixe selon configuration
- Libération automatique après check-in satisfaisant

---

## 10. INDEXES DE PERFORMANCE

### 10.1 Indexes Critiques

- Tous les champs `tenant_id` pour isolation
- Tous les champs de dates pour rapports périodiques
- Tous les statuts pour filtrage
- VIN véhicules (recherches fréquentes)
- Numéros documents (invoice_number, contract_number)

### 10.2 Indexes Composites

```sql
-- Pour assignments véhicules
CREATE INDEX idx_assignments_active ON vehicle_assignments(vehicle_id, status)
WHERE status = 'active';

-- Pour revenus période
CREATE INDEX idx_revenues_period ON platform_revenues(driver_id, trip_date, platform);

-- Pour factures impayées
CREATE INDEX idx_invoices_overdue ON invoices(customer_id, status)
WHERE status IN ('overdue', 'partial');
```

---

## CONCLUSION

Cette spécification couvre l'intégralité du système FleetCore avec :

- **57 tables** organisées en 6 domaines
- **Zéro hardcoding** : tout paramétrable via `system_parameters`
- **Multi-tenant** complet avec isolation
- **Support véhicules autonomes** via drivers virtuels
- **Réconciliation** driver-customer-employer
- **Multi-pays** UAE/France extensible

Chaque table a sa fonction métier claire et ses relations définies.
