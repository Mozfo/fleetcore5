# SPRINT 3 : CONTRACTS & TENANT ONBOARDING (3 jours)

**OBJECTIF SPONSOR :** À la fin de ce sprint, le sponsor peut transformer une opportunity gagnée en contrat signé, puis provisionner automatiquement le tenant SaaS du client avec accès immédiat.

**Valeur business :** Le contrat est le document juridique qui engage le client et déclenche la facturation récurrente. Sans système automatisé de contractualisation et provisioning, il faut 2-3 semaines pour activer un nouveau client (signature manuelle, création tenant manuellement, configuration compte par compte). Ce sprint réduit ce délai à 24h maximum avec automatisation complète du flux Won → Contract → Tenant → Accès client.

**Impact ROI :**

- **Time to Revenue** : 24h au lieu de 3 semaines = clients facturés 20 jours plus tôt
- **Churn d'onboarding** : -60% (clients perdus pendant onboarding long)
- **Coût opérationnel** : -80% (pas de setup manuel)
- **Satisfaction client** : +40% (accès immédiat vs attente 3 semaines)

---

## ÉTAPE 3.1 : Contract Creation & Management

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** L'opportunity gagnée n'est pas encore un client payant. Le contrat est le document juridique qui formalise l'engagement commercial, les termes de service, la tarification, et la durée. C'est ce contrat qui déclenche la création du tenant SaaS et le début de la facturation récurrente. Sans système de gestion contractuelle, les contrats sont dispersés (emails, Google Drive), les dates de renouvellement oubliées (40% churn évitable), et la facturation déconnectée du contrat (incohérences, litiges).

**QUEL PROBLÈME :** Actuellement, quand une opportunity est marquée "Won" :

