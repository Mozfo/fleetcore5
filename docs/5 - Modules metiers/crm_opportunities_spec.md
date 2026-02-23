# AUTO‑ÉVALUATION – crm_opportunities

## Métriques de complétude

- **Table documentée :** 1/18.
- **Colonnes documentées :** 28/28 pour `crm_opportunities`.
- **Sections par colonne :** Les huit sections exigées sont remplies pour chaque colonne.
- **Workflows documentés :** Oui (création, progression, clôture, suppression).

## Points faibles identifiés

- Certaines règles de gestion ne sont pas explicitement décrites dans les documents fournits ; elles sont marquées par ⚠️ et nécessitent validation du PO.
- Les niveaux de chiffrement et durées de rétention sont estimés selon le RGPD et devront être validés par le service juridique.
- Les interactions avec d’autres modules (billing, reporting) sont esquissées ; une documentation technique plus précise serait nécessaire pour l’implémentation.

## Colonnes les plus complexes

1. **stage** : doit refléter avec précision le processus de vente et comporter des critères de sortie clairs pour chaque étape【80115814900308†L177-L206】.
2. **probability_percent & forecast_value** : champs calculés nécessitant une cohérence avec le scoring et les prévisions de revenus.
3. **loss_reason_id** : lien vers une nomenclature des motifs de perte ; l’analyse fine de ces motifs conditionne l’amélioration du pipeline.
4. **metadata (jsonb)** : stockage flexible mais risqué sans gouvernance de schéma.
5. **pipeline_id** : permet d’associer l’opportunité à un pipeline de vente multi‑étapes ; nécessite une correspondance entre le champ `stage` et la configuration du pipeline.

## Risques de sur‑ingénierie détectés

- **Trop d’étapes d’opportunité :** il convient de limiter le nombre de stages à 4–5 et d’utiliser des verbes d’action【80115814900308†L177-L206】.
- **Modèle de probabilité trop sophistiqué :** un calcul simple avec un pourcentage par étape est suffisant selon les meilleures pratiques【474932527120266†L177-L200】.
- **Utilisation anarchique de `metadata` :** imposer un schéma et des clés validées est nécessaire.

## Temps estimé pour coder ces règles

Le développement complet des règles décrites ci‑dessous est estimé à **60 heures** pour un développeur expérimenté, incluant validations, triggers de mise à jour, notifications et tests.

---

# TABLE : **crm_opportunities**

## Vue d’ensemble

- **Rôle métier global :** Représente les propositions commerciales issues de leads qualifiés. Chaque opportunité contient une valeur estimée de revenu, une probabilité de réussite et un état (prospect → proposal → negotiation → closed). C’est un élément central de la prévision de chiffre d’affaires et de la gestion de pipeline【22870757202212†L95-L123】.
- **Position dans le workflow :** Une opportunité est créée lorsque le lead atteint le stade SQL. Elle évolue à travers plusieurs étapes de vente jusqu’à conclusion (gagnée, perdue, annulée). En cas de succès, elle mène à la génération d’un contrat.
- **Relations clés :** FK vers `crm_leads` (origine), `adm_provider_employees`/`adm_members` (responsables), `crm_opportunity_loss_reasons` (motifs d’échec), `crm_pipelines` (processus de vente), `crm_contracts` (contrat résultant), `bil_billing_plans` (plan tarifaire).
- **Volume estimé :** Selon la taille de l’entreprise, de quelques dizaines à plusieurs milliers d’opportunités actives. Des index sont créés sur `lead_id`, `stage`, `assigned_to`, `close_date` et `deleted_at` afin d’optimiser les requêtes.

## COLONNES

### Colonne : `id`

#### 1. IDENTIFICATION

- **Type :** `uuid` (PRIMARY KEY).
- **Nullable :** non.
- **Défaut :** généré par `uuid_generate_v4()`.
- **Contraintes :** `PRIMARY KEY`, unique.
- **Index :** index primaire.

#### 2. RÔLE FONCTIONNEL

Identifiant technique unique de l’opportunité. Utilisé dans toutes les relations (contrats, plans, notes). Pas de signification métier.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** À la création de l’opportunité.
- **Qui :** la base via la fonction UUID.
- **Comment :** automatique.
- **Conditions :** aucune.
- **Dépendances :** aucune.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** unicité, non nullité.
- **App Validations :** aucune.
- **Format :** RFC 4122.
- **Edge cases :** en cas d’erreur d’insertion, l’opération est annulée.
- **Error messages :** “Erreur lors de la génération de l’identifiant de l’opportunité”.

#### 5. RÈGLES DE MISE À JOUR

Non modifiable après création. Toute tentative est bloquée.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Aucune logique métier ne dépend directement de sa valeur.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture/écriture pour tout service créant des opportunités.
- **Chiffrement :** non.
- **Rétention :** historique conservé 10 ans.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – l’utilisation d’un UUID est standard et évite les collisions.
- **Analyse :** RAS.
- **Recommandation :** conserver l’UUID ; ne pas exposer publiquement cette clé pour des raisons de sécurité.

---

### Colonne : `lead_id`

#### 1. IDENTIFICATION

- **Type :** `uuid`.
- **Nullable :** non.
- **Défaut :** aucun.
- **Contraintes :** `NOT NULL`, FK vers `crm_leads(id)` avec `ON DELETE CASCADE`.
- **Index :** `crm_opportunities_lead_id_idx` + index partiel sur `lead_id`.

#### 2. RÔLE FONCTIONNEL

