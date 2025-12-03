export type ActivityType =
  | "call"
  | "email"
  | "note"
  | "meeting"
  | "stage_change"
  | "status_change"
  | "task"
  | "system";

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: ActivityType;
  title: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  scheduled_at: string | null;
  completed_at: string | null;
  is_completed: boolean;
  performed_by: string | null;
  performed_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  call: "Phone",
  email: "Mail",
  note: "FileText",
  meeting: "Calendar",
  stage_change: "TrendingUp",
  status_change: "RefreshCw",
  task: "CheckSquare",
  system: "Settings",
};

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  call: "text-blue-500 bg-blue-50 dark:bg-blue-950",
  email: "text-purple-500 bg-purple-50 dark:bg-purple-950",
  note: "text-amber-500 bg-amber-50 dark:bg-amber-950",
  meeting: "text-green-500 bg-green-50 dark:bg-green-950",
  stage_change: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950",
  status_change: "text-orange-500 bg-orange-50 dark:bg-orange-950",
  task: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950",
  system: "text-gray-500 bg-gray-50 dark:bg-gray-950",
};
