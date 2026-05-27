"use client";

import { Mail, Plus, Shield, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_USERS } from "@/data";
import { initials } from "@/lib/utils/format";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useTeam } from "@/hooks/use-queries";
import { toast } from "sonner";

const roleColor = {
  owner: "primary",
  admin: "info",
  editor: "outline",
  viewer: "ghost",
  financeiro: "warning",
} as const;

export default function TeamPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbTeam = [] } = useTeam(activeWorkspaceId);

  const team = isMockModeClient && dbTeam.length === 0 ? MOCK_USERS : dbTeam;

  const handleInvite = () => {
    const email = prompt("Digite o e-mail do membro que deseja convidar:");
    if (email?.trim()) {
      toast.success(`Convite enviado para ${email}!`, {
        description: "O membro receberá um e-mail de acesso em instantes.",
      });
    }
  };

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
            <Button variant="gradient" size="sm" onClick={handleInvite}>
              <UserPlus className="h-4 w-4" /> Convidar
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-0 divide-y divide-border/60">
          {team.map((u: any) => (
            <div key={u.id} className="flex items-center gap-4 p-4">
              <div className="relative">
                <Avatar size="md">
                  {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.fullName} />}
                  <AvatarFallback>{initials(u.fullName)}</AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card ${
                    (u as any).online ? "bg-success" : "bg-muted-foreground/40"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{u.fullName}</p>
                  <Badge size="sm" variant={roleColor[u.role as keyof typeof roleColor] || "ghost"}>
                    {u.role}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  toast.success(`Enviando mensagem para ${u.fullName} (${u.email})`);
                }}
              >
                <Mail className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
