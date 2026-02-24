"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import { FilterCategory } from "@/components/ui/filter-category";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleFilterButton } from "@/components/ui/toggle-filter-button";
import { useFleetSizeOptions } from "@/lib/hooks/useFleetSizeOptions";
import { useLeadStages } from "@/lib/hooks/useLeadStages";
import { LEAD_STAGE_VALUES } from "@/types/crm";

import { SIDEBAR_FILTER_PARSERS } from "../hooks/use-leads-table";
import { useSidebarFilterData } from "../hooks/use-sidebar-filter-data";

// ── Static option lists ──────────────────────────────────────────────────

const SOURCE_OPTIONS = [
  { value: "website", labelKey: "leads.modal.source_options.website" },
  { value: "referral", labelKey: "leads.modal.source_options.referral" },
  { value: "paid_ad", labelKey: "leads.modal.source_options.paid_ad" },
  {
    value: "social_media",
    labelKey: "leads.modal.source_options.social_media",
  },
  { value: "event", labelKey: "leads.modal.source_options.event" },
  {
    value: "cold_outreach",
    labelKey: "leads.modal.source_options.cold_outreach",
  },
  { value: "partner", labelKey: "leads.modal.source_options.partner" },
  { value: "other", labelKey: "leads.modal.source_options.other" },
] as const;

