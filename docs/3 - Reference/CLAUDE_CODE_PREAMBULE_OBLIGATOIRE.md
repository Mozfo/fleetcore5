# PRÉAMBULE OBLIGATOIRE — À INCLURE DANS CHAQUE PROMPT CLAUDE CODE

## RÈGLE #0 — TU NE CODES RIEN AVANT D'AVOIR LU L'EXISTANT

Avant d'écrire la MOINDRE ligne de code, tu DOIS exécuter ce protocole dans l'ordre :

### PHASE A — IDENTIFICATION DU PATTERN DE RÉFÉRENCE

1. **Identifie la feature la plus similaire à ce qu'on te demande.**
   - Si on te demande une page admin → regarde les pages admin existantes (Members, Tenants, Invitations)
   - Si on te demande une API route → regarde les API routes existantes du même module
   - Si on te demande un hook → regarde les hooks existants du même type
   - Si on te demande un service → regarde les services existants
   - Si on te demande une table SQL → regarde les tables similaires existantes

2. **Ouvre et lis CHAQUE fichier de la feature de référence.**
   - Liste tous les fichiers (hook, columns, types, API route, composant page, formulaire)
   - Note le pattern exact : nommage, structure, imports, conventions

3. **Présente ta trouvaille AVANT de coder :**
   ```
   PATTERN DE RÉFÉRENCE IDENTIFIÉ :
   - Feature de référence : [ex: Members]
   - Fichiers analysés : [liste complète]
   - Pattern hook : [description]
   - Pattern colonnes : [description]
   - Pattern API : [description]
   - Pattern formulaire : [description]
   - Pattern messages/toasts : [description — i18n ou hardcodé ?]
   ```

### PHASE B — RÈGLES DE COHÉRENCE

1. **MÊME pattern** — Tu utilises EXACTEMENT le même pattern que la feature de référence. Pas "inspiré de", pas "similaire à" — IDENTIQUE.
2. **MÊME structure de fichiers** — Même dossiers, même nommage de fichiers.
3. **MÊME composants** — Même DataTable, même hooks, même UI components.
4. **MÊME conventions de messages** — Si l'existant est en hardcodé EN, tu fais pareil. Si c'est en i18n, tu fais pareil. JAMAIS de mélange.
5. **MÊME gestion d'erreurs** — Même format de messages d'erreur, même HTTP status codes, même structure de réponse.
6. **MÊME colonnes standard** — Si les autres tables ont select, expand, audit columns → tu les as aussi.

### PHASE C — INTERDICTIONS ABSOLUES

1. ❌ **JAMAIS coder from scratch** quand un pattern existe
2. ❌ **JAMAIS inventer un nouveau pattern** sans validation CEO
3. ❌ **JAMAIS utiliser un style différent** des pages existantes
4. ❌ **JAMAIS hardcoder des UUIDs**
5. ❌ **JAMAIS prendre des décisions métier** — si c'est ambigu, DEMANDE
6. ❌ **JAMAIS supprimer des données** sans vérifier les dépendances (FK, members, etc.)
7. ❌ **JAMAIS faire de hard delete** — toujours soft delete (deleted_at)
8. ❌ **JAMAIS écrire un message utilisateur générique** ("Failed", "Error occurred") — le message doit expliquer POURQUOI et QUOI FAIRE
9. ❌ **JAMAIS ignorer le singulier/pluriel** dans les messages
10. ❌ **JAMAIS exécuter de SQL** sans présenter le script au CEO d'abord

### PHASE D — MESSAGES UTILISATEUR

Chaque message affiché à l'utilisateur (toast, erreur, confirmation) doit :

1. **Expliquer ce qui s'est passé** (pas juste "Error")
2. **Dire quoi faire** si c'est une erreur bloquante
3. **Inclure le contexte** (nombre d'éléments, nom de l'entité)
4. **Respecter singulier/pluriel**
5. **Suivre le même format que les messages existants** dans le codebase

### PHASE D-BIS — LISIBILITÉ UX DES FORMULAIRES

**Se mettre TOUJOURS à la place d'un utilisateur qui voit l'écran pour la première fois.**

1. **Chaque champ de formulaire** doit avoir un label explicite (pas technique).
2. **Chaque select/radio/dropdown qui propose un choix** : si le label de l'option ne suffit pas à comprendre ce qu'elle fait, ajouter une description contextuelle sous chaque option.
3. **Chaque concept non évident** : ajouter une infobulle (icône ? + tooltip) qui explique à quoi sert le champ.
4. **Chaque page** doit être compréhensible sans formation. Si tu dois expliquer à quelqu'un ce que fait la page, c'est que les labels ne sont pas assez clairs.
5. **Test mental obligatoire** : "Si un nouveau manager ouvre cette page demain, comprend-il immédiatement quoi faire et pourquoi ?" Si non → améliorer les labels et ajouter des descriptions.

### PHASE E — VALIDATION AVANT PUSH

Avant de push, vérifie :

- [ ] J'ai identifié et suivi un pattern de référence existant
- [ ] Aucun fichier ne diverge du pattern de référence
- [ ] Tous les messages utilisateur sont explicites et utiles
- [ ] Aucun UUID hardcodé
- [ ] Aucune décision métier prise sans validation
- [ ] Soft delete utilisé (jamais hard delete)
- [ ] Les protections de suppression vérifient les dépendances
- [ ] TypeScript compile sans erreur

---

## PROTOCOLE PRISMA — RAPPEL PERMANENT

- SQL manuel dans Supabase → mise à jour manuelle du schema Prisma → `pnpm prisma generate`
- **JAMAIS** `prisma db push`, `prisma db pull`, `prisma migrate`

## PROTOCOLE GIT — RAPPEL PERMANENT

- Tag + backup avant modification majeure
- Commit atomique par fonctionnalité (pas de méga-commit)
- Message de commit descriptif en anglais

---

_Ce préambule est NON NÉGOCIABLE. Si tu ne peux pas identifier un pattern de référence, DEMANDE avant de coder._