Relie l’opportunité au lead d’origine. Permet de retrouver l’historique marketing et les interactions du prospect. Sans ce lien, la traçabilité est impossible.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** lors de la création de l’opportunité.
- **Qui :** commercial via l’interface ou système lorsqu’un lead est converti.
- **Comment :** sélection manuelle du lead dans l’UI ou automatique lors d’une conversion.
- **Conditions :** le lead doit exister et être à un stade qualifié.
- **Dépendances :** `stage` (prospect).

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** FK et `ON DELETE CASCADE`.
- **App Validations :** vérifier que le lead n’est pas supprimé (`deleted_at is null`).
- **Format :** UUID.
- **Edge cases :** tentative de création avec un lead inexistant → rejet.
- **Error messages :** “Le lead sélectionné n’existe pas ou n’est pas qualifié”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** uniquement un administrateur ou via processus interne (ex. fusion de leads).
- **Quand :** exceptionnel (changement de lead source).
- **Impact :** toutes les analyses de pipeline et rapports historiques seront faussés.
- **Audit :** journalisation obligatoire dans `adm_audit_logs`.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Ne peut être modifié si l’opportunité est déjà clôturée. Si modifié, recalculer les métriques associées (ex. pipeline).

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non (identifiant technique).
- **Accès :** lecture pour tous, écriture réservée aux processus de création.
- **Chiffrement :** non.
- **Rétention :** identique à l’opportunité.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅.
- **Analyse :** indispensable pour la traçabilité.
- **Recommandation :** n’autoriser la modification qu’en cas de fusion de leads validée par l’administrateur.

---

### Colonne : `stage`

#### 1. IDENTIFICATION

- **Type :** `text`.
- **Nullable :** non.
- **Défaut :** `'prospect'`.
- **Contraintes :** CHECK sur les valeurs autorisées : `'prospect'`, `'proposal'`, `'negotiation'`, `'closed'`【222665734808171†L388-L399】.
- **Index :** `crm_opportunities_opportunity_stage_idx`.

#### 2. RÔLE FONCTIONNEL

Indique l’étape du cycle de vente. Chaque étape reflète un état précis :

- **prospect** : premier contact, qualification des besoins.
- **proposal** : offre envoyée, en attente de retour.
- **negotiation** : ajustements et négociations tarifaires.
- **closed** : opportunité conclue (gagnée ou perdue).

Des étapes claires et limitées améliorent la visibilité et la gestion de pipeline【80115814900308†L177-L206】.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** à la création (prospect) puis lors de la progression dans le pipeline.
- **Qui :** commercial (réévaluant l’état), ou système si un événement se produit (ex. contrat signé → `closed`).
- **Comment :** sélection manuelle dans l’UI ou automatique via workflow.
- **Conditions :** les critères de sortie d’une étape doivent être respectés : proposition envoyée pour passer à `proposal`, signature d’un contrat pour `closed`.
- **Dépendances :** `probability`, `expected_value` (ajustées selon l’étape).

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** check constraint.
- **App Validations :** vérifier que la transition respecte la séquence logique (prospect → proposal → negotiation → closed).
- **Format :** chaîne parmi les valeurs autorisées.
- **Edge cases :** revenir en arrière n’est autorisé qu’en cas d’erreur exceptionnel.
- **Error messages :** “La transition vers cette étape n’est pas permise.”

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** commercial ou manager disposant des droits.
- **Quand :** lors de l’évolution du cycle de vente.
- **Impact :** recalcul de `probability_percent`, `forecast_value` et possible déclenchement de notifications.
- **Audit :** chaque changement est consigné dans `adm_audit_logs`.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Chaque étape est associée à une probabilité de réussite par défaut (ex. prospect : 20 %, proposal : 50 %, negotiation : 75 %, closed : 100 %)【80115814900308†L135-L154】. Ce pourcentage est utilisé pour calculer `probability_percent` et `forecast_value` :

```text
probability_percent = probabilité par défaut du stage ou valeur personnalisée
forecast_value = expected_value × (probability_percent / 100)
```

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture pour tout utilisateur commercial, écriture réservée au propriétaire ou manager.
- **Chiffrement :** non.
- **Rétention :** 10 ans.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – utiliser des étapes courtes et descriptives est recommandé【80115814900308†L177-L206】.
- **Analyse :** éviter les étapes ambigües ou en trop grand nombre ; associer chaque étape à des probabilités et actions.
- **Recommandation :** documenter précisément les critères de sortie pour chaque étape et assurer un alignement avec le pipeline paramétré dans `crm_pipelines`.

---

### Colonne : `expected_value`

#### 1. IDENTIFICATION

- **Type :** `numeric(18, 2)`.
- **Nullable :** oui.
- **Défaut :** null.
- **Contraintes :** `expected_value >= 0`【222665734808171†L400-L405】.
- **Index :** aucun spécifique.

#### 2. RÔLE FONCTIONNEL

Montant estimé que l’opportunité pourrait générer si elle est gagnée, en devise `currency`. Sert à projeter le chiffre d’affaires et à calculer le `forecast_value`.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** lors de la création ou mise à jour de l’offre commerciale.
- **Qui :** commercial (sur la base du devis ou estimation).
- **Comment :** saisie manuelle ou import automatique depuis l’outil de devis.
- **Conditions :** la devise doit être définie ; la valeur doit être positive.
- **Dépendances :** `currency`, `probability_percent`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** CHECK non négatif.
- **App Validations :** nombre décimal avec deux décimales maximum.
- **Format :** regex : `^[0-9]+(\.[0-9]{1,2})?$`.
- **Edge cases :** valeurs très élevées déclencheront une approbation manager (ex. >1 000 000 €).
- **Error messages :** “Le montant estimé doit être un nombre positif à deux décimales.”

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** commercial ou manager.
- **Quand :** quand le devis évolue.
- **Impact :** recalcul des prévisions (`forecast_value`).
- **Audit :** traçabilité obligatoire.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Si `expected_value` est modifié en cours de négociation, il convient de revalider la probabilité et d’enregistrer un commentaire expliquant l’ajustement.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne/confidentiel (informations financières).
- **RGPD :** non.
- **Accès :** lecture pour équipes commerciales et finance ; modification par le propriétaire ou manager.
- **Chiffrement :** non mais restreindre l’accès.
- **Rétention :** conserver pour historique financier.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – documenter la valeur estimée est essentiel pour les prévisions.
- **Analyse :** valeur trop imprécise nuit aux prévisions ; exiger un devis formel dès que possible.
- **Recommandation :** intégrer l’opportunité avec l’outil de pricing pour éviter les saisies manuelles.

---

### Colonne : `close_date`

#### 1. IDENTIFICATION

