"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { SessionGuard } from "@/components/shared/SessionGuard";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionGuard />
      {children}
    </SessionProvider>
  );
}
