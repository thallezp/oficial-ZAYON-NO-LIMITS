"use client";

import { Building2, Globe, Shield, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useTeam } from "@/hooks/use-queries";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { initials } from "@/lib/utils/format";
import { toast } from "sonner";
import type { User } from "@/types";

const roleColor = {
  owner: "primary",
  admin: "info",
  editor: "outline",
  viewer: "ghost",
  financeiro: "warning",
} as const;

export default function WorkspaceSettingsPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspace = useWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === s.activeWorkspaceId) ?? s.workspaces[0],
  );
  const { data: dbTeam = [] } = useTeam(activeWorkspaceId);
  const team: User[] =
    dbTeam;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace Settings"
        description="Identidade, membros, permissões e governança do workspace ativo."
        badge={<Badge variant="primary">{workspace?.name}</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Identidade
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input defaultValue={workspace?.name} />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input defaultValue={workspace?.slug} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Descrição</Label>
            <Textarea defaultValue={workspace?.description} rows={2} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button
              variant="gradient"
              onClick={() => toast.success("Workspace atualizado")}
            >
              Salvar alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Membros e papéis
          </CardTitle>
          <Button variant="gradient" size="sm">
            Convidar membro
          </Button>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {team.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="Nenhum membro carregado"
              description="Os membros reais aparecem aqui assim que o workspace estiver vinculado no Supabase."
              className="border-0 bg-transparent"
            />
          ) : (
            team.map((u) => (
              <div key={u.id} className="flex items-center gap-4 p-4">
                <Avatar size="md">
                  <AvatarFallback>{initials(u.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{u.fullName}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Badge size="sm" variant={roleColor[u.role]}>
                  {u.role}
                </Badge>
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Governança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Toggle
            title="Realtime sincronização"
            description="Atualiza tarefas, leads e financeiro em tempo real."
            defaultChecked
          />
          <Toggle
            title="Logs de auditoria"
            description="Registra ações sensíveis: deletes, financeiro, IA, permissões."
            defaultChecked
          />
          <Toggle
            title="2FA obrigatório (owner / admin)"
            description="Exige autenticação em 2 fatores para papéis elevados."
            defaultChecked
          />
          <Toggle
            title="IA com ações reais"
            description="Permite que a IA execute mutações (criar tarefas, qualificar leads…)."
            defaultChecked
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> Domínios e SSO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Domínios confiáveis</Label>
            <Input defaultValue="zayon.team, equipe.zayon.team" />
            <p className="text-[11px] text-muted-foreground">
              Apenas emails desses domínios podem ser convidados.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card-elevated px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">SSO via Workspace identidade</p>
              <p className="text-xs text-muted-foreground">
                Google Workspace · ativo
              </p>
            </div>
            <Badge variant="success" size="sm">
              conectado
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" /> Zona perigosa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Arquivar workspace</p>
              <p className="text-xs text-muted-foreground">
                Dados ficam preservados, ninguém acessa.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Arquivar
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Excluir permanentemente</p>
              <p className="text-xs text-muted-foreground">
                Operação irreversível. Exige confirmação por email.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Excluir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Toggle({
  title,
  description,
  defaultChecked,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card-elevated px-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
