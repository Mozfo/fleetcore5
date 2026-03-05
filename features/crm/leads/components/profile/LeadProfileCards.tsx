"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import {
  Mail,
  Phone,
  Building2,
  Globe,
  MapPin,
  Calendar,
  Clock,
  Megaphone,
  Copy,
  MessageSquareText,
  Monitor,
  Layers,
  Link2,
  Target,
  ClipboardCheck,
  DollarSign,
  Shield,
  PhoneCall,
  XCircle,
  Pencil,
  CalendarPlus,
  User,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { getStatusBadgeColor } from "@/lib/utils/status-colors";
import { getStatusConfig } from "@/lib/config/pipeline-status";
import { getCountryFlag } from "@/lib/utils/email.utils";
import { useFleetSizeOptions } from "@/lib/hooks/useFleetSizeOptions";
import {
  getBantCriteriaMet,
  findLabel,
  isQualifying,
  BANT_BUDGET_OPTIONS,
  BANT_AUTHORITY_OPTIONS,
  BANT_NEED_OPTIONS,
  BANT_TIMELINE_OPTIONS,
} from "@/lib/constants/crm/bant.constants";
import { LEAD_STATUSES } from "@/lib/constants/crm/lead-status.constants";
import {
  OPPORTUNITY_STAGES,
  getStageConfig,
} from "@/lib/config/opportunity-stages";
import { LeadTimeline } from "@/components/crm/leads/LeadTimeline";
import type { Lead, Opportunity } from "@/types/crm";

// ── Helpers ──────────────────────────────────────────────────────────────

function daysSince(dateValue: string | null | undefined): number | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function InfoRow({
  icon: Icon,
  value,
  isLink,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value?: string | null;
  isLink?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="text-muted-foreground size-4 shrink-0" />
      {isLink ? (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary truncate underline"
        >
          {value}
        </a>
      ) : (
        <span className="truncate">{value}</span>
      )}
    </div>
  );
}

// ── Lead status → stepper progress (derived from LEAD_STATUSES constant) ──

const LEAD_STATUS_ORDER: Record<string, number> = LEAD_STATUSES.reduce(
  (acc, s, i) => ({ ...acc, [s]: i }),
  {} as Record<string, number>
);

// Pipeline steps shown in the progress bar (subset of all statuses)
const LEAD_PIPELINE_STEPS = [
  "new",
  "email_verified",
  "callback_requested",
  "qualified",
  "converted",
] as const;

function getLeadProgress(status: string): { percent: number; label: string } {
  const statusIdx = LEAD_STATUS_ORDER[status] ?? 0;
  // Map to pipeline step index (find the highest pipeline step the status has reached)
  let stepIdx = 0;
  for (let i = LEAD_PIPELINE_STEPS.length - 1; i >= 0; i--) {
    if (statusIdx >= LEAD_STATUS_ORDER[LEAD_PIPELINE_STEPS[i]]) {
      stepIdx = i;
      break;
    }
  }
  const percent = Math.round(
    (stepIdx / (LEAD_PIPELINE_STEPS.length - 1)) * 100
  );
  const label = LEAD_PIPELINE_STEPS[stepIdx]
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { percent, label };
}

// ── Opportunity stage progress (derived from OPPORTUNITY_STAGES constant) ──

const OPP_TOTAL_STAGES = OPPORTUNITY_STAGES.length;

function getOpportunityProgress(stage: string): {
  percent: number;
  label: string;
} {
  const cfg = getStageConfig(stage);
  const order = cfg?.order ?? 1;
  const percent = Math.round(((order - 1) / (OPP_TOTAL_STAGES - 1)) * 100);
  const label = cfg?.label ?? stage;
  return { percent, label };
}

// ═══════════════════════════════════════════════════════════════════════
// CARTE 1 — LeadIdentityCard (copie profile-card.tsx)
// ═══════════════════════════════════════════════════════════════════════