- **Type :** `date`.
- **Nullable :** oui.
- **Défaut :** null.
- **Contraintes :** aucune.
- **Index :** `crm_opportunities_close_date_idx`.

#### 2. RÔLE FONCTIONNEL

Date à laquelle l’opportunité est effectivement fermée, qu’elle soit gagnée ou perdue. Permet de calculer la durée du cycle de vente et d’alimenter les rapports de conversion.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** lorsque le champ `stage` passe à `closed` et que `status` est mis à jour.
- **Qui :** système lors de la clôture automatique ou commercial lorsqu’il marque l’opportunité comme terminée.
- **Comment :** date du jour (system) ou saisie manuelle si l’opportunité est clôturée rétroactivement.
- **Conditions :** `stage` doit être `closed`.
- **Dépendances :** `status` (won/lost) et `won_date` ou `lost_date`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :** la date ne doit pas être antérieure à `created_at`.
- **Format :** `YYYY‑MM‑DD`.
- **Edge cases :** correction rétroactive d’une date est possible avec justification.
- **Error messages :** “La date de clôture ne peut pas précéder la date de création”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** commercial ou système.
- **Quand :** lorsque l’opportunité est marquée comme close.
- **Impact :** déclenche des notifications et enregistre l’issue (won/lost).
- **Audit :** journalisation obligatoire.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

La modification d’une `close_date` doit être exceptionnelle (ex. correction d’une erreur). Si elle est avancée ou retardée, recalculer la durée de vente et mettre à jour les rapports.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture pour tous les commerciaux ; écriture par propriétaire/manager.
- **Chiffrement :** non.
- **Rétention :** 10 ans.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – enregistrer la date de clôture permet de mesurer la durée du cycle et d’identifier les opportunités bloquées.
- **Analyse :** encourager la mise à jour en temps réel pour assurer l’exactitude des rapports.
- **Recommandation :** automatiser la capture de la date lors du changement de stage.

---

### Colonne : `assigned_to`

#### 1. IDENTIFICATION

- **Type :** `uuid`.
- **Nullable :** oui.
- **Défaut :** null.
- **Contraintes :** FK vers `adm_provider_employees.id` ou `adm_members.id` (deux contraintes en parallèle pour permettre l’assignation à un rôle interne ou prestataire).
- **Index :** `crm_opportunities_assigned_to_idx`.

#### 2. RÔLE FONCTIONNEL

Désigne la personne en charge du suivi de l’opportunité. Distinct de `owner_id` qui est le responsable final ; `assigned_to` peut changer en fonction du roulement des équipes.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** lors de la création ou lors du transfert de l’opportunité.
- **Qui :** manager ou administrateur.
- **Comment :** sélection via l’UI.
- **Conditions :** la personne doit être active et autorisée à gérer des opportunités.
- **Dépendances :** `owner_id`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** FKs.
- **App Validations :** vérifier l’activation et le rôle.
- **Format :** UUID.
- **Edge cases :** réassignation fréquente peut perturber le suivi ; limiter le nombre de transferts.
- **Error messages :** “L’utilisateur sélectionné n’est pas habilité à gérer des opportunités”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** manager/administrateur.
- **Quand :** en cas de changement de responsable.
- **Impact :** déclenche des notifications à la nouvelle personne assignée ; met à jour les tableaux de bord.
- **Audit :** enregistrement obligatoire du changement (ancien/new).

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Il est recommandé de maintenir la cohérence entre `assigned_to` et `owner_id` (l’owner doit avoir accès à toutes les opportunités qu’il gère). Dans certains cas, `assigned_to` peut être une équipe ; dans ce cas, un mécanisme de “shared ownership” est recommandé.【615859498948928†L246-L297】

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** écriture par managers ; lecture par tous.
- **Chiffrement :** non.
- **Rétention :** conservé pour historique.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – l’assignation explicite améliore la responsabilité et le suivi.
- **Analyse :** une opportunité sans responsable se perdra ; activer des alertes si `assigned_to` est null.
- **Recommandation :** mettre en place des équipes d’opportunités (Opportunity Teams) pour favoriser la collaboration【615859498948928†L246-L297】.

---

### Colonne : `metadata`

#### 1. IDENTIFICATION

- **Type :** `jsonb`.
- **Nullable :** non.
- **Défaut :** `{}`.
- **Contraintes :** aucune structure imposée par la base.
- **Index :** `crm_opportunities_metadata_idx` (GIN).

#### 2. RÔLE FONCTIONNEL

Permet de stocker des informations supplémentaires non prévues par le schéma standard, comme des tags, des identifiants externes ou des données d’intégration. Utile pour la flexibilité et l’évolution rapide du modèle.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** à la création ou lors d’intégrations spécifiques.
- **Qui :** système (sync avec outils tiers) ou utilisateur avancé.
- **Comment :** insertion de paires clé/valeur en JSON.
- **Conditions :** respecter le schéma défini en interne (liste de clés autorisées).
- **Dépendances :** aucune.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :** vérifier que seules les clés autorisées sont présentes et que les types des valeurs sont conformes.
- **Format :** JSON valide.
- **Edge cases :** mauvais format JSON → rejet.
- **Error messages :** “Champ metadata invalide : structure ou types non conformes”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** systèmes intégrés ou administrateurs.
- **Quand :** lorsque de nouvelles informations doivent être attachées à l’opportunité.
- **Impact :** aucun sur les autres champs.
- **Audit :** journalisation facultative.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Un schéma JSON (JSON Schema) interne doit être défini et versionné. Toute clé non reconnue doit être rejetée. ⚠️ **RÈGLE À VALIDER AVEC PO** : définir la liste des clés autorisées.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** variable selon le contenu (pourrait contenir des données personnelles).
- **RGPD :** oui si des données personnelles sont stockées ; la clé devrait alors être anonymisée.
- **Accès :** écriture limitée aux systèmes ; lecture pour l’équipe technique.
- **Chiffrement :** recommandé au repos si contenu sensible.
- **Rétention :** même durée que l’opportunité.

#### 8. BEST PRACTICES CRM

