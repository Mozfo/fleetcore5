"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityItem } from "./ActivityItem";
import { AddActivityModal } from "./AddActivityModal";
import { getActivitiesAction } from "@/lib/actions/crm/activities.actions";
import type { Activity } from "@/lib/types/activities";

interface LeadTimelineProps {
  leadId: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
}

function formatDateGroup(
  dateString: string,
  t: (key: string) => string
): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return t("leads.timeline.today");
  if (isYesterday) return t("leads.timeline.yesterday");

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LeadTimeline({
  leadId,
  leadEmail,
  leadPhone,
}: LeadTimelineProps) {
  const { t } = useTranslation("crm");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadActivities = useCallback(
    async (offset = 0, append = false) => {
      if (offset === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const result = await getActivitiesAction({
        leadId,
        limit: 20,
        offset,
      });

      if (result.success) {
        const newActivities = result.activities;
        if (append) {
          setActivities((prev) => [...prev, ...newActivities]);
        } else {
          setActivities(newActivities);
        }
        setTotal(result.total);
        setHasMore(offset + newActivities.length < result.total);
      }

      setIsLoading(false);
      setIsLoadingMore(false);
    },
    [leadId]
  );

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      void loadActivities(activities.length, true);
    }
  };

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    activities.forEach((activity) => {
      const dateKey = new Date(activity.activity_date).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(activity);
    });
    return groups;
  }, [activities]);

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (activities.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {t("leads.timeline.empty")}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("leads.timeline.empty_description")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t("leads.timeline.add_first")}
          </Button>
        </div>
        <AddActivityModal
          leadId={leadId}
          leadEmail={leadEmail}
          leadPhone={leadPhone}
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSuccess={() => void loadActivities()}
        />
      </>
    );
  }

  return (
    <>
      {/* Add Activity Button */}
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t("leads.timeline.add_activity")}
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
          <div key={dateKey}>
            <h4 className="text-muted-foreground bg-background sticky top-0 mb-3 py-1 text-xs font-medium">
              {formatDateGroup(dayActivities[0].activity_date, t)}
            </h4>
            <div className="space-y-4 pl-1">
              {dayActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        ))}

        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("leads.timeline.load_more")}
                </>
              ) : (
                t("leads.timeline.load_more")
              )}
            </Button>
          </div>
        )}

        {total > 0 && (
          <p className="text-muted-foreground text-center text-xs">
            {activities.length} / {total}
          </p>
        )}
      </div>

      <AddActivityModal
        leadId={leadId}
        leadEmail={leadEmail}
        leadPhone={leadPhone}
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => void loadActivities()}
      />
    </>
  );
}