const BOOLEAN_FILTERS = [
  {
    key: "email_verified" as const,
    labelKey: "leads.table.columns.email_verified",
  },
  {
    key: "callback_requested" as const,
    labelKey: "leads.table.columns.callback_requested",
  },
  {
    key: "gdpr_consent" as const,
    labelKey: "leads.table.columns.gdpr_consent",
  },
  {
    key: "attendance_confirmed" as const,
    labelKey: "leads.table.columns.attendance_confirmed",
  },
  {
    key: "wizard_completed" as const,
    labelKey: "leads.filters.fields.wizard_completed",
  },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────

function toggleArrayValue(
  current: string[] | null,
  value: string
): string[] | null {
  const arr = current ?? [];
  const idx = arr.indexOf(value);
  if (idx >= 0) {
    const next = [...arr.slice(0, idx), ...arr.slice(idx + 1)];
    return next.length > 0 ? next : null;
  }
  return [...arr, value];
}

// ── Score Slider (local state for smooth drag, commits on release) ───────

function ScoreSlider({
  minValue,
  maxValue,
  onCommit,
}: {
  minValue: number | null;
  maxValue: number | null;
  onCommit: (min: number | null, max: number | null) => void;
}) {
  const [range, setRange] = React.useState<number[]>([
    minValue ?? 0,
    maxValue ?? 100,
  ]);

  // Sync URL → local when external value changes
  const urlMin = minValue ?? 0;
  const urlMax = maxValue ?? 100;
  React.useEffect(() => {
    setRange([urlMin, urlMax]);
  }, [urlMin, urlMax]);

  return (
    <div className="space-y-2 px-0.5 pt-1">
      <Slider
        min={0}
        max={100}
        step={5}
        value={range}
        onValueChange={setRange}
        onValueCommit={(v) => {
          const mn = v[0] ?? 0;
          const mx = v[1] ?? 100;
          onCommit(mn === 0 ? null : mn, mx === 100 ? null : mx);
        }}
      />
      <div className="text-muted-foreground flex justify-between text-[10px] tabular-nums">
        <span>{range[0]}</span>
        <span>{range[1]}</span>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────

export function LeadsFilterSidebar() {
  const { t } = useTranslation("crm");
  const { stages } = useLeadStages();
  const { options: fleetSizeOptions } = useFleetSizeOptions();
  const { countryCodes, platformCodes } = useSidebarFilterData();

  const [values, setValues] = useQueryStates(SIDEBAR_FILTER_PARSERS);

  // ── Active count helpers ───────────────────────────────────────────

  const arrayCount = React.useCallback(
    (field: keyof typeof SIDEBAR_FILTER_PARSERS) => {
      const v = values[field];
      return Array.isArray(v) ? v.length : 0;
    },
    [values]
  );

  const rangeActive = React.useCallback(
    (
      minField: keyof typeof SIDEBAR_FILTER_PARSERS,
      maxField: keyof typeof SIDEBAR_FILTER_PARSERS
    ) => {
      const min = values[minField];
      const max = values[maxField];
      const hasMin = min !== null && min !== undefined;
      const hasMax = max !== null && max !== undefined;
      return hasMin || hasMax ? 1 : 0;
    },
    [values]
  );

  const boolActiveCount = React.useMemo(
    () =>
      BOOLEAN_FILTERS.filter(
        (bf) => values[bf.key] === "true" || values[bf.key] === "false"
      ).length,
    [values]
  );

  const totalActive = React.useMemo(() => {
    return Object.values(values).filter((v) => {
      if (v === null || v === undefined) return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "string") return v.length > 0;
      return true;
    }).length;
  }, [values]);

  // ── Actions ────────────────────────────────────────────────────────

  const handleReset = React.useCallback(() => {
    const cleared: Record<string, null> = {};
    for (const key of Object.keys(SIDEBAR_FILTER_PARSERS)) {
      cleared[key] = null;
    }
    void setValues(cleared as Parameters<typeof setValues>[0]);
  }, [setValues]);

  const toggleMulti = React.useCallback(
    (field: keyof typeof SIDEBAR_FILTER_PARSERS, value: string) => {
      const current = values[field];
      void setValues({
        [field]: toggleArrayValue(
          Array.isArray(current) ? current : null,
          value
        ),
      } as Parameters<typeof setValues>[0]);
    },
    [values, setValues]
  );

  const toggleBool = React.useCallback(
    (field: keyof typeof SIDEBAR_FILTER_PARSERS, checked: boolean) => {
      void setValues({
        [field]: checked ? "true" : null,
      } as Parameters<typeof setValues>[0]);
    },
    [setValues]
  );

  const commitScoreRange = React.useCallback(
    (
      minField: keyof typeof SIDEBAR_FILTER_PARSERS,
      maxField: keyof typeof SIDEBAR_FILTER_PARSERS,
      min: number | null,
      max: number | null
    ) => {
      void setValues({
        [minField]: min,
        [maxField]: max,
      } as Parameters<typeof setValues>[0]);
    },
    [setValues]
  );

  const setDateValue = React.useCallback(
    (field: keyof typeof SIDEBAR_FILTER_PARSERS, val: string | null) => {
      void setValues({
        [field]: val,
      } as Parameters<typeof setValues>[0]);
    },
    [setValues]
  );

  const isSelected = (
    field: keyof typeof SIDEBAR_FILTER_PARSERS,
    value: string
  ): boolean => {
    const current = values[field];
    return Array.isArray(current) && current.includes(value);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="text-muted-foreground size-4" />
          <span className="text-sm font-semibold">
            {t("leads.filters.advanced")}
          </span>
          {totalActive > 0 && (
            <span className="bg-primary/15 text-primary inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums">
              {totalActive}
            </span>
          )}
        </div>
        {totalActive > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs"
            onClick={handleReset}
          >
            <RotateCcw className="mr-1 size-3" />
            {t("leads.filters.reset")}
          </Button>
        )}
      </div>

      {/* ── Scrollable filter list ──────────────────────────────────── */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-4">
          {/* ── 1. Stage (open) ────────────────────────────────────── */}
          <FilterCategory
            title={t("leads.filters.fields.stage")}
            activeCount={arrayCount("lead_stage")}
          >
            <div className="flex flex-wrap gap-1">
              {(stages.length > 0
                ? stages.map((s) => ({ value: s.value, label: s.label_en }))
                : LEAD_STAGE_VALUES.map((v) => ({
                    value: v,
                    label: t(`leads.card.stage.${v}`, { defaultValue: v }),
                  }))
              ).map((opt) => (
                <ToggleFilterButton
                  key={opt.value}
                  label={opt.label}
                  active={isSelected("lead_stage", opt.value)}
                  onClick={() => toggleMulti("lead_stage", opt.value)}
                />
              ))}
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 2. Source (open) ────────────────────────────────────── */}
          <FilterCategory
            title={t("leads.table.columns.source")}
            activeCount={arrayCount("source")}
          >
            <div className="flex flex-wrap gap-1">
              {SOURCE_OPTIONS.map((opt) => (
                <ToggleFilterButton
                  key={opt.value}
                  label={t(opt.labelKey)}
                  active={isSelected("source", opt.value)}
                  onClick={() => toggleMulti("source", opt.value)}
                />
              ))}
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 3. Fleet Size (open) ───────────────────────────────── */}
          <FilterCategory
            title={t("leads.table.columns.fleet_size")}
            activeCount={arrayCount("fleet_size")}
          >
            <div className="flex flex-wrap gap-1">
              {(fleetSizeOptions.length > 0
                ? fleetSizeOptions.map((o) => ({
                    value: o.value,
                    label: o.label_en,
                  }))
                : [
                    { value: "1-10", label: "1-10" },
                    { value: "11-50", label: "11-50" },
                    { value: "51-100", label: "51-100" },
                    { value: "101-500", label: "101-500" },
                    { value: "500+", label: "500+" },
                  ]
              ).map((opt) => (
                <ToggleFilterButton
                  key={opt.value}
                  label={opt.label}
                  active={isSelected("fleet_size", opt.value)}
                  onClick={() => toggleMulti("fleet_size", opt.value)}
                />
              ))}
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 4. Qualification Score (open) ──────────────────────── */}
          <FilterCategory
            title={t("leads.filters.fields.qualification_score")}
            activeCount={rangeActive(
              "min_qualification_score",
              "max_qualification_score"
            )}
          >
            <ScoreSlider
              minValue={values.min_qualification_score}
              maxValue={values.max_qualification_score}
              onCommit={(min, max) =>
                commitScoreRange(
                  "min_qualification_score",
                  "max_qualification_score",
                  min,
                  max
                )
              }
            />
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 5. Quick Filters / Booleans (open) ─────────────────── */}
          <FilterCategory
            title={t("leads.filters.quick_filters")}
            activeCount={boolActiveCount}
          >
            <div className="space-y-2.5">
              {BOOLEAN_FILTERS.map((bf) => (
                <div
                  key={bf.key}
                  className="flex items-center justify-between gap-2"
                >
                  <Label
                    htmlFor={`bool-${bf.key}`}
                    className="cursor-pointer text-xs font-normal"
                  >
                    {t(bf.labelKey)}
                  </Label>
                  <Switch
                    id={`bool-${bf.key}`}
                    checked={values[bf.key] === "true"}
                    onCheckedChange={(checked: boolean) =>
                      toggleBool(bf.key, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 6. Country (closed) ────────────────────────────────── */}
          <FilterCategory
            title={t("leads.table.columns.country")}
            defaultOpen={false}
            activeCount={arrayCount("country_code")}
          >
            <div className="flex flex-wrap gap-1">
              {countryCodes.map((code) => (
                <ToggleFilterButton
                  key={code}
                  label={code}
                  active={isSelected("country_code", code)}
                  onClick={() => toggleMulti("country_code", code)}
                />
              ))}
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 7. Language (closed) ───────────────────────────────── */}
          <FilterCategory
            title={t("leads.table.columns.language")}
            defaultOpen={false}
            activeCount={arrayCount("language")}
          >
            <div className="flex flex-wrap gap-1">
              {["en", "fr", "ar"].map((lang) => (
                <ToggleFilterButton
                  key={lang}
                  label={lang.toUpperCase()}
                  active={isSelected("language", lang)}
                  onClick={() => toggleMulti("language", lang)}
                />
              ))}
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 8. Fit Score (closed) ──────────────────────────────── */}
          <FilterCategory
            title={t("leads.filters.fields.fit_score")}
            defaultOpen={false}
            activeCount={rangeActive("min_fit_score", "max_fit_score")}
          >
            <ScoreSlider
              minValue={values.min_fit_score}
              maxValue={values.max_fit_score}
              onCommit={(min, max) =>
                commitScoreRange("min_fit_score", "max_fit_score", min, max)
              }
            />
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 9. Engagement Score (closed) ───────────────────────── */}
          <FilterCategory
            title={t("leads.filters.fields.engagement_score")}
            defaultOpen={false}
            activeCount={rangeActive(
              "min_engagement_score",
              "max_engagement_score"
            )}
          >
            <ScoreSlider
              minValue={values.min_engagement_score}
              maxValue={values.max_engagement_score}
              onCommit={(min, max) =>
                commitScoreRange(
                  "min_engagement_score",
                  "max_engagement_score",
                  min,
                  max
                )
              }
            />
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 10. Created Date (closed) ──────────────────────────── */}
          <FilterCategory
            title={t("leads.filters.fields.created_at")}
            defaultOpen={false}
            activeCount={rangeActive("min_created_at", "max_created_at")}
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-muted-foreground mb-1 block text-[10px]">
                  {t("leads.filters.from")}
                </Label>
                <Input
                  type="date"
                  className="h-7 text-xs"
                  value={values.min_created_at ?? ""}
                  onChange={(e) =>
                    setDateValue("min_created_at", e.target.value || null)
                  }
                />
              </div>
              <div>
                <Label className="text-muted-foreground mb-1 block text-[10px]">
                  {t("leads.filters.to")}
                </Label>
                <Input
                  type="date"
                  className="h-7 text-xs"
                  value={values.max_created_at ?? ""}
                  onChange={(e) =>
                    setDateValue("max_created_at", e.target.value || null)
                  }
                />
              </div>
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 11. Last Activity (closed) ─────────────────────────── */}
          <FilterCategory
            title={t("leads.table.columns.last_activity_at")}
            defaultOpen={false}
            activeCount={rangeActive(
              "min_last_activity_at",
              "max_last_activity_at"
            )}
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-muted-foreground mb-1 block text-[10px]">
                  {t("leads.filters.from")}
                </Label>
                <Input
                  type="date"
                  className="h-7 text-xs"
                  value={values.min_last_activity_at ?? ""}
                  onChange={(e) =>
                    setDateValue("min_last_activity_at", e.target.value || null)
                  }
                />
              </div>
              <div>
                <Label className="text-muted-foreground mb-1 block text-[10px]">
                  {t("leads.filters.to")}
                </Label>
                <Input
                  type="date"
                  className="h-7 text-xs"
                  value={values.max_last_activity_at ?? ""}
                  onChange={(e) =>
                    setDateValue("max_last_activity_at", e.target.value || null)
                  }
                />
              </div>
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 12. Booking Date (closed) ──────────────────────────── */}
          <FilterCategory
            title={t("leads.filters.fields.booking_date")}
            defaultOpen={false}
            activeCount={rangeActive(
              "min_booking_slot_at",
              "max_booking_slot_at"
            )}
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-muted-foreground mb-1 block text-[10px]">
                  {t("leads.filters.from")}
                </Label>
                <Input
                  type="date"
                  className="h-7 text-xs"
                  value={values.min_booking_slot_at ?? ""}
                  onChange={(e) =>
                    setDateValue("min_booking_slot_at", e.target.value || null)
                  }
                />
              </div>
              <div>
                <Label className="text-muted-foreground mb-1 block text-[10px]">
                  {t("leads.filters.to")}
                </Label>
                <Input
                  type="date"
                  className="h-7 text-xs"
                  value={values.max_booking_slot_at ?? ""}
                  onChange={(e) =>
                    setDateValue("max_booking_slot_at", e.target.value || null)
                  }
                />
              </div>
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 13. Next Action Date (closed) ──────────────────────── */}
          <FilterCategory
            title={t("leads.table.columns.next_action_date")}
            defaultOpen={false}
            activeCount={rangeActive(
              "min_next_action_date",
              "max_next_action_date"
            )}
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-muted-foreground mb-1 block text-[10px]">
                  {t("leads.filters.from")}
                </Label>
                <Input
                  type="date"
                  className="h-7 text-xs"
                  value={values.min_next_action_date ?? ""}
                  onChange={(e) =>
                    setDateValue("min_next_action_date", e.target.value || null)
                  }
                />
              </div>
              <div>
                <Label className="text-muted-foreground mb-1 block text-[10px]">
                  {t("leads.filters.to")}
                </Label>
                <Input
                  type="date"
                  className="h-7 text-xs"
                  value={values.max_next_action_date ?? ""}
                  onChange={(e) =>
                    setDateValue("max_next_action_date", e.target.value || null)
                  }
                />
              </div>
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 14. Loss Reason (closed) ───────────────────────────── */}
          <FilterCategory
            title={t("leads.table.columns.loss_reason_code")}
            defaultOpen={false}
            activeCount={arrayCount("loss_reason_code")}
          >
            <div className="flex flex-wrap gap-1">
              {[
                "price_too_high",
                "competitor_won",
                "no_budget",
                "no_response",
                "bad_timing",
                "feature_missing",
                "other",
              ].map((reason) => (
                <ToggleFilterButton
                  key={reason}
                  label={t(`opportunity.loss_reasons.${reason}`, {
                    defaultValue: reason,
                  })}
                  active={isSelected("loss_reason_code", reason)}
                  onClick={() => toggleMulti("loss_reason_code", reason)}
                />
              ))}
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 15. Disqualification Reason (closed) ───────────────── */}
          <FilterCategory
            title={t("leads.table.columns.disqualification_reason")}
            defaultOpen={false}
            activeCount={arrayCount("disqualification_reason")}
          >
            <div className="flex flex-wrap gap-1">
              {[
                "fantasy_email",
                "competitor",
                "no_response",
                "wrong_market",
                "student_test",
                "duplicate",
                "other",
              ].map((reason) => (
                <ToggleFilterButton
                  key={reason}
                  label={t(`leads.disqualify.reasons.${reason}`, {
                    defaultValue: reason,
                  })}
                  active={isSelected("disqualification_reason", reason)}
                  onClick={() => toggleMulti("disqualification_reason", reason)}
                />
              ))}
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 16. Platforms Used (closed) ─────────────────────────── */}
          <FilterCategory
            title={t("leads.table.columns.platforms_used")}
            defaultOpen={false}
            activeCount={arrayCount("platforms_used")}
          >
            <div className="flex flex-wrap gap-1">
              {platformCodes.map((platform) => (
                <ToggleFilterButton
                  key={platform}
                  label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  active={isSelected("platforms_used", platform)}
                  onClick={() => toggleMulti("platforms_used", platform)}
                />
              ))}
            </div>
          </FilterCategory>

          <Separator className="opacity-50" />

          {/* ── 17. Industry (closed) ──────────────────────────────── */}
          <FilterCategory
            title={t("leads.table.columns.industry")}
            defaultOpen={false}
            activeCount={arrayCount("industry")}
          >
            <div className="flex flex-wrap gap-1">
              {[
                "transport",
                "logistics",
                "taxi",
                "vtc",
                "delivery",
                "rental",
                "other",
              ].map((ind) => (
                <ToggleFilterButton
                  key={ind}
                  label={ind.charAt(0).toUpperCase() + ind.slice(1)}
                  active={isSelected("industry", ind)}
                  onClick={() => toggleMulti("industry", ind)}
                />
              ))}
            </div>
          </FilterCategory>
        </div>
      </ScrollArea>
    </div>
  );
}