- **Conformité :** ⚠️ à revoir – un champ JSON sans gouvernance peut causer de la dette technique.
- **Analyse :** les solutions CRM robustes limitent les métadonnées ou imposent un schéma explicite.
- **Recommandation :** adopter un schéma JSON strict et valider les clés lors de l’écriture.

---

### Colonne : `created_at`, `updated_at`, `deleted_at`

#### 1. IDENTIFICATION

- **Type :** `timestamp with time zone`.
- **Nullable :** `created_at` et `updated_at` non null, `deleted_at` null.
- **Défaut :** `now()` pour created/updated.
- **Contraintes :** triggers `set_updated_at` et `trigger_set_updated_at`.
- **Index :** index sur `deleted_at` pour filtrer les enregistrements actifs.

#### 2. RÔLE FONCTIONNEL

Permettent de suivre la date de création, de modification et de suppression logique de l’opportunité. Utile pour l’audit, la gestion du cycle de vente et le nettoyage de données.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :**
  - `created_at` → lors de l’insertion.
  - `updated_at` → à chaque mise à jour (via triggers).
  - `deleted_at` → lorsqu’une opportunité est marquée comme supprimée.
- **Qui :** système (triggers).
- **Comment :** automatisé.
- **Conditions :** `deleted_at` ne doit être renseigné que si l’enregistrement est supprimé.
- **Dépendances :** `deleted_by`, `deletion_reason`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** triggers assurent la cohérence.
- **App Validations :** vérifier que `deleted_at` n’est pas antérieur à `created_at`.
- **Format :** ISO 8601.
- **Edge cases :** correction manuelle interdite sauf par un administrateur.
- **Error messages :** “Dates incohérentes : mise à jour ou suppression antérieure à la création.”

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** `updated_at` est mis à jour par trigger ; `deleted_at` par le processus de suppression logique.
- **Quand :** à chaque modification ; lors de la suppression.
- **Impact :** `deleted_at` rend l’opportunité inactive et la filtre par défaut dans les requêtes.
- **Audit :** utile pour la conformité RGPD.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Le champ `deleted_at` ne supprime pas physiquement l’opportunité mais la rend invisible pour l’utilisateur ; un job de purge pourra l’effacer définitivement après X années.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** Oui – les dates peuvent être considérées comme données personnelles car elles permettent de tracer l’activité d’un individu ; la conservation doit être limitée.
- **Accès :** lecture pour l’administration.
- **Chiffrement :** non.
- **Rétention :** définir un délai de conservation (ex. 5 ans pour `deleted_at`).

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – utiliser `deleted_at` permet une suppression logique et la récupération d’historique.
- **Analyse :** prévoir un mécanisme de purge automatique.
- **Recommandation :** implémenter un processus d’archivage/purge pour les opportunités fermées ou supprimées depuis plus de 3 ans.

---

### Colonne : `created_by`, `updated_by`, `deleted_by`

#### 1. IDENTIFICATION

- **Type :** `uuid`.
- **Nullable :** oui.
- **Défaut :** null.
- **Contraintes :** FK vers `adm_provider_employees` ou `adm_members`.
- **Index :** index individuels sur chaque champ.

#### 2. RÔLE FONCTIONNEL

Identifient l’employé qui a créé, mis à jour ou supprimé l’opportunité. Utiles pour la traçabilité et la responsabilité.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :**
  - `created_by` : lors de l’insertion.
  - `updated_by` : à chaque modification.
  - `deleted_by` : lors de la suppression logique.
- **Qui :** le système renseigne ce champ avec l’identifiant de l’utilisateur connecté.
- **Comment :** automatique via la couche applicative.
- **Conditions :** l’employé doit exister et être actif.
- **Dépendances :** `created_at`, `updated_at`, `deleted_at`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** FKs.
- **App Validations :** l’ID doit correspondre à l’utilisateur authentifié ; un administrateur ne peut pas se faire passer pour quelqu’un d’autre.
- **Format :** UUID.
- **Edge cases :** migrations ou imports anciens doivent renseigner un utilisateur “système”.
- **Error messages :** “Utilisateur inexistant ou inactif”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** ce champ est mis à jour par l’application ; il ne peut pas être modifié manuellement.
- **Quand :** à chaque écriture.
- **Impact :** trace l’activité et permet des audits.
- **Audit :** consultation possible dans `adm_audit_logs`.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

L’absence de `created_by` doit être considérée comme une anomalie ; un job de nettoyage doit l’attribuer à “système” lorsque la provenance est inconnue.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne (identifiants d’employés).
- **RGPD :** oui – données personnelles (identifiants).
- **Accès :** lecture restreinte aux administrateurs ; non exposé aux clients.
- **Chiffrement :** non nécessaire mais doit être protégé par des ACL.
- **Rétention :** identique au journal d’audit.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – la traçabilité des actions est essentielle pour l’audit.
- **Analyse :** imposer l’usage de ces champs à chaque opération d’écriture.
- **Recommandation :** centraliser la gestion des identifiants pour tous les modules (ADM et CRM).

---

### Colonne : `probability`, `probability_percent`, `forecast_value`, `won_value`

#### 1. IDENTIFICATION

- **Type :** `probability` : `integer` (0–100), `probability_percent` : `numeric(5,2)`, `forecast_value` et `won_value` : `numeric(15,2)`.
- **Nullable :** oui.
- **Défaut :** `probability_percent` : 0 ; autres : null.
- **Contraintes :** aucune en base pour `probability`, mais `probability_percent` doit être entre 0 et 100.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

- **probability** : note qualitative (0 à 100) que l’agent peut assigner pour refléter son intuition quant à la chance de réussite.
- **probability_percent** : pourcentage dérivé de l’étape ou de la note ; utilisé dans le calcul du `forecast_value`.
- **forecast_value** : projection du revenu attendu = `expected_value × probability_percent / 100`.
- **won_value** : valeur réelle une fois l’opportunité gagnée.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :**
  - `probability` : lors de la qualification et peut être ajusté au fur et à mesure.
  - `probability_percent` : initialisé automatiquement selon `stage`, ajusté lors des changements de stage ou lors du changement de `probability`.
  - `forecast_value` : recalculé à chaque modification d’`expected_value` ou de `probability_percent`.
  - `won_value` : rempli lors de la signature du contrat (date `won_date`).
