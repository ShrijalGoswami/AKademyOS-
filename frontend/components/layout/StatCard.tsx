import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  value: string | number;
  label: string;
  sublabel?: string;
  /** tailwind text color class for the icon, e.g. "text-primary" */
  iconColor?: string;
  /** tailwind bg color class for the icon chip, e.g. "bg-primary/10" */
  iconBg?: string;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  sublabel,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="font-heading text-2xl font-bold leading-tight text-text-primary">{value}</p>
        <p className="truncate text-sm text-text-secondary">{label}</p>
        {sublabel ? <p className="truncate text-xs text-text-muted">{sublabel}</p> : null}
      </div>
    </div>
  );
}
