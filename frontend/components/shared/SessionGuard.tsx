"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

/**
 * Ends the session when a closed tab is reopened.
 *
 * NextAuth stores the session in a persistent cookie, so a tab close does not
 * log the user out on its own. We pair that cookie with a sessionStorage flag
 * (set at login in LoginButton) which the browser clears on tab close. If we
 * are authenticated by the cookie but the flag is missing, the tab was closed
 * and reopened, so we sign out to clear the cookie and return to the login
 * page. A normal page refresh keeps the flag (same tab session), so it does
 * NOT log the user out.
 *
 * Renders nothing.
 */
export function SessionGuard() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (sessionStorage.getItem("isLoggedIn") !== "true") {
      signOut({ callbackUrl: "/" });
    }
  }, [status]);

  return null;
}