- **Qui :** commercial ou système.
- **Comment :** saisie manuelle ou calcul automatique.
- **Conditions :** la note doit être comprise entre 0 et 100.
- **Dépendances :** `stage`, `expected_value`, `won_date`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune (à ajouter si nécessaire).
- **App Validations :** 0 ≤ `probability` ≤ 100 ; 0 ≤ `probability_percent` ≤ 100 ; `won_value` ≥ 0.
- **Format :** numériques avec deux décimales pour les valeurs monétaires.
- **Edge cases :** `won_value` sans contrat signé → incohérence.
- **Error messages :** “La probabilité doit être comprise entre 0 et 100 %”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** commercial ou manager.
- **Quand :** à chaque réévaluation.
- **Impact :** ajustement des prévisions et des reports.
- **Audit :** journaux d’audit recommandés.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

- **Calcul de forecast_value :** `forecast_value = expected_value × (probability_percent / 100)`.
- **Mise à jour de won_value :** au moment où `status` passe à `won`, `won_value` est renseigné avec la valeur réelle facturée.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** confidentiel (projections financières).
- **RGPD :** non.
- **Accès :** limité aux équipes commerciales et finance.
- **Chiffrement :** non mais restreindre l’accès.
- **Rétention :** historique à conserver.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – le calcul de prévisions est standard.
- **Analyse :** maintenir le modèle simple et transparent【474932527120266†L177-L200】.
- **Recommandation :** permettre d’ajuster `probability` en se basant sur des données factuelles (interactions) plutôt que sur l’intuition seule.

---

### Colonne : `status`

#### 1. IDENTIFICATION

- **Type :** `public.opportunity_status`.
- **Nullable :** non.
- **Défaut :** `'open'`.
- **Contraintes :** valeurs autorisées : `'open'`, `'won'`, `'lost'`, `'on_hold'`, `'cancelled'`【556285489482171†L452-L456】.
- **Index :** index partiel `crm_opportunities_status_idx` (non explicitement listé).

#### 2. RÔLE FONCTIONNEL

Indique l’issue courante de l’opportunité. Complète la logique de `stage` : `open` lorsqu’elle est active, `on_hold` en cas de pause, `won` si gagnée, `lost` si perdue, `cancelled` si annulée.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** à la création (`open`), puis lors de la clôture ou mise en pause.
- **Qui :** commercial ou système (ex. workflow “annulé”).
- **Comment :** choix dans l’interface ou automatisme.
- **Conditions :** cohérence avec `stage` : un statut `won` ou `lost` implique que le `stage` est `closed`.
- **Dépendances :** `stage`, `won_date`, `lost_date`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** type énuméré.
- **App Validations :** interdiction de passer à `won` sans contrat ou `won_date`.
- **Format :** énumération.
- **Edge cases :** transition `lost` → `open` possible pour réactivation ; justifier la raison.
- **Error messages :** “Impossible de marquer comme gagnée sans contrat associé”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** commercial ou manager.
- **Quand :** lors de la conclusion ou pause.
- **Impact :** mise à jour des comptes rendus ; déclenchement de création de contrat en cas de gain.
- **Audit :** requis.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Lors du passage à `won` :

- Créer un contrat dans `crm_contracts`.
- Renseigner `won_date` et `won_value`.
- Envoyer une notification aux équipes finance.  
  Lors du passage à `lost` :
- Renseigner `lost_date` et `loss_reason_id`.
- Relancer le lead après X mois.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture pour tous ; modification par responsables.
- **Chiffrement :** non.
- **Rétention :** conservé pour historique.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – la séparation `stage`/`status` clarifie l’état【22870757202212†L95-L123】.
- **Analyse :** utiliser des validations fortes pour empêcher des combinaisons incohérentes.
- **Recommandation :** définir un tableau de transitions autorisées.

---

### Colonne : `currency`

#### 1. IDENTIFICATION

- **Type :** `char(3)`.
- **Nullable :** oui.
- **Défaut :** `'EUR'`.
- **Contraintes :** doit être un code ISO 4217.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Devise de l’opportunité (euro, USD…). Permet de calculer des montants et de convertir pour reporting.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** à la création ou lors de l’édition.
- **Qui :** commercial.
- **Comment :** sélection dans une liste déroulante.
- **Conditions :** la liste doit provenir du référentiel des devises.
- **Dépendances :** `expected_value`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** pas de check sur la colonne – à implémenter par la couche applicative.
- **App Validations :** code ISO 4217 à 3 lettres ; ex. `^[A-Z]{3}$`.
- **Edge cases :** opportunités en devises étrangères ; gérer les conversions.
- **Error messages :** “Devise invalide ”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** commercial ou finance.
- **Quand :** lorsque la négociation implique une autre devise.
- **Impact :** recalcul des montants ; recalcul des prévisions en devise par défaut.
- **Audit :** requise.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Prévoir un module de conversion automatique des devises pour le reporting global. Laisser la monnaie d’origine en base et enregistrer un taux de conversion dans les métadonnées.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture pour tous ; modification par responsable de l’offre.
- **Chiffrement :** non.
- **Rétention :** sans limite.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – l’utilisation d’un champ de devise est nécessaire.
- **Analyse :** ne pas multiplier les devises sans raison ; imposer une devise par marché.
- **Recommandation :** relier ce champ au module financier pour gestion centralisée des taux.

---

### Colonne : `discount_amount`

#### 1. IDENTIFICATION