export function LeadIdentityCard({ lead }: { lead: Lead }) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { getLabel: getFleetSizeLabel } = useFleetSizeOptions();

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} ${t("leads.drawer.actions.copied")}`);
      } catch {
        toast.error(t("leads.drawer.actions.copy_failed"));
      }
    },
    [t]
  );

  const initials =
    `${(lead.first_name ?? "").charAt(0)}${(lead.last_name ?? "").charAt(0)}`.toUpperCase();
  const bantScore = getBantCriteriaMet(lead);
  const fleetLabel = lead.fleet_size
    ? getFleetSizeLabel(lead.fleet_size, locale)
    : null;
  const days = daysSince(lead.created_at);

  return (
    <Card className="relative">
      <CardContent>
        {/* ── COPIE EXACTE de profile-card.tsx ── */}
        <div className="space-y-12">
          {/* Avatar centré — COPIE profile-card.tsx L12-23 */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="size-20">
              <AvatarFallback className="text-lg">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h5 className="flex items-center justify-center gap-2 text-xl font-semibold">
                {lead.first_name} {lead.last_name}
              </h5>
              <div className="text-muted-foreground text-sm">
                {lead.company_name ?? "—"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  "text-[10px] font-medium uppercase",
                  getStatusBadgeColor(lead.status)
                )}
              >
                {lead.status}
              </Badge>
              {lead.priority && (
                <Badge variant="outline" className="text-[10px]">
                  {t(`leads.card.priority.${lead.priority}`)}
                </Badge>
              )}
            </div>
            {lead.lead_code && (
              <div
                className="text-primary cursor-pointer font-mono text-sm"
                onClick={() => handleCopy(lead.lead_code ?? "", "Lead code")}
              >
                {lead.lead_code} <Copy className="inline size-3" />
              </div>
            )}
          </div>

          {/* Stats grid 3 cols — COPIE EXACTE de profile-card.tsx L24-37 */}
          <div className="bg-muted grid grid-cols-3 divide-x rounded-md border text-center *:py-3">
            <div>
              <h5 className="text-lg font-semibold">{bantScore}/4</h5>
              <div className="text-muted-foreground text-sm">BANT</div>
            </div>
            <div>
              <h5 className="text-lg font-semibold">{fleetLabel ?? "—"}</h5>
              <div className="text-muted-foreground text-sm">Fleet</div>
            </div>
            <div>
              <h5 className="text-lg font-semibold">{days ?? "—"}</h5>
              <div className="text-muted-foreground text-sm">Days</div>
            </div>
          </div>

          {/* Contact info — COPIE EXACTE de profile-card.tsx L38-67 */}
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="text-muted-foreground size-4" />
              <span className="min-w-0 flex-1 truncate">{lead.email}</span>
              {lead.email_verified && (
                <Badge variant="success" className="shrink-0 text-[10px]">
                  <Check className="size-3" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="text-muted-foreground size-4" />
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="hover:text-primary hover:underline"
                >
                  {lead.phone}
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MessageSquareText className="text-muted-foreground size-4" />
              {lead.whatsapp_number ? (
                <a
                  href={`https://wa.me/${lead.whatsapp_number.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  {lead.whatsapp_number}
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            {lead.country_code && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="text-muted-foreground size-4" />
                <span>
                  {getCountryFlag(lead.country_code)} {lead.country_code}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Globe className="text-muted-foreground size-4" />
              <span>{lead.language?.toUpperCase() ?? "—"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CARTE 2 — LeadJourneyCard (COMPACT — pattern "Complete Your Profile")
// ═══════════════════════════════════════════════════════════════════════

export function LeadJourneyCard({
  lead,
  opportunity,
}: {
  lead: Lead;
  opportunity?: Opportunity | null;
}) {
  const showOpportunity = !!lead.opportunity_id && !!opportunity;
  const leadProgress = getLeadProgress(lead.status);
  const statusColor = getStatusConfig(lead.status);

  let progressPercent = leadProgress.percent;
  let currentStepLabel = leadProgress.label;

  if (showOpportunity) {
    const oppProgress = getOpportunityProgress(opportunity.stage);
    progressPercent = Math.round(50 + (oppProgress.percent / 100) * 50);
    currentStepLabel = oppProgress.label;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Lead Journey</CardTitle>
      </CardHeader>
      <CardContent>
        {/* ── Pattern "Complete Your Profile" : Progress bar + label ── */}
        <div className="flex items-center gap-3">
          <Progress
            value={progressPercent}
            className="flex-1"
            indicatorColor={statusColor.bg}
          />
          <span className="text-muted-foreground text-xs">
            {currentStepLabel}
          </span>
        </div>
        {/* Statut spéciaux si applicable */}
        {lead.status === "nurturing" && (
          <Badge variant="pending" className="mt-2 text-[10px]">
            Nurturing
          </Badge>
        )}
        {lead.status === "disqualified" && (
          <Badge variant="destructive" className="mt-2 text-[10px]">
            Disqualified
          </Badge>
        )}
        {opportunity?.status === "won" && (
          <Badge variant="success" className="mt-2 text-[10px]">
            Won
          </Badge>
        )}
        {opportunity?.status === "lost" && (
          <Badge variant="destructive" className="mt-2 text-[10px]">
            Lost
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CARTE 3 — LeadBantCard (COMPACT — pattern "Skills")
// ═══════════════════════════════════════════════════════════════════════

export function LeadBantCard({ lead }: { lead: Lead }) {
  const bantFieldMap: Record<string, string | null | undefined> = {
    budget: lead.bant_budget,
    authority: lead.bant_authority,
    need: lead.bant_need,
    timeline: lead.bant_timeline,
  };
  const criteria = [
    { key: "budget", label: "Budget", options: BANT_BUDGET_OPTIONS },
    { key: "authority", label: "Authority", options: BANT_AUTHORITY_OPTIONS },
    { key: "need", label: "Need", options: BANT_NEED_OPTIONS },
    { key: "timeline", label: "Timeline", options: BANT_TIMELINE_OPTIONS },
  ].map((c) => ({ ...c, met: isQualifying(c.options, bantFieldMap[c.key]) }));
  const score = criteria.filter((c) => c.met).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          BANT Score — {score}/4
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* ── Pattern compact : 4 badges sur une ligne ── */}
        <div className="flex flex-wrap gap-2">
          {criteria.map((c) => (
            <Badge
              key={c.key}
              variant={c.met ? "success" : "secondary"}
              className="text-xs"
            >
              {c.met ? <Check className="size-3" /> : <X className="size-3" />}{" "}
              {c.label}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CARTE 4 — LeadActivitiesCard (copie "Latest Activity" de profile)
// ═══════════════════════════════════════════════════════════════════════

export function LeadActivitiesCard({
  leadId,
  lead,
  refreshTrigger,
}: {
  leadId: string;
  lead: Lead;
  refreshTrigger: number;
}) {
  return (
    <Card>
      <CardHeader>
        {/* ── COPIE EXACTE du header "Latest Activity" de profile/latest-activity.tsx ── */}
        <CardTitle>Latest Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {/* ── Réutilise LeadTimeline existant ── */}
        <LeadTimeline
          leadId={leadId}
          leadEmail={lead.email}
          leadPhone={lead.phone}
          refreshTrigger={refreshTrigger}
        />
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CARTE 5 — LeadCompanyCard (PETITE)
// ═══════════════════════════════════════════════════════════════════════

export function LeadCompanyCard({ lead }: { lead: Lead }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Company</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <InfoRow icon={Building2} value={lead.company_name} />
        <InfoRow
          icon={MapPin}
          value={
            lead.city || lead.country_code
              ? `${lead.city ?? "—"}, ${lead.country_code ?? ""}`
              : null
          }
        />
        <InfoRow icon={Monitor} value={lead.current_software} />
        <InfoRow
          icon={Layers}
          value={
            lead.platforms_used && lead.platforms_used.length > 0
              ? lead.platforms_used.join(", ")
              : null
          }
        />
        {lead.website_url && (
          <InfoRow icon={Link2} value={lead.website_url} isLink />
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CARTE 6 — LeadAssignmentCard (PETITE)
// ═══════════════════════════════════════════════════════════════════════

export function LeadAssignmentCard({ lead }: { lead: Lead }) {
  const assignedName = lead.assigned_to
    ? `${lead.assigned_to.first_name} ${lead.assigned_to.last_name ?? ""}`.trim()
    : "Unassigned";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <InfoRow icon={User} value={assignedName} />
        <InfoRow
          icon={Calendar}
          value={
            lead.next_action_date ? formatDate(lead.next_action_date) : null
          }
        />
        <InfoRow
          icon={Clock}
          value={
            lead.last_activity_at ? formatDate(lead.last_activity_at) : null
          }
        />
        <InfoRow icon={CalendarPlus} value={formatDate(lead.created_at)} />
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CARTE 7 — LeadSourceCard (PETITE)
// ═══════════════════════════════════════════════════════════════════════

export function LeadSourceCard({ lead }: { lead: Lead }) {
  const utmParts = [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(
    Boolean
  );
  const utmString = utmParts.length > 0 ? utmParts.join(" / ") : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Source</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <InfoRow icon={Megaphone} value={lead.source} />
        {utmString && <InfoRow icon={Target} value={utmString} />}
        <div className="flex items-center gap-3 text-sm">
          <ClipboardCheck className="text-muted-foreground size-4" />
          <Badge
            variant={lead.wizard_completed ? "success" : "secondary"}
            className="text-[10px]"
          >
            Wizard {lead.wizard_completed ? "Complete" : "Incomplete"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CARTE 8 — LeadQualificationCard (PETITE)
// ═══════════════════════════════════════════════════════════════════════

export function LeadQualificationCard({ lead }: { lead: Lead }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Qualification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {lead.bant_budget && (
          <InfoRow
            icon={DollarSign}
            value={`Budget: ${findLabel(BANT_BUDGET_OPTIONS, lead.bant_budget)}`}
          />
        )}
        {lead.bant_authority && (
          <InfoRow
            icon={Shield}
            value={`Authority: ${findLabel(BANT_AUTHORITY_OPTIONS, lead.bant_authority)}`}
          />
        )}
        {lead.bant_need && (
          <InfoRow
            icon={Target}
            value={`Need: ${findLabel(BANT_NEED_OPTIONS, lead.bant_need)}`}
          />
        )}
        {lead.bant_timeline && (
          <InfoRow
            icon={Clock}
            value={`Timeline: ${findLabel(BANT_TIMELINE_OPTIONS, lead.bant_timeline)}`}
          />
        )}
        {lead.callback_requested && (
          <InfoRow
            icon={PhoneCall}
            value={`Callback: ${formatDate(lead.callback_requested_at) ?? "Requested"}`}
          />
        )}
        {lead.disqualified_at && (
          <InfoRow
            icon={XCircle}
            value={`Disqualified: ${lead.disqualification_reason ?? "—"}`}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CARTE 9 — LeadAuditCard (PETITE)
// ═══════════════════════════════════════════════════════════════════════

export function LeadAuditCard({ lead }: { lead: Lead }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Audit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-3 text-sm">
          <Shield className="text-muted-foreground size-4" />
          <span>GDPR</span>
          <Badge
            variant={lead.gdpr_consent ? "success" : "secondary"}
            className="text-[10px]"
          >
            {lead.gdpr_consent ? "Consented" : "Unknown"}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Mail className="text-muted-foreground size-4" />
          <span>Email</span>
          <Badge
            variant={lead.email_verified ? "success" : "secondary"}
            className="text-[10px]"
          >
            {lead.email_verified ? "Verified" : "Unverified"}
          </Badge>
        </div>
        {lead.detected_country_code && (
          <div className="flex items-center gap-3 text-sm">
            <Globe className="text-muted-foreground size-4" />
            <span>
              Detected: {getCountryFlag(lead.detected_country_code)}{" "}
              {lead.detected_country_code}
            </span>
            {lead.country_code &&
              lead.detected_country_code !== lead.country_code && (
                <Badge variant="warning" className="text-[10px]">
                  Mismatch
                </Badge>
              )}
          </div>
        )}
        <InfoRow
          icon={CalendarPlus}
          value={`Created: ${formatDate(lead.created_at)}`}
        />
        <InfoRow
          icon={Pencil}
          value={
            lead.updated_at ? `Updated: ${formatDate(lead.updated_at)}` : null
          }
        />
      </CardContent>
    </Card>
  );
}
