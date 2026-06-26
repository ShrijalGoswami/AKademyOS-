import { Bell, Search } from "lucide-react";
import { SidebarToggle } from "@/components/layout/SidebarToggle";

interface Props {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: Props) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface/80 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarToggle />
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-bold text-text-primary">{title}</h1>
          {subtitle ? <p className="truncate text-sm text-text-secondary">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-48 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 lg:w-64"
          />
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:border-primary hover:text-primary"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