- **Type :** `numeric(15, 2)`.
- **Nullable :** oui.
- **Défaut :** null.
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Montant de remise accordé sur l’offre. Sert à calculer la valeur finale et à mesurer la marge.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** lors de la proposition ou de la négociation.
- **Qui :** commercial ou manager avec délégation.
- **Comment :** saisie manuelle ; l’application peut calculer un montant autorisé maximum en fonction des politiques commerciales.
- **Conditions :** la remise ne peut pas dépasser un pourcentage maximal (ex. 20 %).
- **Dépendances :** `expected_value`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune ; à implémenter côté application.
- **App Validations :** 0 ≤ remise ≤ `expected_value × taux_max_remise`.
- **Edge cases :** remise à zéro ; remise négative interdite.
- **Error messages :** “La remise dépasse le seuil autorisé”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** commercial ; valide par le manager au‑delà d’un certain seuil.
- **Quand :** lors de la négociation.
- **Impact :** modifie la marge et la valeur espérée.
- **Audit :** l’approbation du manager doit être enregistrée.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Prévoir un workflow d’approbation lorsque le montant de remise dépasse le seuil X. Si approuvé, mettre à jour `expected_value` :

```text
expected_value_net = expected_value - discount_amount
```

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** confidentiel (politique commerciale).
- **RGPD :** non.
- **Accès :** restreint aux commerciaux et direction.
- **Chiffrement :** non.
- **Rétention :** historique pour l’analyse des marges.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – documenter la remise permet d’optimiser la marge.
- **Analyse :** éviter d’accorder des remises non justifiées ; centraliser les règles.
- **Recommandation :** intégrer ce champ avec la politique de pricing pour validation automatique.

---

### Colonne : `expected_close_date`

#### 1. IDENTIFICATION

- **Type :** `date`.
- **Nullable :** oui.
- **Défaut :** null.
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Date anticipée de fermeture de l’opportunité. Permet d’anticiper les revenus et d’organiser les actions de suivi.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** lors de la création, mise à jour régulièrement.
- **Qui :** commercial.
- **Comment :** estimation manuelle, révisée en fonction de l’avancement.
- **Conditions :** doit être postérieure à `created_at`.
- **Dépendances :** `stage`, `expected_value`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :** la date doit être future par rapport à la date du jour (sauf cas exceptionnel).
- **Edge cases :** repousser plusieurs fois cette date indique un problème ; déclencher une alerte.
- **Error messages :** “La date de clôture prévisionnelle doit être ultérieure”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** commercial.
- **Quand :** lors de l’évolution du cycle.
- **Impact :** mise à jour des prévisions.
- **Audit :** conserver l’historique des dates successives.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Si l’opportunité dépasse sa date de clôture prévisionnelle sans mise à jour, un rappel doit être envoyé et l’opportunité marquée “à risque”.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture pour l’équipe, modification par le propriétaire.
- **Chiffrement :** non.
- **Rétention :** historique.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – prévoir une date prévisionnelle aide à la planification.
- **Analyse :** inciter à mettre à jour cette date régulièrement pour éviter de “vieilles” opportunités.
- **Recommandation :** utiliser un tableau de bord pour visualiser les opportunités en retard.

---

### Colonne : `won_date`, `lost_date`

#### 1. IDENTIFICATION

- **Type :** `date`.
- **Nullable :** oui.
- **Défaut :** null.
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Dates effectives où l’opportunité a été gagnée (`won_date`) ou perdue (`lost_date`). Permettent de mesurer la durée du cycle et d’analyser les performances par période.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** lors de la conclusion de l’opportunité (status → won/lost).
- **Qui :** système.
- **Comment :** date du jour lorsque `status` est mis à jour.
- **Conditions :** `stage` doit être `closed` et `status` mis à jour.
- **Dépendances :** `close_date`, `loss_reason_id`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :** incohérence si les deux dates sont renseignées ; l’une des deux seulement.
- **Edge cases :** backdating doit être justifié.
- **Error messages :** “Une opportunité ne peut pas être à la fois gagnée et perdue”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** système ou manager.
- **Quand :** au moment du changement de `status`.
- **Impact :** déclenche des notifications (ex. félicitations, actions de nurturing).
- **Audit :** journalisation.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

La présence de `won_date` sans `won_value` ou de `lost_date` sans `loss_reason_id` doit déclencher une erreur. Après une perte, un processus de nurturing peut être lancé (relance après 6 mois).【615859498948928†L246-L297】

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture pour tous ; modification par le système.
- **Chiffrement :** non.
- **Rétention :** durée de conservation identique à l’opportunité.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – tracer les dates d’issue améliore l’analyse.
- **Analyse :** utiliser ces dates pour calculer la durée moyenne de vente et le taux de conversion.
- **Recommandation :** auto‑renseigner ces dates et empêcher l’utilisateur de les modifier manuellement.

---

### Colonne : `owner_id`

#### 1. IDENTIFICATION

- **Type :** `uuid`.
- **Nullable :** oui.
- **Défaut :** null.
- **Contraintes :** FK vers `adm_provider_employees.id`.
- **Index :** non.

#### 2. RÔLE FONCTIONNEL

Responsable hiérarchique de l’opportunité. Peut être le manager d’équipe qui supervise les actions de `assigned_to`.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** généralement lors de l’affectation initiale ou lorsque l’équipe change.
- **Qui :** manager ou administrateur.
- **Comment :** sélection dans l’interface.
- **Conditions :** l’employé doit avoir un rôle d’encadrement.
- **Dépendances :** `assigned_to` (l’owner doit couvrir l’utilisateur assigné).

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** FK.
- **App Validations :** l’owner doit appartenir à la même business unit que le `lead`.
- **Edge cases :** pas d’owner → opportunité orpheline ; déclencher une alerte.
- **Error messages :** “Impossible d’affecter cet owner : rôle incompatible”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** administrateur.
- **Quand :** changement de structure hiérarchique.
- **Impact :** modifie la responsabilité et potentiellement la répartition des commissions.
- **Audit :** à journaliser.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

En cas de départ d’un owner, les opportunités doivent être réaffectées automatiquement à un nouveau manager.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture restreinte ; écriture par un gestionnaire.
- **Chiffrement :** non.
- **Rétention :** historique pour la traçabilité.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – distinguer `owner` et `assigned_to` permet une meilleure gouvernance.
- **Analyse :** s’assurer que les owners sont clairement désignés ; les opportunités sans owner peuvent se perdre.
- **Recommandation :** créer des rapports listant les opportunités sans owner ou avec owner obsolète.

