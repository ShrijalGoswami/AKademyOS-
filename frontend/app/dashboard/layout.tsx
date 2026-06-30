import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          name={session.user.name ?? null}
          email={session.user.email ?? null}
          image={session.user.image ?? null}
          role={session.user.role}
        />
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </div>
    </SidebarProvider>
  );
}
