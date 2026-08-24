import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  icon?: ComponentType<{ className?: string }>;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card p-5 text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-elevated",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </div>
  );
}
