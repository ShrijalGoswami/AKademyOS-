"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/components/layout/SidebarContext";

export function SidebarToggle() {
  const { toggle } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Open menu"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:border-primary hover:text-primary md:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
