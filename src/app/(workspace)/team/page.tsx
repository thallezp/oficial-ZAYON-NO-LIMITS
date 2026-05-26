"use client";

import { Mail, Plus, Shield, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MOCK_USERS } from "@/data";
import { initials } from "@/lib/utils/format";

const roleColor = {
  owner: "primary",
  admin: "info",
  editor: "outline",
  viewer: "ghost",
  financeiro: "warning",
} as const;

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description="Membros do workspace, papéis e permissões."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Shield className="h-3.5 w-3.5" /> Permissões
            </Button>
            <Button variant="gradient" size="sm">
              <UserPlus className="h-4 w-4" /> Convidar
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-0 divide-y divide-border/60">
          {MOCK_USERS.map((u) => (
            <div key={u.id} className="flex items-center gap-4 p-4">
              <div className="relative">
                <Avatar size="md">
                  <AvatarFallback>{initials(u.fullName)}</AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card ${
                    u.online ? "bg-success" : "bg-muted-foreground/40"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{u.fullName}</p>
                  <Badge size="sm" variant={roleColor[u.role]}>
                    {u.role}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Button variant="ghost" size="icon-sm">
                <Mail className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
