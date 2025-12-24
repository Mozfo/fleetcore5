"use client";

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

export function ActivityItem({ activity }: ActivityItemProps) {
  const { t } = useTranslation("crm");
  const activityType = activity.activity_type;
  const iconName = ACTIVITY_ICON_NAMES[activityType] || "Settings";
  const Icon = IconMap[iconName];
  const colorClass = ACTIVITY_COLORS[activityType] || ACTIVITY_COLORS.system;

  // Use subject as the activity title (new unified schema)
  const activityTitle =
    activity.subject || t(`leads.timeline.types.${activityType}`, activityType);
  const creatorName = formatCreatorName(activity.creator);

  return (
    <div className="group flex gap-3">
      {/* Icon */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          colorClass
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {activityTitle}
            </p>
            {activity.description && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {activity.description}
              </p>
            )}
          </div>
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {formatTime(activity.activity_date)}
          </span>
        </div>

        {/* Activity-specific metadata */}
        <ActivityMetadata activity={activity} />

        {/* Created by */}
        {creatorName && (
          <p className="text-muted-foreground mt-1 text-xs">
            {t("leads.timeline.performed_by", { name: creatorName })}
          </p>
        )}
      </div>
    </div>
  );
}

interface ActivityMetadataProps {
  activity: Activity;
}

/**
 * Renders activity-specific metadata using explicit fields from unified schema.
 * Replaces old metadata JSON blob approach with typed fields.
 */
function ActivityMetadata({ activity }: ActivityMetadataProps) {
  const activityType = activity.activity_type;

  switch (activityType) {
    case "call":
      if (!activity.duration_minutes && !activity.outcome) return null;
      return (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {activity.duration_minutes !== null && (
            <Badge variant="secondary">{activity.duration_minutes} min</Badge>
          )}
          {activity.outcome && (
            <Badge variant="outline">{activity.outcome}</Badge>
          )}
        </div>
      );
    case "meeting":
      if (!activity.duration_minutes) return null;
      return (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{activity.duration_minutes} min</Badge>
        </div>
      );
    case "task":
      if (activity.is_completed) {
        return (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              ✓ Completed
            </Badge>
          </div>
        );
      }
      return null;
    default:
      return null;
  }
}
