# ADR-007: Lead Scoring Algorithm

> **Status:** Accepted
> **Date:** October 2025
> **Decision Makers:** Engineering Team, Sales Leadership

---

## Context

FleetCore's CRM manages leads from demo requests through to contract signature. Sales representatives needed a way to prioritize leads based on likelihood to convert and potential value. Manual prioritization was inconsistent and didn't scale with lead volume.

The team needed a scoring algorithm that:

1. Provides objective, consistent lead ranking
2. Adapts to different markets (UAE vs France)
3. Can be tuned without code changes
4. Supports automatic stage transitions

---

## Decision

**We will implement a two-component scoring algorithm combining Fit Score (lead characteristics) and Engagement Score (lead behavior), with configurable thresholds for stage transitions.**

### Formula

```
Qualification Score = (Fit Score × 0.6) + (Engagement Score × 0.4)

Where:
- Fit Score: 0-60 points based on lead characteristics
- Engagement Score: 0-100 points based on lead behavior
- Qualification Score: 0-100 points total
```

### Stage Thresholds (Configurable)

| Stage                     | Threshold | Meaning                          |
| ------------------------- | --------- | -------------------------------- |
| SQL (Sales Qualified)     | ≥ 70      | Ready for sales engagement       |
| MQL (Marketing Qualified) | ≥ 40      | Warrants nurturing               |
| TOF (Top of Funnel)       | < 40      | Early stage, needs qualification |

---

## Consequences

### Positive

- **Objective Prioritization:** Sales reps focus on highest-scoring leads first
- **Market Adaptability:** Thresholds adjustable per FleetCore division via `crm_settings`
- **Automation:** Leads auto-promote when crossing thresholds
- **Transparency:** Score breakdown visible to sales reps for context

### Negative

- **Oversimplification:** Numeric score cannot capture all lead nuances
- **Gaming Risk:** If scoring factors become known, leads could be artificially inflated
- **Maintenance Burden:** Score factors need periodic review against conversion data
- **Complexity:** Sales reps must understand what factors influence score

### Mitigations

- **Score Explanation:** UI shows score breakdown, not just total
- **Override Capability:** Sales reps can manually adjust stage if score misleads
- **Regular Review:** Quarterly analysis of score vs actual conversion
- **Factor Documentation:** Clear documentation of what influences each component

---

## Implementation

### Fit Score Components (0-60 points)

```typescript
// lib/services/crm/lead-scoring.service.ts

function calculateFitScore(lead: crm_leads, config: ScoringConfig): number {
  let score = 0;
  const weights = config.fitScore;

  // Fleet Size (0-24 points)
  // Larger fleets = higher value customers
  if (lead.fleet_size) {
    if (lead.fleet_size >= 100) score += 24;
    else if (lead.fleet_size >= 50) score += 18;
    else if (lead.fleet_size >= 20) score += 12;
    else if (lead.fleet_size >= 10) score += 6;
  }

  // Market Tier (0-18 points)
  // Based on country's market potential
  const marketTier = getMarketTier(lead.country_code);
  score += marketTier * 6; // Tier 1=18, Tier 2=12, Tier 3=6

  // Budget Indication (0-18 points)
  // Explicit budget range from demo form
  if (lead.budget_range) {
    if (lead.budget_range === "enterprise") score += 18;
    else if (lead.budget_range === "growth") score += 12;
    else if (lead.budget_range === "starter") score += 6;
  }

  return Math.min(score, weights.maxScore);
}
```

### Engagement Score Components (0-100 points)

```typescript
function calculateEngagementScore(
  lead: crm_leads,
  activities: crm_activities[],
  config: ScoringConfig
): number {
  let score = 0;
  const weights = config.engagementScore;

  // Demo Request Completed (0-50 points)
  if (lead.source === "demo_request") score += 50;

  // Email Engagement (0-20 points)
  const emailOpens = activities.filter((a) => a.type === "email_opened").length;
  score += Math.min(emailOpens * 5, 20);

  // Response Time (0-30 points)
  // How quickly lead responded to outreach
  const firstResponse = activities.find((a) => a.type === "lead_replied");
  if (firstResponse) {
    const hoursToRespond = calculateHoursToRespond(lead, firstResponse);
    if (hoursToRespond < 24) score += 30;
    else if (hoursToRespond < 72) score += 20;
    else if (hoursToRespond < 168) score += 10;
  }

  return Math.min(score, weights.maxScore);
}
```

### Automatic Stage Transitions

```typescript
async recalculateAndTransition(leadId: string): Promise<void> {
  const lead = await this.leadRepo.findById(leadId);
  const activities = await this.activityRepo.findByLeadId(leadId);
  const config = await this.getScoringConfig();

  const fitScore = this.calculateFitScore(lead, config);
  const engagementScore = this.calculateEngagementScore(lead, activities, config);
  const qualificationScore = (fitScore * 0.6) + (engagementScore * 0.4);

  // Determine target stage based on score
  let targetStage = "tof";
  if (qualificationScore >= config.qualificationThresholds.sql) {
    targetStage = "sql";
  } else if (qualificationScore >= config.qualificationThresholds.mql) {
    targetStage = "mql";
  }

  // Update lead with new scores
  await this.leadRepo.update(leadId, {
    fit_score: fitScore,
    engagement_score: engagementScore,
    qualification_score: qualificationScore,
    stage: targetStage,
  });

  // Audit log if stage changed
  if (lead.stage !== targetStage) {
    await auditLog({
      action: "stage_transition",
      entityId: leadId,
      changes: { from: lead.stage, to: targetStage, trigger: "auto_score" },
    });
  }
}
```

### Score Decay

Engagement scores decay over time to prevent stale leads from appearing qualified:

```typescript
// CRON job: /api/cron/leads/score-decay
async decayEngagementScores(): Promise<void> {
  const config = await this.getScoringConfig();
  const decayRate = config.engagementScore.weeklyDecayPercent || 5;

  // Reduce engagement score by 5% for leads not contacted in 7+ days
  await this.prisma.crm_leads.updateMany({
    where: {
      last_activity_at: { lt: subDays(new Date(), 7) },
      engagement_score: { gt: 0 },
    },
    data: {
      engagement_score: {
        multiply: (100 - decayRate) / 100,
      },
    },
  });
}
```

---

_See also: [ADR-006: JSONB Dynamic Configuration](./ADR-006-jsonb-configuration.md)_
