# FleetCore v5 - Documentation Index

> **Version:** 5.0
> **Last Updated:** December 2025
> **Status:** Production Ready
> **Quality Score:** 8.5/10

---

## Purpose

This documentation serves as the comprehensive technical and business reference for FleetCore v5. It is designed for three primary audiences: external support teams requiring operational knowledge, new developers joining the project, and technical auditors conducting due diligence assessments.

---

## Document Structure

### 01_OVERVIEW/

| Document                                                         | Description                                                  | Audience             |
| ---------------------------------------------------------------- | ------------------------------------------------------------ | -------------------- |
| [01_executive_summary.md](./01_OVERVIEW/01_executive_summary.md) | High-level platform overview, value proposition, key metrics | All                  |
| [02_business_context.md](./01_OVERVIEW/02_business_context.md)   | Market analysis, competitive landscape, growth strategy      | Auditors, Management |
| [03_glossary.md](./01_OVERVIEW/03_glossary.md)                   | Technical and business terminology definitions               | All                  |

### 02_ARCHITECTURE/

| Document   | Description                          | Audience             |
| ---------- | ------------------------------------ | -------------------- |
| DECISIONS/ | Architecture Decision Records (ADRs) | Developers, Auditors |

### 03_MODULES/

| Module   | Description                                   | Status         |
| -------- | --------------------------------------------- | -------------- |
| CRM/     | Lead management, scoring, pipeline automation | Production     |
| BILLING/ | Quote-to-Cash, invoicing, payments            | In Development |
| FLEET/   | Vehicle management, maintenance tracking      | Production     |
| ADMIN/   | Multi-tenant administration, audit logging    | Production     |

### 04_TECHNICAL/

| Section       | Description                                    | Audience   |
| ------------- | ---------------------------------------------- | ---------- |
| DATABASE/     | Schema documentation, migrations, RLS policies | Developers |
| API/          | REST endpoints, authentication, rate limiting  | Developers |
| INTEGRATIONS/ | Third-party services (Clerk, Resend, Supabase) | Developers |

### 05_OPERATIONS/

| Section     | Description                                  | Audience        |
| ----------- | -------------------------------------------- | --------------- |
| DEPLOYMENT/ | Vercel deployment, environment configuration | DevOps          |
| MONITORING/ | Sentry integration, logging, alerts          | Support, DevOps |
| RUNBOOKS/   | Incident response procedures                 | Support         |

### 06_SECURITY/

| Document                                               | Description          | Audience |
| ------------------------------------------------------ | -------------------- | -------- |
| Security policies, RLS implementation, data protection | Auditors, Developers |

---

## Quick Reference

### Technology Stack

- **Framework:** Next.js 15.5.x with App Router
- **Runtime:** React 19.1.x
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma 6.x
- **Authentication:** Clerk Organizations
- **Email:** Resend + React Email
- **Deployment:** Vercel

### Key Metrics

- **Test Coverage:** 530+ tests passing
- **API Routes:** 58 documented endpoints
- **Database Tables:** 40+ with RLS protection
- **Supported Locales:** English, French

### Contact

- **Repository:** github.com/Mozfo/fleetcore5
- **Support:** support@fleetcore.io

---

## Navigation Guide

For a quick start, read the documents in this order:

1. **01_executive_summary.md** - Understand what FleetCore does
2. **02_business_context.md** - Understand the market opportunity
3. **03_glossary.md** - Reference for technical terms
4. Then explore module-specific documentation based on your needs

---

_This documentation is auto-generated and manually curated. Last audit: December 2025._
