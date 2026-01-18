# FLEETCORE - SPÉCIFICATION CRM V6.3 FINALE

## ARCHITECTURE 3 MODULES + WIZARD CAL.COM + ONE-CALL CLOSE + STRIPE PAYMENT FLOW

**Version :** 6.3.0  
**Date :** 10 Janvier 2026  
**Statut :** SPÉCIFICATION CONSOLIDÉE - VALIDÉE  
**Auteur :** Mohamed Fodil (CEO FleetCore)

---

## ⚠️ AVERTISSEMENTS

### Documents remplacés

Ce document **REMPLACE INTÉGRALEMENT** :

- FLEETCORE_CRM_SPECIFICATION_V6_2_1_FINAL.md ❌
- FLEETCORE_CRM_SPECIFICATION_V6_2_FINAL.md ❌
- Tout document antérieur sur le CRM ❌

### Changements majeurs V6.2.1 → V6.3

| Élément               | V6.2.1 (OBSOLÈTE)                                   | V6.3 (ACTUEL)                             |
| --------------------- | --------------------------------------------------- | ----------------------------------------- |
| **Statuts Lead**      | 10 statuts (incohérents)                            | **8 statuts** (cohérents one-call)        |
| **Phases Kanban**     | 5 phases                                            | **4 phases**                              |
| **Statut demo**       | `demo_scheduled`                                    | **`demo`** (simplifié)                    |
| **Statuts supprimés** | `qualified`, `demo_completed`                       | ❌ N'existent plus                        |
| **Noms phases**       | Acquisition, Qualification, Demo, Closing, Résultat | **Incomplet, Démo, Proposition, Terminé** |

### Principe CARDINAL

**ZERO HARDCODING** - Toutes les règles métier dans tables settings (crm_settings, bil_settings, adm_settings)

---

