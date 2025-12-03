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
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { LeadActivity, ActivityType } from "@/lib/types/activities";
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
  activity: LeadActivity;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatStage(stage: string): string {
  return stage
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const { t } = useTranslation("crm");
  const activityType = activity.activity_type;
  const iconName = ACTIVITY_ICON_NAMES[activityType] || "Settings";
  const Icon = IconMap[iconName];
  const colorClass = ACTIVITY_COLORS[activityType] || ACTIVITY_COLORS.system;

  const getActivityTitle = (): string => {
    if (activity.title) return activity.title;
    return t(`leads.timeline.types.${activityType}`, activityType);
  };

  const metadata = activity.metadata || {};

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
              {getActivityTitle()}
            </p>
            {activity.description && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {activity.description}
              </p>
            )}
          </div>
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {formatTime(activity.created_at)}
          </span>
        </div>

        {/* Metadata */}
        <ActivityMetadata activityType={activityType} metadata={metadata} />

        {/* Performed by */}
        {activity.performed_by_name && (
          <p className="text-muted-foreground mt-1 text-xs">
            {t("leads.timeline.performed_by", {
              name: activity.performed_by_name,
            })}
          </p>
        )}
      </div>
    </div>
  );
}

interface ActivityMetadataProps {
  activityType: ActivityType;
  metadata: Record<string, unknown>;
}

function ActivityMetadata({ activityType, metadata }: ActivityMetadataProps) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  const durationMinutes = metadata.duration_minutes as number | undefined;
  const outcome = metadata.outcome as string | undefined;
  const fromStage = metadata.from_stage as string | undefined;
  const toStage = metadata.to_stage as string | undefined;
  const fromStatus = metadata.from_status as string | undefined;
  const toStatus = metadata.to_status as string | undefined;
  const subject = metadata.subject as string | undefined;
  const location = metadata.location as string | undefined;

  switch (activityType) {
    case "call":
      return (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {durationMinutes !== undefined && (
            <Badge variant="secondary">{durationMinutes} min</Badge>
          )}
          {outcome && <Badge variant="outline">{outcome}</Badge>}
        </div>
      );
    case "stage_change":
      return (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <Badge variant="outline">{formatStage(fromStage || "")}</Badge>
          <ArrowRight className="text-muted-foreground h-3 w-3" />
          <Badge variant="secondary">{formatStage(toStage || "")}</Badge>
        </div>
      );
    case "status_change":
      return (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <Badge variant="outline">{fromStatus || ""}</Badge>
          <ArrowRight className="text-muted-foreground h-3 w-3" />
          <Badge variant="secondary">{toStatus || ""}</Badge>
        </div>
      );
    case "email":
      if (subject) {
        return (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {subject}
            </Badge>
          </div>
        );
      }
      return null;
    case "meeting":
      return (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {durationMinutes !== undefined && (
            <Badge variant="secondary">{durationMinutes} min</Badge>
          )}
          {location && <Badge variant="outline">{location}</Badge>}
        </div>
      );
    default:
      return null;
  }
}
