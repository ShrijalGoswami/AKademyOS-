"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  Upload,
  LinkIcon,
  LineChart,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV: Record<"student" | "admin", NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
    { label: "My Scores", href: "/dashboard/student#scores", icon: LineChart },
    { label: "Quick Links", href: "/dashboard/student#quick-links", icon: LinkIcon },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Students", href: "/dashboard/admin#students", icon: Users },
    { label: "Imports", href: "/dashboard/admin#imports", icon: Upload },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  student: "Student",
  admin: "Administrator",
  teacher: "Teacher",
  parent: "Parent",
};

interface Props {
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
}

export function Sidebar({ name, email, image, role }: Props) {
  const pathname = usePathname();
  const items = NAV[role === "admin" ? "admin" : "student"];
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : role === "admin"
    ? "AD"
    : "ST";

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-[#09261E] text-white/90">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <BookOpen className="h-5 w-5 text-accent" />
        </div>
        <div className="leading-tight">
          <p className="font-heading text-base font-bold text-white">AKademy38</p>
          <p className="text-[10px] uppercase tracking-wider text-white/50">Education Portal</p>
        </div>
      </div>

      {/* User */}
      <div className="mx-3 mb-2 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name ?? "User"} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-medium text-accent">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{name ?? email ?? "User"}</p>
          <p className="truncate text-xs text-accent">{ROLE_LABEL[role]}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Main
        </p>
        {items.map((item) => {
          const active = pathname === item.href.split("#")[0] && item.href === items[0].href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-2 px-3 py-4">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/70">
          <span className="h-2 w-2 rounded-full bg-accent" />
          Backend Connected
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
