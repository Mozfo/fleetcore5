"use client";

/**
 * Activity Item Component
 *
 * Displays a single activity in the timeline with appropriate icon,
 * metadata badges, and creator information.
 *
 * @see lib/types/activities.ts - Activity type definition
 */

import { useTranslation } from "react-i18next";
import {
  Phone,
  Mail,
  FileText,
  Calendar,
  TrendingUp,
  RefreshCw,
  CheckSquare,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Activity, ActivityType } from "@/lib/types/activities";
import { ACTIVITY_COLORS } from "@/lib/types/activities";

const IconMap = {
  Phone,
  Mail,
  FileText,
  Calendar,
  TrendingUp,
  RefreshCw,
  CheckSquare,
  Settings,
};

const ACTIVITY_ICON_NAMES: Record<ActivityType, keyof typeof IconMap> = {
  call: "Phone",
  email: "Mail",
  note: "FileText",
  meeting: "Calendar",
  stage_change: "TrendingUp",
  status_change: "RefreshCw",
  task: "CheckSquare",
  system: "Settings",
};

interface ActivityItemProps {
  activity: Activity;
  /** Show compact version (smaller text, less spacing) */
  compact?: boolean;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Format creator name from first_name and last_name
 */
function formatCreatorName(creator: Activity["creator"]): string | null {
  if (!creator) return null;
  const parts = [creator.first_name, creator.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

export function ActivityItem({ activity, compact = false }: ActivityItemProps) {
  const { t } = useTranslation("crm");
  const activityType = activity.activity_type;
  const iconName = ACTIVITY_ICON_NAMES[activityType] || "Settings";
  const Icon = IconMap[iconName];
  const colorClass = ACTIVITY_COLORS[activityType] || ACTIVITY_COLORS.system;

  // Use subject as the activity title (new unified schema)
  const activityTitle =
    activity.subject || t(`activities.types.${activityType}`, activityType);
  const creatorName = formatCreatorName(activity.creator);

  return (
    <div className={cn("group flex gap-3", compact && "gap-2")}>
      {/* Icon */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          colorClass,
          compact ? "h-6 w-6" : "h-8 w-8"
        )}
      >
        <Icon className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-medium text-gray-900 dark:text-gray-100",
                compact ? "text-xs" : "text-sm"
              )}
            >
              {activityTitle}
            </p>
            {activity.description && (
              <p
                className={cn(
                  "text-muted-foreground mt-1 line-clamp-2",
                  compact ? "text-xs" : "text-sm"
                )}
              >
                {activity.description}
              </p>
            )}
          </div>
          <span
            className={cn(
              "text-muted-foreground whitespace-nowrap",
              compact ? "text-[10px]" : "text-xs"
            )}
          >
            {formatTime(activity.activity_date)}
          </span>
        </div>

        {/* Activity-specific metadata */}
        <ActivityMetadata activity={activity} compact={compact} />

        {/* Created by */}
        {creatorName && (
          <p
            className={cn(
              "text-muted-foreground mt-1",
              compact ? "text-[10px]" : "text-xs"
            )}
          >
            {t("activities.performed_by", { name: creatorName })}
          </p>
        )}
      </div>
    </div>
  );
}

interface ActivityMetadataProps {
  activity: Activity;
  compact?: boolean;
}

/**
 * Renders activity-specific metadata using explicit fields from unified schema.
 * Replaces old metadata JSON blob approach with typed fields.
 */
function ActivityMetadata({
  activity,
  compact = false,
}: ActivityMetadataProps) {
  const { t } = useTranslation("crm");
  const activityType = activity.activity_type;

  const badgeSize = compact ? "text-[10px] px-1.5 py-0" : "text-xs";

  switch (activityType) {
    case "call":
      if (!activity.duration_minutes && !activity.outcome) return null;
      return (
        <div className={cn("mt-2 flex flex-wrap gap-2", compact && "mt-1")}>
          {activity.duration_minutes !== null && (
            <Badge variant="secondary" className={badgeSize}>
              {activity.duration_minutes} min
            </Badge>
          )}
          {activity.outcome && (
            <Badge variant="outline" className={badgeSize}>
              {t(`activities.outcomes.${activity.outcome}`, activity.outcome)}
            </Badge>
          )}
        </div>
      );
    case "meeting":
      if (!activity.duration_minutes) return null;
      return (
        <div className={cn("mt-2 flex flex-wrap gap-2", compact && "mt-1")}>
          <Badge variant="secondary" className={badgeSize}>
            {activity.duration_minutes} min
          </Badge>
        </div>
      );
    case "task":
      if (activity.is_completed) {
        return (
          <div className={cn("mt-2", compact && "mt-1")}>
            <Badge variant="secondary" className={badgeSize}>
              {t("activities.completed")}
            </Badge>
          </div>
        );
      }
      return null;
    default:
      return null;
  }
}
