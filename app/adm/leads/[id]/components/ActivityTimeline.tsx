"use client";

type Activity = {
  id: string;
  activity_type: string;
  notes: string | null;
  outcome: string | null;
  duration: number | null;
  priority: string;
  next_action: string | null;
  next_action_date: Date | null;
  activity_date: Date;
  performed_by: string;
  status: string;
  lead_id: string;
  created_at: Date | null;
};

interface ActivityTimelineProps {
  activities: Activity[];
}

export default function ActivityTimeline({
  activities,
}: ActivityTimelineProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getActivityTypeColor = (type: string | null) => {
    const typeMap: Record<string, string> = {
      call: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      email:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      meeting:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      note: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      status_change:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    };

    return (
      typeMap[type || "note"] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    );
  };

  const getPriorityColor = (priority: string | null) => {
    const priorityMap: Record<string, string> = {
      high: "text-red-600 dark:text-red-400",
      medium: "text-yellow-600 dark:text-yellow-400",
      low: "text-green-600 dark:text-green-400",
    };

    return priorityMap[priority || "low"] || "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Activity Timeline
      </h2>

      {activities.length === 0 ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          No activities yet
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="relative border-l-2 border-gray-200 pb-4 pl-4 dark:border-gray-700"
            >
              <div className="absolute top-0 -left-2 h-4 w-4 rounded-full border-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"></div>

              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getActivityTypeColor(activity.activity_type)}`}
                    >
                      {activity.activity_type || "note"}
                    </span>
                    {activity.priority && (
                      <span
                        className={`text-xs font-medium ${getPriorityColor(activity.priority)}`}
                      >
                        {activity.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(activity.activity_date)}
                  </span>
                </div>

                {activity.notes && (
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.notes}
                  </p>
                )}

                {activity.outcome && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Outcome:{" "}
                    </span>
                    <span className="text-xs text-gray-900 dark:text-white">
                      {activity.outcome}
                    </span>
                  </div>
                )}

                {activity.duration && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Duration:{" "}
                    </span>
                    <span className="text-xs text-gray-900 dark:text-white">
                      {activity.duration} minutes
                    </span>
                  </div>
                )}

                {activity.next_action && (
                  <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-800">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Next Action:
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {activity.next_action}
                    </div>
                    {activity.next_action_date && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {formatDate(activity.next_action_date)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
