import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const supabase = getAdminClient();
      const { data } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", user.email)
        .single();
      return !!data;
    },

    async jwt({ token, trigger }) {
      if (trigger === "signIn" || !token.role) {
        const supabase = getAdminClient();
        const { data } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("email", token.email)
          .single();
        if (data) {
          token.role = data.role as "student" | "admin" | "teacher" | "parent";
          token.userId = data.id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.email) {
        console.log("[NextAuth Session Callback] Checking session for email:", token.email);
        const supabase = getAdminClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("id, role, full_name")
          .ilike("email", token.email)
          .single();

        if (error) {
          console.error("[NextAuth Session Callback] Database error or profile not found:", error.message);
        }

        if (!data) {
          console.warn("[NextAuth Session Callback] Invalidating session because profile was not found.");
          return null as any;
        }

        console.log("[NextAuth Session Callback] Profile found. Role:", data.role, "Name:", data.full_name);
        session.user.role = data.role as "student" | "admin" | "teacher" | "parent";
        session.user.id = data.id;
        session.user.name = data.full_name || session.user.name;
      } else {
        console.warn("[NextAuth Session Callback] Missing session.user or token.email. User:", !!session.user, "Email:", token.email);
      }
      return session;
    },
  },
};
