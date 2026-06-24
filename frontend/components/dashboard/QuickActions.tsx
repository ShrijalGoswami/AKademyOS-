import { ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import { STUDENT_LINKS } from "@/lib/links";

const cardClass =
  "group flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary hover:shadow-md";

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STUDENT_LINKS.map(({ key, label, description, url, icon: Icon, internal }) => {
        const inner = (
          <>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              {internal ? (
                <ArrowRight className="h-4 w-4 text-text-muted transition-colors group-hover:text-primary" />
              ) : (
                <ExternalLink className="h-4 w-4 text-text-muted transition-colors group-hover:text-primary" />
              )}
            </div>
            <div>
              <p className="font-semibold text-text-primary">{label}</p>
              <p className="text-xs text-text-muted">{description}</p>
            </div>
          </>
        );

        // Internal routes navigate in the same tab via the Next router; external
        // tools still open in a new tab.
        return internal ? (
          <Link key={key} href={url} className={cardClass}>
            {inner}
          </Link>
        ) : (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cardClass}
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}
