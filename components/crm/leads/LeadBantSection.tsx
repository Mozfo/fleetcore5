/**
 * LeadBantSection - BANT qualification for Lead Drawer (V7)
 *
 * Display modes based on lead status:
 * - hidden:   new, email_verified → not rendered
 * - edit:     callback_requested → 4 dropdowns + Qualify button
 * - summary:  qualified, converted → read-only values + Re-qualify
 * - readonly: nurturing, disqualified → read-only if BANT exists, hidden if not
 *
 * Qualification flow (edit mode):
 * - 4/4 qualifying → auto-qualify, toast success
 * - 3/4 → confirmation dialog "Move to Nurturing?"
 * - ≤2/4 + fleet >50 → confirmation dialog "Move to Nurturing? (large fleet)"
 * - ≤2/4 + fleet ≤50 → confirmation dialog "Disqualify?"
 *
 * Placement: RIGHT column of LeadDrawer, between InlineActivityForm and LeadStatusActions.
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Check,
  XCircle,
  Loader2,
  RefreshCw,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select-native";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { drawerSectionVariants } from "@/lib/animations/drawer-variants";
import type { Lead } from "@/types/crm";

// ── BANT option definitions ─────────────────────────────────────────────

interface BantOption {
  value: string;
  label: string;
  qualifying: boolean;
}

const BANT_BUDGET_OPTIONS: BantOption[] = [
  { value: "confirmed", label: "Confirmed", qualifying: true },
  { value: "planned", label: "Planned", qualifying: true },
  { value: "no_budget", label: "No Budget", qualifying: false },
  { value: "unknown", label: "Unknown", qualifying: false },
];

const BANT_AUTHORITY_OPTIONS: BantOption[] = [
  { value: "decision_maker", label: "Decision Maker", qualifying: true },
  { value: "influencer", label: "Influencer", qualifying: false },
  { value: "user", label: "User", qualifying: false },
  { value: "unknown", label: "Unknown", qualifying: false },
];

const BANT_NEED_OPTIONS: BantOption[] = [
  { value: "critical", label: "Critical", qualifying: true },
  { value: "important", label: "Important", qualifying: true },
  { value: "nice_to_have", label: "Nice to Have", qualifying: false },
  { value: "none", label: "None", qualifying: false },
];

const BANT_TIMELINE_OPTIONS: BantOption[] = [
  { value: "immediate", label: "Immediate", qualifying: true },
  { value: "this_quarter", label: "This Quarter", qualifying: true },
  { value: "this_year", label: "This Year", qualifying: false },
  { value: "no_timeline", label: "No Timeline", qualifying: false },
];

// All BANT dimension configs for iteration
const BANT_DIMENSIONS = [
  { key: "budget" as const, options: BANT_BUDGET_OPTIONS },
  { key: "authority" as const, options: BANT_AUTHORITY_OPTIONS },
  { key: "need" as const, options: BANT_NEED_OPTIONS },
  { key: "timeline" as const, options: BANT_TIMELINE_OPTIONS },
] as const;

type BantKey = (typeof BANT_DIMENSIONS)[number]["key"];

// ── Helpers ─────────────────────────────────────────────────────────────

function isQualifying(
  options: BantOption[],
  value: string | null | undefined
): boolean {
  if (!value) return false;
  return options.find((o) => o.value === value)?.qualifying === true;
}

function findLabel(
  options: BantOption[],
  value: string | null | undefined
): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

function formatDate(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return "";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Display mode logic ──────────────────────────────────────────────────

type BantMode = "hidden" | "edit" | "summary" | "readonly";

const HIDDEN_STATUSES = new Set(["new", "email_verified"]);
const SUMMARY_STATUSES = new Set(["qualified", "converted"]);
const READONLY_STATUSES = new Set(["nurturing", "disqualified"]);

function getBantMode(lead: Lead): BantMode {
  const status = lead.status;

  if (HIDDEN_STATUSES.has(status)) return "hidden";
  if (status === "callback_requested") return "edit";
  if (SUMMARY_STATUSES.has(status)) return "summary";
  if (READONLY_STATUSES.has(status)) return "readonly";

  // Default: show summary if BANT data exists, hidden otherwise
  const hasBant =
    lead.bant_budget ||
    lead.bant_authority ||
    lead.bant_need ||
    lead.bant_timeline;
  return hasBant ? "readonly" : "hidden";
}

function hasBantData(lead: Lead): boolean {
  return !!(
    lead.bant_budget ||
    lead.bant_authority ||
    lead.bant_need ||
    lead.bant_timeline
  );
}

// Map BANT key to lead field value
function getBantValue(lead: Lead, key: BantKey): string | null | undefined {
  const fieldMap: Record<BantKey, string | null | undefined> = {
    budget: lead.bant_budget,
    authority: lead.bant_authority,
    need: lead.bant_need,
    timeline: lead.bant_timeline,
  };
  return fieldMap[key];
}

// ── Confirmation dialog state ───────────────────────────────────────────

interface ConfirmationState {
  open: boolean;
  result: "nurturing" | "disqualified" | null;
  criteriaMet: number;
  fleetSizeException: boolean;
  leadId: string;
}

const INITIAL_CONFIRMATION: ConfirmationState = {
  open: false,
  result: null,
  criteriaMet: 0,
  fleetSizeException: false,
  leadId: "",
};

// ── Component ───────────────────────────────────────────────────────────

interface LeadBantSectionProps {
  lead: Lead;
  onQualified?: () => void;
}

export function LeadBantSection({ lead, onQualified }: LeadBantSectionProps) {
  const { t } = useTranslation("crm");
  const mode = getBantMode(lead);

  // For readonly statuses with no BANT data → don't render
  if (mode === "hidden") return null;
  if (mode === "readonly" && !hasBantData(lead)) return null;

  return (
    <motion.div variants={drawerSectionVariants} className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <ClipboardCheck className="h-4 w-4 text-blue-500" />
        <span>
          {t("leads.bant.title", { defaultValue: "BANT Qualification" })}
        </span>
      </div>

      <div className="border-border bg-card space-y-4 rounded-lg border border-l-4 border-l-blue-500 p-4">
        {mode === "edit" ? (
          <BantEditMode lead={lead} onQualified={onQualified} />
        ) : (
          <BantSummaryMode
            lead={lead}
            showRequalify={mode === "summary"}
            onQualified={onQualified}
          />
        )}
      </div>
    </motion.div>
  );
}

// ── EDIT MODE (callback_requested) ──────────────────────────────────────

interface BantEditModeProps {
  lead: Lead;
  onQualified?: () => void;
}

function BantEditMode({ lead, onQualified }: BantEditModeProps) {
  const { t } = useTranslation("crm");

  const [budget, setBudget] = useState<string>(lead.bant_budget || "");
  const [authority, setAuthority] = useState<string>(lead.bant_authority || "");
  const [need, setNeed] = useState<string>(lead.bant_need || "");
  const [timeline, setTimeline] = useState<string>(lead.bant_timeline || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] =
    useState<ConfirmationState>(INITIAL_CONFIRMATION);
  const [isConfirming, setIsConfirming] = useState(false);

  const values = useMemo<Record<BantKey, string>>(
    () => ({ budget, authority, need, timeline }),
    [budget, authority, need, timeline]
  );
  const setters: Record<BantKey, (v: string) => void> = {
    budget: setBudget,
    authority: setAuthority,
    need: setNeed,
    timeline: setTimeline,
  };

  const labelKeys: Record<BantKey, { key: string; defaultValue: string }> = {
    budget: { key: "leads.bant.budget", defaultValue: "Budget Confirmed?" },
    authority: {
      key: "leads.bant.authority",
      defaultValue: "Decision Maker?",
    },
    need: { key: "leads.bant.need", defaultValue: "Primary Need?" },
    timeline: {
      key: "leads.bant.timeline_field",
      defaultValue: "Start Timeline?",
    },
  };

  const criteriaMet = useMemo(() => {
    let count = 0;
    for (const dim of BANT_DIMENSIONS) {
      if (isQualifying(dim.options, values[dim.key])) count++;
    }
    return count;
  }, [values]);

  const allFilled =
    budget !== "" && authority !== "" && need !== "" && timeline !== "";

  const progressConfig = useMemo(() => {
    if (criteriaMet === 4) {
      return {
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800",
        label: t("leads.bant.ready", {
          defaultValue: "Ready for qualification",
        }),
      };
    }
    if (criteriaMet === 3) {
      return {
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        label: t("leads.bant.one_missing", {
          defaultValue: "1 criterion missing",
        }),
      };
    }
    return {
      color: "text-muted-foreground",
      bg: "bg-muted/50",
      border: "border-border",
      label: t("leads.bant.insufficient", {
        defaultValue: "Insufficient qualification",
      }),
    };
  }, [criteriaMet, t]);

  // ── Step 1: Call qualify API → saves BANT + evaluates result ──────────

  const handleQualify = useCallback(async () => {
    if (!allFilled) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/crm/leads/${lead.id}/qualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bant_budget: budget,
          bant_authority: authority,
          bant_need: need,
          bant_timeline: timeline,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(
          json.error?.message ||
            json.message ||
            t("leads.bant.error", { defaultValue: "Qualification failed" })
        );
        return;
      }

      const result = json.data?.result as string;
      const met = json.data?.criteria_met as number;
      const fleetException = json.data?.fleet_size_exception as boolean;

      // 4/4 → auto-qualified by backend, show success
      if (result === "qualified") {
        toast.success(
          t("leads.bant.qualified_success", {
            defaultValue: `Lead qualified (${met}/4 criteria met)`,
            count: met,
          })
        );
        onQualified?.();
        return;
      }

      // <4/4 → show confirmation dialog (backend saved BANT but did NOT change status)
      setConfirmation({
        open: true,
        result: result as "nurturing" | "disqualified",
        criteriaMet: met,
        fleetSizeException: fleetException,
        leadId: lead.id,
      });
    } catch {
      toast.error(
        t("leads.bant.error", { defaultValue: "Qualification failed" })
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [lead.id, budget, authority, need, timeline, allFilled, onQualified, t]);

  // ── Step 2: User confirms → call status API to change status ─────────

  const handleConfirmStatusChange = useCallback(async () => {
    if (!confirmation.result) return;

    setIsConfirming(true);
    try {
      const res = await fetch(
        `/api/v1/crm/leads/${confirmation.leadId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: confirmation.result }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(
          json.error?.message ||
            t("leads.bant.error", { defaultValue: "Status update failed" })
        );
        return;
      }

      if (confirmation.result === "nurturing") {
        toast.info(
          t("leads.bant.nurturing_result", {
            defaultValue: `Lead moved to nurturing (${confirmation.criteriaMet}/4 criteria met)`,
            count: confirmation.criteriaMet,
          })
        );
      } else {
        toast.warning(
          t("leads.bant.disqualified_result", {
            defaultValue: `Lead disqualified (${confirmation.criteriaMet}/4 criteria met)`,
            count: confirmation.criteriaMet,
          })
        );
      }

      setConfirmation(INITIAL_CONFIRMATION);
      onQualified?.();
    } catch {
      toast.error(
        t("leads.bant.error", { defaultValue: "Status update failed" })
      );
    } finally {
      setIsConfirming(false);
    }
  }, [confirmation, onQualified, t]);

  // ── Step 2b: User cancels → close dialog, dropdowns stay ─────────────

  const handleCancelConfirmation = useCallback(() => {
    setConfirmation(INITIAL_CONFIRMATION);
  }, []);

  // ── Confirmation dialog message ──────────────────────────────────────

  const confirmationMessage = useMemo(() => {
    if (!confirmation.result) return "";
    const met = confirmation.criteriaMet;

    if (confirmation.result === "nurturing" && met === 3) {
      return t("leads.bant.confirm_nurturing_3", {
        defaultValue: `1 criterion missing (${met}/4). Move this lead to Nurturing?`,
        count: met,
      });
    }
    if (
      confirmation.result === "nurturing" &&
      confirmation.fleetSizeException
    ) {
      return t("leads.bant.confirm_nurturing_fleet", {
        defaultValue: `Insufficient qualification (${met}/4) but large fleet detected. Move to Nurturing instead of disqualifying?`,
        count: met,
      });
    }
    // disqualified
    return t("leads.bant.confirm_disqualify", {
      defaultValue: `Insufficient qualification (${met}/4 criteria met). Disqualify this lead?`,
      count: met,
    });
  }, [confirmation, t]);

  const confirmationTitle = useMemo(() => {
    if (confirmation.result === "nurturing") {
      return t("leads.bant.confirm_nurturing_title", {
        defaultValue: "Move to Nurturing?",
      });
    }
    return t("leads.bant.confirm_disqualify_title", {
      defaultValue: "Disqualify Lead?",
    });
  }, [confirmation.result, t]);

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <>
      {BANT_DIMENSIONS.map((dim) => (
        <BantSelect
          key={dim.key}
          label={t(labelKeys[dim.key].key, {
            defaultValue: labelKeys[dim.key].defaultValue,
          })}
          value={values[dim.key]}
          onChange={setters[dim.key]}
          options={dim.options}
          disabled={isSubmitting}
        />
      ))}

      <Separator />

      {/* Progress indicator */}
      <div
        className={cn(
          "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
          progressConfig.bg,
          progressConfig.border
        )}
      >
        <span className={cn("font-medium", progressConfig.color)}>
          {criteriaMet}/4{" "}
          {t("leads.bant.criteria", { defaultValue: "criteria OK" })}
        </span>
        <span className={cn("text-xs", progressConfig.color)}>
          {progressConfig.label}
        </span>
      </div>

      {/* Qualify button */}
      <Button
        size="sm"
        className="w-full gap-2"
        disabled={!allFilled || isSubmitting}
        onClick={handleQualify}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("leads.bant.qualifying", { defaultValue: "Qualifying..." })}
          </>
        ) : (
          <>
            <ClipboardCheck className="h-4 w-4" />
            {t("leads.bant.qualify_button", { defaultValue: "Qualify Lead" })}
          </>
        )}
      </Button>

      {/* ── Confirmation dialog for non-4/4 results ────────────────── */}
      <Dialog
        open={confirmation.open}
        onOpenChange={(open) => {
          if (!open) handleCancelConfirmation();
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  confirmation.result === "nurturing"
                    ? "text-amber-500"
                    : "text-red-500"
                )}
              />
              {confirmationTitle}
            </DialogTitle>
            <DialogDescription>{confirmationMessage}</DialogDescription>
          </DialogHeader>

          {/* BANT summary in dialog */}
          <div className="space-y-2 rounded-lg border p-3">
            {BANT_DIMENSIONS.map((dim) => {
              const val = values[dim.key];
              const label = findLabel(dim.options, val);
              const qualifying = isQualifying(dim.options, val);

              return (
                <div
                  key={dim.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {t(labelKeys[dim.key].key, {
                      defaultValue: labelKeys[dim.key].defaultValue,
                    })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {qualifying ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                    )}
                    <span
                      className={cn(
                        "font-medium",
                        qualifying
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {label || "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancelConfirmation}
              disabled={isConfirming}
            >
              {t("common:cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              variant={
                confirmation.result === "disqualified"
                  ? "destructive"
                  : "default"
              }
              onClick={handleConfirmStatusChange}
              disabled={isConfirming}
              className="gap-2"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("leads.bant.confirming", {
                    defaultValue: "Confirming...",
                  })}
                </>
              ) : confirmation.result === "nurturing" ? (
                t("leads.bant.confirm_move_nurturing", {
                  defaultValue: "Move to Nurturing",
                })
              ) : (
                t("leads.bant.confirm_disqualify_button", {
                  defaultValue: "Disqualify",
                })
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── SUMMARY / READONLY MODE ─────────────────────────────────────────────

interface BantSummaryModeProps {
  lead: Lead;
  showRequalify: boolean;
  onQualified?: () => void;
}

function BantSummaryMode({
  lead,
  showRequalify,
  onQualified,
}: BantSummaryModeProps) {
  const { t } = useTranslation("crm");
  const [isRequalifying, setIsRequalifying] = useState(false);

  const hasData = hasBantData(lead);

  // Legacy qualified leads — no BANT data
  if (!hasData) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-2 text-xs">
        <Info className="h-3.5 w-3.5" />
        <span className="italic">
          {t("leads.bant.legacy", {
            defaultValue: "Qualified (legacy — no BANT data)",
          })}
        </span>
      </div>
    );
  }

  // Calculate criteria met from saved lead values
  const criteriaMet = BANT_DIMENSIONS.reduce((count, dim) => {
    const val = getBantValue(lead, dim.key);
    return count + (isQualifying(dim.options, val) ? 1 : 0);
  }, 0);

  const labelKeys: Record<BantKey, { key: string; defaultValue: string }> = {
    budget: { key: "leads.bant.budget_label", defaultValue: "Budget" },
    authority: {
      key: "leads.bant.authority_label",
      defaultValue: "Authority",
    },
    need: { key: "leads.bant.need_label", defaultValue: "Need" },
    timeline: {
      key: "leads.bant.timeline_label",
      defaultValue: "Timeline",
    },
  };

  const handleRequalify = async () => {
    setIsRequalifying(true);
    try {
      const res = await fetch(`/api/v1/crm/leads/${lead.id}/qualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bant_budget: lead.bant_budget,
          bant_authority: lead.bant_authority,
          bant_need: lead.bant_need,
          bant_timeline: lead.bant_timeline,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(
          json.error?.message ||
            t("leads.bant.error", { defaultValue: "Qualification failed" })
        );
        return;
      }

      toast.success(
        t("leads.bant.requalified", {
          defaultValue: "Lead re-qualified successfully",
        })
      );
      onQualified?.();
    } catch {
      toast.error(
        t("leads.bant.error", { defaultValue: "Qualification failed" })
      );
    } finally {
      setIsRequalifying(false);
    }
  };

  return (
    <>
      {/* BANT values with ✓/✗ indicators */}
      <div className="space-y-2.5">
        {BANT_DIMENSIONS.map((dim) => {
          const val = getBantValue(lead, dim.key);
          const label = findLabel(dim.options, val);
          const qualifying = isQualifying(dim.options, val);

          return (
            <div key={dim.key} className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {t(labelKeys[dim.key].key, {
                  defaultValue: labelKeys[dim.key].defaultValue,
                })}
              </span>
              <div className="flex items-center gap-1.5">
                {qualifying ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    qualifying
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  )}
                >
                  {label || "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Score summary */}
      <div
        className={cn(
          "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
          criteriaMet === 4
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
            : "border-border bg-muted/50"
        )}
      >
        <span
          className={cn(
            "font-medium",
            criteriaMet === 4 ? "text-emerald-600" : "text-muted-foreground"
          )}
        >
          {criteriaMet}/4{" "}
          {t("leads.bant.criteria", { defaultValue: "criteria OK" })}
        </span>
        {criteriaMet === 4 && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Check className="h-3 w-3" />
            {t("leads.bant.qualified_badge", { defaultValue: "Qualified" })}
          </span>
        )}
      </div>

      {/* Qualified date */}
      {lead.bant_qualified_at && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          <span>
            {t("leads.bant.qualified_on", { defaultValue: "Qualified on" })}{" "}
            {formatDate(lead.bant_qualified_at)}
          </span>
        </div>
      )}

      {/* Re-qualify button — only for summary mode (qualified/converted) */}
      {showRequalify && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          disabled={isRequalifying}
          onClick={handleRequalify}
        >
          {isRequalifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("leads.bant.requalifying", {
                defaultValue: "Re-qualifying...",
              })}
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              {t("leads.bant.requalify_button", {
                defaultValue: "Re-qualify",
              })}
            </>
          )}
        </Button>
      )}
    </>
  );
}

// ── BANT Select sub-component (edit mode only) ─────────────────────────

interface BantSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: BantOption[];
  disabled?: boolean;
}

function BantSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: BantSelectProps) {
  const selected = options.find((o) => o.value === value);
  const isQualifyingValue = selected?.qualifying === true;

  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="relative">
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "h-9",
            isQualifyingValue && "border-emerald-300 dark:border-emerald-700"
          )}
        >
          <option value="">—</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.qualifying ? `✓ ${opt.label}` : opt.label}
            </option>
          ))}
        </Select>
        {isQualifyingValue && (
          <Check className="pointer-events-none absolute top-1/2 right-8 h-3.5 w-3.5 -translate-y-1/2 text-emerald-500" />
        )}
      </div>
    </div>
  );
}