---

### Colonne : `loss_reason_id`

#### 1. IDENTIFICATION

- **Type :** `uuid`.
- **Nullable :** oui.
- **Défaut :** null.
- **Contraintes :** FK vers `crm_opportunity_loss_reasons(id)`.
- **Index :** non.

#### 2. RÔLE FONCTIONNEL

Identifie la raison de perte lorsqu’une opportunité est marquée comme `lost`. Permet une analyse systématique des échecs afin d’adapter l’offre ou la stratégie【22870757202212†L95-L123】.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** lors du changement de statut vers `lost`.
- **Qui :** commercial.
- **Comment :** sélection dans une liste normalisée (base `crm_opportunity_loss_reasons`).
- **Conditions :** `status` doit être `lost`.
- **Dépendances :** `lost_date`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** FK.
- **App Validations :** l’ID doit exister et être actif.
- **Edge cases :** laisser vide → interdit ; forcer un choix “autre” avec commentaire.
- **Error messages :** “Merci de sélectionner un motif de perte”.

#### 5. RÈGLES DE MISE À JOUR

Peut être modifié si l’analyse post‑mortem révèle un autre motif. Mise à jour par le manager uniquement. Audit obligatoire.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Les motifs de perte doivent être détaillés et régulièrement révisés ; par exemple : prix trop élevé, fonctionnalités manquantes, concurrent choisi, absence de budget.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture pour l’équipe ; modification par manager.
- **Chiffrement :** non.
- **Rétention :** historique indispensable pour l’amélioration continue.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – analyser les pertes est recommandé pour optimiser la proposition de valeur.
- **Analyse :** utiliser ces données pour alimenter un rapport de “voix du prospect”.
- **Recommandation :** coupler ce champ avec un commentaire libre.

---

### Colonne : `plan_id`, `contract_id`, `pipeline_id`

#### 1. IDENTIFICATION

- **Type :** `uuid`.
- **Nullable :** oui.
- **Défaut :** null.
- **Contraintes :** FKs respectifs vers `bil_billing_plans`, `crm_contracts`, `crm_pipelines`.
- **Index :** index sur `pipeline_id` (partiel).

#### 2. RÔLE FONCTIONNEL

- **plan_id** : relie l’opportunité à un plan tarifaire standard (produit/service).
- **contract_id** : référence le contrat créé lorsque l’opportunité est gagnée.
- **pipeline_id** : associe l’opportunité à un pipeline spécifique (par segment, produit ou région). Cela permet d’utiliser des étapes personnalisées et des probabilités différentes.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :**
  - `plan_id` : à la création si un produit standard est proposé ; peut rester null pour des offres sur mesure.
  - `contract_id` : une fois le contrat signé.
  - `pipeline_id` : à la création ou lors d’un changement de segment.
- **Qui :** commercial ou système (lors de la création du contrat).
- **Comment :** sélection dans l’UI ou association automatique.
- **Conditions :** les entités référencées doivent exister et être actives.
- **Dépendances :** `status` (le contrat ne peut être lié qu’à une opportunité gagnée).

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** FKs.
- **App Validations :** pas de `contract_id` si `status` ≠ `won`.
- **Edge cases :** changement de pipeline oblige à recalculer la probabilité.
- **Error messages :** “Le contrat ne peut être lié qu’à une opportunité gagnée”.

#### 5. RÈGLES DE MISE À JOUR

- **plan_id** : modifiable tant que le contrat n’est pas signé.
- **contract_id** : renseigné et non modifiable après signature.
- **pipeline_id** : peut être modifié par un manager en cas de réorganisation.
- **Impact :** modifications importantes sur les statistiques de pipeline et de revenus.
- **Audit :** journalisation nécessaire.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

- **plan_id** : si null, des champs personnalisés peuvent être stockés dans `metadata`.
- **contract_id** : déclenche la création d’événements dans le module Billing.
- **pipeline_id** : doit correspondre à la valeur de `stage`. Chaque pipeline a ses propres étapes stockées en JSON dans `crm_pipelines`.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture générale ; écriture par les commerciaux et managers.
- **Chiffrement :** non.
- **Rétention :** historique.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅.
- **Analyse :** la segmentation par pipeline est une bonne pratique pour différencier les processus.
- **Recommandation :** aligner la configuration des pipelines avec les étapes (`stage`) et le scoring.

---

### Colonne : `notes`

#### 1. IDENTIFICATION

- **Type :** `text`.
- **Nullable :** oui.
- **Défaut :** null.
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Commentaires libres concernant l’opportunité : résumé des appels, objections du client, décisions prises. Sert à garder une trace qualitative.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** en continu, après chaque interaction.
- **Qui :** commercial.
- **Comment :** saisie libre ; possibilité d’ajouter des pièces jointes dans un module associé.
- **Conditions :** adopter un style clair, éviter les informations sensibles (numéro de carte bancaire).
- **Dépendances :** aucune.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :** interdire certains mots ou caractères interdits.
- **Edge cases :** risque de stocker des données personnelles sensibles ; à proscrire.
- **Error messages :** “Ce champ ne doit pas contenir d’informations personnelles sensibles”.

#### 5. RÈGLES DE MISE À JOUR

Modifiable en permanence par le propriétaire de l’opportunité. Historiser les commentaires importants dans un journal.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

⚠️ **RÈGLE À VALIDER AVEC PO** : définir une limite de taille et un formatage (Markdown, rich text). Prévoir la possibilité de mentions et de notifications lorsque le nom d’un collaborateur est cité.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** oui si des données personnelles y sont saisies.
- **Accès :** lecture par tous les membres habilités ; écriture par le propriétaire.
- **Chiffrement :** non.
- **Rétention :** identique à l’opportunité ; prévoir un nettoyage pour se conformer au RGPD.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – prendre des notes détaillées est recommandé.
- **Analyse :** un champ libre peut devenir un fourre‑tout ; imposer un modèle de saisie améliore la qualité.
- **Recommandation :** combiner ce champ avec un système de tâches et d’activités pour structurer l’historique.

---

