# ⚠️ CRITICAL LESSONS LEARNED - FLEETCORE

## NEVER USE REGEX TO PARSE OR MODIFY TYPESCRIPT/JAVASCRIPT CODE

**Date**: November 22, 2025
**Severity**: CRITICAL
**Impact**: Complete data corruption of all English email templates in database

### What Happened

An automated script (`update-seed-templates.ts`) attempted to use regular expressions to update email templates in `prisma/seed.ts`. The regex pattern was:

```typescript
const regex = new RegExp(
  `(template_code: "${templateCode}",[\\s\\S]*?body_translations: \\{\\s*en: \`)([^\`]*?)(\`,)`,
  "m"
);
```

**THE PROBLEM**: The pattern `([^\`]\*?)` matches "any character except backtick". This stopped at the FIRST backtick it encountered - which was INSIDE the HTML template content (in JavaScript code, attributes, etc.), NOT the closing backtick of the template string.

**THE RESULT**: All English templates were replaced with EMPTY or TRUNCATED strings. Users would have received emails with hardcoded test data ("Bonjour Jean", "Paris VTC Services") instead of their actual information.

### Why This Is WRONG

1. **Regex cannot parse nested structures** - Template literals in TypeScript can contain backticks in strings, comments, or nested templates
2. **Regex cannot understand context** - It doesn't know the difference between a backtick in HTML vs the closing delimiter
3. **Silent failures** - The regex matched SOMETHING, so no error was thrown, but the wrong thing was matched
4. **Data corruption** - Once written to the database, corrupted templates affected all users

### The CORRECT Approach

**MANUAL EDITING ONLY** for code modifications. When templates need updating:

1. ✅ **Generate templates from React Email** components (the source of truth)
2. ✅ **Manually copy/paste** the generated HTML into seed.ts using a text editor
3. ✅ **OR** Use AST parsers like Babel if automation is absolutely necessary
4. ✅ **NEVER** use regex for anything beyond simple find/replace of literal strings

### Script That Caused The Issue

File: `/scripts/update-seed-templates.ts` (now deprecated - DO NOT USE)

**BANNED PATTERN**:

```typescript
// ❌ NEVER DO THIS
seedContent = seedContent.replace(regex, (match, before, oldHtml, after) => {
  return `${before}${newHtml}${after}`;
});
```

### Recovery Process

1. Identified corruption through user report of wrong email data
2. Attempted backup restoration (failed due to schema mismatches)
3. Regenerated templates from React Email components (source of truth)
4. Created `/scripts/manual-update-seed-templates.ts` with careful string replacement using unique markers
5. Manually fixed syntax errors (missing commas)
6. Reseeded database successfully

### Prevention Measures

1. **CODE REVIEW REQUIRED** for any script that modifies seed.ts or any TypeScript files
2. **NEVER AUTOMATE** code modifications with regex
3. **ALWAYS** keep React Email components as source of truth
4. **VERIFY** template changes in development before deploying
5. **BACKUP** database before running seed updates

---

**REMEMBER**: Regular expressions are for matching PATTERNS in TEXT, NOT for parsing CODE STRUCTURE. Use proper parsers (AST) or manual editing.