1. Le commercial crée manuellement un Google Doc à partir d'un template
2. Remplit manuellement nom client, tarif, dates (risque d'erreurs)
3. Envoie par email au client pour signature
4. Attend retour signé (parfois perdu dans les emails)
5. Une fois signé, contacte l'équipe technique : "Créez le compte pour ABC Logistics"
6. L'équipe technique crée manuellement le tenant (30 min)
7. Envoie les accès au client par email
8. Le client se connecte... 2-3 semaines après avoir dit "oui"

Résultat : **15% des clients perdus** pendant cette période (trouvent concurrent avec onboarding immédiat).

**IMPACT SI ABSENT :**

- **Churn onboarding** : 15% clients perdus après Won = 180k€/an de revenus perdus
- **Time to Revenue** : 21 jours au lieu de 1 jour = 20 jours de MRR perdus par client
- **Erreurs contractuelles** : 30% contrats avec erreurs (mauvais tarif, dates incorrectes) → litiges
- **Renouvellements manqués** : 40% contrats non renouvelés car date oubliée
- **Coût opérationnel** : 2h de travail manuel par contrat × 50 contrats/mois = 100h/mois gaspillées

**CAS D'USAGE CONCRET :**

**AVANT (Processus manuel) :**

_8 novembre 2025, 16h00 - Karim Al-Rashid marque l'opportunity "ABC Logistics" comme Won_

- Karim ouvre Google Drive
- Cherche le template "Contrat Standard FleetCore v3.docx"
- Copie le document → "Contrat ABC Logistics Nov 2025.docx"
- Remplit manuellement :
  - Nom client : ABC Logistics ✅
  - Contact : Ahmed Al-Mansoori ✅
  - Email : ahmed@abclogistics.ae ✅
  - Nombre véhicules : 80 ✅
  - Prix par véhicule : 18.75€/mois ✅
  - Total mensuel : 1500€ ✅
  - Date début : 1er décembre 2025 ✅
  - Date fin : 30 novembre 2026 ❌ (erreur : écrit 2025 au lieu de 2026)
  - Cycle facturation : Mensuel ✅
  - Renouvellement auto : Oui ✅
- Envoie email à Ahmed : "Veuillez signer le contrat ci-joint"
- Ahmed reçoit l'email 2 jours plus tard (spam)
- Ahmed imprime, signe, scanne, renvoie par email (5 jours après)
- Karim reçoit le contrat signé le 15 novembre
- Karim envoie email à tech@fleetcore.com : "Créez le compte ABC Logistics SVP"
- Email reste 3 jours dans inbox de l'équipe technique (surchargée)
- Le 18 novembre, un technicien crée manuellement le tenant :
  - Se connecte à Supabase
  - INSERT INTO adm_tenants (...) manuellement
  - Crée l'organisation Clerk manuellement
  - Configure les settings par défaut manuellement
  - Génère un mot de passe temporaire
  - Envoie les accès à Ahmed par email
- Ahmed reçoit les accès le 19 novembre, se connecte
- **21 jours après avoir dit "oui"** → Ahmed a déjà contacté un concurrent

**APRÈS (Processus automatisé avec notre système) :**

_8 novembre 2025, 16h00 - Karim Al-Rashid marque l'opportunity "ABC Logistics" comme Won dans le CRM_

- Karim clique "Mark as Won" sur l'opportunity
- Modal s'ouvre : "Créer le contrat"
  - Toutes les infos pré-remplies depuis l'opportunity :
    - Client : ABC Logistics (Ahmed Al-Mansoori)
    - Email : ahmed@abclogistics.ae
    - Nombre véhicules : 80
    - Plan : Standard (18.75€/véhicule/mois)
    - Total mensuel : 1500€
    - Total annuel : 18,000€
    - Date début : 1er décembre 2025 (ajustable)
    - Durée : 12 mois
    - Date fin : **30 novembre 2026** (calculée automatiquement, aucune erreur possible)
    - Cycle facturation : Mensuel
    - Renouvellement auto : Oui (par défaut)
- Karim clique "Generate Contract"
- Système génère automatiquement le PDF contrat avec tous les champs remplis
- Système envoie email à Ahmed avec lien DocuSign : "Signez votre contrat FleetCore en 2 clics"
- Ahmed reçoit l'email immédiatement (16h05)
- Ahmed clique, signe électroniquement en 1 minute (16h06)
- Webhook DocuSign notifie FleetCore : "Contrat signé"
- Système déclenche automatiquement :
  1. Status contrat passe à "signed"
  2. Création tenant dans adm_tenants (automated)
  3. Création organisation Clerk (automated)
  4. Génération invitation admin pour Ahmed (automated)
  5. Email envoyé à Ahmed : "Votre compte FleetCore est prêt, créez votre mot de passe"
- Ahmed reçoit l'email 16h10, crée son mot de passe, se connecte
- **10 minutes après avoir dit "oui"** → Ahmed est dans l'application, impressionné

Résultat :

- **Time to Access** : 10 minutes au lieu de 21 jours
- **Satisfaction client** : 10/10 au lieu de 4/10
- **Churn évité** : 0% au lieu de 15%
- **Coût opérationnel** : 0h au lieu de 2h
- **Erreurs** : 0 au lieu de 30%

### 📊 DONNÉES ET RÈGLES MÉTIER

**Tables impliquées :**

- **crm_contracts** (table principale des contrats)
- **crm_opportunities** (lien opportunity → contract)
- **adm_tenants** (provisionning automatique après signature)
- **adm_invitations** (invitation admin client)
- **bil_billing_plans** (plans tarifaires)

**Colonnes critiques de crm_contracts :**

| Colonne                  | Type       | Obligatoire | Utilité Business                                                       |
| ------------------------ | ---------- | ----------- | ---------------------------------------------------------------------- |
| **contract_number**      | varchar    | AUTO        | Numéro unique (CTR-2025-00123)                                         |
| **contract_code**        | varchar    | AUTO        | Code court (C2025-123)                                                 |
| **opportunity_id**       | uuid       | OUI         | Lien vers opportunity gagnée                                           |
| **lead_id**              | uuid       | OUI         | Traçabilité complète depuis lead initial                               |
| **tenant_id**            | uuid       | AUTO        | Rempli après provisioning                                              |
| **company_name**         | varchar    | OUI         | Nom société cliente                                                    |
| **contact_name**         | varchar    | OUI         | Nom contact signataire                                                 |
| **contact_email**        | varchar    | OUI         | Email contact (pour DocuSign)                                          |
| **contact_phone**        | varchar    | NON         | Téléphone contact                                                      |
| **billing_address_id**   | uuid       | NON         | Adresse facturation (FK crm_addresses)                                 |
| **contract_date**        | date       | AUTO        | Date création contrat                                                  |
| **effective_date**       | date       | OUI         | Date début d'effet (peut être future)                                  |
| **expiry_date**          | date       | OUI         | Date fin contrat                                                       |
| **duration_months**      | int        | AUTO        | Durée en mois (calculée)                                               |
| **total_value**          | numeric    | OUI         | Valeur totale contrat sur durée                                        |
| **currency**             | varchar(3) | OUI         | Devise (EUR, USD, AED)                                                 |
| **vat_rate**             | numeric    | OUI         | Taux TVA selon pays                                                    |
| **billing_cycle**        | enum       | OUI         | monthly, quarterly, yearly                                             |
| **payment_terms**        | varchar    | OUI         | Net 30, Net 15, Immediate                                              |
| **auto_renew**           | boolean    | OUI         | Renouvellement automatique ?                                           |
| **renewal_type**         | varchar    | NON         | automatic, manual, one_time                                            |
| **renewal_date**         | date       | AUTO        | Date prochain renouvellement                                           |
| **plan_id**              | uuid       | OUI         | FK vers bil_billing_plans                                              |
| **subscription_id**      | uuid       | AUTO        | FK vers bil_tenant_subscriptions (après provisioning)                  |
| **status**               | enum       | OUI         | draft, pending_signature, signed, active, expired, terminated, renewed |
| **signature_date**       | timestamp  | AUTO        | Date signature client                                                  |
| **signature_method**     | varchar    | AUTO        | docusign, manual, electronic                                           |
| **document_url**         | text       | AUTO        | URL PDF contrat signé (S3)                                             |
| **docusign_envelope_id** | varchar    | AUTO        | ID enveloppe DocuSign                                                  |
| **approved_by**          | uuid       | AUTO        | ID employé FleetCore qui a validé                                      |
| **approved_at**          | timestamp  | AUTO        | Date validation interne                                                |
| **activation_date**      | date       | AUTO        | Date activation effective tenant                                       |
| **termination_date**     | date       | AUTO        | Si résilié, date fin anticipée                                         |
| **termination_reason**   | text       | AUTO        | Raison résiliation                                                     |
| **notes**                | text       | NON         | Notes internes                                                         |
| **metadata**             | jsonb      | NON         | Données flexibles (clauses spéciales)                                  |

**Règles métier de création contrat :**

**Règle 1 : Contrat créé uniquement depuis opportunity Won**
Un contrat ne peut être créé que depuis une opportunity avec status = "won". Si opportunity status = "open" ou "lost", impossible de créer contrat.

**Règle 2 : Une opportunity génère un seul contrat initial**
Une opportunity ne peut générer qu'un seul contrat. Le champ `opportunity.contract_id` est renseigné à la création du contrat. Si déjà renseigné, erreur "Contract already created for this opportunity".

**Règle 3 : Héritage automatique des données Opportunity → Contract**

```
Mapping automatique à la création :
- opportunity.company_name → contract.company_name
- opportunity.lead_id → contract.lead_id
- opportunity.owner_id → contract.approved_by (commercial = approbateur)
- opportunity.expected_value → contract.total_value
- opportunity.currency → contract.currency
- opportunity.metadata.contact_name → contract.contact_name
- opportunity.metadata.contact_email → contract.contact_email
```

**Règle 4 : Calcul automatique des dates**

```
ALGORITHME calculateContractDates :
  ENTRÉE : effective_date, duration_months

  # Effective date par défaut = premier jour du mois suivant
  SI effective_date non fournie
    ALORS effective_date = premier_jour(mois_suivant(today))
  FIN SI

  # Expiry date = last day of last month
  expiry_date = dernier_jour(mois(effective_date) + duration_months - 1)

  # Exemple : effective_date = 1 Dec 2025, duration = 12 mois
  # → expiry_date = 30 Nov 2026

  # Renewal date = expiry_date si auto_renew = true
  SI auto_renew = true
    ALORS renewal_date = expiry_date
  SINON
    renewal_date = NULL
  FIN SI

  SORTIE : effective_date, expiry_date, renewal_date
```

**Règle 5 : Numérotation automatique des contrats**

```
ALGORITHME generateContractNumber :
  ENTRÉE : aucune

  # Format : CTR-YYYY-NNNNN
  # Exemple : CTR-2025-00123

  année = YEAR(today)
  dernier_numéro = SELECT MAX(contract_number)
                   WHERE contract_number LIKE 'CTR-{année}-%'

  SI dernier_numéro IS NULL
    ALORS nouveau_numéro = 1
  SINON
    nouveau_numéro = EXTRACT_NUMBER(dernier_numéro) + 1
  FIN SI

  contract_number = FORMAT('CTR-%d-%05d', année, nouveau_numéro)
  contract_code = FORMAT('C%d-%d', année, nouveau_numéro)

  SORTIE : contract_number, contract_code
```

**Règle 6 : Cycle de vie du contrat (statuts)**

```
STATUTS POSSIBLES :
1. draft : Brouillon, pas encore envoyé au client
2. pending_signature : Envoyé au client via DocuSign, en attente signature
3. signed : Signé par le client, en attente activation
4. active : Contrat en vigueur (effective_date atteinte)
5. expired : Contrat arrivé à échéance (expiry_date dépassée)
6. terminated : Résilié avant terme
7. renewed : Renouvelé (ancien contrat)

TRANSITIONS AUTORISÉES :
draft → pending_signature : Envoi DocuSign
pending_signature → signed : Webhook DocuSign signature
signed → active : Atteinte effective_date (cron job quotidien)
active → terminated : Résiliation client ou FleetCore
active → expired : Atteinte expiry_date sans renouvellement
active → renewed : Renouvellement créé nouveau contrat
expired → renewed : Renouvellement tardif
```

**Règle 7 : Génération du PDF contrat**

Le PDF contrat est généré automatiquement à partir d'un template HTML avec toutes les données du contrat injectées.

```
TEMPLATE CONTRAT (structure) :
- En-tête FleetCore (logo, coordonnées)
- Numéro contrat et date
- Informations client (société, contact, adresse)
- Objet du contrat (abonnement SaaS FleetCore)
- Détail tarifaire :
  - Nombre d'utilisateurs/véhicules
  - Prix unitaire
  - Total mensuel
  - Total annuel
  - TVA applicable
  - Total TTC
- Durée et dates (début, fin, renouvellement)
- Modalités paiement (cycle, moyen, délai)
- Conditions générales de vente (CGV)
- Clauses spécifiques (SLA, support, résiliation)
- Signatures (client + FleetCore)
```

**Règle 8 : Signature électronique DocuSign**

Lorsqu'un contrat passe en status "pending_signature", le système envoie automatiquement le PDF à DocuSign avec :

- Email signataire : contract.contact_email
- Nom signataire : contract.contact_name
- Document : PDF généré
- Callback URL : https://fleetcore.com/api/webhooks/docusign

Workflow DocuSign :

1. Client reçoit email "Vous avez un document à signer"
2. Client clique lien, ouvre DocuSign
3. Client lit contrat, clique "Sign"
4. Client dessine/upload signature électronique
5. Client valide
6. DocuSign envoie webhook à FleetCore :
   - event_type : "envelope.completed"
   - envelope_id : "abc123..."
   - signature_date : "2025-11-08T16:06:00Z"
   - document_url : "https://docusign.com/documents/signed/abc123.pdf"
7. FleetCore met à jour contrat :
   - status : "signed"
   - signature_date : date du webhook
   - signature_method : "docusign"
   - docusign_envelope_id : envelope_id
   - document_url : URL document signé
8. FleetCore déclenche provisioning tenant (voir Étape 3.2)

**Règle 9 : Activation automatique du contrat**

Un cron job quotidien (tous les jours à 00:00 UTC) vérifie :

```
SELECT * FROM crm_contracts
WHERE status = 'signed'
  AND effective_date <= TODAY()
  AND activation_date IS NULL
```

Pour chaque contrat trouvé :

1. Créer le tenant si pas encore créé (voir Étape 3.2)
2. Créer la subscription dans bil_tenant_subscriptions
3. Mettre à jour contrat :
   - status = "active"
   - activation_date = today
4. Créer lifecycle event "contract_activated"
5. Envoyer email client : "Votre compte FleetCore est maintenant actif"

**Règle 10 : Renouvellement automatique**

30 jours avant expiry_date, si auto_renew = true :

1. Créer nouveau contrat (clone de l'ancien) :
   - effective_date = ancien expiry_date + 1 jour
   - expiry_date = effective_date + duration_months
   - total_value = recalculé selon tarif actuel
   - status = "draft"
   - parent_contract_id = ancien contrat
2. Marquer ancien contrat :
   - status = "renewed"
   - renewed_contract_id = nouveau contrat
3. Envoyer notification client : "Votre contrat sera renouvelé le [date]"
4. Si client refuse : bouton "Cancel renewal" → passe nouveau contrat en "cancelled"

**Règle 11 : Résiliation anticipée**

Si client ou FleetCore résilie le contrat avant expiry_date :

1. Vérifier si période minimum écoulée (ex: 3 mois minimum)
2. Calculer préavis (ex: 30 jours)
3. Calculer termination_date = today + préavis
4. Mettre à jour contrat :
   - status = "terminated"
   - termination_date = calculée
   - termination_reason = raison fournie
5. Créer lifecycle event "contract_terminated"
6. Arrêter facturation à termination_date
7. Suspendre tenant à termination_date (status = "cancelled")
8. Envoyer email client : "Votre contrat sera résilié le [date]"

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/crm/contract.service.ts`**

Service contenant toute la logique métier des contrats.

**Classe ContractService extends BaseService :**

**Méthode createContractFromOpportunity(opportunityId: string, contractData: ContractCreateInput) → Promise<Contract>**

Cette méthode est appelée quand un commercial marque une opportunity comme "Won".

**Algorithme détaillé :**

1. Récupérer l'opportunity complète avec toutes ses relations :
   - Opportunity elle-même (expected_value, owner, currency)
   - Lead d'origine (contact_name, contact_email, company_name)
   - Pipeline (pour contexte)

2. Vérifier règles business :
   - opportunity.status = "won" ? Si non → throw BusinessRuleError("Cannot create contract: opportunity not won")
   - opportunity.contract_id IS NULL ? Si déjà renseigné → throw BusinessRuleError("Contract already exists for this opportunity")

3. Générer numéros uniques :
   - Appeler generateContractNumber() → contract_number, contract_code
   - Exemple : "CTR-2025-00123", "C2025-123"

4. Hériter données depuis opportunity et lead :

   ```
   contractData = {
     contract_number: généré,
     contract_code: généré,
     opportunity_id: opportunityId,
     lead_id: opportunity.lead_id,
     company_name: opportunity.company_name || lead.demo_company_name,
     contact_name: lead.first_name + " " + lead.last_name,
     contact_email: lead.email,
     contact_phone: lead.phone,
     total_value: contractData.total_value || opportunity.expected_value,
     currency: opportunity.currency,
     vat_rate: getVatRate(opportunity.country_code),
     approved_by: opportunity.owner_id,
     approved_at: now(),
     status: "draft",
     ...contractData (données fournies par commercial)
   }
   ```

5. Calculer dates automatiquement si non fournies :
   - Appeler calculateContractDates(effective_date, duration_months)
   - Renseigner effective_date, expiry_date, renewal_date

6. Valider données complètes avec ContractCreateSchema (Zod)

7. Créer contrat dans DB via contractRepository.create()

8. Mettre à jour opportunity :
   - contract_id = contrat créé
   - won_date = now() (si pas déjà renseigné)

9. Créer audit logs :
   - Contract : action = "created", entity = "contracts", entity_id = contract.id
   - Opportunity : action = "contract_created", entity = "opportunities"

10. Envoyer notifications :
    - Manager commercial : "Nouveau contrat créé par Karim pour ABC Logistics"
    - Équipe finance : "Nouveau contrat à valider : €18,000/an"
    - Équipe Customer Success : "Préparer onboarding ABC Logistics"

11. Retourner contrat créé avec toutes ses relations

**Méthode generateContractPDF(contractId: string) → Promise<{ pdfUrl: string, pdfBuffer: Buffer }>**

Génère le PDF du contrat prêt pour signature.

**Algorithme détaillé :**

1. Récupérer contrat complet avec toutes relations :
   - Opportunity (pour contexte commercial)
   - Lead (pour historique)
   - Billing plan (pour détail tarif)
   - Billing address (pour adresse facturation)

2. Charger template HTML contrat depuis fichiers :
   - Fichier : `/templates/contracts/contract-template-fr.html` (ou en, ar selon langue)
   - Template contient placeholders : {{company_name}}, {{total_value}}, etc.

3. Injecter données contrat dans template :
   - Utiliser moteur de templating (Handlebars ou Mustache)
   - Remplacer tous les {{placeholders}} par valeurs réelles
   - Formater nombres (18,000.00 €), dates (1 décembre 2025)
   - Calculer ligne par ligne si détail facture :
     ```
     80 véhicules × 18.75€/mois × 12 mois = 18,000.00€ HT
     TVA 20% : 3,600.00€
     Total TTC : 21,600.00€
     ```

4. Générer PDF depuis HTML :
   - Utiliser librairie `puppeteer` ou `playwright`
   - Lancer headless browser
   - Charger HTML
   - Imprimer en PDF avec options :
     - Format : A4
     - Marges : 2cm tous côtés
     - Header/Footer : numéro page, date génération
     - Qualité : haute résolution

5. Upload PDF sur S3 (ou cloud storage) :
   - Chemin : `/contracts/2025/11/CTR-2025-00123.pdf`
   - Permissions : privé (accessible uniquement avec signed URL)
   - Metadata : contract_id, company_name, generated_at

6. Mettre à jour contrat :
   - document_url = URL S3 du PDF
   - pdf_generated_at = now()

7. Créer audit log :
   - action = "pdf_generated"
   - metadata = { pdf_url, file_size, page_count }

8. Retourner :
   - pdfUrl : URL S3 signed (expire 7 jours)
   - pdfBuffer : Buffer PDF (pour envoi DocuSign)

**Méthode sendForSignature(contractId: string) → Promise<{ docusignEnvelopeId: string }>**

Envoie le contrat au client via DocuSign pour signature électronique.

**Algorithme détaillé :**

1. Récupérer contrat complet

2. Vérifier règles business :
   - contract.status = "draft" ? Si non → throw BusinessRuleError("Contract must be in draft status")
   - contract.document_url IS NOT NULL ? Si NULL → appeler generateContractPDF() d'abord
   - contract.contact_email valide ? Vérifier format email

3. Télécharger PDF contrat depuis S3 :
   - Utiliser document_url
   - Récupérer buffer PDF

4. Créer enveloppe DocuSign via API :

   ```javascript
   const docusignClient = new DocuSign.ApiClient();
   docusignClient.setBasePath(process.env.DOCUSIGN_BASE_PATH);
   docusignClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

   const envelopeDefinition = {
     emailSubject: `Contrat FleetCore - ${contract.company_name}`,
     emailBlurb: `Bonjour ${contract.contact_name}, veuillez signer votre contrat FleetCore ci-joint.`,
     documents: [
       {
         documentBase64: pdfBuffer.toString("base64"),
         name: `Contrat ${contract.contract_number}.pdf`,
         fileExtension: "pdf",
         documentId: "1",
       },
     ],
     recipients: {
       signers: [
         {
           email: contract.contact_email,
           name: contract.contact_name,
           recipientId: "1",
           routingOrder: "1",
           tabs: {
             signHereTabs: [
               {
                 documentId: "1",
                 pageNumber: "4", // Page signature
                 xPosition: "100",
                 yPosition: "600",
               },
             ],
             dateSignedTabs: [
               {
                 documentId: "1",
                 pageNumber: "4",
                 xPosition: "300",
                 yPosition: "600",
               },
             ],
           },
         },
       ],
     },
     status: "sent", // Envoie immédiatement
     eventNotification: {
       url: "https://fleetcore.com/api/webhooks/docusign",
       loggingEnabled: true,
       includeDocuments: true,
       envelopeEvents: [
         { envelopeEventStatusCode: "sent" },
         { envelopeEventStatusCode: "delivered" },
         { envelopeEventStatusCode: "completed" },
         { envelopeEventStatusCode: "declined" },
         { envelopeEventStatusCode: "voided" },
       ],
     },
   };

   const envelopesApi = new DocuSign.EnvelopesApi(docusignClient);
   const result = await envelopesApi.createEnvelope(accountId, {
     envelopeDefinition,
   });
   const envelopeId = result.envelopeId;
   ```

5. Mettre à jour contrat :
   - status = "pending_signature"
   - docusign_envelope_id = envelopeId
   - signature_sent_at = now()

6. Créer audit log :
   - action = "sent_for_signature"
   - metadata = { docusign_envelope_id, sent_to: contact_email }

7. Envoyer notification interne :
   - Commercial propriétaire : "Contrat ABC Logistics envoyé pour signature à Ahmed"
   - Manager : "Contrat €18k envoyé, suivi sur DocuSign"

8. Retourner :
   - docusignEnvelopeId pour tracking

**Méthode handleSignatureCompleted(docusignEnvelopeId: string, signatureData: any) → Promise<Contract>**

Appelée par le webhook DocuSign quand le client a signé.

**Algorithme détaillé :**

1. Trouver contrat via docusign_envelope_id

2. Vérifier que contrat existe et status = "pending_signature"

3. Télécharger document signé depuis DocuSign :

   ```javascript
   const documentsApi = new DocuSign.DocumentsApi(docusignClient);
   const signedPdf = await documentsApi.getDocument(
     accountId,
     docusignEnvelopeId,
     "1" // documentId
   );
   ```

4. Upload document signé sur S3 :
   - Chemin : `/contracts/signed/2025/11/CTR-2025-00123-signed.pdf`
   - Remplacer document_url par nouvelle URL

5. Mettre à jour contrat :
   - status = "signed"
   - signature_date = signatureData.completedDateTime
   - signature_method = "docusign"
   - signature_metadata = {
     envelope_id: docusignEnvelopeId,
     signer_email: signatureData.recipient.email,
     ip_address: signatureData.recipient.ipAddress,
     user_agent: signatureData.recipient.userAgent
     }

6. Créer audit log :
   - action = "signed"
   - severity = "info"
   - metadata = signature_metadata

7. Déclencher provisioning tenant automatique :
   - Appeler tenantService.provisionFromContract(contract.id)
   - Voir Étape 3.2 pour détails

8. Envoyer notifications :
   - Commercial : "Contrat ABC Logistics signé ! Tenant en cours de création..."
   - Manager : "Contrat €18k signé, revenus confirmés"
   - Client : "Merci d'avoir signé ! Votre compte sera prêt sous quelques minutes"
   - Finance : "Nouveau contrat actif, déclencher facturation"

9. Créer lifecycle event :
   - event_type = "contract_signed"
   - tenant_id = sera rempli après provisioning
   - effective_date = contract.effective_date

10. Retourner contrat mis à jour

**Méthode activateContract(contractId: string) → Promise<Contract>**

Appelée par le cron job quotidien quand effective_date est atteinte.

**Algorithme détaillé :**

1. Récupérer contrat avec tenant associé

2. Vérifier règles :
   - contract.status = "signed" ? Si non → erreur
   - contract.effective_date <= today ? Si non → pas encore temps
   - contract.activation_date IS NULL ? Si déjà activé → skip

3. Si tenant pas encore créé (cas rare) :
   - Appeler tenantService.provisionFromContract(contractId)
   - Attendre fin provisioning

4. Si subscription pas encore créée :
   - Appeler billingService.createSubscription(contract)
   - Renseigner contract.subscription_id

5. Mettre à jour contrat :
   - status = "active"
   - activation_date = today

6. Mettre à jour tenant :
   - status = "active" (si était "trialing")
   - subscription_start_date = today

7. Créer lifecycle event :
   - event_type = "contract_activated"
   - tenant_id = contract.tenant_id
   - effective_date = today

8. Créer première facture si cycle mensuel :
   - Appeler billingService.generateInvoice(subscription)

9. Envoyer notifications :
   - Client : "Votre compte FleetCore est maintenant actif et facturé"
   - Finance : "Facturation commencée pour ABC Logistics - €1500/mois"

10. Retourner contrat activé

**Méthode renewContract(contractId: string) → Promise<Contract>**

Crée un nouveau contrat de renouvellement 30 jours avant expiry_date.

**Algorithme détaillé :**

1. Récupérer contrat en cours de renouvellement

2. Vérifier règles :
   - contract.auto_renew = true ? Si non → ne rien faire
   - contract.expiry_date - today <= 30 jours ? Si non → trop tôt
   - contract.renewed_contract_id IS NULL ? Si déjà renouvelé → erreur

3. Récupérer plan tarifaire actuel (peut avoir changé) :
   - Chercher dans bil_billing_plans le plan équivalent ou supérieur

4. Créer nouveau contrat (clone de l'ancien) :

   ```
   newContract = {
     ...oldContract, // Copie tous les champs
     id: nouveau UUID,
     contract_number: générer nouveau numéro,
     contract_code: générer nouveau code,
     contract_date: today,
     effective_date: oldContract.expiry_date + 1 jour,
     expiry_date: calculer (effective_date + duration_months),
     duration_months: même durée que ancien,
     total_value: recalculer selon tarif actuel,
     plan_id: plan actuel (peut avoir changé),
     status: "draft",
     parent_contract_id: oldContract.id,
     renewal_date: NULL (sera recalculé),
     signature_date: NULL,
     document_url: NULL,
     docusign_envelope_id: NULL
   }
   ```

5. Créer nouveau contrat dans DB

6. Mettre à jour ancien contrat :
   - status = "renewed"
   - renewed_contract_id = newContract.id

7. Générer PDF nouveau contrat :
   - Appeler generateContractPDF(newContract.id)

8. Envoyer pour signature automatiquement :
   - Appeler sendForSignature(newContract.id)

9. Envoyer notifications :
   - Client : "Votre contrat FleetCore sera renouvelé le [date]. Veuillez signer le nouveau contrat ci-joint."
   - Commercial : "Renouvellement automatique déclenché pour ABC Logistics"
   - Finance : "Renouvellement €18k prévu pour décembre"

10. Créer lifecycle event :
    - event_type = "contract_renewal_initiated"
    - tenant_id = oldContract.tenant_id
    - metadata = { old_contract_id, new_contract_id }

11. Retourner nouveau contrat

**Méthode terminateContract(contractId: string, terminationData: TerminationInput) → Promise<Contract>**

Résilie un contrat avant terme (demande client ou FleetCore).

**Algorithme détaillé :**

1. Récupérer contrat avec tenant

2. Vérifier règles :
   - contract.status = "active" ? Si non → erreur "Cannot terminate inactive contract"
   - Période engagement minimum écoulée ? Ex: si contrat 12 mois avec engagement 3 mois minimum, vérifier activation_date + 3 mois <= today

3. Calculer préavis selon termes contrat :
   - Lire contract.metadata.notice_period_days (ex: 30 jours)
   - termination_date = today + notice_period_days

4. Calculer remboursement prorata si applicable :
   - Si facturation annuelle payée d'avance :
     - Mois restants = (expiry_date - termination_date) / 30
     - Montant remboursement = (total_value / 12) × mois_restants
   - Si facturation mensuelle : pas de remboursement

5. Mettre à jour contrat :
   - status = "terminated"
   - termination_date = calculée
   - termination_reason = terminationData.reason
   - termination_initiated_by = terminationData.initiated_by (client ou fleetcore)
   - termination_notes = terminationData.notes

6. Planifier suspension tenant :
   - Créer tâche programmée (scheduled job)
   - Date exécution = termination_date
   - Action : tenantService.suspendTenant(contract.tenant_id, reason = "contract_terminated")

7. Arrêter facturation future :
   - Mettre à jour subscription :
     - cancel_at = termination_date
     - cancellation_reason = "contract_terminated"
   - Empêcher génération nouvelles factures après termination_date

8. Créer lifecycle event :
   - event_type = "contract_terminated"
   - effective_date = termination_date
   - metadata = { reason, initiated_by, notice_period_days }

9. Envoyer notifications :
   - Client : "Votre contrat sera résilié le [date]. Vos données seront conservées 90 jours."
   - Commercial : "Contrat ABC Logistics résilié, raison : [reason]"
   - Finance : "Arrêt facturation ABC Logistics prévu [date], remboursement prorata : €[montant]"
   - Customer Success : "Exit interview à planifier avec ABC Logistics"

10. Si remboursement nécessaire :
    - Créer avoir (credit note) dans système billing
    - Planifier remboursement via Stripe

11. Créer audit log avec tous détails résiliation

12. Retourner contrat mis à jour

**Fichier à créer : `lib/repositories/crm/contract.repository.ts`**

Repository pour encapsuler accès Prisma à la table crm_contracts.

**Classe ContractRepository extends BaseRepository :**

**Méthode findByContractNumber(contractNumber: string) → Promise<Contract | null>**
Cherche un contrat par son numéro unique. Utilisé pour éviter doublons.

**Méthode findByOpportunityId(opportunityId: string, tenantId: string) → Promise<Contract | null>**
Cherche le contrat lié à une opportunity. Utilisé pour vérifier si opportunity déjà convertie.

**Méthode findExpiringContracts(daysUntilExpiry: number) → Promise<Contract[]>**
Cherche tous les contrats qui expirent dans X jours (pour renouvellement automatique).

```sql
WHERE status = 'active'
  AND auto_renew = true
  AND renewed_contract_id IS NULL
  AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '{daysUntilExpiry} days'
```

**Méthode findContractsToActivate() → Promise<Contract[]>**
Appelée par cron job quotidien, cherche contrats signés dont effective_date est atteinte.

```sql
WHERE status = 'signed'
  AND effective_date <= TODAY()
  AND activation_date IS NULL
```

**Méthode findActiveContractsForTenant(tenantId: string) → Promise<Contract[]>**
Liste tous les contrats actifs d'un tenant (peut avoir plusieurs si montée en gamme).

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/crm/contracts/route.ts`**

**GET /api/v1/crm/contracts**

- **Description** : Liste tous les contrats du tenant avec filtres
- **Query params** :
  - status : filter par status (draft, signed, active, expired, terminated)
  - opportunity_id : filter par opportunity
  - tenant_id : filter par tenant (admin seulement)
  - effective_date_from / to : range dates début
  - expiry_date_from / to : range dates fin
  - auto_renew : true/false
  - search : recherche texte (company_name, contact_name, contract_number)
  - limit, offset : pagination
- **Permissions** : contracts.read
- **Réponse 200** :

```json
{
  "contracts": [
    {
      "id": "uuid",
      "contract_number": "CTR-2025-00123",
      "contract_code": "C2025-123",
      "company_name": "ABC Logistics",
      "contact_name": "Ahmed Al-Mansoori",
      "total_value": 18000,
      "currency": "EUR",
      "status": "active",
      "effective_date": "2025-12-01",
      "expiry_date": "2026-11-30",
      "auto_renew": true,
      "billing_cycle": "monthly",
      "tenant": {
        "id": "uuid",
        "name": "ABC Logistics",
        "status": "active"
      }
    }
  ],
  "total": 23,
  "total_value": 456000,
  "limit": 50,
  "offset": 0
}
```

**POST /api/v1/crm/contracts**

- **Description** : Créer un nouveau contrat depuis une opportunity Won
- **Body** :

```json
{
  "opportunity_id": "uuid",
  "effective_date": "2025-12-01",
  "duration_months": 12,
  "billing_cycle": "monthly",
  "payment_terms": "Net 30",
  "auto_renew": true,
  "plan_id": "uuid",
  "billing_address_id": "uuid",
  "notes": "Conditions spéciales : remise 10% premiers 3 mois"
}
```

- **Permissions** : contracts.create (commercial ou manager)
- **Réponse 201** :

```json
{
  "id": "uuid",
  "contract_number": "CTR-2025-00123",
  "status": "draft",
  "company_name": "ABC Logistics",
  "total_value": 18000,
  "effective_date": "2025-12-01",
  "expiry_date": "2026-11-30",
  "created_at": "2025-11-08T16:00:00Z"
}
```

- **Erreurs** :
  - 422 : Opportunity not won
  - 422 : Contract already exists for this opportunity
  - 400 : Validation failed (dates invalides, etc.)

**Fichier à créer : `app/api/v1/crm/contracts/[id]/route.ts`**

**GET /api/v1/crm/contracts/[id]**

- **Description** : Détails complets d'un contrat
- **Permissions** : contracts.read
- **Réponse 200** : Contract complet avec toutes relations (opportunity, lead, tenant, subscription, billing_plan)

**PATCH /api/v1/crm/contracts/[id]**

- **Description** : Modifier un contrat en draft uniquement
- **Body** : Champs modifiables (dates, valeurs, notes)
- **Permissions** : contracts.update
- **Réponse 200** : Contract mis à jour
- **Erreurs** :
  - 422 : Cannot modify contract after signature

**DELETE /api/v1/crm/contracts/[id]**

- **Description** : Supprimer un contrat draft (soft delete)
- **Permissions** : contracts.delete
- **Réponse 204** : No Content
- **Erreurs** :
  - 422 : Cannot delete signed or active contract

**Fichier à créer : `app/api/v1/crm/contracts/[id]/pdf/route.ts`**

**POST /api/v1/crm/contracts/[id]/pdf**

- **Description** : Générer le PDF du contrat
- **Body** : Aucun
- **Permissions** : contracts.update
- **Réponse 200** :

```json
{
  "pdf_url": "https://s3.amazonaws.com/contracts/CTR-2025-00123.pdf?signature=...",
  "expires_at": "2025-11-15T16:00:00Z"
}
```

**GET /api/v1/crm/contracts/[id]/pdf**

- **Description** : Télécharger le PDF du contrat
- **Permissions** : contracts.read
- **Réponse 200** : Fichier PDF (Content-Type: application/pdf)

**Fichier à créer : `app/api/v1/crm/contracts/[id]/send/route.ts`**

**POST /api/v1/crm/contracts/[id]/send**

- **Description** : Envoyer le contrat au client pour signature DocuSign
- **Body** :

```json
{
  "contact_email": "ahmed@abclogistics.ae",
  "contact_name": "Ahmed Al-Mansoori",
  "message": "Bonjour Ahmed, veuillez signer votre contrat FleetCore."
}
```

- **Permissions** : contracts.send
- **Réponse 200** :

```json
{
  "docusign_envelope_id": "abc123...",
  "status": "pending_signature",
  "sent_at": "2025-11-08T16:05:00Z"
}
```

- **Erreurs** :
  - 422 : Contract not in draft status
  - 422 : PDF not generated yet

**Fichier à créer : `app/api/v1/crm/contracts/[id]/activate/route.ts`**

**POST /api/v1/crm/contracts/[id]/activate**

- **Description** : Activer manuellement un contrat signé (si effective_date passée)
- **Body** : Aucun
- **Permissions** : contracts.activate (admin uniquement)
- **Réponse 200** : Contract activé avec tenant créé
- **Erreurs** :
  - 422 : Contract not signed
  - 422 : Effective date not reached

**Fichier à créer : `app/api/v1/crm/contracts/[id]/renew/route.ts`**

**POST /api/v1/crm/contracts/[id]/renew**

- **Description** : Déclencher manuellement le renouvellement d'un contrat
- **Body** :

```json
{
  "duration_months": 12,
  "total_value": 19800,
  "notes": "Renouvellement avec upgrade plan Premium"
}
```

- **Permissions** : contracts.renew
- **Réponse 201** : Nouveau contrat de renouvellement créé
- **Erreurs** :
  - 422 : Contract not active
  - 422 : Contract already renewed

**Fichier à créer : `app/api/v1/crm/contracts/[id]/terminate/route.ts`**

**POST /api/v1/crm/contracts/[id]/terminate**

- **Description** : Résilier un contrat avant terme
- **Body** :

```json
{
  "termination_reason": "Client switching to competitor",
  "termination_date": "2025-12-31",
  "initiated_by": "client",
  "notes": "Client unhappy with support response time"
}
```

- **Permissions** : contracts.terminate
- **Réponse 200** : Contract terminé avec termination_date
- **Erreurs** :
  - 422 : Contract not active
  - 422 : Minimum commitment period not met

**Fichier à créer : `app/api/webhooks/docusign/route.ts`**

**POST /api/webhooks/docusign**

- **Description** : Webhook DocuSign pour notifications signature
- **Authentification** : HMAC signature DocuSign (vérifier avec DOCUSIGN_WEBHOOK_SECRET)
- **Body** : Événement DocuSign (structure complexe)
- **Traitement** :
  - Si event = "envelope.completed" → Appeler contractService.handleSignatureCompleted()
  - Si event = "envelope.declined" → Mettre contract status = "signature_declined"
  - Si event = "envelope.voided" → Mettre contract status = "signature_voided"
- **Réponse 200** : { success: true }
- **Erreurs** :
  - 400 : Invalid HMAC signature
  - 404 : Contract not found for envelope_id

**Fichier à créer : `app/api/cron/contracts/activate/route.ts`**

**GET /api/cron/contracts/activate**

- **Description** : Cron job quotidien pour activer les contrats dont effective_date est atteinte
- **Authentification** : CRON_SECRET (variable d'environnement)
- **Réponse 200** :

```json
{
  "activated_count": 5,
  "contracts_activated": [
    { "id": "uuid", "contract_number": "CTR-2025-00123" }
  ],
  "executed_at": "2025-11-09T00:00:00Z"
}
```

**Fichier à créer : `app/api/cron/contracts/renew/route.ts`**

**GET /api/cron/contracts/renew**

- **Description** : Cron job quotidien pour déclencher renouvellements automatiques (30 jours avant expiry)
- **Authentification** : CRON_SECRET
- **Réponse 200** :

```json
{
  "renewal_initiated_count": 3,
  "contracts_renewed": [{ "id": "uuid", "contract_number": "CTR-2025-00078" }]
}
```

#### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/crm/contracts/page.tsx`**

Page principale du module Contracts avec liste tableau.

**Layout de la page :**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│ [FleetCore Logo] CRM > Contracts             [+ New Contract]│
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ STATS                                                         │
│ Active: 45 | Pending Signature: 12 | Expiring Soon: 8       │
│ Total ARR: €1,234,567 | Avg Contract: €27,435               │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ FILTRES                                                       │
│ [Status ▼] [Billing Cycle ▼] [Auto-Renew ▼] [Search...    ]│
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ CONTRACTS TABLE                                               │
│ ┌─────┬────────────┬────────────┬────────┬────────┬────────┐│
│ │ #   │Company     │ Value      │Status  │Dates   │Actions ││
│ ├─────┼────────────┼────────────┼────────┼────────┼────────┤│
│ │CTR- │ABC Log.    │ €18,000/yr │🟢Active│Dec 25- │[View] ││
│ │00123│Ahmed       │ €1,500/mo  │        │Nov 26  │[PDF]  ││
│ │     │            │            │        │        │[⋮]    ││
│ ├─────┼────────────┼────────────┼────────┼────────┼────────┤│
│ │CTR- │XYZ Trans.  │ €24,000/yr │🟡Pending│Jan 26-│[View] ││
│ │00124│Sarah       │ €2,000/mo  │Sig.    │Dec 26  │[Send] ││
│ │     │            │            │        │        │[⋮]    ││
│ ├─────┼────────────┼────────────┼────────┼────────┼────────┤│
│ │CTR- │DEF Deliv.  │ €15,000/yr │🔴Expir.│Nov 25- │[View] ││
│ │00089│Mohamed     │ €1,250/mo  │Soon    │Oct 26  │[Renew]││
│ │     │            │            │(30 days│        │[⋮]    ││
│ └─────┴────────────┴────────────┴────────┴────────┴────────┘│
│ [← Prev] Page 1 of 5 [Next →]                                │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Tableau DataTable** : Liste tous les contrats avec colonnes triables
- **Badges status** : Couleurs selon status (vert active, orange pending, rouge expired)
- **Indicateur expiration** : Badge rouge "Expiring Soon" si expiry_date < 30 jours
- **Filtres** : Dropdowns pour status, billing_cycle, auto_renew, search texte
- **Actions rapides** :
  - 👁️ View : Navigue vers page détail
  - 📄 PDF : Télécharge le PDF du contrat
  - ✉️ Send : Envoie pour signature (si draft)
  - 🔄 Renew : Déclenche renouvellement (si proche expiry)
  - ⋮ More : Menu avec Terminate, Edit, etc.
- **Stats en haut** : Nombre contrats par status, ARR total, valeur moyenne
- **Bouton "+ New Contract"** : Ouvre modal création (demande opportunity_id)

**Fichier à créer : `app/[locale]/crm/contracts/[id]/page.tsx`**

Page détail d'un contrat avec toutes les informations.

**Layout de la page :**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│ [← Back] Contract CTR-2025-00123 - ABC Logistics  [Actions▼]│
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ STATUS BADGE                                                  │
│ 🟢 ACTIVE - Contract in effect                               │
└──────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┬──┐
│ CONTRACT DETAILS                    │ CLIENT DETAILS          │
│ Number: CTR-2025-00123              │ Company: ABC Logistics  │
│ Code: C2025-123                     │ Contact: Ahmed Al-Man.  │
│ Created: Nov 8, 2025                │ Email: ahmed@abc.ae     │
│ Effective: Dec 1, 2025              │ Phone: +971 50 123...   │
│ Expiry: Nov 30, 2026                │ Country: UAE 🇦🇪         │
│ Duration: 12 months                 │ Billing Addr: [View]    │
│                                     │                         │
│ FINANCIAL DETAILS                   │ BILLING & PAYMENT       │
│ Total Value: €18,000 (HT)           │ Plan: Standard          │
│ VAT (20%): €3,600                   │ Cycle: Monthly          │
│ Total TTC: €21,600                  │ Payment: Net 30         │
│ Monthly: €1,500                     │ Auto-Renew: Yes         │
│ Currency: EUR                       │ Renewal: Nov 30, 2026   │
└─────────────────────────────────────┴─────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ SIGNATURE DETAILS                                            │
│ Status: Signed                                               │
│ Method: DocuSign Electronic Signature                        │
│ Signed At: Nov 8, 2025 4:06 PM                              │
│ Signed By: Ahmed Al-Mansoori (ahmed@abclogistics.ae)        │
│ IP Address: 185.xx.xxx.xx (Dubai, UAE)                      │
│ DocuSign Envelope: abc123xyz...                              │
│ [Download Signed PDF]                                        │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ TENANT & SUBSCRIPTION                                        │
│ Tenant: ABC Logistics (uuid)                                │
│ Status: Active                                               │
│ Created: Nov 8, 2025 4:08 PM                                │
│ Subscription: SUB-2025-00045                                │
│ Next Invoice: Dec 1, 2025                                   │
│ [View Tenant →] [View Subscription →]                       │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ LIFECYCLE TIMELINE                                           │
│ ┌────────────────────────────────────────────────────┐      │
│ │ ✅ Contract Activated                                │      │
│ │ Nov 8, 2025 4:10 PM - Tenant provisioned            │      │
│ └────────────────────────────────────────────────────┘      │
│ ┌────────────────────────────────────────────────────┐      │
│ │ ✍️ Contract Signed                                  │      │
│ │ Nov 8, 2025 4:06 PM - Ahmed Al-Mansoori via DocuSign│      │
│ └────────────────────────────────────────────────────┘      │
│ ┌────────────────────────────────────────────────────┐      │
│ │ ✉️ Sent for Signature                               │      │
│ │ Nov 8, 2025 4:05 PM - Sent to ahmed@abclogistics.ae │      │
│ └────────────────────────────────────────────────────┘      │
│ ┌────────────────────────────────────────────────────┐      │
│ │ 📝 Contract Created                                 │      │
│ │ Nov 8, 2025 4:00 PM - By Karim Al-Rashid            │      │
│ └────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ ACTIONS                                                       │
│ [📄 Download PDF] [📧 Resend] [🔄 Renew] [⚠️ Terminate]     │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Badge status** : Affiche status contrat avec couleur et description
- **Sections détails** : Contract, Client, Financial, Billing regroupés logiquement
- **Signature section** : Toutes les infos signature DocuSign (date, IP, envelope_id)
- **Tenant & Subscription** : Liens vers tenant et subscription créés automatiquement
- **Timeline** : Historique complet des événements contrat (création → signature → activation)
- **Boutons actions** :
  - Download PDF : Télécharge le PDF signé
  - Resend : Renvoie email signature si pending
  - Renew : Déclenche renouvellement manuel
  - Terminate : Ouvre modal résiliation

**Composant à créer : `components/crm/ContractCard.tsx`**

Composant réutilisable pour afficher une carte contrat (utilisé dans liste tableau).

**Props :**

- contract : objet Contract complet
- onClick : callback clic carte

**Affichage :**

- Contract number + code
- Company name
- Contact name
- Total value (formatted avec currency)
- Monthly value
- Badge status avec couleur
- Dates (effective → expiry)
- Boutons actions rapides

**Composant à créer : `components/crm/CreateContractModal.tsx`**

Modal formulaire pour créer un contrat depuis une opportunity Won.

**Champs du formulaire :**

- **Opportunity** : Dropdown recherche opportunities Won (required)
  - Affiche : Company name, expected value, owner
  - Pré-rempli si vient de page opportunity
- **Effective date** : Date picker, défaut = premier jour mois suivant
- **Duration** : Dropdown (3, 6, 12, 24, 36 months)
- **Billing cycle** : Dropdown (Monthly, Quarterly, Yearly)
- **Payment terms** : Dropdown (Net 15, Net 30, Immediate)
- **Auto-renew** : Toggle switch, défaut ON
- **Plan** : Dropdown plans tarifaires (Standard, Premium, Enterprise)
- **Total value** : Calculé automatiquement, éditable
- **Notes** : Textarea optionnel

**Calcul automatique total_value :**

```
Quand plan ou duration change :
- Récupérer prix plan depuis API
- Calculer : price_per_vehicle × nb_vehicles × duration_months
- Afficher détail calcul sous champ total_value
```

**Validation :**

- Effective date >= today
- Duration min 1 mois
- Total value min 100€
- Opportunity must be Won status

**Soumission :**

- POST /api/v1/crm/contracts
- Si succès : ferme modal, redirige vers /contracts/[id]
- Si erreur : affiche message détaillé

**Composant à créer : `components/crm/TerminateContractModal.tsx`**

Modal formulaire pour résilier un contrat actif.

**Champs du formulaire :**

- **Termination date** : Date picker, min = today + notice_period (ex: 30 jours)
- **Reason** : Dropdown raisons prédéfinies
  - Client switching to competitor
  - Budget constraints
  - Business closure
  - Dissatisfied with service
  - Other (free text)
- **Initiated by** : Radio (Client, FleetCore)
- **Notes** : Textarea requis si reason = "Other"

**Affichage warnings :**

- "⚠️ Minimum commitment period: 3 months. You are within commitment, early termination fees may apply."
- "⚠️ Notice period: 30 days. Termination effective on [calculated date]."
- "💰 Prorated refund: €[amount] will be credited to your account."

**Validation :**

- Termination date >= today + notice_period
- Reason required
- Notes required si reason = "Other"

**Soumission :**

- POST /api/v1/crm/contracts/[id]/terminate
- Confirmation popup : "Are you sure? This action cannot be undone."
- Si succès : ferme modal, refresh page, affiche toast "Contract terminated"

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Créer contrat depuis opportunity Won**

- Naviguer vers /crm/opportunities
- Ouvrir opportunity "ABC Logistics" (status Won)
- Cliquer "Create Contract"
- Modal s'ouvre avec infos pré-remplies :
  - Company : ABC Logistics
  - Contact : Ahmed Al-Mansoori
  - Total value : €18,000 (calculé depuis opportunity)
  - Effective date : 1 Dec 2025
  - Duration : 12 months
  - Plan : Standard
- Confirmer création
- Toast "Contract created successfully"
- Redirection vers /contracts/CTR-2025-00123
- Status : Draft

**2. Générer et envoyer PDF pour signature**

- Sur page détail contrat
- Cliquer "Generate PDF"
- Loader 3 secondes (génération PDF)
- Toast "PDF generated"
- Cliquer "Send for Signature"
- Modal confirmation :
  - To : ahmed@abclogistics.ae
  - Subject : "Contrat FleetCore - ABC Logistics"
  - Message personnalisable
- Confirmer envoi
- Status passe à "Pending Signature"
- Toast "Contract sent to Ahmed via DocuSign"
- Email envoyé à Ahmed immédiatement

**3. Simuler signature client (via DocuSign ou webhook test)**

- Option A : Ahmed reçoit email, clique, signe sur DocuSign
- Option B : Simuler webhook DocuSign pour test :
  ```bash
  curl -X POST http://localhost:3000/api/webhooks/docusign \
    -H "Content-Type: application/json" \
    -d '{
      "event": "envelope.completed",
      "envelope_id": "abc123...",
      "completed_date_time": "2025-11-08T16:06:00Z"
    }'
  ```
- Webhook reçu, traité
- Status contrat passe à "Signed"
- Signature date renseignée
- Document signé uploadé sur S3
- Toast "Contract signed by Ahmed!"

**4. Provisioning tenant automatique (voir Étape 3.2)**

- Immédiatement après signature, système déclenche :
- Création tenant "ABC Logistics" dans adm_tenants
- Création organisation Clerk
- Génération invitation admin Ahmed
- Email envoyé à Ahmed : "Votre compte FleetCore est prêt"
- Durée totale : ~30 secondes

**5. Activation contrat le jour J**

- Attendre effective_date (ou simuler avec cron)
- Cron job active contrats signés dont effective_date atteinte
- Status passe de "Signed" à "Active"
- Tenant status passe à "Active"
- Première facture générée
- Email client : "Votre facturation a commencé"

**6. Visualiser contrat actif**

- Retour sur /contracts/CTR-2025-00123
- Status : 🟢 Active
- Toutes sections remplies :
  - Signature details (date, IP, DocuSign ID)
  - Tenant & Subscription (liens cliquables)
  - Timeline complète (created → sent → signed → activated)
- Bouton "Renew" visible si proche expiry
- Bouton "Terminate" disponible pour résiliation

**7. Renouvellement automatique (simulation)**

- Changer expiry_date du contrat à dans 25 jours (manipulation DB test)
- Attendre cron job renouvellement (ou appeler manuellement)
- Nouveau contrat créé automatiquement :
  - Contract number : CTR-2025-00124
  - Parent : CTR-2025-00123
  - Status : Draft
  - Effective date : 1 Dec 2026 (jour après expiry ancien)
- PDF généré automatiquement
- Envoyé automatiquement à Ahmed pour signature
- Email : "Votre contrat FleetCore sera renouvelé. Veuillez signer."
- Ancien contrat status passe à "Renewed"

**8. Résiliation anticipée**

- Sur page contrat actif
- Cliquer "Terminate"
- Modal résiliation s'ouvre
- Remplir :
  - Termination date : 31 Dec 2025 (30 jours préavis)
  - Reason : "Client switching to competitor"
  - Initiated by : Client
  - Notes : "Better pricing from competitor"
- Warning affiché : "Prorated refund: €1,500"
- Confirmer
- Status passe à "Terminated"
- Facturation arrêtée
- Tenant suspendu à termination_date
- Email client : "Votre contrat sera résilié le 31 Dec"

**Critères d'acceptation :**

- ✅ Contrat créé depuis opportunity Won avec données héritées
- ✅ PDF contrat généré automatiquement avec toutes infos
- ✅ Envoi DocuSign fonctionne, email reçu par client
- ✅ Webhook DocuSign traité, signature enregistrée
- ✅ Provisioning tenant déclenché automatiquement après signature
- ✅ Activation automatique à effective_date via cron
- ✅ Renouvellement automatique 30 jours avant expiry
- ✅ Résiliation avec calcul préavis et remboursement prorata
- ✅ Timeline complète visible sur page détail
- ✅ Liste contrats avec filtres et search fonctionne
- ✅ Badges status colorés selon état contrat
- ✅ Tous audits logs créés pour traçabilité

### ⏱️ ESTIMATION

- Temps backend : **16 heures**
  - ContractService complet (createFrom, generatePDF, send, activate, renew, terminate) : 12h
  - ContractRepository : 2h
  - DocuSign intégration : 2h
- Temps API : **8 heures**
  - GET /contracts : 1h
  - POST /contracts : 2h
  - PATCH/DELETE /contracts/[id] : 1h
  - POST /pdf, /send, /activate, /renew, /terminate : 3h
  - Webhook DocuSign : 1h
- Temps frontend : **12 heures**
  - Page liste /contracts : 4h
  - Page détail /contracts/[id] : 4h
  - CreateContractModal : 2h
  - TerminateContractModal : 2h
- **TOTAL : 36 heures (4.5 jours)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Étape 1.3 terminée (conversion opportunity → contract)
- Table crm_contracts existante
- DocuSign compte et API configurés (DOCUSIGN_ACCOUNT_ID, DOCUSIGN_API_KEY)
- S3 ou cloud storage pour PDFs
- Puppeteer ou Playwright installé (génération PDF)

**Services/composants requis :**

- OpportunityService (pour récupérer opportunity)
- TenantService (pour provisioning - voir Étape 3.2)
- NotificationService (emails)

**Données de test nécessaires :**

- Opportunities Won prêtes pour conversion
- Plans tarifaires dans bil_billing_plans
- Template HTML contrat (/templates/contracts/contract-template-fr.html)

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : ContractService compile, toutes méthodes implémentées
- [ ] **Backend** : generateContractPDF() génère PDF valide avec toutes données
- [ ] **Backend** : sendForSignature() crée enveloppe DocuSign correctement
- [ ] **Backend** : handleSignatureCompleted() traite webhook DocuSign
- [ ] **Backend** : activateContract() active et crée subscription
- [ ] **Backend** : renewContract() crée nouveau contrat renouvellement
- [ ] **Backend** : terminateContract() calcule préavis et remboursement
- [ ] **API** : POST /contracts crée contrat depuis opportunity
- [ ] **API** : POST /contracts/[id]/pdf génère et retourne PDF
- [ ] **API** : POST /contracts/[id]/send envoie DocuSign
- [ ] **API** : Webhook /docusign traite signature et déclenche provisioning
- [ ] **API** : Cron /cron/contracts/activate active contrats
- [ ] **API** : Cron /cron/contracts/renew renouvelle automatiquement
- [ ] **Frontend** : Page liste contrats affiche tableau filtrable
- [ ] **Frontend** : Page détail contrat affiche toutes infos + timeline
- [ ] **Frontend** : CreateContractModal calcule total_value automatiquement
- [ ] **Frontend** : TerminateContractModal affiche warnings et calcul prorata
- [ ] **Tests** : 20+ tests unitaires ContractService
- [ ] **Tests** : Test E2E complet opportunity → contract → signature → provisioning
- [ ] **Tests** : Test webhook DocuSign avec signature mock
- [ ] **Démo** : Sponsor peut créer contrat, générer PDF, envoyer signature
- [ ] **Démo** : Sponsor voit contrat signé après webhook
- [ ] **Démo** : Sponsor voit tenant créé automatiquement après signature

---

## ÉTAPE 3.2 : Tenant Provisioning & Activation

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Le contrat signé n'est qu'un document juridique. Pour que le client puisse utiliser FleetCore, il faut créer son "espace de travail" isolé (tenant) avec :

- Une organisation dans Clerk (auth provider)
- Une base de données isolée (RLS policies)
- Des settings par défaut configurés
- Un compte administrateur pour le contact client
- Des permissions et rôles par défaut

Le provisioning tenant est le pont critique entre la vente (contrat) et l'utilisation (produit SaaS). Sans automatisation, ce processus prend 2-3 semaines et nécessite intervention manuelle de l'équipe technique. Avec automatisation, le client accède à FleetCore en moins de 2 minutes après avoir signé.

**QUEL PROBLÈME :** Avant automatisation, le workflow était :

1. Commercial envoie email à tech@ : "Créer compte ABC Logistics"
2. Email reste 3 jours en inbox (équipe surchargée)
3. Technicien se connecte à Supabase manuellement
4. Exécute SQL INSERT INTO adm_tenants(...) avec données copiées-collées
5. Se connecte à Clerk dashboard
6. Crée organisation manuellement
7. Crée utilisateur admin manuellement
8. Configure settings par défaut manuellement (timezone, langue, devise)
9. Génère mot de passe temporaire
10. Envoie email au client avec credentials
11. Client reçoit email 1 semaine après avoir signé le contrat
12. 30% des clients ne reçoivent jamais l'email (erreur typo email)
13. Client contacte support : "Je n'ai toujours pas accès"
14. Support doit investiguer, relancer tech, renvoyer credentials
15. Client accède enfin 2-3 semaines après signature
16. **15% clients churned** entre signature et premier accès

**IMPACT SI ABSENT :**

- **Time to Access** : 14-21 jours au lieu de 2 minutes
- **Churn onboarding** : 15% clients perdus après signature
- **Coût opérationnel** : 30 min équipe tech par tenant × 50 tenants/mois = 25h/mois
- **Erreurs** : 30% tenants avec config incorrecte (timezone, devise, langue)
- **Satisfaction** : 4/10 au lieu de 9/10
- **Support tickets** : 50 tickets/mois "Je n'ai pas reçu les accès"

**CAS D'USAGE CONCRET :**

**AVANT (Processus manuel) :**

_8 novembre 2025, 16h06 - Ahmed Al-Mansoori signe le contrat FleetCore via DocuSign_

- Webhook DocuSign notifie FleetCore : contrat signé
- Commercial Karim reçoit notification : "Contrat ABC Logistics signé"
- Karim envoie email à tech@fleetcore.com :

  ```
  Objet : Nouveau client à provisionner

  Bonjour équipe technique,

  Le client ABC Logistics vient de signer son contrat.
  Pouvez-vous créer son compte SVP ?

  Infos :
  - Société : ABC Logistics
  - Contact : Ahmed Al-Mansoori
  - Email : ahmed@abclogistics.ae
  - Pays : UAE
  - Plan : Standard
  - Langue : Anglais

  Merci !
  Karim
  ```

- Email arrive dans inbox équipe tech (5 personnes)
- Personne ne le voit pendant 3 jours (week-end + surchargé)
- Le 11 novembre, un technicien voit l'email
- Technicien se connecte à Supabase
- Exécute manuellement :
  ```sql
  INSERT INTO adm_tenants (
    name, slug, country_code, default_currency, ...
  ) VALUES (
    'ABC Logistics',
    'abc-logistics',  -- ERREUR : déjà pris, doit être 'abc-logistics-ae'
    'AE',
    'USD',  -- ERREUR : devrait être AED pour UAE
    ...
  );
  ```
- Erreur : slug déjà existant, doit recommencer
- Corrige : slug = 'abc-logistics-ae', currency = 'AED'
- Succès, tenant créé
- Se connecte à Clerk dashboard
- Crée organisation manuellement : "ABC Logistics" (sans "-ae" dans le nom)
- Crée utilisateur admin : ahmed@abclogistics.ae
- ERREUR de typo : ahmed@abclogisitcs.ae (faute "logisitcs")
- Génère mot de passe temporaire : "P@ssw0rd123!"
- Envoie email à ahmed@abclogisitcs.ae (mauvais email)
- Email bounce back → pas reçu par Ahmed
- Ahmed attend 2 jours sans nouvelles
- Ahmed contacte support : "Je n'ai toujours pas mes accès"
- Support ticket créé, escaladé à équipe tech
- Technicien voit l'erreur email, corrige
- Renvoie credentials à bon email : ahmed@abclogistics.ae
- Ahmed reçoit email le 15 novembre (7 jours après signature)
- Se connecte, découvre :
  - Timezone : UTC (devrait être Asia/Dubai)
  - Langue : Français (devrait être Anglais)
  - Devise : USD (devrait être AED)
- Ahmed doit contacter support pour corriger
- **Expérience client catastrophique : 2/10**
- **Time to Access : 7 jours**

**APRÈS (Processus automatisé avec notre système) :**

_8 novembre 2025, 16h06 - Ahmed Al-Mansoori signe le contrat FleetCore via DocuSign_

- Webhook DocuSign notifie FleetCore : contrat signé (16h06:00)
- ContractService.handleSignatureCompleted() appelé automatiquement (16h06:01)
- Contract.status passe à "signed" (16h06:02)
- TenantService.provisionFromContract() déclenché automatiquement (16h06:03)
- Système exécute en parallèle (16h06:04 → 16h06:25) :

**Thread 1 : Création Tenant Database**

```
16h06:04 - Génération slug unique : "abc-logistics-ae" (check non existant)
16h06:05 - Extraction données contrat :
  - company_name : "ABC Logistics"
  - country_code : "AE"
  - contact_name : "Ahmed Al-Mansoori"
  - contact_email : "ahmed@abclogistics.ae"
16h06:06 - Récupération settings par défaut selon pays UAE :
  - default_currency : "AED" (Dirham)
  - timezone : "Asia/Dubai" (UTC+4)
  - default_language : "en" (Anglais)
  - date_format : "DD/MM/YYYY"
  - first_day_of_week : "sunday"
16h06:07 - Création tenant dans adm_tenants :
  INSERT INTO adm_tenants (
    name: "ABC Logistics",
    slug: "abc-logistics-ae",
    country_code: "AE",
    default_currency: "AED",
    timezone: "Asia/Dubai",
    status: "trialing",  -- Trial 14 jours par défaut
    trial_ends_at: "2025-11-22",  -- +14 jours
    max_members: 10,  -- Selon plan Standard
    max_vehicles: 100,
    settings: { locale: "en", ... }
  )
16h06:08 - Tenant créé, ID : uuid-abc-logistics
```

**Thread 2 : Création Organisation Clerk (parallèle)**

```
16h06:04 - Appel Clerk API createOrganization :
  POST https://api.clerk.com/v1/organizations
  {
    "name": "ABC Logistics",
    "slug": "abc-logistics-ae",
    "public_metadata": {
      "tenant_id": "uuid-abc-logistics",
      "country": "AE"
    }
  }
16h06:09 - Organisation Clerk créée, ID : org_abc123...
16h06:10 - Mise à jour tenant :
  UPDATE adm_tenants
  SET clerk_organization_id = 'org_abc123...'
  WHERE id = 'uuid-abc-logistics'
```

**Thread 3 : Génération Invitation Admin**

```
16h06:11 - Création invitation dans adm_invitations :
  INSERT INTO adm_invitations (
    tenant_id: "uuid-abc-logistics",
    email: "ahmed@abclogistics.ae",  -- Depuis contrat, aucune erreur
    role: "admin",  -- Role super-admin par défaut
    invitation_type: "initial_admin",
    token: "crypto_uuid_unique",
    expires_at: "2025-11-15"  -- +7 jours
  )
16h06:12 - Génération URL invitation :
  https://fleetcore.com/accept-invitation?token=crypto_uuid_unique
```

**Thread 4 : Configuration Settings par Défaut**

```
16h06:13 - Création settings dans adm_tenant_settings :
  - Branding : logo par défaut, couleurs neutres
  - Notifications : emails activés, SMS désactivés
  - Security : 2FA obligatoire pour admins
  - Business : working_hours (9h-18h Dubai time)
  - Vehicle classes : par défaut (Sedan, SUV, Van)
16h06:14 - Settings créés
```

**Thread 5 : Rôles et Permissions par Défaut**

```
16h06:15 - Création rôles standards dans adm_roles :
  1. Admin : toutes permissions
  2. Manager : gestion véhicules, chauffeurs, trajets
  3. Dispatcher : assignation trajets uniquement
  4. Driver : lecture seule son planning
16h06:17 - Rôles créés
```

**Thread 6 : Tenant Lifecycle Event**

```
16h06:18 - Création event dans adm_tenant_lifecycle_events :
  event_type: "created",
  effective_date: "2025-11-08",
  description: "Tenant provisioned from contract CTR-2025-00123",
  metadata: {
    contract_id,
    opportunity_id,
    lead_id,
    provisioned_automatically: true
  }
```

**Consolidation (16h06:19 → 16h06:25)**

```
16h06:19 - Vérification : tous threads OK
16h06:20 - Mise à jour contract :
  contract.tenant_id = "uuid-abc-logistics"
16h06:21 - Création audit log provisioning
16h06:22 - Envoi email Ahmed :
  Objet : "Bienvenue sur FleetCore - Créez votre compte"

  Bonjour Ahmed,

  Félicitations ! Votre compte FleetCore pour ABC Logistics est prêt.

  Cliquez ici pour créer votre mot de passe et accéder à votre tableau de bord :
  https://fleetcore.com/accept-invitation?token=crypto_uuid_unique

  Ce lien expire dans 7 jours.

  Votre période d'essai de 14 jours commence maintenant.

  Besoin d'aide ? Répondez à cet email.

  L'équipe FleetCore
16h06:23 - Email envoyé via Resend
16h06:24 - Notification Karim (commercial) :
  "Tenant ABC Logistics provisionné avec succès ! Ahmed va recevoir ses accès."
16h06:25 - Notification manager commercial :
  "Nouveau client actif : ABC Logistics - €18k ARR"
```

**Ahmed reçoit email (16h07)**

- Ahmed ouvre email immédiatement (16h08)
- Clique sur lien invitation (16h08)
- Page "Créez votre mot de passe" s'affiche
- Ahmed remplit :
  - Email : ahmed@abclogistics.ae (pré-rempli)
  - Mot de passe : [choisit son mot de passe sécurisé]
  - Confirmer mot de passe
- Ahmed clique "Créer mon compte" (16h09)
- Compte créé dans Clerk (16h09:05)
- Webhook Clerk → FleetCore (16h09:06)
- Création dans adm_members (16h09:07)
- Attribution rôle Admin (16h09:08)
- Invitation marquée "accepted" (16h09:09)
- Redirect automatique vers dashboard FleetCore (16h09:10)
- Ahmed se connecte pour la première fois (16h09:11)
- Dashboard s'affiche avec onboarding wizard :

  ```
  Bienvenue Ahmed ! 👋

  Complétez ces 4 étapes pour démarrer :
  ☐ Ajoutez votre premier véhicule
  ☐ Ajoutez votre premier chauffeur
  ☐ Configurez vos paramètres entreprise
  ☐ Importez vos données existantes
  ```

- Ahmed voit :
  - Timezone correcte : Asia/Dubai
  - Langue correcte : Anglais
  - Devise correcte : AED
  - Trial badge : "13 jours restants"
- **Expérience client excellente : 10/10**
- **Time to Access : 3 minutes après signature**

**Résultat comparaison :**

- **Time to Access** : 3 minutes vs 7 jours = **x3360 plus rapide**
- **Erreurs** : 0 vs 3 (typo email, mauvaise devise, mauvaise timezone)
- **Coût opérationnel** : 0 min vs 30 min
- **Satisfaction** : 10/10 vs 2/10
- **Churn évité** : 0% vs 15%

### 📊 DONNÉES ET RÈGLES MÉTIER

**Tables impliquées :**

- **adm_tenants** (création tenant)
- **adm_tenant_settings** (configuration par défaut)
- **adm_tenant_lifecycle_events** (event "created")
- **adm_invitations** (invitation admin initial)
- **adm_roles** (rôles par défaut)
- **adm_role_permissions** (permissions par défaut)
- **crm_contracts** (lien contract ↔ tenant)

**Colonnes critiques de adm_tenants (rappel) :**

| Colonne                   | Valeur lors provisioning | Source                                     |
| ------------------------- | ------------------------ | ------------------------------------------ |
| **name**                  | Company name             | contract.company_name                      |
| **slug**                  | Généré unique            | company_name + country_code                |
| **clerk_organization_id** | Généré Clerk             | API Clerk createOrganization               |
| **country_code**          | Pays client              | contract → opportunity → lead.country_code |
| **default_currency**      | Devise pays              | Mapping pays → devise                      |
| **timezone**              | Timezone pays            | Mapping pays → timezone                    |
| **default_language**      | Langue pays              | Mapping pays → langue                      |
| **status**                | "trialing"               | Initial toujours trial                     |
| **trial_ends_at**         | today + 14 jours         | Période trial standard                     |
| **max_members**           | Selon plan               | plan.limits.max_members                    |
| **max_vehicles**          | Selon plan               | plan.limits.max_vehicles                   |
| **primary_contact_email** | Contact client           | contract.contact_email                     |
| **primary_contact_phone** | Téléphone                | contract.contact_phone                     |
| **billing_email**         | Email facturation        | contract.contact_email (même initialement) |

**Règles métier de provisioning tenant :**

**Règle 1 : Génération slug unique**

```
ALGORITHME generateTenantSlug :
  ENTRÉE : company_name, country_code

  # Nettoyer le nom société
  slug_base = company_name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  # Remplacer espaces et chars spéciaux par -
    .replace(/^-+|-+$/g, '')       # Retirer - début et fin
    .substring(0, 50)              # Max 50 chars

  # Ajouter suffix pays si collision potentielle
  slug = slug_base + '-' + country_code.toLowerCase()

  # Vérifier unicité
  tentative = 0
  WHILE EXISTS (SELECT 1 FROM adm_tenants WHERE slug = slug)
    tentative++
    slug = slug_base + '-' + country_code.toLowerCase() + '-' + tentative
  FIN WHILE

  SORTIE : slug

# Exemples :
# "ABC Logistics" + "AE" → "abc-logistics-ae"
# "DEF Transport & Co." + "FR" → "def-transport-co-fr"
# "ABC Logistics" + "AE" (collision) → "abc-logistics-ae-1"
```

**Règle 2 : Mapping pays → settings par défaut**

```
CONFIGURATION PAR PAYS :

UAE (AE) :
  currency : AED
  timezone : Asia/Dubai
  locale : en
  date_format : DD/MM/YYYY
  time_format : 24h
  first_day_of_week : sunday
  phone_country_code : +971

France (FR) :
  currency : EUR
  timezone : Europe/Paris
  locale : fr
  date_format : DD/MM/YYYY
  time_format : 24h
  first_day_of_week : monday
  phone_country_code : +33

Saudi Arabia (SA) :
  currency : SAR
  timezone : Asia/Riyadh
  locale : ar
  date_format : DD/MM/YYYY
  time_format : 12h
  first_day_of_week : sunday
  phone_country_code : +966

USA (US) :
  currency : USD
  timezone : America/New_York  # Par défaut, ajustable
  locale : en
  date_format : MM/DD/YYYY
  time_format : 12h
  first_day_of_week : sunday
  phone_country_code : +1
```

**Règle 3 : Mapping plan → limites**

```
LIMITS PAR PLAN :

Starter :
  max_members : 3
  max_vehicles : 25
  max_drivers : 50
  max_trips_per_month : 1000
  support_level : email
  features : [basic_fleet, basic_scheduling]

Standard :
  max_members : 10
  max_vehicles : 100
  max_drivers : 200
  max_trips_per_month : 10000
  support_level : email + chat
  features : [full_fleet, advanced_scheduling, basic_analytics]

Premium :
  max_members : 50
  max_vehicles : 500
  max_drivers : 1000
  max_trips_per_month : 100000
  support_level : email + chat + phone
  features : [full_fleet, advanced_scheduling, advanced_analytics, integrations, api_access]

Enterprise :
  max_members : unlimited
  max_vehicles : unlimited
  max_drivers : unlimited
  max_trips_per_month : unlimited
  support_level : dedicated_account_manager
  features : [all_features, white_label, custom_integrations, sla_99.9]
```

**Règle 4 : Rôles par défaut à créer**

À la création d'un tenant, 4 rôles standards sont créés automatiquement dans `adm_roles` :

```
RÔLE 1 : Admin
  name : "Admin"
  description : "Super administrateur avec tous les droits"
  is_system : true  # Rôle système, ne peut pas être supprimé
  permissions : {
    vehicles : { create, read, update, delete },
    drivers : { create, read, update, delete },
    trips : { create, read, update, delete },
    members : { create, read, update, delete },
    roles : { create, read, update, delete },
    settings : { read, update },
    billing : { read, update },
    reports : { read, export }
  }
  max_members : 5  # Max 5 admins par tenant

RÔLE 2 : Manager
  name : "Manager"
  description : "Gestionnaire de flotte avec droits étendus"
  is_system : true
  permissions : {
    vehicles : { create, read, update },
    drivers : { create, read, update },
    trips : { create, read, update },
    members : { read },
    reports : { read }
  }
  max_members : 20

RÔLE 3 : Dispatcher
  name : "Dispatcher"
  description : "Répartiteur pouvant assigner les trajets"
  is_system : true
  permissions : {
    vehicles : { read },
    drivers : { read },
    trips : { create, read, update }
  }
  max_members : unlimited

RÔLE 4 : Driver
  name : "Driver"
  description : "Chauffeur avec accès lecture seule à ses trajets"
  is_system : true
  permissions : {
    trips : { read_own },  # Lecture uniquement ses propres trajets
    vehicles : { read_assigned },  # Lecture uniquement véhicule assigné
    profile : { read, update_own }
  }
  max_members : unlimited
```

**Règle 5 : Ordre des opérations de provisioning (obligatoire)**

Le provisioning DOIT suivre cet ordre exact pour éviter erreurs :

```
ORDRE STRICT :
1. Valider données contrat
2. Générer slug unique tenant
3. Créer tenant dans adm_tenants (status = trialing)
4. Créer organisation Clerk
5. Mettre à jour tenant avec clerk_organization_id
6. Créer settings par défaut dans adm_tenant_settings
7. Créer rôles par défaut dans adm_roles
8. Créer permissions par défaut dans adm_role_permissions
9. Créer invitation admin initial dans adm_invitations
10. Créer lifecycle event "created"
11. Mettre à jour contract avec tenant_id
12. Envoyer email invitation à l'admin
13. Envoyer notifications internes (commercial, manager)

SI UNE ÉTAPE ÉCHOUE → ROLLBACK complet (transaction)
```

**Règle 6 : Transaction atomique obligatoire**

Le provisioning DOIT se faire dans une transaction DB unique. Si une étape échoue, TOUT est rollback.

```
BEGIN TRANSACTION;

TRY :
  -- Étapes 1-11 ci-dessus
  COMMIT;
  -- Étapes 12-13 (emails) hors transaction
CATCH error :
  ROLLBACK;
  LOG error;
  THROW ProvisioningFailedError(error);
END TRY;
```

**Règle 7 : Gestion des erreurs de provisioning**

Si provisioning échoue, système doit :

1. Rollback transaction DB
2. Supprimer organisation Clerk si créée
3. Logger erreur détaillée dans Sentry
4. Créer ticket support automatique
5. Notifier équipe technique via Slack
6. Envoyer email au commercial : "Provisioning failed for ABC Logistics, ticket #1234 created"
7. NE PAS envoyer email client (il ne doit rien savoir de l'erreur interne)
8. Permettre retry manuel par équipe technique

**Règle 8 : Idempotence**

Le provisioning DOIT être idempotent. Si appelé 2 fois (retry après erreur), ne doit pas créer doublon.

```
ALGORITHME provisionTenant (idempotent) :
  ENTRÉE : contract_id

  # Vérifier si déjà provisionné
  SI contract.tenant_id IS NOT NULL
    ALORS
      tenant = getTenant(contract.tenant_id)
      SI tenant.status != 'error'
        ALORS RETURN tenant  # Déjà OK, rien à faire
      SINON
        # Tenant en erreur, nettoyer et recommencer
        cleanupErroredTenant(tenant.id)
      FIN SI
  FIN SI

  # Provisioning normal...
```

**Règle 9 : Trial period automatique**

TOUS les tenants commencent avec un trial de 14 jours, peu importe le plan.

```
trial_ends_at = today + 14 jours
status = "trialing"

À J+14 :
  SI carte bancaire enregistrée
    ALORS status = "active", facturation commence
  SINON status = "suspended", accès bloqué
```

**Règle 10 : Onboarding checklist initial**

À la création, insérer checklist onboarding dans tenant.metadata :

```json
{
  "onboarding": {
    "completed": false,
    "steps": [
      {
        "key": "add_first_vehicle",
        "label": "Ajoutez votre premier véhicule",
        "completed": false,
        "required": true
      },
      {
        "key": "add_first_driver",
        "label": "Ajoutez votre premier chauffeur",
        "completed": false,
        "required": true
      },
      {
        "key": "configure_settings",
        "label": "Configurez vos paramètres entreprise",
        "completed": false,
        "required": false
      },
      {
        "key": "import_data",
        "label": "Importez vos données existantes",
        "completed": false,
        "required": false
      }
    ],
    "started_at": null,
    "completed_at": null
  }
}
```

Quand admin se connecte, afficher wizard avec ces étapes. Quand toutes complétées :

- onboarding.completed = true
- onboarding.completed_at = now()
- tenant.onboarding_completed_at = now() (colonne directe pour analytics)

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/tenant.service.ts`**

Service pour provisionner et gérer les tenants.

**Classe TenantService extends BaseService :**

**Méthode provisionFromContract(contractId: string) → Promise<Tenant>**

Méthode principale appelée automatiquement après signature contrat.

**Algorithme ultra-détaillé :**

```typescript
async provisionFromContract(contractId: string): Promise<Tenant> {
  // ÉTAPE 0 : Récupération et validation
  const contract = await this.contractRepository.findById(contractId);

  if (!contract) {
    throw new NotFoundError('Contract not found');
  }

  if (contract.tenant_id) {
    // Déjà provisionné, vérifier état
    const existingTenant = await this.tenantRepository.findById(contract.tenant_id);
    if (existingTenant.status !== 'error') {
      this.logger.info('Tenant already provisioned', { contractId, tenantId: existingTenant.id });
      return existingTenant;
    }
    // Tenant en erreur, nettoyer et recommencer
    await this.cleanupErroredTenant(existingTenant.id);
  }

  // Récupérer toutes les données sources
  const opportunity = await this.opportunityRepository.findById(contract.opportunity_id);
  const lead = await this.leadRepository.findById(contract.lead_id);
  const plan = await this.billingPlanRepository.findById(contract.plan_id);

  // TRANSACTION ATOMIQUE
  return await this.transaction(async () => {

    // ÉTAPE 1 : Générer slug unique
    const slug = await this.generateTenantSlug(
      contract.company_name,
      lead.country_code
    );

    // ÉTAPE 2 : Récupérer settings par défaut selon pays
    const countrySettings = this.getCountryDefaults(lead.country_code);

    // ÉTAPE 3 : Récupérer limites selon plan
    const planLimits = this.getPlanLimits(plan.tier);

    // ÉTAPE 4 : Créer tenant dans DB
    const tenantData = {
      name: contract.company_name,
      slug: slug,
      country_code: lead.country_code,
      default_currency: countrySettings.currency,
      timezone: countrySettings.timezone,
      default_language: countrySettings.locale,
      status: 'trialing',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 jours
      max_members: planLimits.max_members,
      max_vehicles: planLimits.max_vehicles,
      primary_contact_email: contract.contact_email,
      primary_contact_phone: contract.contact_phone,
      billing_email: contract.contact_email,
      metadata: {
        contract_id: contract.id,
        opportunity_id: opportunity.id,
        lead_id: lead.id,
        plan_tier: plan.tier,
        onboarding: {
          completed: false,
          steps: [
            { key: 'add_first_vehicle', completed: false, required: true },
            { key: 'add_first_driver', completed: false, required: true },
            { key: 'configure_settings', completed: false, required: false },
            { key: 'import_data', completed: false, required: false }
          ]
        }
      }
    };

    const tenant = await this.tenantRepository.create(tenantData);

    // ÉTAPE 5 : Créer organisation Clerk
    const clerkOrg = await this.clerkService.createOrganization({
      name: tenant.name,
      slug: tenant.slug,
      publicMetadata: {
        tenant_id: tenant.id,
        country: tenant.country_code,
        plan: plan.tier
      }
    });

    // ÉTAPE 6 : Mettre à jour tenant avec clerk_organization_id
    tenant.clerk_organization_id = clerkOrg.id;
    await this.tenantRepository.update(tenant.id, {
      clerk_organization_id: clerkOrg.id
    });

    // ÉTAPE 7 : Créer settings par défaut
    await this.tenantSettingsRepository.create({
      tenant_id: tenant.id,
      settings: {
        branding: {
          logo_url: null,
          primary_color: '#3B82F6', // Bleu par défaut
          secondary_color: '#10B981' // Vert par défaut
        },
        notifications: {
          email_enabled: true,
          sms_enabled: false,
          push_enabled: true
        },
        security: {
          two_factor_required_for_admins: true,
          session_timeout_minutes: 480, // 8h
          password_expiry_days: 90
        },
        business: {
          working_hours: {
            start: '09:00',
            end: '18:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          },
          timezone: countrySettings.timezone
        },
        features: planLimits.features,
        ...countrySettings
      }
    });

    // ÉTAPE 8 : Créer rôles par défaut
    const roles = await this.createDefaultRoles(tenant.id);

    // ÉTAPE 9 : Créer invitation admin initial
    const adminRole = roles.find(r => r.name === 'Admin');
    const invitation = await this.invitationService.createInvitation({
      tenant_id: tenant.id,
      email: contract.contact_email,
      role_id: adminRole.id,
      invitation_type: 'initial_admin',
      sent_by: contract.approved_by, // Commercial qui a créé le contrat
      custom_message: `Bienvenue sur FleetCore ! Votre compte ${tenant.name} est prêt.`
    });

    // ÉTAPE 10 : Créer lifecycle event
    await this.lifecycleEventRepository.create({
      tenant_id: tenant.id,
      event_type: 'created',
      effective_date: new Date(),
      description: `Tenant provisioned from contract ${contract.contract_number}`,
      performed_by: null, // Système
      metadata: {
        contract_id: contract.id,
        opportunity_id: opportunity.id,
        lead_id: lead.id,
        provisioned_automatically: true,
        provisioning_duration_ms: Date.now() - startTime
      }
    });

    // ÉTAPE 11 : Mettre à jour contract avec tenant_id
    await this.contractRepository.update(contract.id, {
      tenant_id: tenant.id
    });

    // COMMIT TRANSACTION (automatique si aucune erreur)

    return tenant;
  });

  // HORS TRANSACTION (peuvent échouer sans rollback) :

  // ÉTAPE 12 : Envoyer email invitation à l'admin
  try {
    await this.emailService.sendInvitation(invitation);
  } catch (error) {
    this.logger.error('Failed to send invitation email', { error, invitationId: invitation.id });
    // Ne pas throw, email peut être renvoyé manuellement
  }

  // ÉTAPE 13 : Envoyer notifications internes
  try {
    await this.notificationService.notifyTenantProvisioned({
      tenant,
      contract,
      commercial: opportunity.owner
    });
  } catch (error) {
    this.logger.error('Failed to send internal notifications', { error });
  }

  return tenant;
}
```

**Méthode generateTenantSlug(companyName: string, countryCode: string) → Promise<string>**

Génère un slug unique pour le tenant.

**Algorithme détaillé :**

```typescript
async generateTenantSlug(companyName: string, countryCode: string): Promise<string> {
  // Nettoyer le nom
  let slugBase = companyName
    .toLowerCase()
    .normalize('NFD')  // Décomposer accents
    .replace(/[\u0300-\u036f]/g, '')  // Retirer diacritiques
    .replace(/[^a-z0-9]+/g, '-')  // Remplacer chars spéciaux par -
    .replace(/^-+|-+$/g, '')  // Trim - début/fin
    .substring(0, 40);  // Max 40 chars pour laisser place suffix

  // Ajouter pays en suffix
  const country = countryCode.toLowerCase();
  let slug = `${slugBase}-${country}`;

  // Vérifier unicité
  let attempt = 0;
  while (await this.tenantRepository.slugExists(slug)) {
    attempt++;
    slug = `${slugBase}-${country}-${attempt}`;
  }

  return slug;
}
```

**Méthode getCountryDefaults(countryCode: string) → CountrySettings**

Retourne les settings par défaut selon le pays.

**Algorithme :**

```typescript
getCountryDefaults(countryCode: string): CountrySettings {
  const COUNTRY_CONFIGS = {
    'AE': {
      currency: 'AED',
      timezone: 'Asia/Dubai',
      locale: 'en',
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
      first_day_of_week: 'sunday',
      phone_country_code: '+971'
    },
    'FR': {
      currency: 'EUR',
      timezone: 'Europe/Paris',
      locale: 'fr',
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
      first_day_of_week: 'monday',
      phone_country_code: '+33'
    },
    'SA': {
      currency: 'SAR',
      timezone: 'Asia/Riyadh',
      locale: 'ar',
      date_format: 'DD/MM/YYYY',
      time_format: '12h',
      first_day_of_week: 'sunday',
      phone_country_code: '+966'
    },
    // ... autres pays
  };

  return COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS['AE']; // Default UAE
}
```

**Méthode getPlanLimits(planTier: string) → PlanLimits**

Retourne les limites selon le plan tarifaire.

**Algorithme :**

```typescript
getPlanLimits(planTier: string): PlanLimits {
  const PLAN_LIMITS = {
    'starter': {
      max_members: 3,
      max_vehicles: 25,
      max_drivers: 50,
      max_trips_per_month: 1000,
      support_level: 'email',
      features: ['basic_fleet', 'basic_scheduling']
    },
    'standard': {
      max_members: 10,
      max_vehicles: 100,
      max_drivers: 200,
      max_trips_per_month: 10000,
      support_level: 'email_chat',
      features: ['full_fleet', 'advanced_scheduling', 'basic_analytics']
    },
    'premium': {
      max_members: 50,
      max_vehicles: 500,
      max_drivers: 1000,
      max_trips_per_month: 100000,
      support_level: 'email_chat_phone',
      features: ['full_fleet', 'advanced_scheduling', 'advanced_analytics', 'integrations', 'api_access']
    },
    'enterprise': {
      max_members: null, // Unlimited
      max_vehicles: null,
      max_drivers: null,
      max_trips_per_month: null,
      support_level: 'dedicated_manager',
      features: ['all_features', 'white_label', 'custom_integrations', 'sla_99.9']
    }
  };

  return PLAN_LIMITS[planTier] || PLAN_LIMITS['standard'];
}
```

**Méthode createDefaultRoles(tenantId: string) → Promise<Role[]>**

Crée les 4 rôles par défaut pour le tenant.

**Algorithme :**

```typescript
async createDefaultRoles(tenantId: string): Promise<Role[]> {
  const DEFAULT_ROLES = [
    {
      name: 'Admin',
      description: 'Super administrateur avec tous les droits',
      is_system: true,
      tenant_id: tenantId,
      permissions: {
        vehicles: { create: true, read: true, update: true, delete: true },
        drivers: { create: true, read: true, update: true, delete: true },
        trips: { create: true, read: true, update: true, delete: true },
        members: { create: true, read: true, update: true, delete: true },
        roles: { create: true, read: true, update: true, delete: true },
        settings: { read: true, update: true },
        billing: { read: true, update: true },
        reports: { read: true, export: true }
      },
      max_members: 5
    },
    {
      name: 'Manager',
      description: 'Gestionnaire de flotte',
      is_system: true,
      tenant_id: tenantId,
      permissions: {
        vehicles: { create: true, read: true, update: true, delete: false },
        drivers: { create: true, read: true, update: true, delete: false },
        trips: { create: true, read: true, update: true, delete: false },
        members: { create: false, read: true, update: false, delete: false },
        reports: { read: true, export: false }
      },
      max_members: 20
    },
    {
      name: 'Dispatcher',
      description: 'Répartiteur',
      is_system: true,
      tenant_id: tenantId,
      permissions: {
        vehicles: { create: false, read: true, update: false, delete: false },
        drivers: { create: false, read: true, update: false, delete: false },
        trips: { create: true, read: true, update: true, delete: false }
      },
      max_members: null // Unlimited
    },
    {
      name: 'Driver',
      description: 'Chauffeur',
      is_system: true,
      tenant_id: tenantId,
      permissions: {
        trips: { read_own: true },
        vehicles: { read_assigned: true },
        profile: { read: true, update_own: true }
      },
      max_members: null // Unlimited
    }
  ];

  const roles = [];
  for (const roleData of DEFAULT_ROLES) {
    const role = await this.roleRepository.create(roleData);
    roles.push(role);
  }

  return roles;
}
```

**Méthode cleanupErroredTenant(tenantId: string) → Promise<void>**

Nettoie un tenant en état d'erreur pour permettre retry.

**Algorithme :**

```typescript
async cleanupErroredTenant(tenantId: string): Promise<void> {
  await this.transaction(async () => {
    // Supprimer organisation Clerk si existe
    const tenant = await this.tenantRepository.findById(tenantId);
    if (tenant.clerk_organization_id) {
      try {
        await this.clerkService.deleteOrganization(tenant.clerk_organization_id);
      } catch (error) {
        this.logger.warn('Failed to delete Clerk org during cleanup', { error });
      }
    }

    // Soft delete toutes les données liées
    await this.tenantSettingsRepository.deleteByTenant(tenantId);
    await this.roleRepository.deleteByTenant(tenantId);
    await this.invitationRepository.deleteByTenant(tenantId);
    await this.lifecycleEventRepository.deleteByTenant(tenantId);

    // Soft delete le tenant
    await this.tenantRepository.softDelete(tenantId);
  });
}
```

**Fichier à créer : `lib/services/admin/clerk.service.ts`**

Service wrapper pour API Clerk.

**Classe ClerkService :**

**Méthode createOrganization(data) → Promise<ClerkOrganization>**

```typescript
async createOrganization(data: {
  name: string;
  slug: string;
  publicMetadata: any;
}): Promise<ClerkOrganization> {
  const clerkClient = this.getClerkClient();

  const org = await clerkClient.organizations.createOrganization({
    name: data.name,
    slug: data.slug,
    publicMetadata: data.publicMetadata
  });

  return org;
}
```

**Méthode deleteOrganization(orgId: string) → Promise<void>**

```typescript
async deleteOrganization(orgId: string): Promise<void> {
  const clerkClient = this.getClerkClient();
  await clerkClient.organizations.deleteOrganization(orgId);
}
```

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/tenants/route.ts`**

**GET /api/v1/admin/tenants**

- **Description** : Liste tous les tenants (admin FleetCore seulement)
- **Query params** : status, country_code, plan_tier, search, limit, offset
- **Permissions** : provider.admin (employé FleetCore)
- **Réponse 200** : Liste tenants paginée avec stats

**POST /api/v1/admin/tenants**

- **Description** : Créer un tenant manuellement (sans contrat)
- **Body** : TenantCreateInput
- **Permissions** : provider.admin
- **Réponse 201** : Tenant créé avec invitation envoyée

**Fichier à créer : `app/api/v1/admin/tenants/[id]/route.ts`**

**GET /api/v1/admin/tenants/[id]**

- **Description** : Détails complets d'un tenant
- **Permissions** : provider.admin OU tenant.admin (si même tenant)
- **Réponse 200** : Tenant avec settings, membres, lifecycle events

**PATCH /api/v1/admin/tenants/[id]**

- **Description** : Modifier un tenant
- **Body** : TenantUpdateInput (name, settings, etc.)
- **Permissions** : tenant.admin
- **Réponse 200** : Tenant mis à jour

**Fichier à créer : `app/api/v1/admin/tenants/[id]/provision/route.ts`**

**POST /api/v1/admin/tenants/[id]/provision**

- **Description** : Déclencher manuellement le provisioning d'un tenant (retry après erreur)
- **Body** : { contract_id: "uuid" }
- **Permissions** : provider.admin
- **Réponse 200** : Tenant provisionné
- **Erreurs** :
  - 422 : Tenant already provisioned
  - 422 : Contract not signed

**Fichier à créer : `app/api/v1/admin/tenants/[id]/suspend/route.ts`**

**POST /api/v1/admin/tenants/[id]/suspend**

- **Description** : Suspendre un tenant (impayé, fraude, etc.)
- **Body** : { reason: "payment_failed", notes: "3 failed attempts" }
- **Permissions** : provider.admin
- **Réponse 200** : Tenant suspendu (status = "suspended")

**Fichier à créer : `app/api/v1/admin/tenants/[id]/reactivate/route.ts`**

**POST /api/v1/admin/tenants/[id]/reactivate**

- **Description** : Réactiver un tenant suspendu
- **Body** : { reason: "payment_received" }
- **Permissions** : provider.admin
- **Réponse 200** : Tenant réactivé (status = "active")

#### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/admin/tenants/page.tsx`**

Page liste des tenants (admin FleetCore seulement).

**Layout :**

```
┌──────────────────────────────────────────────────────────────┐
│ FleetCore Admin > Tenants                       [+ New Tenant]│
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ STATS                                                         │
│ Active: 123 | Trial: 45 | Suspended: 12 | Total ARR: €2.3M  │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ FILTRES                                                       │
│ [Status ▼] [Country ▼] [Plan ▼] [Search...              ]   │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ TENANTS TABLE                                                 │
│ Name | Status | Country | Plan | MRR | Members | Created    │
│ ABC Logistics | 🟢 Active | UAE | Standard | €1,500 | 5/10 │
│ XYZ Transport | 🟡 Trial | FR | Premium | €0 (trial) | 2/50 │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

**Fichier à créer : `app/[locale]/admin/tenants/[id]/page.tsx`**

Page détail d'un tenant (admin FleetCore).

**Sections :**

- Informations générales
- Settings et configuration
- Membres et rôles
- Usage et limites
- Lifecycle events timeline
- Contrat associé
- Subscription et facturation
- Actions : Suspend, Reactivate, Delete

**Fichier à créer : `app/[locale]/onboarding/page.tsx`**

Page wizard onboarding pour nouvel admin client (première connexion).

**Layout :**

```
┌──────────────────────────────────────────────────────────────┐
│ Bienvenue sur FleetCore ! 👋                                  │
│ Complétez ces étapes pour commencer                          │
│ [═══════════════════════────────░░░░░░░░░░] 50% complété      │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ STEP 1/4 : Ajoutez votre premier véhicule                    │
│ ✅ Complété                                                   │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ STEP 2/4 : Ajoutez votre premier chauffeur                   │
│ [Formulaire...]                                               │
│ [Skip] [Continue →]                                           │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- Progress bar visuelle
- Steps avec checkmarks
- Bouton Skip pour étapes optionnelles
- Sauvegarde automatique progression
- Redirect dashboard quand complété

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet :**

**1. Déclencher provisioning automatique**

- Depuis page contrat signé (Étape 3.1)
- Status contrat = "Signed"
- Cliquer bouton "Provision Tenant Now" (si pas déjà fait automatiquement)
- Loader "Provisioning tenant..."
- 20 secondes max
- Toast "Tenant provisioned successfully!"

**2. Vérifier tenant créé**

- Naviguer vers /admin/tenants (admin FleetCore)
- Voir nouveau tenant "ABC Logistics"
- Status : 🟡 Trialing
- Country : UAE 🇦🇪
- Plan : Standard
- Members : 0/10 (invitation envoyée, pas encore acceptée)
- Created : À l'instant

**3. Vérifier organisation Clerk créée**

- Se connecter à Clerk dashboard externe
- Aller dans Organizations
- Voir "ABC Logistics" (abc-logistics-ae)
- Metadata : tenant_id, country AE, plan standard

**4. Vérifier invitation admin envoyée**

- Ouvrir Mailbox Ahmed (ou mailhog pour test)
- Email reçu : "Bienvenue sur FleetCore - Créez votre compte"
- Contenu : lien invitation avec token unique
- Lien cliquable : https://fleetcore.com/accept-invitation?token=...

**5. Accepter invitation (côté client)**

- Ahmed clique lien dans email
- Page "Créez votre compte FleetCore" s'affiche
- Formulaire :
  - Email : ahmed@abclogistics.ae (pré-rempli, readonly)
  - Prénom : Ahmed
  - Nom : Al-Mansoori
  - Mot de passe : (choisir sécurisé)
  - Confirmer mot de passe
  - Checkbox : "J'accepte les CGU"
- Ahmed remplit, clique "Créer mon compte"
- Compte créé dans Clerk
- Webhook Clerk → FleetCore
- Création dans adm_members
- Attribution rôle Admin
- Invitation marquée "accepted"
- Redirect vers /onboarding

**6. Wizard onboarding**

- Page onboarding s'affiche
- "Bienvenue Ahmed ! Complétez ces étapes :"
- Step 1/4 : Ajoutez premier véhicule (formulaire inline)
- Ahmed remplit : Plaque, Marque, Modèle
- Clique "Continue"
- Step 2/4 : Ajoutez premier chauffeur
- Ahmed remplit : Nom, Email, Téléphone
- Clique "Continue"
- Step 3/4 : Configurez paramètres (optionnel)
- Ahmed clique "Skip"
- Step 4/4 : Importez données (optionnel)
- Ahmed clique "Skip"
- Toast "Onboarding complété !"
- Redirect vers dashboard principal

**7. Dashboard FleetCore première connexion**

- Ahmed voit dashboard vide
- Header : "ABC Logistics" + avatar Ahmed
- Trial badge : "13 jours restants" (14 - 1)
- Sidebar : Véhicules (1), Chauffeurs (1), Trajets (0)
- Banner : "Complétez votre profil entreprise"
- Settings correctes visibles :
  - Timezone : Asia/Dubai (heure locale affichée)
  - Langue : Anglais
  - Devise : AED

**8. Vérifier settings par défaut**

- Aller dans Settings
- Voir :
  - Branding : logo placeholder, couleurs par défaut
  - Notifications : email ON, SMS OFF
  - Security : 2FA requis pour admins
  - Business hours : 9h-18h Dubai time
  - Membres max : 10 (selon plan Standard)
  - Véhicules max : 100

**9. Vérifier rôles créés**

- Aller dans Settings > Rôles
- Voir 4 rôles :
  - Admin (5/5 permissions)
  - Manager (3/5 permissions)
  - Dispatcher (2/5 permissions)
  - Driver (1/5 permissions lecture seule)
- Badge "Rôle système" sur les 4 (non supprimables)

**10. Vérifier lifecycle events**

- Aller dans /admin/tenants/[id] (côté FleetCore admin)
- Section Timeline
- Voir événement : "🎉 Tenant Created - Nov 8, 2025 4:08 PM"
- Metadata : contract_id, provisioned_automatically: true

**Critères d'acceptation :**

- ✅ Tenant créé automatiquement après signature contrat
- ✅ Slug unique généré sans collision
- ✅ Organisation Clerk créée et synchronisée
- ✅ Settings par défaut appliqués selon pays (devise, timezone, langue)
- ✅ Limites appliquées selon plan (max_members, max_vehicles)
- ✅ 4 rôles par défaut créés avec permissions correctes
- ✅ Invitation admin envoyée immédiatement
- ✅ Client peut accepter invitation et créer compte
- ✅ Wizard onboarding affiché à première connexion
- ✅ Dashboard avec settings correctes visibles
- ✅ Lifecycle event "created" enregistré
- ✅ Transaction atomique (rollback si erreur à n'importe quelle étape)
- ✅ Idempotence (retry après erreur ne crée pas doublon)
- ✅ Time to Access < 5 minutes après signature

### ⏱️ ESTIMATION

- Temps backend : **14 heures**
  - TenantService.provisionFromContract() complet : 8h
  - ClerkService wrapper : 2h
  - createDefaultRoles(), cleanupErroredTenant() : 2h
  - InvitationService (if not exists) : 2h
- Temps API : **6 heures**
  - GET/POST /tenants : 2h
  - POST /tenants/[id]/provision : 1h
  - POST /tenants/[id]/suspend, /reactivate : 2h
  - PATCH/DELETE /tenants/[id] : 1h
- Temps frontend : **12 heures**
  - Page liste tenants /admin/tenants : 4h
  - Page détail tenant /admin/tenants/[id] : 3h
  - Page onboarding wizard /onboarding : 5h
- **TOTAL : 32 heures (4 jours)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Étape 3.1 terminée (contracts avec signature)
- Tables adm_tenants, adm_tenant_settings, adm_roles, adm_invitations existantes
- Clerk SDK configuré (CLERK_SECRET_KEY)
- Email service configuré (Resend API key)

**Services/composants requis :**

- ContractService (trigger provisioning)
- ClerkService (nouveau, à créer)
- InvitationService (nouveau ou adapter existant)
- EmailService (existant)
- NotificationService (existant)

**Données de test nécessaires :**

- Contrats signés prêts pour provisioning
- Plans tarifaires avec limites définies
- Templates email invitation

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : TenantService.provisionFromContract() compile et fonctionne
- [ ] **Backend** : generateTenantSlug() génère slug unique sans collision
- [ ] **Backend** : getCountryDefaults() retourne settings corrects pour 5+ pays
- [ ] **Backend** : getPlanLimits() retourne limites correctes pour 4 plans
- [ ] **Backend** : createDefaultRoles() crée 4 rôles avec permissions cohérentes
- [ ] **Backend** : Transaction rollback si erreur à n'importe quelle étape
- [ ] **Backend** : Idempotence : provisioning appelé 2x ne crée pas doublon
- [ ] **Backend** : ClerkService.createOrganization() crée org Clerk
- [ ] **API** : POST /admin/tenants/[id]/provision déclenche provisioning
- [ ] **API** : POST /admin/tenants/[id]/suspend suspend tenant
- [ ] **API** : GET /admin/tenants liste tenants avec filtres
- [ ] **Frontend** : Page liste tenants affiche status colorés
- [ ] **Frontend** : Page détail tenant affiche settings et lifecycle
- [ ] **Frontend** : Wizard onboarding affiche 4 étapes avec progress bar
- [ ] **Frontend** : Wizard sauvegarde progression automatiquement
- [ ] **Frontend** : Dashboard affiche settings correctes (timezone, currency)
- [ ] **Tests** : 20+ tests unitaires TenantService
- [ ] **Tests** : Test E2E complet signature → provisioning → invitation → onboarding
- [ ] **Tests** : Test rollback si Clerk API échoue
- [ ] **Tests** : Test idempotence (retry après erreur)
- [ ] **Démo** : Sponsor voit tenant créé automatiquement après signature
- [ ] **Démo** : Sponsor voit email invitation reçu par client
- [ ] **Démo** : Sponsor voit client accepter invitation et se connecter
- [ ] **Démo** : Sponsor voit wizard onboarding fonctionner
- [ ] **Démo** : Sponsor vérifie settings appliquées correctement selon pays

---

# DÉMO SPRINT 3

**À la fin du Sprint 3 complet (sections 3.1 + 3.2), le sponsor peut valider :**

**1. Contractualisation automatisée :**

- Opportunity Won → Contract généré automatiquement
- PDF contrat généré avec toutes données
- Envoi DocuSign pour signature électronique
- Signature trackée avec date/IP/DocuSign ID
- Activation automatique à effective_date
- Renouvellement automatique 30 jours avant expiry
- Résiliation avec calcul préavis et remboursement

**2. Provisioning tenant immédiat :**

- Signature contrat → Tenant créé en moins de 30 secondes
- Organisation Clerk synchronisée automatiquement
- Settings par défaut appliqués selon pays
- Rôles et permissions par défaut créés
- Invitation admin envoyée immédiatement
- Client accède en moins de 5 minutes après signature

**3. Flux complet Lead → Tenant opérationnel :**

- Lead capturé → Qualifié → Converti en Opportunity
- Opportunity Won → Contract créé → Signé
- Contract Signé → Tenant provisionné → Invitation envoyée
- Client accepte → Onboarding → Dashboard accessible
- **Time total : 3 minutes** (vs 3 semaines avant)

**4. Metrics business critiques :**

- Time to Access : < 5 minutes (vs 21 jours)
- Churn onboarding : 0% (vs 15%)
- Coût opérationnel provisioning : €0 (vs €50/tenant)
- Satisfaction client : 10/10 (vs 4/10)
- Taux erreur : 0% (vs 30%)

**🎉 SPRINT 3 TERMINÉ - FLEETCORE CRM & ADM 100% FONCTIONNEL**