## WORKFLOWS IMPLIQUÉS

1. **Création d’opportunité** : un lead qualifié est converti en opportunité via l’interface. L’utilisateur sélectionne `lead_id`, définit `stage = prospect`, renseigne `expected_value`, `currency`, `assigned_to` et éventuellement `plan_id` et `pipeline_id`. Le système génère `id`, `created_at` et `probability_percent` par défaut.

2. **Progression dans le pipeline** : lorsque l’offre est envoyée, `stage` passe à `proposal`, ce qui peut modifier `probability_percent`. Si le prospect engage une négociation, `stage = negotiation`. Chaque changement déclenche un recalcul de `forecast_value` et peut générer un rappel de suivi.

3. **Conclusion** : si l’offre est acceptée, le commercial passe `status` à `won`, `stage` à `closed`, crée un enregistrement dans `crm_contracts` et renseigne `won_date` et `won_value`. En cas d’échec, `status = lost`, `lost_date` est renseignée et un `loss_reason_id` est sélectionné.

4. **Suppression logique** : pour retirer une opportunité sans effacement physique, l’utilisateur marque `deleted_at` et `deleted_by`. Les opportunités supprimées sont exclues des vues actives mais conservées pour audit.

5. **Réattribution/Changement de pipeline** : un manager peut modifier `assigned_to` ou `pipeline_id` (ex. changement de segment). Le système met à jour l’historique et notifie les personnes concernées.

## SCÉNARIOS MÉTIER CRITIQUES

1. **Scénario nominal (opportunité gagnée)** : un lead qualifié est converti en opportunité. Un devis est émis (`expected_value` et `currency` renseignés). Le prospect accepte l’offre. L’opportunité passe successivement par les stages `prospect` → `proposal` → `negotiation` → `closed` avec `status = won`. `won_date` et `won_value` sont enregistrés, un contrat est généré et rattaché via `contract_id`.

2. **Scénario de perte** : l’opportunité n’aboutit pas. Lors du passage en `status = lost`, l’utilisateur doit renseigner `loss_reason_id` et `lost_date`. Le système déclenche un workflow de nurturing pour réengager le prospect plus tard.

3. **Scénario d’abandon** : l’opportunité est annulée (`status = cancelled`) ou mise en pause (`on_hold`). Cela survient, par exemple, si le prospect reporte le projet. Des rappels sont programmés pour relancer la vente à une date ultérieure.

4. **Cas limite – double clôture** : l’utilisateur tente de définir à la fois `won_date` et `lost_date`. Une validation empêche cette situation en affichant un message d’erreur.

5. **Cas limite – opportunité sans assigned_to** : l’opportunité est créée mais aucun responsable n’est désigné. Le système déclenche une notification pour que le manager l’assigne sous 24 heures.

## RÈGLES DE COHÉRENCE INTER‑COLONNES

- `status = won` ⇒ `stage = closed`, `won_date` et `won_value` doivent être non null.
- `status = lost` ⇒ `stage = closed`, `lost_date` et `loss_reason_id` doivent être non null.
- `contract_id` ne peut être renseigné que si `status = won`.
- `deleted_at` non null ⇒ `deleted_by` et `deletion_reason` doivent être renseignés.
- Les champs date (`close_date`, `expected_close_date`, `won_date`, `lost_date`) doivent respecter l’ordre logique : `created_at` ≤ `expected_close_date` ≤ `close_date` et `won_date` ou `lost_date`.

## RÈGLES DE COHÉRENCE INTER‑TABLES

- Le `lead_id` doit exister dans `crm_leads` et ne pas être supprimé.
- Le `plan_id` doit exister dans `bil_billing_plans` (module Billing).
- Le `contract_id` doit exister dans `crm_contracts`.
- Le `loss_reason_id` doit être valide dans `crm_opportunity_loss_reasons`.
- Le `pipeline_id` doit exister dans `crm_pipelines` et ses `stages` doivent inclure le `stage` courant.
- Les FKs vers `adm_provider_employees` et `adm_members` doivent pointer vers des utilisateurs actifs.

## ALERTES ET NOTIFICATIONS

- **Alerte de réattribution** : lorsqu’un responsable (`assigned_to`) est modifié, notifier l’ancien et le nouveau.
- **Alerte de retard** : si la date `expected_close_date` est dépassée sans mise à jour de `stage`, envoyer un rappel.
- **Alerte d’absence de owner** : opportunité sans `owner_id` ou `assigned_to` depuis plus de X jours.
- **Notification de gain/perte** : informer les équipes finance et marketing lors du passage à `won` ou `lost`.
- **Alerte RGPD** : lorsqu’une opportunité est supprimée (`deleted_at`), lancer un workflow pour anonymiser les données sensibles après la durée de rétention.

## MÉTRIQUES ET KPI

- Taux de conversion : nombre d’opportunités gagnées / nombre d’opportunités totales.
- Valeur prévisionnelle totale (`sum(forecast_value)`) par mois, par stage, par pipeline.
- Durée moyenne du cycle de vente : moyenne de `close_date - created_at`.
- Taux de perte par motif : distribution des `loss_reason_id`.
- Montant moyen des remises (`discount_amount`).
- Délais de relance pour les opportunités en pause (`on_hold`).

## POINTS D’ATTENTION POUR LE DÉVELOPPEMENT

- **Performances** : indexer efficacement les champs utilisés dans les filtres (status, stage, assigned_to, close_date).
- **Coût total** : les calculs `forecast_value` peuvent être gourmands ; prévoir des champs matérialisés ou des vues pour le reporting.
- **Sécurité** : appliquer des ACL pour restreindre la modification des champs sensibles (valeurs financières).
- **Extensibilité** : la liste des étapes et des statuts peut évoluer ; stocker ces valeurs dans des tables de configuration (comme `crm_pipelines`) pour éviter le code en dur.
- **Intégration** : synchroniser l’opportunité avec d’autres modules (contrats, facturation, reporting) via des events ou des webhooks.
- **Tests** : couvrir les transitions d’étape, la logique de calcul des prévisions, la gestion des dates et la suppression logique.
