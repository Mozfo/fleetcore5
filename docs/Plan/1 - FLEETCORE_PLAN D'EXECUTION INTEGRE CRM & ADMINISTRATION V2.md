# FLEETCORE - PLAN D'EXÉCUTION INTÉGRÉ CRM & ADMINISTRATION V2

## Sprint 1 : Lead Management & Transition Sprint 2 : Opportunity Pipeline

**Date:** 16 Novembre 2025
**Version:** 2.3 avec Session #25 (CRM Email Dynamic Countries + French Grammar)
**Périmètre:** Sprint 1 (Lead Management) + Transition Sprint 2 (Opportunity Pipeline)
**Méthodologie:** Vertical Slicing - Livrables démontrables end-to-end

---

## 📋 TABLE DES MATIÈRES

1. [Résumé Phase 0 : Fondations](#résumé-phase-0--fondations-frozen)
2. [Sprint 1 : Lead Management Complet](#sprint-1--lead-management-complet-5-jours)
3. [Transition vers Sprint 2](#transition-vers-sprint-2--opportunity-pipeline)

---

# RÉSUMÉ PHASE 0 : FONDATIONS (FROZEN)

**Durée:** 2 jours | **Statut:** NON MODIFIABLE

La Phase 0 a établi l'architecture technique complète permettant le développement rapide et sécurisé des fonctionnalités métier. Cette phase a livré :

**Architecture Service Layer (8h)** : Création de BaseService et BaseRepository comme classes abstraites fournissant transaction management, error handling centralisé, soft delete automatique, audit logging, et validation tenant_id. Tous les futurs services CRM/ADM héritent de ces classes pour garantir cohérence et maintenabilité.

**Validation & Sécurité (6h)** : Implémentation de 18+ schémas Zod (LeadCreateSchema, OpportunityCreateSchema, etc.) pour validation stricte côté serveur. Création de trois middlewares critiques : auth.middleware (vérification token Clerk), rbac.middleware (permissions granulaires), validate.middleware (validation Zod automatique). Messages d'erreur clairs et exploitables pour l'utilisateur final.

**Audit & Synchronisation (12h)** : Service audit automatique créant un log pour chaque action CUD (Create/Update/Delete) avec diff before/after, IP, user agent, session ID. Service Clerk sync traitant les webhooks user.created, organization.created pour synchronisation automatique entre Clerk et base FleetCore (tables adm_members et adm_tenants). Endpoint POST /api/webhooks/clerk opérationnel avec vérification signature.

**Résultat:** Architecture production-ready avec isolation multi-tenant automatique, traçabilité complète, validation robuste, et sync auth externe. Zéro dette technique. Tests unitaires > 80% coverage. Documentation complète patterns et best practices.

**Livrables:** BaseService, BaseRepository, 18 validators Zod, 3 middlewares, AuditService, ClerkSyncService, webhook Clerk endpoint, NotificationService + EmailService avec **33 templates multilingues** (11 EN + 11 FR + 11 AR avec support RTL), 50+ tests unitaires, documentation architecture patterns.

**🆕 Phase 0.4 Extension (Novembre 2025):** Expansion du système de notifications de 10 templates anglais vers 33 templates multilingues. Support complet de l'anglais, français et arabe avec implémentation RTL (Right-to-Left) pour les marchés du Moyen-Orient. Tous les templates utilisent React Email + génération HTML, stockage JSONB dans base de données. Sélection automatique de langue basée sur country_code (CASCADE_4_FALLBACK). 21 emails de test envoyés avec succès. Prêt pour production.

**🔧 Session #24 - Template Regeneration (14 Novembre 2025):** Correction critique d'un bug majeur découvert lors des tests - les templates avaient des valeurs hardcodées ("John", "Test Company Ltd", "United States") au lieu des placeholders dynamiques `{{variable}}`. Cause: React Email compilait les templates avec les props par défaut. Solution: Régénération complète des 11 templates (33 variations multilingues) avec props `{{variable}}`, mise à jour directe en base de données. Résultat: 39/39 templates fonctionnels (100% success rate), remplacement dynamique vérifié en FR/AR, routing intelligent validé (pays opérationnels vs expansion). Tous les emails de test envoyés avec succès (France, UAE, Espagne, Qatar). Table `dir_notification_templates` mise à jour avec les templates corrigés.

**🌍 Session #25 - CRM Email Dynamic Countries + French Grammar (16 Novembre 2025):** Implémentation complète du système de capture de leads avec dropdown de pays dynamique et routing intelligent des emails. **Dynamic Countries Dropdown:** Création de l'endpoint `GET /api/countries` qui récupère 30 pays depuis la table `crm_countries` (filtrés par `is_visible`, triés par `display_order`). Frontend mis à jour pour recevoir les pays en Server-Side Rendering (pas de hardcoding). **Intelligent Email Routing:** Ajout de la logique de sélection automatique des templates selon `is_operational` - pays opérationnels (AE, FR) reçoivent "lead_confirmation" ("We'll contact you within 24h"), pays expansion (28 autres) reçoivent "expansion_opportunity" ("We'll notify you at launch"). **French Grammar Perfection:** Ajout de la colonne `country_preposition_fr` à `crm_countries` avec mapping complet des 30 pays - masculins (au: Qatar, Canada, Maroc), pluriels (aux: États-Unis, Émirats, Pays-Bas), féminins (en: France, Espagne). API route mise à jour pour construire `country_name` avec préposition grammaticalement correcte pour les emails français. Template `ExpansionOpportunityFR.tsx` corrigé (préposition "en" hardcodée supprimée). Migration SQL `add_country_preposition_fr.sql` créée et exécutée manuellement par l'utilisateur. **Message Position Fix:** Correction du layout email où le champ message apparaissait trop bas - intégration de `message_row` dans le même bloc `<Text>` que les autres détails (6 templates modifiés: LeadConfirmation + ExpansionOpportunity × 3 langues). **\_row Pattern:** Implémentation du pattern de variables conditionnelles (`phone_row`, `message_row`) dans NotificationService - génération HTML côté service uniquement si champ rempli, sinon chaîne vide. **Tests validés:** UAE lead → lead_confirmation (AR), France lead → lead_confirmation (FR), Qatar lead → expansion_opportunity (AR, "au Qatar"), USA lead → expansion_opportunity (EN). User validation: "ok c'est bien". **Résultat:** CRM Lead Capture System production-ready pour expansion globale avec 30 pays, grammaire française parfaite, routing intelligent, zero hardcoding maintenu.

---

# SPRINT 1 : LEAD MANAGEMENT COMPLET (5 jours)

**Objectif Sponsor:** À la fin du Sprint 1, le sponsor dispose d'un système complet de capture, qualification et gestion des prospects via interface Kanban avec scoring automatique et conversion vers opportunities.

**Valeur Business:** Le lead management est le point d'entrée du funnel commercial. Sans système structuré, 60% des leads sont perdus car oubliés ou traités tardivement. Ce sprint permet de traiter 100% des leads sous 48h avec priorisation automatique basée sur un scoring intelligent.

---

## ÉTAPE 1.1 : Capture et Création de Leads (2 jours)

### 🎯 RATIONNEL MÉTIER

**Problème actuel:** Aucune API pour capturer les leads depuis le formulaire public "Demander une démo". Les prospects remplissent le formulaire mais rien ne se passe côté serveur. Les leads sont perdus. Les commerciaux n'ont aucune visibilité sur les nouveaux prospects.

**Impact si absent:**

- **Commercial:** 40% leads perdus = 40% revenus perdus
- **Marketing:** Impossible mesurer ROI campagnes (quelle source convertit?)
- **Qualité:** Données prospects éparpillées = qualité catastrophique
- **Réactivité:** Délai réponse 5+ jours au lieu de 2h = prospect part concurrent

**Cas d'usage concret:**
ABC Logistics, entreprise livraison 80 véhicules à Dubaï, cherche solution gestion flotte. Le responsable visite fleetcore.com, remplit formulaire "Demander une démo" avec nom, entreprise, email, téléphone, taille flotte, pays, message détaillé. Le système doit créer le lead avec toutes ces infos, calculer automatiquement fit_score (80 véhicules = points élevés, UAE = points élevés → bon fit), calculer engagement_score (message détaillé = points), assigner automatiquement au commercial zone UAE, envoyer email au commercial "Nouveau lead haute priorité", envoyer email à Ahmed "Merci, contact sous 24h". Sans ce système, Ahmed attend 5 jours sans réponse, va concurrent, FleetCore perd 24k€/an revenus potentiels.

### 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale:** crm_leads

**Colonnes obligatoires à la création:**

- **email:** unique par tenant, format validé automatiquement, converti en lowercase, max 255 caractères
- **first_name:** min 2 caractères, max 50, pas de chiffres autorisés, trim automatique espaces
- **last_name:** min 2 caractères, max 50, pas de chiffres autorisés, trim automatique espaces
- **country_code:** code ISO 3166-1 alpha-2 (2 lettres), conversion automatique en majuscules, validation contre liste pays autorisés FleetCore
- **lead_stage:** valeur initiale automatique "top_of_funnel" (système décide, pas l'utilisateur)
- **status:** valeur initiale automatique "new" (nouveau lead non contacté)
- **lead_code:** généré automatiquement format "LEAD-YYYY-NNNNN" exemple "LEAD-2025-00001", unique global, séquentiel par année calendaire, incrémentation automatique
- **company_name:** nom entreprise du prospect, max 100 caractères, validation anti-injection SQL/XSS
- **fleet_size:** enum strict parmi ("1-10", "11-50", "51-100", "101-500", "500+", "unknown"), utilisé directement pour calcul fit_score

**Note importante migration:** La table contient actuellement demo_company_name ET company_name. Phase de transition : copier valeur demo_company_name vers company_name si company_name vide, puis supprimer colonne demo_company_name dans migration ultérieure. Pour Sprint 1, utiliser company_name partout.

**Colonnes optionnelles enrichissement:**

- **phone:** format E.164 international (+33612345678), validation regex stricte, normalisation automatique
- **industry:** enum industries cibles (logistics, delivery, transport, taxi, vtc, rideshare, other), impact direct sur scoring
- **current_software:** texte libre max 100 caractères, analyse concurrence pour positionnement commercial
- **message:** texte libre max 1000 caractères, analysé pour calcul engagement_score (longueur = intérêt)
- **utm_source:** tracking attribution marketing (google, facebook, linkedin), max 50 caractères, normalisation lowercase
- **utm_medium:** tracking canal marketing (cpc, organic, email, social), max 50 caractères, normalisation lowercase
- **utm_campaign:** tracking campagne spécifique pour calcul ROI, max 100 caractères
- **source_id:** FK vers crm_lead_sources, si null alors utiliser source par défaut "website"

**Colonnes RGPD obligatoires si pays Union Européenne:**

- **gdpr_consent:** boolean obligatoire TRUE si country_code dans liste pays UE (FR, DE, IT, ES, BE, NL, PT, AT, IE, etc.)
- **consent_at:** timestamp obligatoire si gdpr_consent true, date exacte moment où consentement donné
- **consent_ip:** type inet obligatoire si gdpr_consent true, adresse IP depuis laquelle consentement donné (traçabilité légale)

**Règle UX formulaire:** Si l'utilisateur sélectionne un pays UE dans le dropdown pays du formulaire "Demander une démo", alors afficher automatiquement section RGPD avec checkbox "J'accepte traitement données personnelles" et lien vers politique confidentialité. Checkbox doit être cochée pour soumettre formulaire. Date et IP capturées automatiquement côté serveur au moment soumission.

**Colonnes calculées automatiquement (système):**

- **fit_score:** calculé via algorithme scoring (détails section suivante), valeur 0-60 (modification spec: plus sur 100)
- **engagement_score:** calculé via algorithme scoring, valeur 0-100
- **qualification_score:** formule (fit_score × 0.6) + (engagement_score × 0.4), résultat 0-100, détermine automatiquement lead_stage
- **assigned_to:** assignation automatique selon règles géographiques (country_code) et capacité commerciaux (round-robin)
- **next_action_date:** calculé automatiquement created_at + 24 heures pour premiers contacts rapides
- **metadata:** colonne JSONB stockant informations enrichissement structurées (page_views, referrer, device_type, browser, time_on_site)

**Algorithme calcul fit_score (MODIFIÉ - maintenant sur 60 points max):**

Critère 1 - Taille de flotte (40 points maximum):

- fleet_size = "500+" → 40 points (cible premium)
- fleet_size = "101-500" → 35 points (cible principale)
- fleet_size = "51-100" → 30 points (bon prospect)
- fleet_size = "11-50" → 20 points (prospect acceptable)
- fleet_size = "1-10" → 5 points (trop petit, faible priorité)
- fleet_size = "unknown" → 10 points (moyenne par défaut)

Critère 2 - Pays cible (20 points maximum):

- country_code dans ["AE", "SA", "QA"] (Pays Golfe) → 20 points (marchés prioritaires haute valeur)
- country_code = "FR" → 18 points (marché prioritaire Europe)
- country_code dans ["KW", "BH", "OM"] (Autres MENA) → 15 points (marchés secondaires)
- country_code dans liste pays UE autres que FR → 12 points (expansion Europe)
- country_code autres (pays non implémentés) → 5 points (expansion future)

**Règle spéciale pays non implémentés:** Si country_code pas dans liste pays déjà implémentés dans FleetCore (actuellement: AE, SA, QA, FR, et liste restreinte), alors :

1. Lead créé normalement avec fit_score = 5 points pour pays
2. Email automatique envoyé au prospect: "Thank you for your interest. FleetCore will arrive in [Country Name] soon. We'll contact you as soon as we launch in your market."
3. Email automatique envoyé à équipe expansion: "New lead from non-covered country: [Country Name], interest detected for future expansion"
4. Lead marqué dans metadata avec flag "expansion_opportunity": true

Critère 3 - Industrie cible: SUPPRIMÉ (simplifie scoring, évite sur-ingénierie)

Critère 4 - Budget indiqué: SUPPRIMÉ (information rarement fiable, inutile complexité)

**Résultat fit_score final:** Somme Critère 1 + Critère 2 = score entre 0 et 60 points.

**Recalibrage qualification_score:** Comme fit_score maintenant max 60 au lieu de 100, la formule qualification_score doit normaliser :

- qualification_score = ((fit_score / 60) × 60 × 0.6) + (engagement_score × 0.4)
- Ou plus simplement : qualification_score = (fit_score × 0.6) + (engagement_score × 0.4)
- Résultat toujours entre 0 et 100

**Algorithme calcul engagement_score (0-100 points):**

Critère 1 - Message détaillé (30 points maximum):

- length(message) > 200 caractères → 30 points (besoins exprimés très clairement)
- length(message) > 100 caractères → 20 points (intérêt substantiel)
- length(message) > 20 caractères → 10 points (intérêt minimal)
- message vide ou très court → 0 points

Critère 2 - Téléphone fourni (20 points maximum):

- phone renseigné et valide → 20 points (accepte contact téléphonique direct)
- phone vide → 0 points

Critère 3 - Pages visitées site web (30 points maximum):

- metadata.page_views > 10 pages → 30 points (très engagé, recherche active)
- metadata.page_views > 5 pages → 20 points (intéressé)
- metadata.page_views > 2 pages → 10 points (curiosité)
- metadata.page_views <= 2 pages → 5 points (trafic normal)

Critère 4 - Temps passé sur site (20 points maximum):

- metadata.time_on_site > 10 minutes → 20 points (lecture approfondie)
- metadata.time_on_site > 5 minutes → 15 points
- metadata.time_on_site > 2 minutes → 10 points
- metadata.time_on_site <= 2 minutes → 5 points

**Détermination automatique lead_stage selon qualification_score:**

- qualification_score >= 70 → lead_stage = "sales_qualified" (SQL, prêt pour commercial)
- qualification_score >= 40 → lead_stage = "marketing_qualified" (MQL, nurturing marketing)
- qualification_score < 40 → lead_stage = "top_of_funnel" (TOF, nurturing long terme)

**Règles assignation automatique commerciaux:**

Règle 1 - Assignation géographique prioritaire:

- country_code = "AE" → assigner commercial UAE (Karim Al-Rashid)
- country_code = "SA" → assigner commercial KSA (Faisal Al-Otaibi)
- country_code = "FR" → assigner commercial France (Marie Dubois)
- country_code autres pays MENA → pool commerciaux MENA (round-robin)
- country_code pays UE → pool commerciaux Europe (round-robin)
- country_code autres → pool commercial international (round-robin)

Règle 2 - Ajustement selon taille flotte (surcharge règle 1):

- Si fleet_size = "500+" → toujours assigner Account Manager Senior quel que soit pays
- Si fleet_size = "101-500" → assigner Account Manager Standard
- Si fleet_size <= "50" → assigner selon règle géographique normale

Règle 3 - Round-robin au sein d'un pool:

- Si plusieurs commerciaux éligibles dans même pool, choisir celui avec moins de leads actifs (status IN ('new', 'contacted', 'qualified'))
- Si égalité nombre leads, choisir dernier assigné il y a le plus longtemps (fairness)

**Validation Zod LeadCreateSchema (côté serveur obligatoire):**

- email: string format email, max 255, obligatoire
- first_name: string min 2 max 50, regex alphabétique, obligatoire
- last_name: string min 2 max 50, regex alphabétique, obligatoire
- company_name: string min 2 max 100, obligatoire
- country_code: string length 2, uppercase, obligatoire
- fleet_size: enum strict, obligatoire
- phone: string regex E.164 si fourni, optionnel
- industry: enum si fourni, optionnel
- message: string max 1000 si fourni, optionnel
- utm_source: string max 50 si fourni, optionnel
- utm_medium: string max 50 si fourni, optionnel
- utm_campaign: string max 100 si fourni, optionnel
- gdpr_consent: boolean obligatoire TRUE si country_code pays UE, sinon optionnel
- consent_ip: string si gdpr_consent true, optionnel sinon

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend - Service Layer

**✅ STATUT: COMPLETE (8h30 - November 12, 2025)**
**Tests: 86/86 passing | TypeScript: 0 errors**

Les composants backend suivants ont été implémentés avec architecture database-driven (principe "zero hardcoding"):

**Livrables complétés:**

- ✅ `lib/repositories/crm/lead.repository.ts` (19 tests)
- ✅ `lib/repositories/crm/settings.repository.ts` (12 tests)
- ✅ `lib/services/crm/lead-scoring.service.ts` (28 tests)
- ✅ `lib/services/crm/lead-assignment.service.ts` (12 tests)
- ✅ `lib/services/crm/lead-creation.service.ts` (15 tests)
- ✅ `scripts/seed-priority-config.ts` (priority configuration)
- ✅ 3 CRM settings configurations (scoring, assignment, priority)

**Décisions architecture:**

1. Database-driven config: toutes règles métier dans crm_settings (scoring weights, country tiers, priority thresholds)
2. Service composition: LeadCreationService orchestre ScoringService + AssignmentService
3. VARCHAR(20) au lieu d'ENUM pour priority → extensibilité sans migration

**Prochaine tâche:** API Routes (POST /api/v1/crm/leads)

---

**Spécification originale (référence):**

**Fichier lib/services/crm/lead.service.ts**

Classe LeadService extends BaseService avec méthodes suivantes :

**Méthode createLead(data: LeadCreateInput) → Promise Lead:**

1. Valider data avec LeadCreateSchema Zod complet (lève ValidationError si échec)
2. Extraire tenant_id depuis contexte authentification Clerk (vérifie que tenant actif)
3. Vérifier unicité email pour ce tenant (query SELECT email FROM crm_leads WHERE tenant_id AND email, si existe lève BusinessRuleError "Email already exists")
4. Normaliser données : email vers lowercase, phone vers format E.164, country_code vers uppercase, trim first_name et last_name
5. Générer lead_code unique : query SELECT MAX lead_code WHERE year = current year, incrémenter, formater "LEAD-2025-00001"
6. Calculer fit_score avec algorithme décrit (appel méthode calculateFitScore)
7. Calculer engagement_score avec algorithme décrit (appel méthode calculateEngagementScore)
8. Calculer qualification_score avec formule (fit_score × 0.6) + (engagement_score × 0.4)
9. Déterminer lead_stage automatiquement selon qualification_score (SQL/MQL/TOF)
10. Assigner commercial via assignToSalesRep selon country_code et fleet_size
11. Calculer next_action_date = created_at + 24 heures
12. Remplir metadata JSONB avec informations tracking (referrer, user_agent, device_type depuis requête HTTP)
13. Si country_code pays non implémenté : ajouter metadata.expansion_opportunity = true
14. Créer lead dans DB via leadRepository.create (transaction automatique BaseService)
15. Créer audit log action "lead_created" via auditService avec toutes données
16. Si pays non implémenté : envoyer email "We will arrive in your country soon"
17. Envoyer email notification commercial assigné "New high priority lead"
18. Envoyer email confirmation prospect "Thank you, contact within 24h"
19. Retourner lead créé complet avec tous champs calculés

**Méthode calculateFitScore(data) → number:**
Implémenter algorithme fit_score décrit avec critères flotte et pays. Retourne score 0-60.

**Méthode calculateEngagementScore(data) → number:**
Implémenter algorithme engagement_score décrit avec critères message, phone, pages, temps. Retourne score 0-100.

**Méthode assignToSalesRep(countryCode, fleetSize) → UUID:**

1. Si fleetSize = "500+" alors chercher Account Manager Senior actif (query adm_provider_employees WHERE title LIKE Senior Account Manager AND status active)
2. Sinon si fleetSize = "101-500" alors chercher Account Manager Standard
3. Sinon selon countryCode :
   - "AE" → chercher commercial UAE
   - "SA" → chercher commercial KSA
   - "FR" → chercher commercial France
   - Autres MENA → pool MENA
   - Autres UE → pool UE
   - Autres → pool international
4. Si plusieurs commerciaux dans pool, compter leads actifs pour chacun (query COUNT crm_leads WHERE assigned_to = employee_id AND status IN new contacted qualified)
5. Retourner UUID commercial avec moins de leads actifs
6. Si aucun commercial trouvé, assigner manager commercial par défaut (fallback sécurité)

**Méthode findAll(filters: LeadFilters) → Promise LeadsList:**

1. Extraire tenant_id contexte
2. Construire query Prisma :
   - WHERE tenant_id = tenant_id
   - WHERE deleted_at IS NULL (exclure soft deleted)
   - Si filters.status fourni : AND status = filters.status
   - Si filters.lead_stage fourni : AND lead_stage = filters.lead_stage
   - Si filters.assigned_to fourni : AND assigned_to = filters.assigned_to
   - Si filters.country_code fourni : AND country_code = filters.country_code
   - Si filters.created_from fourni : AND created_at >= filters.created_from
   - Si filters.created_to fourni : AND created_at <= filters.created_to
   - Si filters.qualification_score_min fourni : AND qualification_score >= min
   - Si filters.qualification_score_max fourni : AND qualification_score <= max
3. ORDER BY created_at DESC par défaut (plus récents d'abord)
4. Paginer avec LIMIT filters.limit (défaut 50, max 100) et OFFSET filters.offset
5. Inclure relations : assigned_to (employé complet), source_id (source détails)
6. Retourner objet avec leads array, total count, pagination info

**Méthode findById(id: string) → Promise Lead:**

1. Extraire tenant_id contexte
2. Query SELECT lead WHERE id = id AND tenant_id = tenant_id AND deleted_at IS NULL
3. Si non trouvé lève NotFoundError "Lead not found"
4. Inclure toutes relations (assigned_to, source, opportunity si existe)
5. Retourner lead complet

**Méthode updateLead(id: string, data: LeadUpdateInput) → Promise Lead:**

1. Valider data avec LeadUpdateSchema (tous champs optionnels)
2. Vérifier lead existe et appartient tenant (findById)
3. Si email modifié : vérifier unicité nouveau email pour tenant
4. Normaliser nouvelles données (lowercase, trim, etc.)
5. Si fit_score ou engagement_score modifiés manuellement : recalculer qualification_score
6. Si qualification_score change : mettre à jour lead_stage si franchit seuil
7. UPDATE lead avec updated_at = NOW, updated_by = current_user
8. Créer audit log action "lead_updated" avec old_values et new_values diff
9. Retourner lead mis à jour

**Méthode softDelete(id: string, reason: string) → Promise void:**
Héritée de BaseService, appel automatique audit log. Spécifique leads : vérifier que lead pas déjà converti en opportunity (si opportunity_id NOT NULL, refuser suppression avec erreur "Cannot delete converted lead").

**Fichier lib/repositories/crm/lead.repository.ts**

Classe LeadRepository extends BaseRepository avec méthodes spécifiques :

**Méthode findByEmail(email: string, tenantId: string) → Promise Lead ou null:**
Query SELECT WHERE email lowercase = email lowercase AND tenant_id = tenantId AND deleted_at IS NULL. Retourne lead si trouvé, null sinon.

**Méthode findWithFilters(tenantId, filters) → Promise LeadsList:**
Construit query Prisma complexe avec tous filtres possibles (status, stage, assigned_to, country_code, dates, scores). Utilisée par LeadService.findAll.

**Méthode countActiveLeads(assignedTo: string) → Promise number:**
Query COUNT leads WHERE assigned_to = assignedTo AND status IN ('new', 'contacted', 'qualified') AND deleted_at IS NULL. Utilisé pour round-robin assignation.

**Méthode generateLeadCode(year: number) → Promise string:**

1. Query SELECT MAX(lead_code) FROM crm_leads WHERE lead_code LIKE 'LEAD-[year]-%'
2. Extraire numéro séquentiel, incrémenter
3. Formatter "LEAD-[year]-[numéro paddé 5 chiffres]"
4. Gérer cas première création année (commence 00001)
5. Retourner lead_code unique

#### Backend - API REST

**Fichier app/api/v1/crm/leads/route.ts**

**GET /api/v1/crm/leads - Liste tous les leads tenant avec filtres**

- Middleware : requireAuth (vérifie token Clerk)
- Middleware : requirePermission("leads.read")
- Query params acceptés :
  - status : filter par status (new, contacted, qualified, converted, lost)
  - lead_stage : filter par stage (top_of_funnel, marketing_qualified, sales_qualified)
  - assigned_to : filter par UUID commercial
  - country_code : filter par code pays (2 lettres)
  - source_id : filter par UUID source marketing
  - created_from : date début format ISO 8601
  - created_to : date fin format ISO 8601
  - qualification_score_min : score minimum (0-100)
  - qualification_score_max : score maximum (0-100)
  - limit : nombre résultats par page (défaut 50, max 100)
  - offset : pagination (défaut 0)
- Appel leadService.findAll(filters)
- Réponse 200 OK avec objet :
  - leads : array objets lead complets
  - total : nombre total leads (hors pagination)
  - limit : limite utilisée
  - offset : offset utilisé
  - Chaque lead contient : id, lead_code, first_name, last_name, email, phone, company_name, country_code, fleet_size, lead_stage, status, qualification_score, fit_score, engagement_score, assigned_to (objet employé), source (objet source), created_at, next_action_date
- Erreur 401 Unauthorized si token invalide
- Erreur 403 Forbidden si permission leads.read manquante

**POST /api/v1/crm/leads - Créer nouveau lead**

- Route publique OU authentifiée (si authentifié alors middleware requirePermission("leads.create"))
- Si publique : pas d'auth requise pour formulaire site web
- Middleware : validate(LeadCreateSchema) valide body avant passage controller
- Body JSON attendu :
  - email : string obligatoire
  - first_name : string obligatoire
  - last_name : string obligatoire
  - company_name : string obligatoire
  - country_code : string obligatoire (2 lettres)
  - fleet_size : enum obligatoire
  - phone : string optionnel
  - industry : enum optionnel
  - current_software : string optionnel
  - message : string optionnel
  - utm_source : string optionnel
  - utm_medium : string optionnel
  - utm_campaign : string optionnel
  - gdpr_consent : boolean (obligatoire true si pays UE)
  - consent_ip : string (rempli automatiquement depuis req.ip côté serveur)
  - metadata : objet optionnel avec page_views, referrer, device_type, etc.
- Appel leadService.createLead(data)
- Réponse 201 Created avec lead créé complet incluant :
  - id, lead_code, tous champs fournis, plus champs calculés (fit_score, engagement_score, qualification_score, lead_stage, status, assigned_to, next_action_date, created_at)
- Erreur 400 Bad Request si validation Zod échoue (retourne détails erreurs Zod avec champs et messages)
- Erreur 409 Conflict si email existe déjà pour ce tenant
- Erreur 422 Unprocessable Entity si règle métier violée (exemple : GDPR consent manquant pour pays UE)

**Fichier app/api/v1/crm/leads/[id]/route.ts**

**GET /api/v1/crm/leads/[id] - Détails complets d'un lead**

- Middleware : requireAuth
- Middleware : requirePermission("leads.read")
- Params : id (UUID lead)
- Appel leadService.findById(id)
- Réponse 200 OK avec lead complet incluant toutes colonnes et relations
- Erreur 404 Not Found si lead non trouvé ou appartient autre tenant

**PATCH /api/v1/crm/leads/[id] - Modifier lead existant**

- Middleware : requireAuth
- Middleware : requirePermission("leads.update")
- Middleware : validate(LeadUpdateSchema)
- Params : id (UUID lead)
- Body JSON avec champs à modifier (tous optionnels) : email, first_name, last_name, company_name, phone, fleet_size, industry, current_software, message, status, lead_stage, next_action_date, notes
- Appel leadService.updateLead(id, data)
- Réponse 200 OK avec lead mis à jour complet
- Erreur 400 Bad Request si validation échoue
- Erreur 404 Not Found si lead non trouvé
- Erreur 409 Conflict si email déjà utilisé par autre lead

**DELETE /api/v1/crm/leads/[id] - Supprimer lead (soft delete)**

- Middleware : requireAuth
- Middleware : requirePermission("leads.delete") (admin seulement)
- Params : id (UUID lead)
- Query param : reason (string obligatoire, raison suppression)
- Appel leadService.softDelete(id, reason)
- Réponse 204 No Content si succès
- Erreur 403 Forbidden si permission insuffisante
- Erreur 404 Not Found si lead non trouvé
- Erreur 422 Unprocessable Entity si lead déjà converti en opportunity (impossible supprimer)

#### Frontend - Interface Utilisateur

**Fichier app/[locale]/crm/leads/page.tsx**

Page principale module Leads avec tableau Kanban trois colonnes.

**Structure layout page:**
En-tête page :

- Logo FleetCore + breadcrumb "CRM > Leads"
- Bouton "+ New Lead" en haut droite (ouvre modal création)

Section filtres :

- Dropdown "Status" : filtre par status avec options All, New, Contacted, Qualified, Converted, Lost
- Dropdown "Stage" : filtre par lead_stage avec options All, Top of Funnel, Marketing Qualified, Sales Qualified
- Dropdown "Assigned to" : filtre par commercial avec liste commerciaux actifs
- Dropdown "Country" : filtre par country_code avec liste pays (flags + noms)
- Bouton "Reset filters" : réinitialise tous filtres

Tableau Kanban trois colonnes :

- Colonne 1 "NEW" : affiche leads avec status = "new", compteur nombre leads, valeur totale si applicable
- Colonne 2 "CONTACTED" : affiche leads avec status = "contacted", compteur, valeur
- Colonne 3 "QUALIFIED" : affiche leads avec status = "qualified", compteur, valeur
- Chaque colonne contient cartes leads empilées verticalement
- Bouton "+ Add" en bas de chaque colonne pour création rapide

**Carte lead (LeadCard component) affiche:**

- Avatar avec initiales (exemple : AM pour Ahmed Al-Mansoori) ou photo si disponible
- Nom complet : first_name + last_name en gras
- Nom entreprise : company_name en gris clair sous nom
- Flag pays : emoji drapeau basé sur country_code (🇦🇪 pour UAE)
- Badge score qualification : qualification_score/100 avec couleur (rouge < 40, orange 40-69, vert 70+)
- Taille flotte : fleet_size avec icône véhicule
- Date création relative : "Il y a 2h", "Hier", "Il y a 3 jours"
- Commercial assigné : avatar + nom assigned_to
- Boutons actions rapides en hover :
  - 📞 Call : ouvre modal log appel
  - 📧 Email : ouvre modal envoi email
  - 👁️ View : navigue vers page détail /crm/leads/[id]
  - Plus d'actions : menu dropdown avec Convert, Edit, Delete

**Fonctionnalité drag and drop:**

- Utilisateur peut glisser carte lead d'une colonne vers autre colonne
- Pendant glissement : carte devient semi-transparente, colonnes cibles surbrillent
- Au drop : appel API PATCH /api/v1/crm/leads/[id] avec nouveau status
- Mise à jour optimiste UI (carte déplace immédiatement, rollback si API échoue)
- Animation fluide avec Framer Motion
- Compteurs colonnes se mettent à jour instantanément

**Filtres fonctionnement:**

- Changement filtre déclenche nouvelle requête GET /api/v1/crm/leads avec query params
- Loading state pendant requête (skeleton cards)
- Résultats filtrés affichés dans colonnes appropriées
- Compteurs colonnes reflètent leads filtrés uniquement
- URL mise à jour avec params filtres (partage URL possible)

**Technologies utilisées:**

- @dnd-kit/core pour drag and drop
- @tanstack/react-query pour data fetching et cache
- Framer Motion pour animations
- Tailwind CSS pour styling
- Lucide React pour icônes
- React Hook Form pour formulaires

**Composant components/crm/LeadCard.tsx**

Props :

- lead : objet Lead complet
- onDragStart : callback début glissement
- onDragEnd : callback fin glissement
- onClick : callback clic carte pour navigation détail

Affichage détaillé :

- Section avatar : cercle avec initiales first_name[0] + last_name[0], couleur background aléatoire seeded par id
- Section header : nom complet taille 16px bold, company_name taille 14px gris
- Section pays : flag emoji + country_code texte (exemple : 🇦🇪 UAE)
- Section score : badge arrondi avec qualification_score/100, couleur fond selon valeur (bg-red-100 text-red-800 si < 40, bg-orange-100 text-orange-800 si 40-69, bg-green-100 text-green-800 si 70+)
- Section flotte : icône véhicule + fleet_size texte (exemple : 🚗 51-100 vehicles)
- Section timestamp : texte gris clair "Created [temps relatif]" utilisant bibliothèque date-fns formatDistanceToNow
- Section assigné : mini avatar + first_name commercial (exemple : "Karim")
- Section actions : flex row avec icônes boutons apparaissant au hover
- Hover effet : légère élévation (shadow-lg) et scale 1.02 transformation
- Click effet : animation ripple

**Composant components/crm/LeadFormModal.tsx**

Modal formulaire pour créer ou modifier lead.

Props :

- isOpen : boolean contrôle ouverture modal
- onClose : callback fermeture
- onSubmit : callback soumission données validées
- initialData : objet Lead si édition, null si création
- mode : "create" ou "edit"

Champs formulaire création lead :

- First name : input texte, label "First Name", placeholder "John", obligatoire, validation min 2 max 50 alphabétique
- Last name : input texte, label "Last Name", placeholder "Doe", obligatoire, validation min 2 max 50 alphabétique
- Email : input email, label "Email", placeholder "john.doe@company.com", obligatoire, validation format email
- Phone : input tel, label "Phone (optional)", placeholder "+33 6 12 34 56 78", optionnel, validation format E.164
- Company name : input texte, label "Company", placeholder "ABC Logistics", obligatoire, validation min 2 max 100
- Country : dropdown searchable, label "Country", placeholder "Select country", obligatoire, liste tous pays avec flags
- Fleet size : dropdown, label "Fleet Size", placeholder "Select size", obligatoire, options enum ("1-10", "11-50", "51-100", "101-500", "500+", "Unknown")
- Industry : dropdown, label "Industry (optional)", placeholder "Select industry", optionnel, options enum industries
- Current software : input texte, label "Current Software (optional)", placeholder "Excel, Fleet Complete, etc.", optionnel, max 100 caractères
- Message : textarea, label "Message (optional)", placeholder "Tell us about your needs...", optionnel, max 1000 caractères, rows 4
- Section UTM (collapsible) :
  - UTM Source : input texte petit, placeholder "google", optionnel
  - UTM Medium : input texte petit, placeholder "cpc", optionnel
  - UTM Campaign : input texte, placeholder "dubai_logistics_q4", optionnel

**Section RGPD conditionnelle:**
Si country sélectionné est pays UE (France, Allemagne, Italie, etc.) alors afficher :

- Checkbox "I consent to the processing of my personal data" avec lien vers privacy policy
- Texte légal petit gris : "Required for EU countries under GDPR regulations"
- Checkbox doit être cochée (obligatoire) pour submit si pays UE
- IP et timestamp capturés automatiquement côté serveur, pas visible utilisateur

**Validation temps réel formulaire:**

- Utilise React Hook Form avec résolveur Zod (LeadCreateSchema côté client)
- Affiche erreurs sous chaque champ en temps réel pendant saisie
- Bouton Submit désactivé tant que formulaire invalide
- Messages erreur en rouge sous champs concernés
- Icône croix rouge à droite champs invalides, check vert pour valides

**Soumission formulaire:**

- Click bouton "Create Lead" ou "Update Lead"
- Affiche loader dans bouton (spinner + texte "Creating...")
- Appel POST /api/v1/crm/leads si création, PATCH /api/v1/crm/leads/[id] si édition
- Si succès :
  - Ferme modal automatiquement
  - Affiche toast success "Lead created successfully" ou "Lead updated successfully"
  - Refresh liste leads (invalidate react-query cache)
  - Si création : scroll automatique vers carte lead créée dans Kanban
- Si erreur :
  - Modal reste ouverte
  - Affiche message erreur détaillé en haut formulaire (bannière rouge)
  - Si erreur validation serveur : surligne champs concernés avec messages spécifiques
  - Si erreur 409 conflict email : message "A lead with this email already exists"

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour sponsor (Étape 1.1) :**

**Démo 1 - Formulaire public capture lead:**

1. Ouvrir page publique https://fleetcore.com/demo (formulaire "Request Demo")
2. Remplir formulaire :
   - First name : Ahmed
   - Last name : Al-Mansoori
   - Email : ahmed.test@abclogistics.ae
   - Phone : +971 50 123 4567
   - Company : ABC Logistics Test
   - Country : UAE 🇦🇪 (sélection dropdown)
   - Fleet size : 51-100 (dropdown)
   - Industry : Logistics
   - Message : "We need a comprehensive fleet management solution for our Uber, Careem and Talabat drivers. Real-time tracking and automated billing are critical for us." (message détaillé)
   - UTM fields : automatiquement remplis depuis URL (utm_source=google, utm_campaign=dubai_q4)
3. Pas de section RGPD affichée car UAE non UE
4. Cliquer "Request Demo"
5. Message confirmation affiché : "Thank you! We'll contact you within 24 hours."
6. Email reçu sur ahmed.test@abclogistics.ae : "Thank you for your interest in FleetCore..."
7. En backend : lead créé dans DB avec :
   - lead_code = "LEAD-2025-00042" (séquentiel)
   - status = "new"
   - lead_stage = "marketing_qualified" (score 62/100)
   - fit_score = 30 (flotte 51-100) + 20 (UAE) = 50/60
   - engagement_score = 30 (message > 200 chars) + 20 (phone fourni) + 10 (pages) = 60/100
   - qualification_score = (50 × 0.6) + (60 × 0.4) = 54/100 → MQL
   - assigned_to = Karim Al-Rashid (commercial UAE)
   - next_action_date = created_at + 24h

**Démo 2 - Pays UE avec RGPD:**

1. Remplir formulaire similaire mais sélectionner Country : France 🇫🇷
2. Section RGPD apparaît automatiquement sous pays :
   - Checkbox "J'accepte le traitement de mes données personnelles"
   - Lien vers politique confidentialité
   - Texte "Required for EU countries under GDPR"
3. Tenter soumettre sans cocher : erreur "GDPR consent required for EU countries"
4. Cocher checkbox, soumettre : succès
5. En backend : lead créé avec gdpr_consent = true, consent_at = timestamp, consent_ip = IP utilisateur

**Démo 3 - Pays non implémenté expansion:**

1. Remplir formulaire, sélectionner Country : Brazil 🇧🇷 (pas encore implémenté)
2. Soumettre formulaire : succès
3. Email reçu : "Thank you for your interest. FleetCore will arrive in Brazil soon. We'll contact you as soon as we launch in your market."
4. Email équipe expansion : "New lead from non-covered country: Brazil, interest detected for future expansion"
5. En backend : lead créé avec fit_score = 5 (pays non implémenté), metadata.expansion_opportunity = true

**Démo 4 - Dashboard Kanban avec leads:**

1. Commercial Karim se connecte, navigue vers /crm/leads
2. Voit tableau Kanban trois colonnes :
   - NEW : 23 leads (dont Ahmed Al-Mansoori fraîchement créé)
   - CONTACTED : 15 leads
   - QUALIFIED : 8 leads
3. Carte Ahmed visible dans colonne NEW avec :
   - Avatar "AM"
   - Nom "Ahmed Al-Mansoori"
   - Entreprise "ABC Logistics Test"
   - Flag 🇦🇪 UAE
   - Badge orange "62/100" (MQL)
   - Taille "51-100 vehicles"
   - "Created 2 minutes ago"
   - "Karim" (assigné)
4. Karim voit immédiatement son nouveau lead sans refresh

**Démo 5 - Drag and drop changement status:**

1. Karim glisse carte Ahmed de colonne NEW vers colonne CONTACTED
2. Carte se déplace avec animation fluide
3. API appelée : PATCH /api/v1/crm/leads/[ahmed-id] body {status: "contacted"}
4. Carte Ahmed maintenant dans colonne CONTACTED
5. Compteurs mis à jour : NEW 22 leads, CONTACTED 16 leads
6. Audit log créé automatiquement : "Lead status changed from new to contacted by Karim"

**Démo 6 - Filtres fonctionnels:**

1. Cliquer dropdown "Country", sélectionner "UAE 🇦🇪"
2. Liste filtrée : seulement leads UAE affichés dans les 3 colonnes
3. Cliquer dropdown "Score min", saisir "60"
4. Liste filtrée davantage : seulement leads UAE avec score ≥ 60
5. URL mise à jour : /crm/leads?country=AE&score_min=60
6. Cliquer "Reset filters" : tous filtres retirés, liste complète restaurée

**Démo 7 - Création lead manuelle via bouton:**

1. Cliquer bouton "+ New Lead" en haut droite
2. Modal formulaire s'ouvre (LeadFormModal)
3. Remplir rapidement :
   - Name : Marie Dupont
   - Email : marie@xyzlogistics.fr
   - Company : XYZ Logistics
   - Country : France 🇫🇷
   - Fleet size : 101-500
4. Section RGPD apparaît automatiquement (France = UE)
5. Cocher GDPR consent, soumettre
6. Modal se ferme, toast "Lead created successfully"
7. Nouvelle carte Marie apparaît dans colonne NEW
8. Score calculé : fit_score = 35 (flotte 101-500) + 18 (France) = 53, engagement faible = 15, qualification = 39 → TOF

**Critères acceptation Étape 1.1:**

- ✅ Formulaire public capture leads avec validation temps réel
- ✅ Section RGPD affichée automatiquement si pays UE sélectionné
- ✅ Lead créé apparaît immédiatement dans Kanban NEW
- ✅ lead_code généré format "LEAD-YYYY-NNNNN" unique séquentiel
- ✅ fit_score calculé avec algorithme 60 points (flotte + pays)
- ✅ engagement_score calculé avec critères message/phone/pages
- ✅ qualification_score formule (fit × 0.6) + (engagement × 0.4)
- ✅ lead_stage déterminé automatiquement (SQL/MQL/TOF) selon score
- ✅ Commercial assigné automatiquement selon country_code
- ✅ Email notification envoyé au commercial assigné
- ✅ Email confirmation envoyé au prospect
- ✅ Si pays non implémenté : email "We will arrive soon" + flag expansion
- ✅ Kanban affiche 3 colonnes (NEW, CONTACTED, QUALIFIED) avec compteurs
- ✅ Drag and drop change status avec animation fluide
- ✅ Filtres fonctionnent (country, stage, assigned_to, score)
- ✅ Bouton "+ New Lead" ouvre modal création
- ✅ Modal validation temps réel avec React Hook Form + Zod
- ✅ Audit logs créés automatiquement pour création et modifications
- ✅ Tests unitaires LeadService > 80% coverage
- ✅ Tests API endpoints (POST, GET, PATCH leads) passent
- ✅ Test E2E complet : formulaire public → lead DB → Kanban affiché

### ⏱️ ESTIMATION ÉTAPE 1.1

- **Backend LeadService:** 12 heures (createLead, scoring algorithms, assignation logic, validation)
- **Backend LeadRepository:** 3 heures (findByEmail, findWithFilters, generateLeadCode, countActiveLeads)
- **API REST endpoints:** 5 heures (GET /leads, POST /leads, GET /leads/[id], PATCH /leads/[id], DELETE /leads/[id])
- **Frontend page Kanban:** 10 heures (layout, colonnes, drag and drop, filtres, loading states)
- **Frontend LeadCard:** 3 heures (composant avec hover, actions, animations)
- **Frontend LeadFormModal:** 6 heures (formulaire complet, validation, RGPD conditionnel, soumission)
- **Tests unitaires backend:** 4 heures (LeadService, scoring algorithms)
- **Tests API:** 2 heures (endpoints CRUD leads)
- **Tests E2E:** 3 heures (formulaire public → Kanban)
- **TOTAL Étape 1.1:** **48 heures (6 jours)**

**Ajustement réaliste:** Estimation initiale trop optimiste. Avec complexité scoring, RGPD conditionnel, génération lead_code séquentiel, assignation géographique, emails notifications, l'étape 1.1 prend réellement 6 jours pour qualité production. Accepter cette réalité plutôt que rusher.

---

## ÉTAPE 1.2 : Qualification et Timeline d'Activités (1.5 jours)

### 🎯 RATIONNEL MÉTIER

**Problème actuel:** Les scores sont calculés à la création mais jamais recalculés. Un lead qui visite 10 pages supplémentaires ou télécharge un whitepaper devrait voir son engagement_score augmenter. Un lead qui répond "pas de budget" devrait avoir son fit_score diminué. Sans recalcul dynamique, commerciaux travaillent avec données obsolètes et perdent opportunités chaudes.

**Impact si absent:**

- **Efficacité commerciale:** Commerciaux appellent mauvais leads en priorité = 60% temps perdu sur leads froids
- **Taux conversion:** 5% au lieu de 30% si priorisation correcte
- **Motivation:** Commerciaux découragés par trop de prospects "bidons"
- **Revenus:** Leads chauds (score 80+) traités trop tard = partent concurrent

**Cas d'usage concret:**
Lead initial Ahmed créé avec fit_score = 50, engagement_score = 30, qualification_score = 42 (MQL). Trois jours après, Ahmed revient site, visite 5 pages (pricing, features, case studies), télécharge whitepaper "ROI Fleet Management", télécharge cas client "Comment ABC Logistics réduisit coûts 30%", remplit formulaire "Request Call" avec message détaillé. Avec recalcul automatique : engagement_score passe à 80 (5 pages + 2 downloads + message), qualification_score passe à (50 × 0.6) + (80 × 0.4) = 62 (toujours MQL mais proche SQL). Système détecte engagement fort, envoie notification commercial "Lead ABC Logistics très engagé, appeler maintenant". Commercial appelle dans l'heure, Ahmed dit "Je cherche solution depuis 1 semaine, votre cas client m'a convaincu, on peut signer rapidement". Contrat signé 2 semaines plus tard = 18k€/an. Sans recalcul, Ahmed reste score 42, traité 2 semaines plus tard, a déjà choisi concurrent.

### 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale:** crm_leads (mise à jour scores)
**Table tracking:** crm_lead_activities (nouvelle table pour historique activités)

**Structure crm_lead_activities:**

- id : UUID primary key
- lead_id : UUID FK vers crm_leads NOT NULL ON DELETE CASCADE
- activity_type : enum (page_view, document_download, email_opened, email_clicked, form_submitted, call_logged, meeting_scheduled, demo_attended)
- activity_data : JSONB avec détails spécifiques activité
- occurred_at : timestamp NOT NULL (moment activité, peut être passé si import)
- tracked_at : timestamp NOT NULL DEFAULT NOW (moment enregistrement système)
- source : enum (website, email_campaign, sales_action, manual_entry, integration)
- metadata : JSONB informations complémentaires (user_agent, ip_address, device_type)

**Règles recalcul automatique scores:**

Trigger 1 - Nouvelle activité trackée:
Quand nouvelle ligne créée dans crm_lead_activities, système doit recalculer immédiatement engagement_score du lead concerné en comptant toutes activités des 30 derniers jours.

Trigger 2 - Mise à jour manuelle lead:
Quand commercial met à jour informations lead (fleet_size change de "50" à "100" après découverte lors appel), fit_score doit être recalculé avec nouvelles données.

Trigger 3 - Changement données firmographiques:
Si lead change country_code (erreur initiale corrigée) ou industry, fit_score doit être recalculé.

**Règle reclassification automatique lead_stage:**
Si ancien qualification_score < 70 ET nouveau qualification_score >= 70 alors :

- lead_stage passe de "marketing_qualified" à "sales_qualified"
- Notification envoyée commercial assigné : "Lead [company_name] now Sales Qualified (score [nouveau score])"
- Priorité lead augmentée dans liste (tri par score DESC)
- Créer tâche CRM "Call high-priority SQL lead" pour commercial

Si ancien qualification_score >= 70 ET nouveau qualification_score < 70 alors :

- lead_stage passe de "sales_qualified" à "marketing_qualified"
- Lead retiré queue commerciale prioritaire
- Lead repassé au marketing pour nurturing email campaigns

**Règle réassignation si nouveau SQL sans assigned:**
Si lead passe à lead_stage = "sales_qualified" ET assigned_to IS NULL alors :

- Assigner automatiquement commercial selon règles géographiques
- Créer tâche "Contact new SQL lead within 2 hours"
- Envoyer notification commercial assigné

**Règles tracking activités (événements externes):**

Activités trackées via événements envoyés depuis :

- Site web FleetCore : via Google Tag Manager ou Segment
- Emails marketing : via Resend webhooks (email_opened, email_clicked)
- Chat en ligne : via Intercom webhooks (chat_started, message_sent)
- Actions commerciales : via formulaires CRM (call_logged, meeting_scheduled)

**Points engagement_score par activité:**

- page_view page pricing : +10 points (intérêt achat fort)
- page_view page case_studies : +10 points (recherche validation sociale)
- page_view page features : +5 points
- page_view page about : +3 points
- document_download whitepaper : +15 points (contenu éducatif = recherche active)
- document_download case_study : +20 points (très engagé, proche décision)
- document_download pricing_guide : +25 points (en phase évaluation prix)
- email_opened marketing : +5 points
- email_clicked lien dans email : +10 points
- form_submitted "request_call" : +25 points (signal achat très fort)
- form_submitted "request_demo" : +30 points (le plus fort signal achat)
- demo_attended webinar en ligne : +20 points

**Calcul engagement_score avec activités:**
Nouveau calcul engagement_score prend en compte :

1. Score de base : message fourni (0-30) + phone fourni (0-20) = 0-50 points
2. Score activités 30 derniers jours : somme points toutes activités = 0-100 points (cap à 50)
3. Score total = score_base + MIN(50, score_activités)
4. Normaliser sur 100 : si total > 100 alors 100

**Dégradation score dans temps (lead froid):**
Job cron quotidien à 2h du matin exécute :

- Trouver tous leads avec status IN ('new', 'contacted') AND last_activity_at < NOW - 30 jours
- Pour chaque lead trouvé :
  - engagement_score = engagement_score × 0.8 (réduction 20%)
  - Recalculer qualification_score
  - Si qualification_score passe sous 40 alors lead_stage = "top_of_funnel"
  - Créer audit log "score_degraded_inactivity"
- Retourner nombre leads dégradés pour monitoring

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend - Service Layer

**Modification fichier lib/services/crm/lead.service.ts**

Ajouter méthodes :

**Méthode recalculateScores(leadId: string) → Promise Lead:**

1. Récupérer lead complet depuis DB via findById
2. Recalculer fit_score avec calculateFitScore basé sur données actuelles lead (fleet_size, country_code)
3. Récupérer toutes activités des 30 derniers jours : query SELECT FROM crm_lead_activities WHERE lead_id = leadId AND occurred_at >= NOW - INTERVAL 30 days
4. Calculer score_activites : boucle sur activités, additionner points selon activity_type
5. Recalculer engagement_score : score_base (message + phone) + MIN(50, score_activites)
6. Recalculer qualification_score = (fit_score × 0.6) + (engagement_score × 0.4)
7. Déterminer nouveau lead_stage selon qualification_score
8. Comparer ancien vs nouveau qualification_score et lead_stage
9. Si franchissement seuil 70 (MQL → SQL) :
   - Envoyer notification commercial via notificationService
   - Créer tâche CRM "Call SQL lead" via taskService
   - Si assigned_to NULL, assigner automatiquement commercial
10. Mettre à jour lead en DB : UPDATE fit_score, engagement_score, qualification_score, lead_stage, updated_at
11. Créer audit log "scores_recalculated" avec old et new values
12. Retourner lead mis à jour complet

**Méthode qualifyManually(leadId: string, qualificationData) → Promise Lead:**

1. Récupérer lead
2. Valider qualificationData avec LeadQualifySchema Zod : lead_stage (must be sales_qualified), qualification_notes (string max 500)
3. Mettre à jour lead :
   - lead_stage = "sales_qualified" (forçage manuel par commercial)
   - qualified_date = NOW
   - qualification_notes = qualificationData.notes
   - status reste inchangé (peut être new ou contacted)
4. Si assigned_to NULL, assigner automatiquement commercial zone
5. Créer audit log "lead_manually_qualified" avec commercial qui a qualifié
6. Créer notification manager commercial : "Lead [company] manually qualified by [commercial_name]"
7. Retourner lead qualifié

**Méthode trackActivity(leadId: string, activity: ActivityData) → Promise void:**

1. Valider activity avec ActivityCreateSchema Zod : activity_type (enum), activity_data (object), occurred_at (timestamp optionnel défaut NOW)
2. Vérifier lead existe et appartient tenant
3. Créer entrée dans crm_lead_activities :
   - lead_id = leadId
   - activity_type = activity.type
   - activity_data = activity.data (JSONB)
   - occurred_at = activity.occurred_at || NOW
   - tracked_at = NOW
   - source = activity.source (website, email, manual)
   - metadata = {user_agent, ip_address, device_type depuis requête}
4. Mettre à jour lead.last_activity_at = NOW
5. Appeler automatiquement recalculateScores(leadId) pour mise à jour scores immédiates
6. Si nouveau score franchit seuil, notifications déjà gérées par recalculateScores

**Méthode degradeInactiveScores() → Promise number:**
Méthode appelée par cron job quotidien :

1. Query trouver leads inactifs : SELECT id FROM crm_leads WHERE status IN ('new', 'contacted') AND last_activity_at < NOW - INTERVAL 30 days AND deleted_at IS NULL
2. Pour chaque lead_id trouvé :
   - Récupérer lead complet
   - engagement_score = ROUND(engagement_score × 0.8)
   - Recalculer qualification_score = (fit_score × 0.6) + (engagement_score × 0.4)
   - Si qualification_score < 40 alors lead_stage = "top_of_funnel"
   - UPDATE lead en DB
   - Créer audit log "score_degraded_inactivity"
3. Retourner COUNT leads dégradés pour monitoring dashboard

**Nouveau fichier lib/services/crm/activity.service.ts**

Classe ActivityService extends BaseService :

**Méthode createActivity(leadId: string, activity: ActivityCreateInput) → Promise Activity:**

1. Valider activity avec ActivityCreateSchema
2. Vérifier lead existe et appartient tenant
3. Créer activity dans crm_lead_activities via activityRepository.create
4. Appeler leadService.trackActivity pour recalcul scores
5. Retourner activity créée

**Méthode getActivities(leadId: string, filters) → Promise ActivityList:**

1. Récupérer toutes activités lead : query SELECT FROM crm_lead_activities WHERE lead_id = leadId
2. Si filters.type fourni : AND activity_type = filters.type
3. Si filters.from_date fourni : AND occurred_at >= filters.from_date
4. Si filters.to_date fourni : AND occurred_at <= filters.to_date
5. ORDER BY occurred_at DESC (plus récentes d'abord)
6. Paginer avec limit et offset
7. Retourner liste activités avec total count

**Nouveau fichier lib/repositories/crm/activity.repository.ts**

Classe ActivityRepository extends BaseRepository avec méthodes CRUD standards pour crm_lead_activities.

#### Backend - API REST

**Nouveau fichier app/api/v1/crm/leads/[id]/qualify/route.ts**

**POST /api/v1/crm/leads/[id]/qualify - Qualifier manuellement lead (commercial valide SQL)**

- Middleware : requireAuth
- Middleware : requirePermission("leads.qualify")
- Params : id (UUID lead)
- Body JSON :
  - lead_stage : string must be "sales_qualified"
  - qualification_notes : string max 500 caractères, raison qualification
- Appel leadService.qualifyManually(id, body)
- Réponse 200 OK avec lead qualifié complet (lead_stage = sales_qualified, qualified_date renseigné)
- Erreur 422 Unprocessable Entity si lead déjà qualifié ou déjà converti

**Nouveau fichier app/api/v1/crm/leads/[id]/recalculate/route.ts**

**POST /api/v1/crm/leads/[id]/recalculate - Forcer recalcul scores manuellement**

- Middleware : requireAuth
- Middleware : requirePermission("leads.update")
- Params : id (UUID lead)
- Body : aucun (empty)
- Appel leadService.recalculateScores(id)
- Réponse 200 OK avec lead mis à jour incluant nouveaux scores
- Erreur 404 Not Found si lead non trouvé

**Nouveau fichier app/api/v1/crm/leads/[id]/activities/route.ts**

**GET /api/v1/crm/leads/[id]/activities - Liste toutes activités lead (timeline)**

- Middleware : requireAuth
- Middleware : requirePermission("leads.read")
- Params : id (UUID lead)
- Query params :
  - type : filter par activity_type (optionnel)
  - from_date : date début format ISO 8601 (optionnel)
  - to_date : date fin format ISO 8601 (optionnel)
  - limit : nombre résultats (défaut 50)
  - offset : pagination (défaut 0)
- Appel activityService.getActivities(id, filters)
- Réponse 200 OK avec objet :
  - activities : array objets activity avec id, activity_type, activity_data, occurred_at, tracked_at, source
  - total : nombre total activités
  - Exemple activity : {id, activity_type: "page_view", activity_data: {page: "/pricing", duration_seconds: 45}, occurred_at: "2025-11-08T14:23:00Z"}
- Erreur 404 si lead non trouvé

**POST /api/v1/crm/leads/[id]/activities - Tracker nouvelle activité (webhooks externes)**

- Middleware : requireAuth OU API Key public (pour webhooks site web)
- Permissions : "leads.create" si auth, ou API_KEY valide si public
- Params : id (UUID lead)
- Body JSON :
  - activity_type : enum obligatoire (page_view, document_download, email_opened, etc.)
  - activity_data : object optionnel avec détails (page, document, email_id, etc.)
  - occurred_at : timestamp optionnel (défaut NOW)
  - source : enum optionnel (website, email, manual) défaut website
- Appel activityService.createActivity(id, body)
- Réponse 201 Created avec activity créée
- Side effect : scores lead recalculés automatiquement, notifications envoyées si seuil franchi
- Erreur 400 si validation échoue

**Nouveau fichier app/api/cron/leads/degrade-scores/route.ts**

**GET /api/cron/leads/degrade-scores - Cron job quotidien dégrade scores leads inactifs**

- Auth : vérification CRON_SECRET dans header (X-Cron-Secret = valeur variable environnement)
- Pas de middleware auth classique, sécurité par secret partagé
- Pas de params ni body
- Appel leadService.degradeInactiveScores()
- Réponse 200 OK avec objet :
  - degraded_count : nombre leads dont score dégradé
  - executed_at : timestamp exécution
  - Exemple : {degraded_count: 23, executed_at: "2025-11-08T02:00:00Z"}
- Erreur 403 Forbidden si CRON_SECRET invalide
- Schedulé via Vercel Cron ou autre service cron externe à 2h du matin quotidien

#### Frontend - Interface Utilisateur

**Nouvelle page app/[locale]/crm/leads/[id]/page.tsx**

Page détail d'un lead avec timeline activités complète.

**Structure layout page détail:**

Section en-tête :

- Breadcrumb : CRM > Leads > [lead_code]
- Nom lead : first_name + last_name en titre h1
- Sous-titre : company_name + flag pays
- Bouton actions dropdown en haut droite : Edit, Qualify, Convert, Delete

Section scores (cards horizontales) :

- Card Fit Score : valeur fit_score/60 avec barre progression, couleur orange si < 40, vert si >= 40
- Card Engagement Score : valeur engagement_score/100 avec barre progression, couleur selon valeur
- Card Qualification Score : valeur qualification_score/100 avec barre progression grande, couleur selon valeur
- Chaque card : tooltip expliquant comment score calculé
- Bouton "Recalculate Scores" sous cards : force recalcul via API

Section détails lead (grid 2 colonnes) :

- Colonne gauche :
  - Email : avec icône email + bouton copier
  - Phone : avec icône phone + bouton appeler (ouvre tel:)
  - Country : flag + nom complet pays
  - Fleet Size : icône véhicule + valeur enum
  - Industry : icône industrie + valeur si renseigné
  - Current Software : valeur texte si renseigné
- Colonne droite :
  - Lead Code : badge avec lead_code (exemple : LEAD-2025-00042)
  - Status : badge coloré selon status (new vert, contacted bleu, qualified orange, etc.)
  - Stage : badge coloré selon lead_stage (TOF gris, MQL orange, SQL vert)
  - Assigned to : avatar + nom commercial avec lien vers profil
  - Created : date complète + temps relatif (Created Nov 8, 2025 10:05 AM - 3 days ago)
  - Last Activity : date last_activity_at avec temps relatif (Last activity 2 hours ago)
  - Next Action : date next_action_date avec temps relatif (Next action in 5 hours)

Section message lead (si existe) :

- Card avec contenu message prospect en texte gris italique
- Icône quote au début

Section timeline activités (liste verticale reverse chrono) :

- Titre "Activity Timeline" avec compteur nombre activités
- Liste activités scrollable max-height 600px :
  - Chaque activité affichée comme card avec :
    - Icône selon type : 🌐 page_view, 📥 document_download, 📧 email_opened, 📞 call_logged, etc.
    - Titre : type activité en langage naturel ("Visited Pricing Page", "Downloaded Case Study", "Opened Marketing Email")
    - Date/heure : format complet + temps relatif ("Nov 8, 2025 2:25 PM - 3 hours ago")
    - Détails activity_data : selon type, afficher infos pertinentes (page visitée, document téléchargé, email ouvert, durée, etc.)
    - Badge source : website, email, manual avec couleur
  - Séparateur ligne pointillée entre activités
  - Dernière activité : "Lead Created" avec date création
- Si aucune activité autre que création : message "No activity tracked yet"

Section actions (footer sticky) :

- Bouton "📞 Log Call" : ouvre modal pour enregistrer appel téléphonique
- Bouton "📧 Send Email" : ouvre modal envoi email prospect
- Bouton "✅ Qualify" : ouvre modal qualification manuelle
- Bouton "🔄 Convert to Opportunity" : ouvre modal conversion (détaillé étape 1.3)
- Boutons désactivés si lead déjà converti

**Composant components/crm/ActivityTimeline.tsx**

Props :

- activities : array objets Activity
- loading : boolean pour skeleton state

Affichage liste activités :

- Mapping activities.map pour chaque activité
- Icône adaptée selon activity_type (mapping type → emoji/icône)
- Titre formaté humainement (page_view → "Visited [page name]", document_download → "Downloaded [document name]")
- Date formatée avec date-fns : format(occurred_at, "MMM d, yyyy h:mm a") + " - " + formatDistanceToNow(occurred_at, {addSuffix: true})
- Détails activity_data affichés selon type (si page_view afficher durée, si email_opened afficher subject, etc.)
- Badge source avec couleur (website bleu, email vert, manual gris)
- Animation fade-in pour nouvelles activités

**Composant components/crm/ScoreDisplay.tsx**

Props :

- label : string (exemple : "Fit Score")
- score : number (exemple : 50)
- maxScore : number (exemple : 60 pour fit, 100 pour engagement/qualification)
- color : string (red, orange, green)
- tooltip : string explication calcul score

Affichage card score :

- Container card avec padding, shadow, rounded corners
- Titre label en haut (exemple : "Fit Score")
- Valeur grande : score/maxScore (exemple : "50/60")
- Barre progression horizontale :
  - Largeur = (score / maxScore) × 100%
  - Couleur background selon color prop
  - Animation transition width smooth
- Icône info avec tooltip hover expliquant calcul
- Si color="red" alors bg-red-100 text-red-800, si "orange" bg-orange-100 text-orange-800, si "green" bg-green-100 text-green-800

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet sponsor (Étape 1.2) :**

**Démo 1 - Timeline activités visible:**

1. Naviguer vers /crm/leads et cliquer carte "Ahmed Al-Mansoori"
2. Page détail s'ouvre avec toutes infos lead
3. Voir section scores en haut :
   - Fit Score : 50/60 (orange)
   - Engagement Score : 30/100 (rouge)
   - Qualification Score : 42/100 (orange)
4. Voir badge "MQL" (Marketing Qualified Lead)
5. Scroll vers section Activity Timeline
6. Voir timeline avec activités depuis création :
   - "Lead Created" (5 nov 10:05 AM)
   - "Opened Marketing Email" (5 nov 11:30 AM) - email "Welcome to FleetCore"
   - "Visited Pricing Page" (8 nov 2:25 PM) - 45 seconds

**Démo 2 - Tracking nouvelle activité et recalcul auto:**

1. Simuler Ahmed télécharge document : appel API POST /api/v1/crm/leads/[ahmed-id]/activities body {activity_type: "document_download", activity_data: {document: "case_study_abc_logistics.pdf"}}
2. Retourner page détail Ahmed, rafraîchir
3. Timeline affiche nouvelle activité : "Downloaded Case Study" (maintenant - il y a 1 minute)
4. Scores automatiquement recalculés :
   - Engagement Score : 30 → 50 (base 30 + 20 points document_download)
   - Qualification Score : 42 → 48 (nouveau calcul avec engagement 50)
5. Badge reste "MQL" car pas encore 70

**Démo 3 - Recalcul manuel scores:**

1. Sur page détail Ahmed, cliquer bouton "Recalculate Scores"
2. Loader s'affiche sur bouton
3. Appel API POST /api/v1/crm/leads/[ahmed-id]/recalculate
4. Scores cards se mettent à jour avec animation :
   - Barres progression se remplissent progressivement
   - Valeurs chiffres changent avec transition
5. Toast notification : "Scores recalculated successfully"

**Démo 4 - Lead franchit seuil automatiquement SQL:**

1. Simuler plusieurs activités rapidement pour Ahmed :
   - POST /activities body {activity_type: "page_view", activity_data: {page: "/features"}}
   - POST /activities body {activity_type: "page_view", activity_data: {page: "/case-studies"}}
   - POST /activities body {activity_type: "document_download", activity_data: {document: "pricing_guide.pdf"}}
   - POST /activities body {activity_type: "form_submitted", activity_data: {form: "request_demo"}}
2. Engagement Score monte rapidement : 30 → 50 → 60 → 75 → 100
3. Qualification Score : (50 × 0.6) + (100 × 0.4) = 70 (franchit seuil!)
4. Badge change automatiquement de "MQL" orange vers "SQL" vert avec animation
5. Commercial Karim reçoit notification push : "Lead ABC Logistics now Sales Qualified (score 70)"
6. Notification email Karim : "High priority lead requires immediate contact"

**Démo 5 - Qualification manuelle par commercial:**

1. Commercial Karim sur page détail Ahmed, clique bouton "✅ Qualify"
2. Modal s'ouvre "Qualify Lead Manually"
3. Formulaire :
   - Stage : dropdown pré-rempli "Sales Qualified Lead"
   - Notes : textarea "Lead very interested after demo call, confirmed budget 3000€/month, decision within 2 weeks"
4. Soumettre formulaire
5. Modal se ferme
6. Badge passe à "SQL" si pas déjà (ou reste SQL si déjà)
7. Qualified Date renseignée : "Qualified Nov 8, 2025 3:45 PM"
8. Timeline nouvelle entrée : "Lead Manually Qualified by Karim" avec notes
9. Notification manager commercial : "Lead ABC Logistics manually qualified by Karim Al-Rashid"

**Démo 6 - Dégradation score inactivité (cron simulation):**

1. Créer lead test avec last_activity_at = 35 jours passés (simulation ancien lead)
2. Lead a engagement_score = 60, qualification_score = 50 (MQL)
3. Exécuter manuellement cron : appel GET /api/cron/leads/degrade-scores avec header X-Cron-Secret
4. Réponse : {degraded_count: 1, executed_at: "..."}
5. Vérifier lead test : engagement_score = 48 (60 × 0.8), qualification_score = 42 (nouveau calcul)
6. Lead_stage reste MQL (42 > 40)
7. Audit log créé : "score_degraded_inactivity"

**Critères acceptation Étape 1.2:**

- ✅ Timeline activités affiche historique complet lead
- ✅ Nouvelle activité trackée apparaît immédiatement timeline
- ✅ Scores recalculés automatiquement après chaque activité
- ✅ Bouton Recalculate force recalcul avec animation
- ✅ Lead franchissant seuil 70 change automatiquement badge MQL → SQL
- ✅ Notification envoyée commercial quand lead devient SQL
- ✅ Qualification manuelle fonctionne avec notes
- ✅ Cron job dégrade scores leads inactifs > 30 jours
- ✅ Page détail affiche tous champs lead + scores + timeline
- ✅ Animations fluides sur changements scores
- ✅ Activity types variés supportés (page_view, download, email, form)
- ✅ Tests unitaires recalculateScores > 80% coverage
- ✅ Test E2E : tracking activité → recalcul → notification

### ⏱️ ESTIMATION ÉTAPE 1.2

- **Backend modification LeadService:** 6 heures (recalculateScores, qualifyManually, trackActivity, degradeInactiveScores)
- **Backend ActivityService:** 3 heures (createActivity, getActivities)
- **Backend ActivityRepository:** 2 heures (CRUD activities)
- **API REST endpoints:** 4 heures (POST /qualify, POST /recalculate, GET /activities, POST /activities, GET /cron/degrade)
- **Frontend page détail lead:** 6 heures (layout complet, sections scores/détails/timeline)
- **Frontend ActivityTimeline:** 3 heures (composant liste activités avec icônes, formatage)
- **Frontend ScoreDisplay:** 2 heures (composant cards scores avec barres progression)
- **Tests unitaires:** 2 heures (recalculateScores, activity tracking)
- **Tests API:** 1 heure (endpoints activities)
- **Tests E2E:** 2 heures (activité → recalcul → notification)
- **TOTAL Étape 1.2:** **31 heures (4 jours)**

---

## ÉTAPE 1.3 : Conversion Lead → Opportunity (1.5 jours)

### 🎯 RATIONNEL MÉTIER

**Problème actuel:** Lead qualifié SQL n'est pas encore client. Il doit passer par pipeline commercial (démo produit, proposition commerciale, négociation) avant signature. Sans conversion structurée Lead → Opportunity, aucune traçabilité entre lead initial et opportunité commerciale. Impossible savoir quel lead a généré quelle opportunité, quel canal marketing a meilleur ROI, ou combien temps prend conversion.

**Impact si absent:**

- **Attribution marketing:** Impossible mesurer ROI campagnes (quel canal convertit mieux?)
- **Prévisions commerciales:** Pas de pipeline visible = impossible prévoir revenus futurs
- **Suivi performance:** Impossible calculer taux conversion Lead → Opportunity → Contract
- **Optimisation processus:** Pas de metrics = impossible identifier goulots

**Cas d'usage concret:**
Ahmed Al-Mansoori (ABC Logistics) qualifié SQL avec score 72/100. Commercial Karim appelle, fait démo produit, Ahmed très intéressé. Karim veut créer opportunité commerciale pour tracker prochaines étapes (proposition, négociation, closing). Conversion Lead → Opportunity : Karim clique "Convert to Opportunity" sur fiche lead Ahmed. Modal s'ouvre avec formulaire pré-rempli : Lead source ABC Logistics (Ahmed Al-Mansoori), Expected value 18000€ (calculé : 80 véhicules × 18.75€/véhicule/mois × 12 mois), Probability 30% (étape initiale Qualification), Expected close date +45 jours, Stage Qualification, Owner Karim. Karim confirme, opportunity créée, lead passe status "converted", champ lead.opportunity_id rempli (lien bidirectionnel), opportunity visible pipeline commercial /crm/opportunities, tout historique lead (activités, notes, scores) lié opportunity.

**Valeur business:**

- **Traçabilité complète:** Première visite site web jusqu'au contrat signé
- **Attribution marketing:** Si opportunity gagnée, on sait Google Ads généré 18k€ revenus
- **Pipeline visible:** Manager voit 50 opportunities en cours = forecast 600k€ sur 3 prochains mois
- **Optimisation:** Analyse montre leads source "Partner" convertissent 2x mieux que "Google Ads" → réallocation budget marketing

### 📊 DONNÉES ET RÈGLES MÉTIER

**Tables impliquées:**

- **crm_leads:** status passe à "converted", opportunity_id renseigné, converted_date rempli
- **crm_opportunities:** nouvelle ligne créée avec lien vers lead

**Règles conversion strictes:**

Règle 1 - Lead doit être qualifié SQL:
Seuls leads avec lead_stage = "sales_qualified" peuvent être convertis. Les MQL ou TOF doivent d'abord être qualifiés manuellement par commercial avant conversion.

Règle 2 - Lead ne peut être converti qu'une fois:
Si lead.opportunity_id déjà renseigné (NOT NULL), erreur "Lead already converted to opportunity". Un lead ne génère qu'une seule opportunity. Si opportunity perdue, possibilité créer nouvelle opportunity mais en dupliquant lead (nouveau lead_id).

Règle 3 - Héritage données Lead → Opportunity automatique:
Lors conversion, champs lead copiés automatiquement vers opportunity :

- lead.company_name → opportunity.company_name
- lead.country_code → opportunity.country_code
- lead.fleet_size → utilisé pour calculer opportunity.expected_value
- lead.assigned_to → opportunity.owner_id (commercial responsable)
- lead.utm_source / utm_campaign → opportunity.metadata.attribution (traçabilité marketing)
- lead.industry → opportunity.metadata.industry

Règle 4 - Calcul automatique expected_value (revenus annuels estimés):
Formule : expected_value = nombre_vehicules × prix_par_vehicule_mensuel × 12 mois

Extraction nombre véhicules depuis fleet_size enum :

- fleet_size = "500+" → 600 véhicules (moyenne haute)
- fleet_size = "101-500" → 250 véhicules (milieu fourchette)
- fleet_size = "51-100" → 75 véhicules
- fleet_size = "11-50" → 30 véhicules
- fleet_size = "1-10" → 5 véhicules
- fleet_size = "unknown" → 30 véhicules (défaut moyen)

Prix par véhicule mensuel selon pays et plan :

- Plan Standard défaut : 18.75€/véhicule/mois
- Plan Premium (optionnel) : 25€/véhicule/mois
- Plan Starter (optionnel) : 12.50€/véhicule/mois
- Ajustement géographique :
  - Pays Golfe (AE, SA, QA) : prix × 1.2 (marché premium)
  - France : prix × 1.0 (marché standard)
  - Autres pays : prix × 0.9 (ajustement local)

Exemple calcul Ahmed : fleet_size = "51-100" → 75 véhicules, pays = UAE → prix 18.75€ × 1.2 = 22.5€/véhicule/mois, expected_value = 75 × 22.5€ × 12 = 20250€/an

Règle 5 - Initialisation stage et probability automatique:
À la conversion, opportunity commence toujours avec :

- stage = "prospecting" (si démo pas encore faite) OU "qualification" (si démo déjà effectuée)
- probability_percent = 10% si prospecting, 30% si qualification
- status = "open" (opportunité active en cours)
- expected_close_date = today + 45 jours (durée moyenne sales cycle FleetCore)
- currency = détecté depuis country_code (AE → AED, FR → EUR, SA → SAR, autres → EUR)

Règle 6 - Traçabilité attribution marketing complète:
Opportunity doit conserver toutes infos attribution lead pour calcul ROI campagnes :

- opportunity.metadata.lead_id = lead.id
- opportunity.metadata.lead_code = lead.lead_code
- opportunity.metadata.utm_source = lead.utm_source
- opportunity.metadata.utm_medium = lead.utm_medium
- opportunity.metadata.utm_campaign = lead.utm_campaign
- opportunity.metadata.lead_created_at = lead.created_at
- opportunity.metadata.lead_qualified_at = lead.qualified_date
- opportunity.metadata.conversion_date = NOW

Permet calculs :

- Time to Convert : lead_qualified_at → conversion_date
- Cost per Opportunity : Coût campagne / Nombre opportunities générées
- ROI par source : (Revenus opportunities won / Coût marketing source) - 1

Règle 7 - Notifications stakeholders automatiques:
Lors conversion, notifications envoyées à :

- Manager commercial : "New opportunity created by Karim, estimated value 20k€, company ABC Logistics"
- Équipe Customer Success : "Prepare onboarding for ABC Logistics, expected closing Dec 25"
- Marketing (si utm_source présent) : "Lead from Google Ads converted to opportunity, campaign dubai_q4"

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend - Service Layer

**Modification fichier lib/services/crm/lead.service.ts**

Ajouter méthode :

**Méthode convertToOpportunity(leadId: string, conversionData: OpportunityCreateInput) → Promise Opportunity:**

1. Récupérer lead complet via findById(leadId) avec toutes relations
2. Vérifier lead.lead_stage = "sales_qualified" :
   - Si NON, throw BusinessRuleError("Lead must be qualified as SQL before conversion")
3. Vérifier lead.opportunity_id IS NULL :
   - Si NON (déjà renseigné), throw BusinessRuleError("Lead already converted to opportunity")
4. Calculer expected_value automatiquement si non fourni dans conversionData :
   - Extraire nb_vehicles depuis lead.fleet_size selon mapping
   - Déterminer prix_par_vehicule selon pays et plan (défaut Standard)
   - Calculer expected_value = nb_vehicles × prix_par_vehicule × 12
5. Déterminer currency automatique depuis lead.country_code :
   - AE → "AED", SA → "SAR", QA → "QAR", FR → "EUR", autres → "EUR"
6. Préparer opportunityData objet complet :
   - company_name : lead.company_name
   - lead_id : lead.id
   - owner_id : lead.assigned_to (commercial responsable lead)
   - stage : conversionData.stage || "qualification" (défaut)
   - status : "open"
   - expected_value : valeur calculée ou fournie
   - probability_percent : 30 (défaut qualification) ou selon stage
   - expected_close_date : conversionData.expected_close_date || (today + 45 jours)
   - currency : déterminé automatiquement
   - country_code : lead.country_code
   - metadata : {
     lead_id, lead_code, utm_source, utm_campaign, utm_medium,
     lead_created_at, lead_qualified_at, conversion_date: NOW,
     industry: lead.industry, fleet_size: lead.fleet_size
     }
7. Créer opportunity via opportunityService.createOpportunity(opportunityData)
8. Mettre à jour lead en DB :
   - status = "converted"
   - converted_date = NOW
   - opportunity_id = opportunity.id (lien bidirectionnel)
9. Créer audit logs doubles :
   - Lead : action "lead_converted" avec opportunity_id
   - Opportunity : action "opportunity_created_from_lead" avec lead_id
10. Envoyer notifications :
    - Manager commercial via notificationService
    - Customer Success team via email
    - Marketing attribution webhook si utm_source présent
11. Retourner opportunity créée complète

**Méthode calculateExpectedValue(fleetSize, countryCode, planType) → number:**
Implémente algorithme calcul décrit ci-dessus. Retourne valeur en euros par an.

**Nouveau fichier lib/services/crm/opportunity.service.ts**

Classe OpportunityService extends BaseService :

**Méthode createOpportunity(data: OpportunityCreateInput) → Promise Opportunity:**

1. Valider data avec OpportunityCreateSchema Zod complet
2. Extraire tenant_id depuis contexte auth
3. Si lead_id fourni, vérifier lead existe et pas déjà converti (query lead.opportunity_id IS NULL)
4. Générer opportunity_code unique format "OPP-YYYY-NNNNN" (similaire lead_code) : query MAX, incrémenter, formater
5. Calculer forecast_value automatiquement : forecast_value = expected_value × (probability_percent / 100)
6. Créer opportunity en DB via opportunityRepository.create :
   - Tous champs data
   - opportunity_code généré
   - forecast_value calculé
   - created_at = NOW
   - created_by = current_user
7. Créer lifecycle event "opportunity_created" dans table crm_opportunity_lifecycle_events (tracking progression)
8. Créer audit log "opportunity_created"
9. Envoyer notification owner (commercial) : "New opportunity assigned to you: [company_name]"
10. Retourner opportunity créée complète

**Méthode findAll(filters: OpportunityFilters) → Promise OpportunityList:**

1. Extraire tenant_id contexte
2. Construire query Prisma :
   - WHERE tenant_id = tenant_id
   - WHERE deleted_at IS NULL
   - Si filters.stage fourni : AND stage = filters.stage
   - Si filters.status fourni : AND status = filters.status
   - Si filters.owner_id fourni : AND owner_id = filters.owner_id
   - Si filters.pipeline_id fourni : AND pipeline_id = filters.pipeline_id
   - Si filters.expected_close_from fourni : AND expected_close_date >= from
   - Si filters.expected_close_to fourni : AND expected_close_date <= to
3. ORDER BY expected_close_date ASC par défaut (plus urgents d'abord)
4. Paginer avec limit et offset
5. Inclure relations : lead (origine), owner (commercial), pipeline si existe
6. Calculer forecast_total : SUM(forecast_value) sur toutes opportunities filtrées
7. Retourner objet {opportunities: array, total: count, forecast_total: sum, pagination}

**Méthode findById(id: string) → Promise Opportunity:**
Query opportunity par id avec tenant_id, inclure toutes relations, throw NotFoundError si pas trouvé.

**Nouveau fichier lib/repositories/crm/opportunity.repository.ts**

Classe OpportunityRepository extends BaseRepository :

**Méthode generateOpportunityCode(year: number) → Promise string:**
Similaire generateLeadCode mais pour opportunities format "OPP-YYYY-NNNNN".

**Méthode findWithRelations(id, tenantId) → Promise Opportunity:**
Query opportunity incluant relations : lead (complet avec activités), owner, pipeline, contract si existe.

#### Backend - API REST

**Nouveau fichier app/api/v1/crm/leads/[id]/convert/route.ts**

**POST /api/v1/crm/leads/[id]/convert - Convertir lead en opportunity**

- Middleware : requireAuth
- Middleware : requirePermission("leads.convert")
- Params : id (UUID lead)
- Body JSON optionnel (tous champs optionnels car auto-calculés) :
  - stage : enum (prospecting, qualification, proposal, negotiation, closing) défaut "qualification"
  - expected_value : number (si fourni override calcul auto)
  - expected_close_date : date ISO 8601 (si fourni override today + 45j)
  - plan_type : enum (starter, standard, premium) défaut "standard" (impact calcul expected_value)
  - notes : string max 500 caractères, contexte conversion
- Appel leadService.convertToOpportunity(id, body)
- Réponse 201 Created avec objet double :
  - opportunity : object opportunity créée complète (id, opportunity_code, company_name, lead_id, stage, status, expected_value, probability_percent, forecast_value, expected_close_date, owner_id, created_at)
  - lead : object lead mis à jour (id, status: "converted", converted_date, opportunity_id)
- Erreur 422 Unprocessable Entity avec message spécifique :
  - "Lead not qualified" si lead_stage != sales_qualified
  - "Lead already converted" si opportunity_id NOT NULL
- Erreur 404 Not Found si lead non trouvé ou autre tenant

**Nouveau fichier app/api/v1/crm/opportunities/route.ts**

**GET /api/v1/crm/opportunities - Liste toutes opportunities tenant**

- Middleware : requireAuth
- Middleware : requirePermission("opportunities.read")
- Query params :
  - stage : filter par stage (prospecting, qualification, proposal, negotiation, closing)
  - status : filter par status (open, won, lost, on_hold, cancelled)
  - owner_id : filter par UUID owner commercial
  - pipeline_id : filter par UUID pipeline si multi-pipelines
  - expected_close_from : date min closing ISO 8601
  - expected_close_to : date max closing ISO 8601
  - limit : nombre résultats (défaut 50, max 100)
  - offset : pagination (défaut 0)
- Appel opportunityService.findAll(filters)
- Réponse 200 OK avec objet :
  - opportunities : array objets opportunity complets
  - total : nombre total opportunities (hors pagination)
  - forecast_total : somme forecast_value toutes opportunities filtrées (prévision revenus)
  - limit, offset : pagination info
  - Chaque opportunity contient : id, opportunity_code, company_name, lead (objet lead origine), stage, status, expected_value, probability_percent, forecast_value, expected_close_date, owner (objet commercial complet), created_at
- Erreur 401 si token invalide
- Erreur 403 si permission opportunities.read manquante

**POST /api/v1/crm/opportunities - Créer opportunity manuellement sans lead**

- Middleware : requireAuth
- Middleware : requirePermission("opportunities.create")
- Middleware : validate(OpportunityCreateSchema)
- Body JSON :
  - company_name : string obligatoire
  - stage : enum obligatoire
  - status : enum défaut "open"
  - expected_value : number obligatoire
  - currency : string 3 lettres (AED, EUR, SAR) obligatoire
  - probability_percent : number 0-100 optionnel (défaut selon stage)
  - expected_close_date : date ISO 8601 obligatoire
  - owner_id : UUID commercial obligatoire
  - country_code : string 2 lettres optionnel
  - plan_id : UUID plan tarifaire optionnel
  - pipeline_id : UUID pipeline optionnel
  - notes : string max 500 optionnel
- Appel opportunityService.createOpportunity(body)
- Réponse 201 Created avec opportunity créée complète
- Erreur 400 si validation échoue
- Erreur 422 si règles métier violées

**Nouveau fichier app/api/v1/crm/opportunities/[id]/route.ts**

**GET /api/v1/crm/opportunities/[id] - Détails complets opportunity**

- Middleware : requireAuth
- Middleware : requirePermission("opportunities.read")
- Params : id (UUID opportunity)
- Appel opportunityService.findById(id)
- Réponse 200 OK avec opportunity complète incluant lead origine, owner, pipeline, contract si existe
- Erreur 404 si opportunity non trouvée

#### Frontend - Interface Utilisateur

**Modification page app/[locale]/crm/leads/[id]/page.tsx**

Ajouter bouton "🔄 Convert to Opportunity" dans section actions.

**Règles affichage bouton Convert:**

- Visible uniquement si lead_stage = "sales_qualified" (badge SQL vert)
- Visible uniquement si opportunity_id IS NULL (pas déjà converti)
- Si lead déjà converti : bouton remplacé par badge "Converted to Opportunity" avec lien cliquable vers /crm/opportunities/[opportunity_id]

**Comportement click bouton Convert:**

1. Ouvre modal ConvertLeadModal
2. Modal pré-remplit formulaire avec données lead
3. Utilisateur peut ajuster valeurs si nécessaire
4. Soumission crée opportunity et met à jour lead

**Nouveau composant components/crm/ConvertLeadModal.tsx**

Modal formulaire conversion lead en opportunity.

Props :

- isOpen : boolean contrôle modal
- onClose : callback fermeture
- lead : objet Lead complet pré-charger formulaire
- onSuccess : callback après conversion réussie

**Champs formulaire conversion:**

Section Company Info (pré-remplie, éditable) :

- Company name : input texte pré-rempli lead.company_name, modifiable, obligatoire
- Country : dropdown pré-sélectionné lead.country_code, modifiable

Section Financial (calcul automatique, éditable) :

- Expected value : input number grande taille, pré-calculé automatiquement, modifiable, suffixe devise (€, AED, SAR)
- Plan type : dropdown (Starter 12.50€, Standard 18.75€, Premium 25€) défaut Standard, change expected_value en temps réel
- Affichage détail calcul sous expected_value :
  - "Calculation: [nb_vehicles] vehicles × [prix]€/vehicle/month × 12 months = [total]€/year"
  - Exemple : "75 vehicles × 22.50€/vehicle/month × 12 months = 20,250€/year"
  - Si utilisateur change plan_type, recalcul automatique et affichage update

Section Sales Process :

- Stage : dropdown (Prospecting, Qualification, Proposal, Negotiation, Closing) défaut Qualification, obligatoire
- Probability : readonly calculé automatiquement selon stage (Prospecting 10%, Qualification 30%, Proposal 50%, Negotiation 70%, Closing 90%)
- Expected close date : date picker, pré-rempli today + 45 jours, modifiable, obligatoire
- Notes : textarea optionnel max 500 caractères, placeholder "Add context about this opportunity..."

Section Attribution (readonly, informatif) :

- Lead Code : badge affichant lead.lead_code
- UTM Source : badge si lead.utm_source présent
- UTM Campaign : badge si lead.utm_campaign présent
- Created : date lead.created_at format lisible
- Qualified : date lead.qualified_date format lisible

**Validation temps réel formulaire:**

- Expected value min 100€ obligatoire
- Expected close date >= today obligatoire
- Expected close date <= today + 2 ans obligatoire
- Company name min 2 caractères obligatoire

**Soumission formulaire:**

1. Click bouton "Convert to Opportunity"
2. Loader dans bouton (spinner + "Converting...")
3. Appel POST /api/v1/crm/leads/[lead.id]/convert avec body {stage, expected_value, expected_close_date, plan_type, notes}
4. Si succès :
   - Modal se ferme automatiquement
   - Toast success "Opportunity created successfully"
   - Redirection automatique vers page détail opportunity /crm/opportunities/[opportunity.id]
   - Page lead mise à jour : badge "Converted" apparaît, bouton Convert remplacé par lien vers opportunity
5. Si erreur :
   - Modal reste ouverte
   - Bannière rouge erreur en haut modal avec message détaillé
   - Si 422 "Lead not qualified" : message "Lead must be Sales Qualified before conversion"
   - Si 422 "Already converted" : message "This lead is already converted to an opportunity"

**Nouvelle page app/[locale]/crm/opportunities/page.tsx**

Page principale module Opportunities avec pipeline Kanban 5 stages.

**Structure layout page pipeline:**

En-tête page :

- Breadcrumb : CRM > Opportunities
- Bouton "+ New Opportunity" en haut droite (création manuelle)

Section stats pipeline (cards horizontales) :

- Card "Total Open" : nombre opportunities status open, valeur forecast_total somme
- Card "Win Rate" : pourcentage opportunities won / total historique
- Card "Average Deal" : moyenne expected_value toutes opportunities
- Card "Forecast" : forecast_total mois en cours avec indicateur tendance

Pipeline Kanban 5 colonnes :

- Colonne "PROSPECTING" : stage prospecting, compteur nombre opps, somme expected_value colonne, probability moyenne 10%
- Colonne "QUALIFICATION" : stage qualification, compteur, somme, probability 30%
- Colonne "PROPOSAL" : stage proposal, compteur, somme, probability 50%
- Colonne "NEGOTIATION" : stage negotiation, compteur, somme, probability 70%
- Colonne "CLOSING" : stage closing, compteur, somme, probability 90%
- Chaque colonne affiche cartes opportunities empilées verticalement
- Bouton "+ Add" en bas chaque colonne pour création rapide

**Carte opportunity (OpportunityCard component) affiche:**

- Nom entreprise : company_name en gras titre
- Valeur : expected_value avec currency symbol (€, AED, SAR)
- Barre progression probability : barre horizontale colorée selon probability (rouge < 30%, orange 30-69%, vert 70%+)
- Probability percent : chiffre à droite barre (exemple : "50%")
- Avatar owner : photo + nom commercial assigné
- Expected close date : date relative (dans 15 jours, dans 2 mois)
- Badge source lead : si lead_id présent, petit badge "From Lead [lead_code]"

**Fonctionnalité drag and drop pipeline:**

- Utilisateur glisse carte opportunity d'un stage vers autre stage
- Pendant glissement : carte semi-transparente, colonnes cibles surbrillent
- Au drop : appel API PATCH /api/v1/crm/opportunities/[id] avec nouveau stage
- Mise à jour optimiste UI (carte déplace immédiatement)
- Probability_percent recalculé automatiquement selon nouveau stage
- Forecast_value recalculé : expected_value × new_probability
- Compteurs et sommes colonnes mis à jour instantanément
- Animation fluide avec Framer Motion

**Composant components/crm/OpportunityCard.tsx**

Props :

- opportunity : objet Opportunity complet
- onDragStart, onDragEnd : callbacks drag
- onClick : callback click carte navigation détail

Affichage détaillé carte :

- Section header : company_name taille 18px bold, badge "From Lead [code]" si origine lead
- Section valeur : expected_value grande taille 20px avec currency symbol, couleur selon montant (vert si > 20k, bleu standard)
- Barre progression probability : largeur = probability_percent, couleur fond selon valeur (bg-red-100 si < 30%, bg-orange-100 si 30-69%, bg-green-100 si 70%+)
- Probability text : chiffre probability_percent% à droite barre
- Section owner : mini avatar circular + first_name commercial
- Section date : icône calendrier + expected_close_date formaté relatif ("In 15 days", "In 2 months")
- Hover effet : élévation shadow-lg, scale 1.02, cursor pointer
- Click navigation vers /crm/opportunities/[id]

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet sponsor (Étape 1.3) :**

**Démo 1 - Lead SQL prêt conversion:**

1. Naviguer /crm/leads, filtrer stage "Sales Qualified"
2. Voir liste leads SQL avec badge vert
3. Cliquer carte "Ahmed Al-Mansoori" (SQL, score 72/100)
4. Page détail lead affichée
5. Voir bouton "🔄 Convert to Opportunity" activé dans actions

**Démo 2 - Conversion lead en opportunity:**

1. Cliquer bouton "Convert to Opportunity"
2. Modal ConvertLeadModal s'ouvre avec formulaire pré-rempli :
   - Company : "ABC Logistics Test"
   - Country : "UAE 🇦🇪"
   - Expected value : "20,250€" (calcul affiché : "75 vehicles × 22.50€/month × 12 = 20,250€/year")
   - Plan type : "Standard" dropdown
   - Stage : "Qualification" dropdown
   - Probability : "30%" (readonly, auto selon stage)
   - Expected close date : "Dec 25, 2025" date picker
   - Notes : textarea vide
   - Attribution section : Lead Code "LEAD-2025-00042", UTM Source "google", UTM Campaign "dubai_q4"
3. Modifier plan type vers "Premium" dans dropdown
4. Expected value recalcule automatiquement : "22,500€" (75 × 25€ × 12)
5. Affichage calcul update : "75 vehicles × 25.00€/month × 12 = 22,500€/year"
6. Remplir notes : "Demo completed, very interested, confirmed budget, decision within 6 weeks"
7. Cliquer "Convert to Opportunity"
8. Loader affiche "Converting..."
9. Modal se ferme, toast "Opportunity created successfully"
10. Redirection automatique vers /crm/opportunities/[new-opp-id]

**Démo 3 - Vérification conversion réussie:**

1. Page détail opportunity affichée avec :
   - Opportunity Code : "OPP-2025-00018"
   - Company : "ABC Logistics Test"
   - Stage : "Qualification"
   - Status : "Open"
   - Expected Value : "22,500€"
   - Probability : "30%"
   - Forecast Value : "6,750€" (22500 × 0.3)
   - Expected Close : "Dec 25, 2025 (47 days)"
   - Owner : "Karim Al-Rashid" avec avatar
   - Created : "Nov 10, 2025 3:45 PM (just now)"
2. Section "Lead Origin" affiche :
   - Lead Code : "LEAD-2025-00042" (lien cliquable vers lead)
   - Lead Created : "Nov 5, 2025"
   - Lead Qualified : "Nov 8, 2025"
   - Converted : "Nov 10, 2025"
   - Time to Convert : "5 days"
3. Section Attribution marketing affiche :
   - Source : "Google Ads"
   - Campaign : "dubai_logistics_q4"
   - Lead activities count : "12 activities tracked"

**Démo 4 - Lead marqué converti:**

1. Retourner page lead Ahmed /crm/leads/[ahmed-id]
2. Voir badge status changé : "Converted" avec icon check vert
3. Bouton "Convert to Opportunity" disparu
4. Nouveau badge affiché : "Converted to Opportunity [OPP-2025-00018]" cliquable
5. Click badge redirige vers page opportunity
6. Timeline lead affiche nouvelle entrée : "Converted to Opportunity by Karim" avec date

**Démo 5 - Pipeline Kanban avec opportunity:**

1. Naviguer vers /crm/opportunities
2. Voir pipeline Kanban 5 colonnes
3. Colonne "QUALIFICATION" affiche :
   - Compteur : "16 opportunities"
   - Somme valeurs : "€247,500"
   - Probability moyenne : "30%"
4. Carte "ABC Logistics Test" visible dans colonne QUALIFICATION avec :
   - Nom "ABC Logistics Test"
   - Valeur "€22,500"
   - Barre orange 30%
   - Owner "Karim"
   - Date "In 47 days"
   - Badge "From Lead LEAD-2025-00042"
5. Stats pipeline en haut affichent :
   - Total Open : "45 opportunities"
   - Forecast : "€780,000"
   - Win Rate : "32%"
   - Avg Deal : "€17,333"

**Démo 6 - Drag and drop opportunity entre stages:**

1. Glisser carte "ABC Logistics Test" de colonne QUALIFICATION vers colonne PROPOSAL
2. Carte se déplace avec animation fluide
3. API appelée : PATCH /api/v1/crm/opportunities/[opp-id] body {stage: "proposal"}
4. Carte maintenant dans colonne PROPOSAL
5. Probability mis à jour automatiquement : 30% → 50%
6. Forecast_value recalculé : 22500 × 0.5 = 11250€
7. Compteurs colonnes mis à jour :
   - QUALIFICATION : 15 opps, €225,000
   - PROPOSAL : 11 opps, €191,250 (était 10 opps, €180,000)
8. Barre progression carte devient plus remplie et plus verte
9. Audit log créé : "Opportunity stage changed from qualification to proposal by Karim"

**Démo 7 - Attribution marketing visible:**

1. Manager marketing connecté, navigue /crm/opportunities
2. Filtre source "Google Ads" via dropdown
3. Voir toutes opportunities originaires Google Ads campaign
4. Cliquer opportunity "ABC Logistics"
5. Section Attribution affiche détails complets tracking marketing
6. Manager calcule ROI : Coût campagne "dubai_logistics_q4" = 5000€, Forecast value opportunities générées = 50000€, ROI = (50000 / 5000) - 1 = 900% (9x retour investissement)

**Critères acceptation Étape 1.3:**

- ✅ Lead SQL peut être converti en opportunity via modal
- ✅ Expected value calculé automatiquement selon fleet_size, country, plan
- ✅ Modal affiche calcul détaillé expected_value
- ✅ Changement plan_type recalcule expected_value en temps réel
- ✅ Lead passe status "converted" après conversion
- ✅ opportunity_id renseigné dans lead (lien bidirectionnel)
- ✅ Opportunity créée visible immédiatement dans pipeline
- ✅ Pipeline Kanban affiche 5 colonnes avec stats (count, sum, probability)
- ✅ Drag and drop opportunity entre stages fonctionne
- ✅ Probability_percent mis à jour automatiquement selon stage
- ✅ Forecast_value recalculé automatiquement (expected × probability)
- ✅ Attribution marketing préservée (utm_source, campaign, lead origin)
- ✅ Time to Convert calculé et affiché (qualified_date → conversion_date)
- ✅ Notifications envoyées (manager, customer success, marketing)
- ✅ Audit logs créés (lead converted, opportunity created)
- ✅ OpportunityCard affiche tous détails correctement
- ✅ Stats pipeline (forecast, win rate, avg deal) correctes
- ✅ Tests unitaires convertToOpportunity > 80% coverage
- ✅ Test E2E : conversion lead → opportunity visible pipeline

### ⏱️ ESTIMATION ÉTAPE 1.3

- **Backend LeadService.convertToOpportunity:** 4 heures (validation, héritage données, calculs)
- **Backend OpportunityService complet:** 6 heures (createOpportunity, findAll, findById, calculateExpectedValue)
- **Backend OpportunityRepository:** 2 heures (generateOpportunityCode, findWithRelations)
- **API REST endpoints:** 4 heures (POST /convert, GET /opportunities, POST /opportunities, GET /opportunities/[id])
- **Frontend ConvertLeadModal:** 5 heures (formulaire complet, calcul temps réel, validation)
- **Frontend page pipeline:** 8 heures (layout, 5 colonnes, stats, drag and drop)
- **Frontend OpportunityCard:** 3 heures (composant avec barres, badges, animations)
- **Tests unitaires backend:** 2 heures (convertToOpportunity, calculateExpectedValue)
- **Tests API:** 2 heures (endpoints opportunities)
- **Tests E2E:** 2 heures (conversion → pipeline)
- **TOTAL Étape 1.3:** **38 heures (5 jours)**

---

# RÉCAPITULATIF SPRINT 1

**Durée totale Sprint 1:** 6 + 4 + 5 = **15 jours ouvrés (3 semaines)**

**Livrables Sprint 1 complets:**

1. **Capture Leads (Étape 1.1 - 6 jours):**
   - Formulaire public "Request Demo" opérationnel avec validation temps réel
   - Section RGPD conditionnelle si pays UE
   - lead_code généré format "LEAD-YYYY-NNNNN" unique séquentiel
   - Scoring automatique : fit_score (60 pts max), engagement_score (100 pts), qualification_score formule pondérée
   - lead_stage déterminé automatiquement (TOF/MQL/SQL) selon score
   - Assignation géographique automatique commerciaux
   - Emails notifications prospect et commercial
   - Message "We will arrive soon" si pays non implémenté
   - Dashboard Kanban 3 colonnes (NEW, CONTACTED, QUALIFIED) fonctionnel
   - Drag and drop change status avec animations
   - Filtres multiples (country, stage, assigned_to, score) opérationnels
   - Modal création lead manuelle depuis dashboard
   - 18+ tests unitaires, 5+ tests API, 3+ tests E2E

2. **Qualification & Timeline (Étape 1.2 - 4 jours):**
   - Table crm_lead_activities tracking historique complet
   - Recalcul automatique scores après chaque activité
   - Reclassification automatique MQL ↔ SQL selon seuils
   - Notifications commerciaux si lead franchit seuil SQL
   - Qualification manuelle par commercial avec notes
   - Page détail lead complète avec scores, détails, timeline
   - Timeline activités avec icônes, formatage, types variés
   - Bouton recalculate force recalcul avec animations
   - Cron job quotidien dégrade scores leads inactifs > 30j
   - 15+ tests unitaires, 4+ tests API, 2+ tests E2E

3. **Conversion Opportunity (Étape 1.3 - 5 jours):**
   - Conversion Lead → Opportunity avec validation stricte
   - Expected value calculé automatiquement (flotte × prix × 12)
   - Modal conversion avec calcul temps réel
   - Héritage données lead vers opportunity complet
   - Attribution marketing préservée (utm tracking)
   - Time to Convert calculé et affiché
   - Pipeline Kanban 5 stages (PROSPECTING → CLOSING)
   - Stats pipeline (forecast, win rate, avg deal) correctes
   - Drag and drop opportunities entre stages
   - Probability et forecast recalculés automatiquement
   - Notifications stakeholders (manager, CS, marketing)
   - Audit logs doubles (lead + opportunity)
   - 15+ tests unitaires, 6+ tests API, 2+ tests E2E

**Metrics business démontrables Sprint 1:**

- ✅ 100% leads capturés structurés (0% pertes)
- ✅ Taux conversion Lead → Opportunity trackable
- ✅ Time to Convert mesurable (qualified_date → conversion_date)
- ✅ ROI campagnes marketing calculable (attribution complète)
- ✅ Forecast revenus pipeline visible (somme forecast_value)
- ✅ Priorisation automatique leads (scoring intelligent)
- ✅ Réactivité commerciale maximale (notifications temps réel)

**Architecture technique Sprint 1:**

- ✅ 3 services métier complets (LeadService, ActivityService, OpportunityService)
- ✅ 3 repositories optimisés (LeadRepository, ActivityRepository, OpportunityRepository)
- ✅ 15+ validators Zod (création, update, conversion)
- ✅ 12+ endpoints API REST (CRUD + actions métier)
- ✅ 5+ pages frontend (Kanban leads, détail lead, pipeline opportunities)
- ✅ 10+ composants réutilisables (LeadCard, OpportunityCard, modals, timeline)
- ✅ 50+ tests automatisés (unitaires, API, E2E)
- ✅ Audit trail complet automatique
- ✅ Isolation multi-tenant garantie
- ✅ Soft delete systématique

---

# TRANSITION VERS SPRINT 2 : OPPORTUNITY PIPELINE

**Acquis Sprint 1 servant de fondation Sprint 2:**

Sprint 1 a livré la capture et conversion des leads en opportunities. Les opportunities créées ont des champs de base (company, expected_value, stage, status, probability) mais leur gestion complète nécessite Sprint 2.

**État actuel après Sprint 1:**

- ✅ Opportunities créées depuis leads convertis
- ✅ Pipeline Kanban visible avec 5 stages
- ✅ Drag and drop entre stages fonctionnel basique
- ⚠️ Pas de gestion Won/Lost (opportunities restent Open indéfiniment)
- ⚠️ Pas de raisons perte trackées (impossibilité analyser pourquoi deals perdus)
- ⚠️ Pas de gestion contrats (opportunities Won ne deviennent pas contrats)
- ⚠️ Pas d'analytics pipeline (conversion funnel, win rate par source invisible)
- ⚠️ Pas de forecast avancé (prévisions basiques uniquement)

**Objectifs Sprint 2 (5 jours):**

Sprint 2 transforme le pipeline opportunités basique en système commercial complet permettant de gérer tout le cycle de vente jusqu'à la signature contrat, avec analytics détaillés pour optimiser performance commerciale.

**Sprint 2 Étape 2.1 : Gestion Win/Lost Opportunities (2 jours)**

**Problème à résoudre:**
Actuellement, opportunities restent status "open" indéfiniment même après closing. Pas de moyen marquer opportunity comme gagnée (won) ou perdue (lost). Impossible tracker résultats commerciaux, calculer win rate, ou analyser raisons échecs.

**Fonctionnalités à développer:**

- Action "Mark as Won" depuis page détail opportunity :
  - Modal formulaire Won avec champs : won_date (défaut today), won_value (valeur réelle vs expected_value), contract_start_date, notes
  - Validation : won_value >= expected_value × 0.5 (minimum 50% valeur estimée accepté)
  - API PATCH /api/v1/crm/opportunities/[id]/win
  - Mise à jour opportunity : status = "won", stage = "closed", won_date, won_value
  - Création automatique contrat (ébauche) dans crm_contracts lié opportunity
  - Notification manager : "Opportunity won by [owner], value [won_value]"
  - Notification Customer Success : "New client ABC Logistics onboarding required"
  - Badge "Won" vert sur carte opportunity dans pipeline

- Action "Mark as Lost" depuis page détail opportunity :
  - Modal formulaire Lost avec champs : lost_date (défaut today), loss_reason_id (dropdown raisons perte), notes obligatoires
  - Table crm_opportunity_loss_reasons référentielle avec raisons standards : "Price too high", "Missing features", "Timing not right", "Competitor chosen", "Budget lost", "No response"
  - API PATCH /api/v1/crm/opportunities/[id]/lose
  - Mise à jour opportunity : status = "lost", stage = "closed", lost_date, loss_reason_id
  - Workflow nurturing automatique déclenché (réengager prospect 6 mois plus tard)
  - Badge "Lost" rouge sur carte opportunity
  - Analytics : analyse raisons perte par période pour amélioration processus

- Règle cohérence : opportunity ne peut pas être Won ET Lost simultanément
- Règle irréversibilité : opportunity Won ou Lost ne peut plus changer stage via drag and drop (stage = closed définitif)

**Valeur business:**

- Win rate calculable : nombre opportunities won / total opportunities → mesure performance commerciale
- Analyse raisons perte : si 60% perdus pour "Price too high" → ajuster stratégie pricing
- Forecast précis : exclure opportunities closed du pipeline actif
- Traçabilité revenus : won_value vs expected_value = précision prévisions futures

**Sprint 2 Étape 2.2 : Analytics Pipeline & Reporting (2 jours)**

**Problème à résoudre:**
Managers n'ont aucune visibilité sur santé pipeline commercial. Impossible savoir si commerciaux atteignent objectifs, identifier goulots étranglement pipeline, ou mesurer efficacité sources lead.

**Fonctionnalités à développer:**

- Dashboard Analytics Pipeline nouveau onglet /crm/opportunities/analytics :
  - Section Conversion Funnel vertical :
    - Étape 1 Leads créés → nombre total leads période
    - Étape 2 Leads qualifiés SQL → nombre + taux conversion
    - Étape 3 Opportunities créées → nombre + taux conversion
    - Étape 4 Opportunities won → nombre + taux conversion (win rate final)
    - Chaque étape : graphique barre horizontale, pourcentage, temps moyen étape
  - Section Win Rate par Source :
    - Graphique barres horizontales par utm_source (Google Ads, Facebook, Organic, Partner, etc.)
    - Pour chaque source : nombre opportunities totales, nombre won, win rate %, avg deal size
    - Tri décroissant par win rate pour identifier meilleures sources
    - Couleur verte si win rate > moyenne globale, rouge si < moyenne
  - Section Sales Forecast 3 prochains mois :
    - Graphique ligne montrant forecast_value total par mois
    - Forecast = somme (expected_value × probability) toutes opportunities expected_close_date dans mois
    - Ligne objectif mensuel (configurable par manager)
    - Zone danger rouge si forecast < 80% objectif
  - Section Pipeline Value par Stage :
    - Graphique colonnes empilées par stage (Prospecting, Qualification, Proposal, Negotiation, Closing)
    - Hauteur colonne = somme expected_value opportunities dans stage
    - Nombre opportunities dans stage affiché haut colonne
    - Clic colonne filtre pipeline principale sur ce stage

- API endpoints analytics :
  - GET /api/v1/crm/analytics/conversion-funnel?from_date=&to_date=
  - GET /api/v1/crm/analytics/win-rate-by-source?from_date=&to_date=
  - GET /api/v1/crm/analytics/sales-forecast?months=3
  - GET /api/v1/crm/analytics/pipeline-value

- Filtres globaux dashboard analytics :
  - Période : dropdown (This Month, This Quarter, This Year, Last 30 days, Custom range)
  - Owner : dropdown multi-select commerciaux
  - Pipeline : dropdown si multi-pipelines

**Valeur business:**

- Identification goulots : si 50 opportunities bloquées en Proposal stage → problème pricing ou processus approbation
- Optimisation sources marketing : si Partner source win rate 45% vs Google Ads 15% → réallocation budget
- Prévisions précises : forecast 3 mois permet planification recrutement, trésorerie, roadmap produit
- Accountability commerciaux : chaque commercial voit ses metrics vs objectifs

**Sprint 2 Étape 2.3 : Gestion Avancée Opportunities (1 jour)**

**Problème à résoudre:**
Opportunities manquent fonctionnalités gestion quotidienne commerciaux : ajout notes contextuelles, historique modifications, réassignation, mise en pause deals.

**Fonctionnalités à développer:**

- Page détail opportunity enrichie /crm/opportunities/[id] :
  - Section informations éditables inline :
    - Company name, expected_value, expected_close_date : click to edit inline
    - Validation changements avec confirmation si valeur diminue > 20%
  - Section notes timeline verticale :
    - Input textarea "Add note" toujours visible en haut
    - Submit ajoute note avec timestamp et auteur
    - Liste notes reverse chrono avec avatar auteur, date relative
    - Possibilité @mention autre commercial pour notification
  - Section historique modifications (changelog) :
    - Liste automatique toutes modifications opportunity depuis création
    - Format : "[User] changed [field] from [old_value] to [new_value] [time_ago]"
    - Exemples : "Karim changed stage from qualification to proposal 2 hours ago"
    - Basé sur audit logs opportunity
  - Action "Put On Hold" :
    - Bouton met opportunity en pause si prospect reporte projet
    - Status devient "on_hold", badge orange
    - Modal demande raison pause et date relance prévue
    - Notification programmée date relance pour rappeler commercial
    - Opportunity masquée pipeline actif, visible onglet séparé "On Hold"
  - Action "Reassign Owner" :
    - Dropdown sélection nouveau commercial
    - Confirmation modal avec raison réassignation
    - Notification ancien et nouveau owner
    - Historique conserve trace réassignation

- API endpoints gestion :
  - POST /api/v1/crm/opportunities/[id]/notes
  - PATCH /api/v1/crm/opportunities/[id]/hold
  - PATCH /api/v1/crm/opportunities/[id]/reassign
  - GET /api/v1/crm/opportunities/[id]/changelog

**Valeur business:**

- Contexte complet : notes détaillées évitent perte information lors passation dossier
- Traçabilité : historique modifications prouve actions commerciales en cas litige
- Flexibilité : mise en pause évite polluer pipeline avec deals non actifs
- Collaboration : réassignation fluide si commercial surcharge ou départ

**Livrables finaux Sprint 2:**

- ✅ Gestion complète cycle vie opportunity (Open → Won/Lost)
- ✅ Table loss_reasons avec analyse raisons échecs
- ✅ Dashboard analytics avec 4 vues majeures (funnel, win rate, forecast, pipeline value)
- ✅ Page détail opportunity enrichie (notes, changelog, actions)
- ✅ Fonctionnalités avancées (on hold, reassign, inline edit)
- ✅ 10+ nouveaux endpoints API
- ✅ 30+ tests automatisés additionnels

**Après Sprint 2, transition Sprint 3:**
Sprint 3 se concentrera sur contractualisation (génération contrats depuis opportunities won) et provisioning tenants (création automatique compte client après signature contrat). Sprint 3 bouclera cycle complet Lead → Opportunity → Contract → Tenant actif.

---

**FIN DU DOCUMENT - SPRINT 1 COMPLET + TRANSITION SPRINT 2**
