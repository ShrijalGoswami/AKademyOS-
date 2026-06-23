"use client";

import { signOut } from "next-auth/react";
import { LogOut, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  name: string | null;
  email: string | null;
  image: string | null;
}

export function AdminHeader({ name, email, image }: Props) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 ring-2 ring-accent/30">
          <AvatarImage src={image ?? undefined} alt={name ?? "Admin"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-bold text-text-primary">{name ?? "Admin"}</h1>
            <Badge variant="warning" className="gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          </div>
          <p className="text-sm text-text-secondary">{email}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
