import { cn } from "@/lib/utils";

const TONES = {
  green: "bg-primary/10 text-primary",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  red: "bg-destructive/10 text-destructive",
  blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  gray: "bg-muted text-muted-foreground",
} as const;

type Tone = keyof typeof TONES;

const STATUS_TONE: Record<string, Tone> = {
  // green — success / done
  ACTIVE: "green", VERIFIED: "green", APPROVED: "green", COMPLETED: "green",
  CONFIRMED: "green", ATTENDED: "green", FINISHED: "green",
  // amber — waiting
  PENDING: "amber", WAITLISTED: "amber", FULL: "amber",
  // blue — in flight
  OPEN: "blue", ONGOING: "blue", SCHEDULED: "blue", IN_PROGRESS: "blue", REGISTERED: "blue",
  // red — negative
  REJECTED: "red", CANCELLED: "red", SUSPENDED: "red", NO_SHOW: "red",
  // gray — inactive
  EXPIRED: "gray", DEACTIVATED: "gray", CLOSED: "gray", DRAFT: "gray", WITHDRAWN: "gray",
};

function humanize(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONE[status] ?? "gray";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {humanize(status)}
    </span>
  );
}
