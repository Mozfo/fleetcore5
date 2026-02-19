/**
 * Pipeline Status Config — Single source of truth for status colors.
 *
 * All classes use CSS variable tokens (--status-*) defined in globals.css.
 * Tailwind 4 OKLCH opacity modifiers work automatically (e.g. bg-status-demo/10).
 *
 * NO hardcoded Tailwind colors allowed here.
 */

export interface StatusColorConfig {
  /** Solid background: bg-status-demo */
  bg: string;
  /** Subtle background (10% opacity): bg-status-demo/10 */
  bgSubtle: string;
  /** Medium background (20% opacity): bg-status-demo/20 */
  bgMedium: string;
  /** Text color: text-status-demo */
  text: string;
  /** Solid border: border-status-demo */
  border: string;
  /** Left border accent: border-l-status-demo */
  borderLeft: string;
  /** Subtle border (30% opacity): border-status-demo/30 */
  borderSubtle: string;
}

/**
 * Status → token class mapping.
 *
 * Statuses with dedicated pipeline tokens:
 *   callback_requested, demo, proposal_sent, converted, lost, nurturing
 *
 * Other statuses (new, email_verified, payment_pending, disqualified)
 * use generic semantic tokens (primary, muted, destructive, chart-*).
 */
export const PIPELINE_STATUS: Record<string, StatusColorConfig> = {
  new: {
    bg: "bg-primary",
    bgSubtle: "bg-primary/10",
    bgMedium: "bg-primary/20",
    text: "text-primary",
    border: "border-primary",
    borderLeft: "border-l-primary",
    borderSubtle: "border-primary/30",
  },
  email_verified: {
    bg: "bg-chart-2",
    bgSubtle: "bg-chart-2/10",
    bgMedium: "bg-chart-2/20",
    text: "text-chart-2",
    border: "border-chart-2",
    borderLeft: "border-l-chart-2",
    borderSubtle: "border-chart-2/30",
  },
  callback_requested: {
    bg: "bg-status-callback",
    bgSubtle: "bg-status-callback/10",
    bgMedium: "bg-status-callback/20",
    text: "text-status-callback",
    border: "border-status-callback",
    borderLeft: "border-l-status-callback",
    borderSubtle: "border-status-callback/30",
  },
  demo: {
    bg: "bg-status-demo",
    bgSubtle: "bg-status-demo/10",
    bgMedium: "bg-status-demo/20",
    text: "text-status-demo",
    border: "border-status-demo",
    borderLeft: "border-l-status-demo",
    borderSubtle: "border-status-demo/30",
  },
  proposal_sent: {
    bg: "bg-status-proposal",
    bgSubtle: "bg-status-proposal/10",
    bgMedium: "bg-status-proposal/20",
    text: "text-status-proposal",
    border: "border-status-proposal",
    borderLeft: "border-l-status-proposal",
    borderSubtle: "border-status-proposal/30",
  },
  payment_pending: {
    bg: "bg-status-proposal",
    bgSubtle: "bg-status-proposal/10",
    bgMedium: "bg-status-proposal/20",
    text: "text-status-proposal",
    border: "border-status-proposal",
    borderLeft: "border-l-status-proposal",
    borderSubtle: "border-status-proposal/30",
  },
  converted: {
    bg: "bg-status-converted",
    bgSubtle: "bg-status-converted/10",
    bgMedium: "bg-status-converted/20",
    text: "text-status-converted",
    border: "border-status-converted",
    borderLeft: "border-l-status-converted",
    borderSubtle: "border-status-converted/30",
  },
  lost: {
    bg: "bg-status-lost",
    bgSubtle: "bg-status-lost/10",
    bgMedium: "bg-status-lost/20",
    text: "text-status-lost",
    border: "border-status-lost",
    borderLeft: "border-l-status-lost",
    borderSubtle: "border-status-lost/30",
  },
  nurturing: {
    bg: "bg-status-nurturing",
    bgSubtle: "bg-status-nurturing/10",
    bgMedium: "bg-status-nurturing/20",
    text: "text-status-nurturing",
    border: "border-status-nurturing",
    borderLeft: "border-l-status-nurturing",
    borderSubtle: "border-status-nurturing/30",
  },
  disqualified: {
    bg: "bg-muted-foreground",
    bgSubtle: "bg-muted-foreground/10",
    bgMedium: "bg-muted-foreground/20",
    text: "text-muted-foreground",
    border: "border-muted-foreground",
    borderLeft: "border-l-muted-foreground",
    borderSubtle: "border-muted-foreground/30",
  },
};

const DEFAULT_STATUS: StatusColorConfig = {
  bg: "bg-muted-foreground",
  bgSubtle: "bg-muted-foreground/10",
  bgMedium: "bg-muted-foreground/20",
  text: "text-muted-foreground",
  border: "border-muted-foreground",
  borderLeft: "border-l-muted-foreground",
  borderSubtle: "border-muted-foreground/30",
};

/** Get the full color config for a status, with fallback */
export function getStatusConfig(status: string): StatusColorConfig {
  return PIPELINE_STATUS[status] || DEFAULT_STATUS;
}

/**
 * Phase color mapping (Kanban column headers).
 * Maps phase id → status token for consistent theming.
 */
export const PHASE_STATUS_MAP: Record<string, StatusColorConfig> = {
  contact: PIPELINE_STATUS.callback_requested,
  demo: PIPELINE_STATUS.demo,
  proposal: PIPELINE_STATUS.proposal_sent,
  finalized: PIPELINE_STATUS.converted,
};

export function getPhaseConfig(phaseId: string): StatusColorConfig {
  return PHASE_STATUS_MAP[phaseId] || DEFAULT_STATUS;
}