## TABLE DES MATIÈRES

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Architecture 3 Modules](#2-architecture-3-modules)
3. [Les 8 Statuts Lead V6.3](#3-les-8-statuts-lead-v63)
4. [Les 4 Phases Kanban V6.3](#4-les-4-phases-kanban-v63)
5. [Segmentation Business](#5-segmentation-business)
6. [UX/Frontend : Wizard Booking](#6-uxfrontend--wizard-booking)
7. [Intégration Cal.com](#7-intégration-calcom)
8. [Processus Appel Commercial (One-Call Close)](#8-processus-appel-commercial-one-call-close)
9. [Framework Qualification CPT](#9-framework-qualification-cpt)
10. [Discours Commercial (Style Gridwise)](#10-discours-commercial-style-gridwise)
11. [Notifications](#11-notifications)
12. [Flux Lead-to-Client (Stripe Payment Flow)](#12-flux-lead-to-client-stripe-payment-flow)
13. [Quote Management (Segment 4)](#13-quote-management-segment-4)
14. [Module CLT - Client](#14-module-clt---client)
15. [Module ADM - Tenant](#15-module-adm---tenant)
16. [Opportunity Pipeline (FREEZE)](#16-opportunity-pipeline-freeze)
17. [Règles Commerciales](#17-règles-commerciales)
18. [Modifications Schema V6.3](#18-modifications-schema-v63)
19. [Configuration crm_settings V6.3](#19-configuration-crm_settings-v63)
20. [Configuration bil_settings V6.3](#20-configuration-bil_settings-v63)
21. [Pages et Routes](#21-pages-et-routes)
22. [Métriques et KPIs](#22-métriques-et-kpis)
23. [Plan d'Exécution](#23-plan-dexécution)
24. [Règles de Gestion Verrouillées](#24-règles-de-gestion-verrouillées)

---

## 1. RÉSUMÉ EXÉCUTIF

### 1.1 Philosophie One-Call Close

> **RÈGLE FONDAMENTALE :**  
> "L'appel n'est PAS un appel de qualification suivi d'une demo séparée.  
> C'est **UN SEUL appel** où on qualifie, on démontre, et on close."

Cette philosophie implique qu'il n'y a **PAS d'états intermédiaires** entre "RDV booké" et "Proposition envoyée".

### 1.2 Conséquences sur les statuts

| Ancien modèle (V6.2.1)                                              | Problème                        | Nouveau modèle (V6.3)    |
| ------------------------------------------------------------------- | ------------------------------- | ------------------------ |
| `demo_scheduled` → `qualified` → `demo_completed` → `proposal_sent` | 2 états intermédiaires inutiles | `demo` → `proposal_sent` |
| 10 statuts                                                          | Trop complexe, incohérent       | **8 statuts**            |
| 5 phases Kanban                                                     | Phases vides                    | **4 phases**             |

### 1.3 Données factuelles justifiant le Wizard

| Source              | Donnée                                 | Impact V6.3            |
| ------------------- | -------------------------------------- | ---------------------- |
| **HubSpot**         | Multi-step forms = +86% conversion     | Wizard 3 étapes        |
| **Venture Harbour** | Form multi-step = 0.96% → 8.1% (+743%) | Wizard 3 étapes        |
| **Chili Piper**     | Calendrier intégré = 30% → 66.7%       | Cal.com embed étape 2  |
| **Chili Piper**     | Réponse < 1 min = +391% conversion     | Appel à l'heure exacte |
| **Formstack**       | Téléphone early = -48% conversion      | Téléphone étape 3      |
| **Gridwise**        | "Plus members earn 30% more"           | Discours orienté GAIN  |

---

## 2. ARCHITECTURE 3 MODULES

### 2.1 Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE V6.3 FINAL                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                  MODULE CRM (Acquisition)                               │ │
│  │  ───────────────────────────────────────────────────────────────────── │ │
│  │  crm_leads (8 statuts) ───→ crm_quotes (Segment 4) ───→ crm_orders     │ │
│  │                                                                        │ │
│  │  Tables : crm_leads, crm_quotes, crm_quote_items, crm_orders,         │ │
│  │           crm_activities, crm_lead_sources, crm_countries,            │ │
│  │           crm_settings, crm_referrals                                 │ │
│  └────────────────────────────────┬────────────────────────────────────────┘ │
│                                   │                                          │
│                                   ▼ Conversion (status = converted)          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                   MODULE CLT (Client)                                   │ │
│  │  ───────────────────────────────────────────────────────────────────── │ │
│  │  clt_masterdata ←── Données Lead + lead_code historique               │ │
│  │  clt_members    ←── (ex adm_members) Utilisateurs client              │ │
│  │  clt_invoices   ←── (ex bil_tenant_invoices) Factures client          │ │
│  │  clt_subscriptions ←── (ex bil_tenant_subscriptions)                  │ │
│  └────────────────────────────────┬────────────────────────────────────────┘ │
│                                   │                                          │
│                                   ▼ Lien technique                           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                   MODULE ADM (Tenant)                                   │ │
│  │  ───────────────────────────────────────────────────────────────────── │ │
│  │  adm_tenants = Liaison tenant/client/Clerk + config technique         │ │
│  │  adm_providers, adm_provider_employees, adm_roles, adm_settings...    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│                              ┌────────────────────────────────────────────┐  │
│                              │  MODULE CRM (Upsell) - FREEZE             │  │
│                              │  crm_opportunities → crm_quotes           │  │
│                              │  (Futur : upsell modules/addons)          │  │
│                              └────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Séparation des responsabilités

| Module  | Responsabilité                                           | Tables principales                                           |
| ------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| **CRM** | Acquisition prospects → clients                          | crm_leads, crm_quotes, crm_orders, crm_activities            |
| **CLT** | Gestion compte client (masterdata, facturation, membres) | clt_masterdata, clt_members, clt_invoices, clt_subscriptions |
| **ADM** | Infrastructure technique tenant + config système         | adm_tenants, adm_providers, adm_roles                        |

---

## 3. LES 8 STATUTS LEAD V6.3

### 3.1 Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         8 STATUTS LEAD V6.3                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     PHASE: INCOMPLET                                    │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │  new              Email OK, wizard PAS terminé           [Wizard]       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     PHASE: DÉMO                                         │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │  demo             Wizard terminé, RDV booké, attente     [Cal.com]      │ │
│  │                   appel commercial                                      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│                         ┌─────────────────────┐                              │
│                         │   L'APPEL           │                              │
│                         │   (one-call close)  │                              │
│                         │   Qual + Demo +     │                              │
│                         │   Closing           │                              │
│                         └─────────────────────┘                              │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     PHASE: PROPOSITION                                  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │  proposal_sent    Lien paiement Stripe généré            [Commercial]   │ │
│  │  payment_pending  Lien envoyé, attente paiement          [Stripe]       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     PHASE: TERMINÉ                                      │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │  converted        Paiement reçu, tenant créé ✓           [Stripe]       │ │
│  │  lost             Perdu (raison obligatoire)             [Commercial]   │ │
│  │  nurturing        En nurturing (timing pas bon)          [Commercial]   │ │
│  │  disqualified     Hors cible / Red flag                  [Commercial]   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Détail des 8 statuts

| Statut            | Phase       | Description                              | Déclencheur           | Probabilité |
| ----------------- | ----------- | ---------------------------------------- | --------------------- | ----------- |
| `new`             | Incomplet   | Email entré, wizard pas terminé          | Wizard étape 1        | 5%          |
| `demo`            | Démo        | Wizard terminé, RDV booké, attente appel | Webhook Cal.com       | 50%         |
| `proposal_sent`   | Proposition | Lien paiement Stripe généré              | Commercial post-appel | 85%         |
| `payment_pending` | Proposition | Lien envoyé, attente paiement            | Commercial            | 90%         |
| `converted`       | Terminé     | Paiement reçu, tenant créé               | Stripe webhook        | 100%        |
| `lost`            | Terminé     | Perdu définitivement                     | Commercial            | 0%          |
| `nurturing`       | Terminé     | Timing pas bon, relance programmée       | Commercial            | 15%         |
| `disqualified`    | Terminé     | Hors cible / Red flag                    | Commercial            | 0%          |

### 3.3 Transitions autorisées

```
new → demo                        (Lead complète wizard + webhook Cal.com BOOKING_CREATED)
new → nurturing                   (Système: wizard incomplet après J+7 OU pays non couvert)
new → disqualified                (Commercial: spam, faux, test, doublon)

demo → proposal_sent              (Commercial: appel OK, génère lien paiement)
demo → nurturing                  (Commercial: pas maintenant + dropdown raison)
demo → lost                       (Commercial: KO + dropdown raison)
demo → disqualified               (Commercial: hors cible découvert pendant appel)

proposal_sent → payment_pending   (Système: lien cliqué ou rappel envoyé)
proposal_sent → lost              (Commercial: abandon, pas de réponse)
proposal_sent → nurturing         (Commercial: demande délai supplémentaire)

payment_pending → converted       (Stripe webhook checkout.session.completed - AUTOMATIQUE)
payment_pending → lost            (Système: expiration lien sans paiement)

nurturing → demo                  (Lead clique "Book Demo" dans email nurturing)
nurturing → proposal_sent         (Lead contacte commercial, prêt à acheter sans démo)
nurturing → lost                  (Lead demande désinscription OU commercial abandonne)

lost → nurturing                  (Commercial: recovery possible après analyse)

converted → (terminal)
disqualified → (terminal)
```

### 3.4 Règle importante : nurturing → demo

**Le commercial NE PEUT PAS manuellement passer un lead de `nurturing` à `demo`.**

C'est le **LEAD qui doit agir** en cliquant sur le lien "Book Demo" dans un email.
Cette action le ramène au wizard `/book-demo?email=xxx&source=nurturing` où il complète le booking Cal.com.

### 3.4 Raisons de clôture (obligatoires)

**Pour `lost`** (dropdown obligatoire) :
| Code | Label FR | Label EN |
|------|----------|----------|
| `not_interested` | Pas intéressé | Not interested |
| `chose_competitor` | A choisi un concurrent | Chose competitor |
| `price_perception` | Prix perçu comme trop élevé | Price perception |
| `bad_timing` | Mauvais timing | Bad timing |
| `no_response` | Ne répond plus | No response |
| `no_show` | Ne s'est pas présenté au RDV | No show |

**Pour `disqualified`** (dropdown obligatoire) :
| Code | Label FR | Label EN |
|------|----------|----------|
| `wrong_segment` | Mauvais segment (1 véhicule) | Wrong segment |
| `wrong_country` | Pays non couvert | Wrong country |
| `spam_fake` | Spam ou faux lead | Spam/Fake |
| `duplicate` | Doublon | Duplicate |
| `test_lead` | Lead de test | Test lead |

**Pour `nurturing`** (dropdown obligatoire) :
| Code | Label FR | Label EN | Source |
|------|----------|----------|--------|
| `wizard_incomplete` | Wizard non complété | Incomplete wizard | Système (depuis new) |
| `country_waitlist` | Pays non disponible | Country waitlist | Système (depuis new) |
| `timing_q1` | Recontacter Q1 | Recontact Q1 | Commercial (depuis demo) |
| `timing_q2` | Recontacter Q2 | Recontact Q2 | Commercial (depuis demo) |
| `timing_6months` | Dans 6 mois | In 6 months | Commercial (depuis demo) |
| `budget_next_year` | Budget année prochaine | Budget next year | Commercial (depuis demo) |
| `internal_discussion` | Discussion interne | Internal discussion | Commercial (depuis demo) |
| `needs_more_time` | Demande plus de temps | Needs more time | Commercial (depuis proposal) |

---

## 4. LES 4 PHASES KANBAN V6.3

### 4.1 Vue Kanban

```
┌────────────────┬────────────────┬────────────────┬────────────────┐
│   INCOMPLET    │     DÉMO       │  PROPOSITION   │    TERMINÉ     │
│   (Phase 1)    │   (Phase 2)    │   (Phase 3)    │   (Phase 4)    │
├────────────────┼────────────────┼────────────────┼────────────────┤
│                │                │                │                │
│  ┌──────────┐  │  ┌──────────┐  │  ┌──────────┐  │  ┌──────────┐  │
│  │   new    │  │  │   demo   │  │  │ proposal │  │  │converted │  │
│  │  badge   │  │  │  badge   │  │  │   sent   │  │  │  ✓ vert  │  │
│  │  gris    │  │  │  bleu    │  │  │  orange  │  │  └──────────┘  │
│  └──────────┘  │  └──────────┘  │  └──────────┘  │                │
│                │                │                │  ┌──────────┐  │
│                │                │  ┌──────────┐  │  │   lost   │  │
│                │                │  │ payment  │  │  │  rouge   │  │
│                │                │  │ pending  │  │  └──────────┘  │
│                │                │  │  jaune   │  │                │
│                │                │  └──────────┘  │  ┌──────────┐  │
│                │                │                │  │nurturing │  │
│                │                │                │  │  violet  │  │
│                │                │                │  └──────────┘  │
│                │                │                │                │
│                │                │                │  ┌──────────┐  │
│                │                │                │  │disqualif.│  │
│                │                │                │  │  noir    │  │
│                │                │                │  └──────────┘  │
│                │                │                │                │
├────────────────┼────────────────┼────────────────┼────────────────┤
│  Wizard        │  Attente       │  Post-appel    │  Issue         │
│  pas fini      │  appel         │  OK            │  finale        │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

### 4.2 Configuration des phases

```json
{
  "phases": [
    {
      "key": "incomplete",
      "order": 1,
      "label_en": "Incomplete",
      "label_fr": "Incomplet",
      "label_ar": "غير مكتمل",
      "statuses": ["new"],
      "color": "#6B7280",
      "description_en": "Wizard not completed",
      "description_fr": "Wizard non terminé"
    },
    {
      "key": "demo",
      "order": 2,
      "label_en": "Demo",
      "label_fr": "Démo",
      "label_ar": "عرض توضيحي",
      "statuses": ["demo"],
      "color": "#3B82F6",
      "description_en": "Waiting for scheduled call",
      "description_fr": "Attente appel planifié"
    },
    {
      "key": "proposal",
      "order": 3,
      "label_en": "Proposal",
      "label_fr": "Proposition",
      "label_ar": "عرض",
      "statuses": ["proposal_sent", "payment_pending"],
      "color": "#F59E0B",
      "description_en": "Payment link sent, waiting",
      "description_fr": "Lien paiement envoyé, attente"
    },
    {
      "key": "completed",
      "order": 4,
      "label_en": "Completed",
      "label_fr": "Terminé",
      "label_ar": "مكتمل",
      "statuses": ["converted", "lost", "nurturing", "disqualified"],
      "color": "#10B981",
      "description_en": "Final outcome",
      "description_fr": "Issue finale"
    }
  ]
}
```

### 4.3 Couleurs des badges statut

| Statut            | Couleur | Hex       | Signification       |
| ----------------- | ------- | --------- | ------------------- |
| `new`             | Gris    | `#6B7280` | En attente action   |
| `demo`            | Bleu    | `#3B82F6` | Actif, RDV planifié |
| `proposal_sent`   | Orange  | `#F97316` | Proposition envoyée |
| `payment_pending` | Jaune   | `#EAB308` | Attente paiement    |
| `converted`       | Vert    | `#22C55E` | Succès ✓            |
| `lost`            | Rouge   | `#EF4444` | Perdu               |
| `nurturing`       | Violet  | `#8B5CF6` | À recontacter       |
| `disqualified`    | Noir    | `#1F2937` | Hors cible          |

---

## 5. SEGMENTATION BUSINESS

### 5.1 Les 4 segments

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  SEGMENT 1 : AUTO-ENTREPRENEUR (1 véhicule)                                 │
│  ═══════════════════════════════════════════                                │
│  Canal : Page /solopreneur + liens App Store / Google Play                  │
│  Modèle : App mobile FREEMIUM → 1 MOIS SATISFAIT/REMBOURSÉ                 │
│  CRM : NON APPLICABLE (Product Analytics)                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  SEGMENTS 2-4 : FLOTTES (2+ véhicules)                                      │
│  ══════════════════════════════════════                                     │
│  Canal : SaaS Web                                                           │
│  Modèle : WIZARD BOOKING → ONE-CALL CLOSE → SATISFAIT/REMBOURSÉ            │
│  CRM : APPLICABLE (8 statuts V6.3)                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Segments 2-4 : Flottes (2+ véhicules)

| Segment                 | Taille          | Processus                      | Escalade DG        |
| ----------------------- | --------------- | ------------------------------ | ------------------ |
| **Segment 2 - Starter** | 2-9 véhicules   | Wizard → 1 appel → Conversion  | Non                |
| **Segment 3 - Pro**     | 10-20 véhicules | Wizard → 1 appel → Conversion  | Non                |
| **Segment 4 - Premium** | 21+ véhicules   | Wizard → Appel → Quote si négo | Oui (paramétrable) |

**Note :** Les seuils sont paramétrables dans `crm_settings.segment_thresholds`.

---

## 6. UX/FRONTEND : WIZARD BOOKING

### 6.1 Principes UX

| Principe                  | Justification                 | Implementation                 |
| ------------------------- | ----------------------------- | ------------------------------ |
| **Progress bar visible**  | Le prospect sait où il en est | Indicateur "Step X of 3"       |
| **Engagement progressif** | Commitment escalation         | Email → Calendrier → Téléphone |
| **Calendrier étape 2**    | +86% conversion (Chili Piper) | Cal.com embed                  |
| **Téléphone en dernier**  | -48% si trop tôt (Formstack)  | Étape 3 obligatoire            |

### 6.2 Les 3 étapes du Wizard

| Étape | Champs                                        | Statut Lead | Action système                |
| ----- | --------------------------------------------- | ----------- | ----------------------------- |
| **1** | Email + Country + Fleet Size + GDPR           | `new`       | Crée le lead en DB            |
| **2** | Calendrier Cal.com (booking)                  | `demo`      | Webhook Cal.com → update lead |
| **3** | First/Last name + Company + Phone + Platforms | `demo`      | wizard_completed = TRUE       |

### 6.3 Page de confirmation post-wizard

Affiche :

- Date et heure du RDV
- Numéro de téléphone où on appellera
- Bouton "Add to Calendar"
- Liens Reschedule / Cancel

---

## 7. INTÉGRATION CAL.COM

### 7.1 Configuration

| Paramètre          | Valeur                |
| ------------------ | --------------------- |
| **Plan**           | Free ($0/mois)        |
| **Commerciaux**    | 1 au démarrage        |
| **Event Type**     | "FleetCore Demo Call" |
| **Duration**       | 30 minutes            |
| **Buffer before**  | 5 minutes             |
| **Buffer after**   | 10 minutes            |
| **Minimum notice** | 4 hours               |

### 7.2 Webhooks Cal.com

| Event                 | Endpoint                        | Action                                           |
| --------------------- | ------------------------------- | ------------------------------------------------ |
| `BOOKING_CREATED`     | `POST /api/crm/webhooks/calcom` | Lead → status = `demo`, store booking_calcom_uid |
| `BOOKING_RESCHEDULED` | `POST /api/crm/webhooks/calcom` | Update booking_slot_at, log activity             |
| `BOOKING_CANCELLED`   | `POST /api/crm/webhooks/calcom` | Lead → status = `lost` (reason: cancelled)       |

---

## 8. PROCESSUS APPEL COMMERCIAL (ONE-CALL CLOSE)

### 8.1 Philosophie

> **"L'appel n'est PAS un appel de qualification suivi d'une demo séparée.  
> C'est UN SEUL appel où on qualifie, on démontre, et on close."**

| Argument              | Explication                                      |
| --------------------- | ------------------------------------------------ |
| **Cycle court**       | Flottes VTC = décideur unique, pas de comité     |
| **Produit vertical**  | FleetCore résout un problème spécifique et clair |
| **Moins de friction** | 2 appels = 50% de perte entre chaque             |
| **Momentum**          | Prospect chaud = closing immédiat                |

### 8.2 Structure de l'appel (20-30 min)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    STRUCTURE APPEL COMMERCIAL                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1 : ICE-BREAKER (2 min)                                             │
│  ═══════════════════════════════                                           │
│  Objectif : Établir le rapport, confirmer le contexte                       │
│                                                                             │
│  Script :                                                                   │
│  "Bonjour [Prénom], c'est [Commercial] de FleetCore.                       │
│   Merci d'avoir pris le temps de programmer cet appel.                     │
│   Je vois que vous gérez une flotte de [X] véhicules à [Pays].             │
│   Avant de vous montrer FleetCore, j'aimerais comprendre                   │
│   ce qui vous a amené à demander une demo ?"                               │
│                                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 2 : QUALIFICATION CPT (5 min)                                       │
│  ═════════════════════════════════════                                     │
│  Objectif : Déterminer GO/NO-GO en 3 questions                             │
│                                                                             │
│  C - Challenges : "Quels sont vos plus gros défis actuellement ?"          │
│  P - Priority : "À quel point c'est urgent de résoudre ça ?"               │
│  T - Timing : "Quand souhaiteriez-vous avoir une solution en place ?"      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  DECISION POINT                                                     │   │
│  │                                                                     │   │
│  │  Qualifié (GO) → Continue vers Phase 3 (Demo)                      │   │
│  │  Non qualifié → Orienter vers nurturing ou clôturer poliment       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 3 : DEMO ROI-FOCUSED (15 min) [SI QUALIFIÉ]                         │
│  ══════════════════════════════════════════════════                        │
│  Objectif : Montrer comment FleetCore résout SES problèmes                 │
│                                                                             │
│  • PAS de tour des features exhaustif                                      │
│  • FOCUS sur les painpoints identifiés en phase 2                          │
│  • MONTRER le ROI, pas les fonctionnalités                                 │
│                                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 4 : CLOSING (5 min)                                                 │
│  ═══════════════════════════                                               │
│  Objectif : Fermer le deal MAINTENANT                                      │
│                                                                             │
│  Actions post-closing :                                                     │
│  • Si OUI → Envoyer lien Stripe, lead → proposal_sent                      │
│  • Si HÉSITATION → Identifier blocage, proposer nurturing                  │
│  • Si NON → Remercier, lead → lost (avec raison)                           │
│                                                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Actions post-appel (Commercial dans FleetCore Admin)

| Issue appel        | Action Commercial            | Nouveau statut  | Dropdown requis |
| ------------------ | ---------------------------- | --------------- | --------------- |
| **OK, on y va**    | Clic "Générer lien paiement" | `proposal_sent` | Non             |
| **Pas maintenant** | Clic "Nurturing"             | `nurturing`     | Oui (raison)    |
| **Non intéressé**  | Clic "Lost"                  | `lost`          | Oui (raison)    |
| **Hors cible**     | Clic "Disqualifier"          | `disqualified`  | Oui (raison)    |
| **No-show**        | Clic "Lost"                  | `lost`          | Auto: `no_show` |

---

## 9. FRAMEWORK QUALIFICATION CPT

### 9.1 Les 3 questions

| Dimension          | Question                                                           | Scores possibles         |
| ------------------ | ------------------------------------------------------------------ | ------------------------ |
| **C** - Challenges | "Quels sont vos plus gros défis avec la gestion de votre flotte ?" | high / medium / low      |
| **P** - Priority   | "À quel point c'est prioritaire de résoudre ces problèmes ?"       | high / medium / low      |
| **T** - Timing     | "Quand souhaiteriez-vous avoir une solution en place ?"            | hot / warm / cool / cold |

### 9.2 Grille de scoring

| C      | P      | T    | Score | Décision                             |
| ------ | ------ | ---- | ----- | ------------------------------------ |
| high   | high   | hot  | 100   | GO - Close immédiat                  |
| high   | high   | warm | 90    | GO - Close avec suivi                |
| high   | medium | hot  | 80    | GO - Demo approfondie                |
| medium | high   | hot  | 75    | GO - Demo approfondie                |
| high   | medium | warm | 70    | GO - Avec réserve                    |
| medium | medium | warm | 50    | MAYBE - Nurturing court              |
| low    | \*     | \*   | < 40  | NO-GO - Nurturing long ou disqualify |
| \*     | \*     | cold | < 30  | NO-GO - Nurturing                    |

### 9.3 Stockage en DB

```sql
-- Colonnes crm_leads pour CPT
cpt_challenges_response TEXT,      -- Réponse verbatim
cpt_challenges_score VARCHAR(10),  -- high/medium/low
cpt_priority_response TEXT,
cpt_priority_score VARCHAR(10),
cpt_timing_response TEXT,
cpt_timing_score VARCHAR(10),      -- hot/warm/cool/cold
cpt_total_score INTEGER,           -- Score calculé 0-100
cpt_qualified_at TIMESTAMPTZ,      -- Date qualification
cpt_qualified_by UUID              -- Commercial qui a qualifié
```

---

## 10. DISCOURS COMMERCIAL (STYLE GRIDWISE)

### 10.1 Principes

| Principe           | Mauvais exemple            | Bon exemple                                      |
| ------------------ | -------------------------- | ------------------------------------------------ |
| **GAIN, pas coût** | "Ça coûte 49€/mois"        | "Vous allez gagner 200€/mois minimum"            |
| **Prix = repas**   | "C'est le prix de 2 cafés" | "C'est le prix d'1 ou 2 repas"                   |
| **ROI immédiat**   | "C'est un investissement"  | "Dès le premier mois, vous voyez la différence"  |
| **Preuve sociale** | "Beaucoup de clients"      | "Des flottes comme la vôtre gagnent 20% de plus" |

### 10.2 Objection prix

> **JAMAIS de baisse de tarif. Le seul levier = mois gratuits.**

Script objection :

> "Je comprends que le prix soit un facteur. Voici ce que je vous propose :  
> Essayez FleetCore pendant 1 mois, satisfait ou remboursé.  
> Si vous ne voyez pas au moins 200€ d'économies ou de revenus supplémentaires,  
> vous ne payez rien. C'est vous qui avez le contrôle."

---

## 11. NOTIFICATIONS

### 11.1 Séquence relance wizard incomplet

Quand un lead crée son compte (étape 1) mais ne termine pas le wizard :

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SÉQUENCE RELANCE AUTOMATIQUE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Création lead (email étape 1)                                              │
│           │                                                                 │
│           ▼                                                                 │
│  J+1 : Email "Finalisez votre demande de démo"                             │
│        CTA: [Continuer mon inscription]                                     │
│           │                                                                 │
│           ▼ (si toujours new)                                               │
│  J+3 : Email "Votre démo vous attend"                                       │
│        CTA: [Reprendre où j'en étais]                                       │
│           │                                                                 │
│           ▼ (si toujours new)                                               │
│  J+7 : Email "Dernière chance"                                              │
│        CTA: [Finaliser maintenant]                                          │
│           │                                                                 │
│           ▼ (si toujours new après J+7)                                     │
│  Lead passe automatiquement en NURTURING                                    │
│  (raison: wizard_incomplete)                                                │
│  → Entre dans la newsletter                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Emails automatiques

| Email                   | Déclencheur                    | Template                       | Statut lead       |
| ----------------------- | ------------------------------ | ------------------------------ | ----------------- |
| `wizard_reminder_j1`    | CRON J+1 si wizard incomplet   | Relance douce                  | `new`             |
| `wizard_reminder_j3`    | CRON J+3 si toujours incomplet | Relance urgence                | `new`             |
| `wizard_final_reminder` | CRON J+7, dernière relance     | Dernière chance                | `new`             |
| `country_waitlist`      | Immédiat si pays non couvert   | Liste d'attente                | `new → nurturing` |
| `booking_confirmation`  | Webhook Cal.com                | Confirmation RDV               | `demo`            |
| `demo_reminder_j1`      | CRON 24h avant RDV             | Rappel avec Confirm/Reschedule | `demo`            |
| `payment_link`          | Commercial génère lien         | Lien Stripe                    | `proposal_sent`   |
| `welcome_client`        | Webhook Stripe                 | Bienvenue                      | `converted`       |
| `verification_24h`      | Post-conversion                | Formulaire vérification        | `converted`       |

### 11.3 Emails nurturing (newsletter)

**Fréquence :** Mensuelle (configurable dans crm_settings)

**Structure email nurturing :**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   [Logo FleetCore]                                                          │
│                                                                             │
│   Bonjour [Prénom],                                                         │
│                                                                             │
│   [Contenu newsletter : actualités, tips, success stories...]              │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────    │
│                                                                             │
│   Prêt à optimiser votre flotte ?                                          │
│                                                                             │
│   ┌───────────────────────┐       ┌───────────────────────┐                │
│   │   📅 Book a Demo      │       │   💬 Contact Sales    │                │
│   │   (Lien wizard)       │       │   (mailto:commercial) │                │
│   └───────────────────────┘       └───────────────────────┘                │
│                                                                             │
│   Ou répondez simplement à cet email.                                      │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────    │
│                                                                             │
│   [Lien désinscription]                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Boutons CTA :**

| Bouton            | URL                                                                | Action                                    |
| ----------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| **Book a Demo**   | `/book-demo?email={email}&source=nurturing`                        | Lead revient au wizard, complète → `demo` |
| **Contact Sales** | `mailto:sales@fleetcore.io?subject=FleetCore%20-%20{company_name}` | Email direct au commercial                |

**Lien désinscription :**

- URL : `/unsubscribe?token={unsubscribe_token}`
- Action : Lead passe en `lost` (raison: `unsubscribed`)

### 11.4 Email J-1 (Anti No-Show)

**Contenu :**

- Rappel date/heure/timezone
- Numéro de téléphone où on appellera
- 2 boutons CTA :
  - ✅ "I'll be there" → Confirme attendance, log activity
  - 📅 "Need to reschedule" → Page reschedule Cal.com

---

## 12. FLUX LEAD-TO-CLIENT (STRIPE PAYMENT FLOW)

### 12.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUX COMPLET V6.3                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. WIZARD PUBLIC                                                           │
│     ├─ Étape 1: Email → Lead créé (status = new)                           │
│     ├─ Étape 2: Cal.com → Booking créé (status = demo)                     │
│     └─ Étape 3: Infos → wizard_completed = TRUE                            │
│                                                                             │
│  2. EMAIL J-1                                                               │
│     └─ CRON envoie rappel avec boutons Confirm/Reschedule                  │
│                                                                             │
│  3. APPEL COMMERCIAL (One-Call Close)                                       │
│     ├─ Qualification CPT (5 min)                                           │
│     ├─ Demo ROI-focused (15 min)                                           │
│     └─ Closing (5 min)                                                     │
│                                                                             │
│  4. POST-APPEL (si OK)                                                      │
│     ├─ Commercial clique "Générer lien paiement"                           │
│     ├─ API crée Stripe Checkout Session                                    │
│     ├─ Lead → status = proposal_sent                                       │
│     └─ Email envoyé au lead avec lien Stripe                               │
│                                                                             │
│  5. PAIEMENT CLIENT                                                         │
│     ├─ Client clique lien → Stripe Checkout                                │
│     ├─ Entre CB (même si 0€ avec coupon 1er mois gratuit)                  │
│     └─ Lead → status = payment_pending                                     │
│                                                                             │
│  6. WEBHOOK STRIPE (checkout.session.completed)                             │
│     ├─ Créer adm_tenants (status = pending_verification)                   │
│     ├─ Créer clt_masterdata                                                │
│     ├─ Créer organisation Clerk                                            │
│     ├─ Lead → status = converted                                           │
│     └─ Envoyer email vérification 24h                                      │
│                                                                             │
│  7. VÉRIFICATION CLIENT (24h)                                               │
│     ├─ Client remplit formulaire (données société, admin désigné)          │
│     ├─ CGI/CGU acceptées                                                   │
│     ├─ Invitation Clerk envoyée à l'admin                                  │
│     └─ Tenant → status = active                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 API Génération Payment Link

**Endpoint :** `POST /api/v1/bil/payment-links`

**Prérequis :** Lead avec status IN (`demo`, `proposal_sent`)

**Body :**

```json
{
  "lead_id": "uuid",
  "plan_code": "starter|pro|premium",
  "billing_cycle": "monthly|yearly"
}
```

**Actions :**

1. Vérifier status autorisé
2. Déterminer segment via fleet_size
3. Créer Stripe Checkout Session avec coupon FIRST_MONTH_FREE
4. Update lead: status = `proposal_sent`, stripe\_\* colonnes
5. Retourner payment_url

### 12.3 Webhook Stripe

**Event :** `checkout.session.completed`

**Transaction atomique :**

1. Créer `adm_tenants` (status = pending_verification)
2. Créer `clt_masterdata` (copie données lead)
3. Créer organisation Clerk
4. Update lead: status = `converted`, tenant_id, converted_at
5. Envoyer email vérification 24h

---

## 13. QUOTE MANAGEMENT (SEGMENT 4)

### 13.1 Quand utiliser les Quotes

| Segment     | Fleet Size | Quote requis ?         |
| ----------- | ---------- | ---------------------- |
| 2 - Starter | 2-9        | Non - Prix fixe        |
| 3 - Pro     | 10-20      | Non - Prix fixe        |
| 4 - Premium | 21+        | **Oui si négociation** |

### 13.2 Quote inline dans Lead Detail

Pour les leads Segment 4, la section Quote apparaît dans la fiche lead (pas de module séparé).

**Actions disponibles :**

- Créer un devis
- Modifier (si draft)
- Envoyer
- Voir historique

---

## 14. MODULE CLT - CLIENT

Après conversion, les données passent dans le module CLT :

| Table               | Description               |
| ------------------- | ------------------------- |
| `clt_masterdata`    | Données entreprise client |
| `clt_members`       | Utilisateurs du client    |
| `clt_invoices`      | Factures                  |
| `clt_subscriptions` | Abonnements actifs        |

---

## 15. MODULE ADM - TENANT

| Table         | Description                                                               |
| ------------- | ------------------------------------------------------------------------- |
| `adm_tenants` | Configuration technique tenant                                            |
| Colonnes clés | clerk_organization_id, stripe_customer_id, stripe_subscription_id, status |

---

## 16. OPPORTUNITY PIPELINE (FREEZE)

**FREEZE pour MVP.**

Le module Opportunity sera utilisé plus tard pour :

- Upsell modules/addons aux clients existants
- Cross-sell services

Pour le moment, tout passe par les Leads directement.

---

## 17. RÈGLES COMMERCIALES

### 17.1 Tarification

| Règle                         | Description                                      |
| ----------------------------- | ------------------------------------------------ |
| **❌ JAMAIS de baisse tarif** | Le tarif unitaire ne peut JAMAIS être réduit     |
| **✅ Mois gratuits**          | Levier de négociation = mois gratuits uniquement |

### 17.2 Leviers commerciaux autorisés

| Levier                      | Qui peut l'offrir             |
| --------------------------- | ----------------------------- |
| 1er mois gratuit (standard) | Automatique via coupon Stripe |
| +1 mois gratuit (négo)      | Commercial (si lead hésite)   |

---

## 18. MODIFICATIONS SCHEMA V6.3

### 18.1 Migration crm_leads

```sql
-- =============================================================================
-- FLEETCORE CRM V6.3 - MIGRATION LEADS (8 STATUTS)
-- Date: 2026-01-10
-- Description: Correction statuts pour one-call close
-- =============================================================================

BEGIN;

-- 1. Migrer les anciens statuts vers les nouveaux
UPDATE crm_leads SET status = 'demo' WHERE status = 'demo_scheduled';
UPDATE crm_leads SET status = 'proposal_sent' WHERE status = 'qualified';
UPDATE crm_leads SET status = 'proposal_sent' WHERE status = 'demo_completed';

-- 2. Supprimer ancienne contrainte
ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_status_check;

-- 3. Nouvelle contrainte avec 8 statuts V6.3
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_status_check
CHECK (status IN (
  'new',
  'demo',
  'proposal_sent',
  'payment_pending',
  'converted',
  'lost',
  'nurturing',
  'disqualified'
));

COMMENT ON CONSTRAINT crm_leads_status_check ON crm_leads IS 'V6.3: 8 statuts one-call close';

COMMIT;
```

### 18.2 Colonnes CPT (si pas encore présentes)

```sql
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS cpt_challenges_response TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS cpt_challenges_score VARCHAR(10);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS cpt_priority_response TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS cpt_priority_score VARCHAR(10);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS cpt_timing_response TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS cpt_timing_score VARCHAR(10);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS cpt_total_score INTEGER;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS cpt_qualified_at TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS cpt_qualified_by UUID;

COMMENT ON COLUMN crm_leads.cpt_challenges_score IS 'V6.3: high/medium/low';
COMMENT ON COLUMN crm_leads.cpt_timing_score IS 'V6.3: hot/warm/cool/cold';
```

---

## 19. CONFIGURATION CRM_SETTINGS V6.3

### 19.1 lead_status_workflow (8 statuts)

```json
{
  "version": "6.3.0",
  "statuses": [
    {
      "value": "new",
      "phase": "incomplete",
      "label_en": "New",
      "label_fr": "Nouveau",
      "label_ar": "جديد",
      "color": "#6B7280",
      "probability": 5,
      "is_terminal": false,
      "allowed_transitions": ["demo", "nurturing", "disqualified"]
    },
    {
      "value": "demo",
      "phase": "demo",
      "label_en": "Demo",
      "label_fr": "Démo",
      "label_ar": "عرض توضيحي",
      "color": "#3B82F6",
      "probability": 50,
      "is_terminal": false,
      "allowed_transitions": [
        "proposal_sent",
        "nurturing",
        "lost",
        "disqualified"
      ]
    },
    {
      "value": "proposal_sent",
      "phase": "proposal",
      "label_en": "Proposal Sent",
      "label_fr": "Proposition envoyée",
      "label_ar": "تم إرسال العرض",
      "color": "#F97316",
      "probability": 85,
      "is_terminal": false,
      "allowed_transitions": ["payment_pending", "lost", "nurturing"]
    },
    {
      "value": "payment_pending",
      "phase": "proposal",
      "label_en": "Payment Pending",
      "label_fr": "Paiement en attente",
      "label_ar": "في انتظار الدفع",
      "color": "#EAB308",
      "probability": 90,
      "is_terminal": false,
      "allowed_transitions": ["converted", "lost"]
    },
    {
      "value": "converted",
      "phase": "completed",
      "label_en": "Converted",
      "label_fr": "Converti",
      "label_ar": "تم التحويل",
      "color": "#22C55E",
      "probability": 100,
      "is_terminal": true,
      "allowed_transitions": []
    },
    {
      "value": "lost",
      "phase": "completed",
      "label_en": "Lost",
      "label_fr": "Perdu",
      "label_ar": "خسر",
      "color": "#EF4444",
      "probability": 0,
      "is_terminal": false,
      "requires_reason": true,
      "allowed_transitions": ["nurturing"]
    },
    {
      "value": "nurturing",
      "phase": "completed",
      "label_en": "Nurturing",
      "label_fr": "En nurturing",
      "label_ar": "رعاية",
      "color": "#8B5CF6",
      "probability": 15,
      "is_terminal": false,
      "requires_reason": true,
      "allowed_transitions": ["demo", "proposal_sent", "lost"],
      "transition_rules": {
        "demo": "lead_action_only",
        "proposal_sent": "lead_contact_sales"
      }
    },
    {
      "value": "disqualified",
      "phase": "completed",
      "label_en": "Disqualified",
      "label_fr": "Disqualifié",
      "label_ar": "غير مؤهل",
      "color": "#1F2937",
      "probability": 0,
      "is_terminal": true,
      "requires_reason": true,
      "allowed_transitions": []
    }
  ]
}
```

### 19.2 wizard_reminder_sequence

```json
{
  "version": "6.3.0",
  "enabled": true,
  "reminders": [
    {
      "delay_days": 1,
      "template": "wizard_reminder_j1",
      "subject_en": "Complete your demo request",
      "subject_fr": "Finalisez votre demande de démo"
    },
    {
      "delay_days": 3,
      "template": "wizard_reminder_j3",
      "subject_en": "Your demo is waiting",
      "subject_fr": "Votre démo vous attend"
    },
    {
      "delay_days": 7,
      "template": "wizard_final_reminder",
      "subject_en": "Last chance to book your demo",
      "subject_fr": "Dernière chance pour réserver votre démo"
    }
  ],
  "auto_nurturing_after_days": 7,
  "auto_nurturing_reason": "wizard_incomplete"
}
```

### 19.3 nurturing_email_settings

```json
{
  "version": "6.3.0",
  "newsletter": {
    "enabled": true,
    "frequency": "monthly",
    "day_of_month": 15,
    "template": "nurturing_newsletter"
  },
  "cta_buttons": {
    "book_demo": {
      "label_en": "Book a Demo",
      "label_fr": "Réserver une démo",
      "url_template": "/book-demo?email={email}&source=nurturing"
    },
    "contact_sales": {
      "label_en": "Contact Sales",
      "label_fr": "Contacter un commercial",
      "url_template": "mailto:sales@fleetcore.io?subject=FleetCore%20-%20{company_name}"
    }
  },
  "unsubscribe": {
    "url_template": "/unsubscribe?token={unsubscribe_token}",
    "auto_lost_reason": "unsubscribed"
  }
}
```

### 19.4 lead_phases (4 phases)

```json
{
  "version": "6.3.0",
  "phases": [
    {
      "key": "incomplete",
      "order": 1,
      "label_en": "Incomplete",
      "label_fr": "Incomplet",
      "label_ar": "غير مكتمل",
      "statuses": ["new"],
      "color": "#6B7280"
    },
    {
      "key": "demo",
      "order": 2,
      "label_en": "Demo",
      "label_fr": "Démo",
      "label_ar": "عرض توضيحي",
      "statuses": ["demo"],
      "color": "#3B82F6"
    },
    {
      "key": "proposal",
      "order": 3,
      "label_en": "Proposal",
      "label_fr": "Proposition",
      "label_ar": "عرض",
      "statuses": ["proposal_sent", "payment_pending"],
      "color": "#F59E0B"
    },
    {
      "key": "completed",
      "order": 4,
      "label_en": "Completed",
      "label_fr": "Terminé",
      "label_ar": "مكتمل",
      "statuses": ["converted", "lost", "nurturing", "disqualified"],
      "color": "#10B981"
    }
  ]
}
```

---

## 20. CONFIGURATION BIL_SETTINGS V6.3

Identique à V6.2.1 - pas de changement.

```json
{
  "version": "6.3.0",
  "payment_link": {
    "allowed_statuses": ["demo", "proposal_sent"],
    "expiry_hours": 24,
    "reminder_hours": 12
  },
  "first_month_free": {
    "enabled": true,
    "coupon_id": "FIRST_MONTH_FREE"
  },
  "checkout": {
    "success_path": "/payment-success",
    "cancel_path": "/payment-cancelled"
  }
}
```

---

## 21. PAGES ET ROUTES

### 21.1 Pages publiques

| Route                     | Description                 |
| ------------------------- | --------------------------- |
| `/book-demo`              | Wizard étape 1 (email)      |
| `/book-demo/verify`       | Vérification email          |
| `/book-demo/step-2`       | Cal.com embed               |
| `/book-demo/step-3`       | Infos + téléphone           |
| `/book-demo/confirmation` | Confirmation post-booking   |
| `/book-demo/confirmed`    | Après clic "I'll be there"  |
| `/book-demo/reschedule`   | Reprogrammer RDV            |
| `/book-demo/coming-soon`  | Pays non couvert            |
| `/solopreneur`            | Segment 1                   |
| `/payment-success`        | Succès paiement Stripe      |
| `/payment-cancelled`      | Annulation paiement         |
| `/verify`                 | Formulaire vérification 24h |

### 21.2 Pages admin CRM

| Route                   | Description              |
| ----------------------- | ------------------------ |
| `/admin/crm/leads`      | Pipeline Kanban 4 phases |
| `/admin/crm/leads/[id]` | Fiche lead détaillée     |

---

## 22. MÉTRIQUES ET KPIS

| Métrique               | Formule                            |
| ---------------------- | ---------------------------------- |
| Taux conversion Wizard | demo / new                         |
| Taux qualification     | proposal_sent / demo               |
| Taux closing           | converted / proposal_sent          |
| Taux no-show           | (demo avec no_show) / demo         |
| Cycle moyen            | Moyenne(converted_at - created_at) |

---

## 23. PLAN D'EXÉCUTION

### 23.1 Phases restantes

| Phase      | Description                       | Statut     |
| ---------- | --------------------------------- | ---------- |
| V6.2-9     | Wizard Book Demo (8 pages)        | ✅ FAIT    |
| V6.2-9     | Email J-1 Anti No-Show            | ✅ FAIT    |
| **V6.3-1** | **Migration 10→8 statuts**        | ⏳ À FAIRE |
| **V6.3-2** | **Frontend Admin CRM (4 phases)** | ⏳ À FAIRE |
| V6.2-9B    | Payment pages (success/cancelled) | ⏳ À FAIRE |
| V6.2-12    | Tests E2E                         | ⏳ À FAIRE |

---

## 24. RÈGLES DE GESTION VERROUILLÉES

> **Ces décisions sont FINALES et ne doivent PAS être remises en question :**
>
> 1. **8 statuts Lead** (new, demo, proposal_sent, payment_pending, converted, lost, nurturing, disqualified)
> 2. **4 phases Kanban** (Incomplet, Démo, Proposition, Terminé)
> 3. **One-call close** (qual + demo + closing = MÊME appel)
> 4. **Wizard 3 étapes** (Email → Cal.com → Infos + Téléphone)
> 5. **Cal.com Free** (1 commercial, distribution interne manuelle)
> 6. **Téléphone OBLIGATOIRE** en étape 3
> 7. **Commercial appelle à l'heure exacte** (pas "sous 24h")
> 8. **Framework CPT** (3 questions : Challenges, Priority, Timing)
> 9. **Pas de question budget** (affirmation ROI en closing)
> 10. **Email J-1 avec Confirm/Reschedule**
> 11. **JAMAIS de baisse de tarif** (levier = mois gratuits)
> 12. **Conversion = Webhook Stripe** (automatique)
> 13. **1er mois gratuit via coupon** (PAS trial_period_days)
> 14. **Quote = Segment 4 only** (inline dans lead detail)
> 15. **Opportunity = FREEZE** (futur upsell)
> 16. **ZERO HARDCODING** - Tout depuis settings DB
> 17. **Séquence relance wizard** - J+1, J+3, J+7 puis nurturing auto
> 18. **nurturing → demo = LEAD ACTION** - Le commercial ne peut pas forcer cette transition
> 19. **Emails nurturing = 2 CTA** - Book Demo + Contact Sales (mailto)

---

## CHECKLIST VALIDATION V6.3

### Schema

```
☐ crm_leads CHECK status = 8 valeurs V6.3
☐ Anciens statuts migrés (demo_scheduled→demo, qualified→proposal_sent)
☐ Colonnes CPT présentes
```

### Configuration

```
☐ crm_settings.lead_status_workflow = 8 statuts V6.3
☐ crm_settings.lead_phases = 4 phases V6.3
```

### Frontend Admin

```
☐ Kanban 4 phases (Incomplet, Démo, Proposition, Terminé)
☐ 8 badges de statut avec bonnes couleurs
☐ Section CPT dans fiche lead
☐ Bouton "Générer lien paiement"
☐ Dropdowns raison pour lost/nurturing/disqualified
```

---

**FIN DE LA SPÉCIFICATION V6.3 FINALE**

_Version 6.3.0 - One-Call Close + 8 Statuts + 4 Phases_
_Correction des incohérences de V6.2.1_
