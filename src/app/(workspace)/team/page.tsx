"use client";

import * as React from "react";
import {
  Copy,
  Crown,
  Mail,
  MoreVertical,
  Shield,
  Trash2,
  UserCog,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initials } from "@/lib/utils/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useTeam,
  useUpdateMemberMutation,
  useRemoveMemberMutation,
  useTransferOwnershipMutation,
} from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { toast } from "sonner";

const ROLES: { value: "owner" | "admin" | "editor" | "viewer" | "financeiro"; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "financeiro", label: "Financeiro" },
  { value: "viewer", label: "Visualizador" },
];

const roleColor: Record<string, "primary" | "info" | "outline" | "ghost" | "warning"> = {
  owner: "primary",
  admin: "info",
  editor: "outline",
  viewer: "ghost",
  financeiro: "warning",
};

export default function TeamPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const currentUser = useWorkspaceStore((s) => s.user);
  const { data: dbTeam = [] } = useTeam(activeWorkspaceId);
  const openQuickCreate = useQuickCreate((s) => s.openWith);
  const updateMember = useUpdateMemberMutation();
  const removeMember = useRemoveMemberMutation();
  const transferOwnership = useTransferOwnershipMutation();

  const [confirmRemove, setConfirmRemove] = React.useState<any | null>(null);
  const [editingRole, setEditingRole] = React.useState<any | null>(null);
  const [transferTo, setTransferTo] = React.useState<any | null>(null);

  const team = dbTeam as any[];
  const owners = team.filter((u) => u.role === "owner");
  const onlyOwner = owners.length === 1;

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Email copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleRoleChange = async (member: any, role: any) => {
    if (!activeWorkspaceId) return;
    if (member.role === "owner" && role !== "owner" && onlyOwner) {
      toast.error("Não é possível rebaixar o único owner. Use Transferir propriedade.");
      return;
    }
    try {
      await updateMember.mutateAsync({
        workspaceId: activeWorkspaceId,
        userId: member.id,
        role,
      });
      toast.success(`Papel alterado para ${role}`);
      setEditingRole(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao alterar papel");
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove || !activeWorkspaceId) return;
    try {
      await removeMember.mutateAsync({
        workspaceId: activeWorkspaceId,
        userId: confirmRemove.id,
      });
      toast.success(`${confirmRemove.fullName} foi removido(a) do workspace`);
      setConfirmRemove(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao remover membro");
    }
  };

  const handleTransfer = async () => {
    if (!transferTo || !activeWorkspaceId) return;
    try {
      await transferOwnership.mutateAsync({
        workspaceId: activeWorkspaceId,
        newOwnerId: transferTo.id,
      });
      toast.success(`Propriedade transferida para ${transferTo.fullName}`);
      setTransferTo(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao transferir propriedade");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description="Membros do workspace, papéis e permissões. Owner pode transferir propriedade ou remover membros."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Shield className="h-3.5 w-3.5" /> Permissões
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => openQuickCreate("invite")}
            >
              <UserPlus className="h-4 w-4" /> Convidar Membro
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-0 divide-y divide-border/60">
          {team.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium">Nenhum membro neste workspace.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Convide alguém clicando em "Convidar Membro".
              </p>
            </div>
          )}
          {team.map((u: any) => {
            const isCurrent = u.id === currentUser?.id;
            const isOnlyOwner = u.role === "owner" && onlyOwner;
            return (
              <div key={u.id} className="flex items-center gap-4 p-4">
                <div className="relative">
                  <Avatar size="md">
                    {u.avatarUrl && (
                      <AvatarImage src={u.avatarUrl} alt={u.fullName} />
                    )}
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
                    <p className="font-medium truncate">
                      {u.fullName}
                      {isCurrent && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                          (você)
                        </span>
                      )}
                    </p>
                    <Badge size="sm" variant={roleColor[u.role] ?? "ghost"}>
                      {u.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleCopyEmail(u.email)}
                  title="Copiar email"
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{u.fullName}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setEditingRole(u)}>
                      <UserCog className="h-4 w-4" /> Editar papel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCopyEmail(u.email)}>
                      <Copy className="h-4 w-4" /> Copiar email
                    </DropdownMenuItem>
                    {u.role !== "owner" && (
                      <DropdownMenuItem
                        onClick={() => setTransferTo(u)}
                        disabled={
                          currentUser?.role !== "owner" && currentUser?.id !== u.id
                        }
                      >
                        <Crown className="h-4 w-4" /> Transferir propriedade para
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      disabled={isOnlyOwner || isCurrent}
                      onClick={() => setConfirmRemove(u)}
                    >
                      <UserMinus className="h-4 w-4" />
                      {isOnlyOwner
                        ? "Único owner — bloqueado"
                        : isCurrent
                          ? "Você (sair do workspace)"
                          : "Remover do workspace"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Modal de edicao de papel */}
      <Dialog open={!!editingRole} onOpenChange={(o) => !o && setEditingRole(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-4 w-4" /> Editar papel
            </DialogTitle>
            <DialogDescription>
              {editingRole?.fullName} — papel atual: {editingRole?.role}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Novo papel</Label>
            <Select
              value={editingRole?.role}
              onValueChange={(v) => handleRoleChange(editingRole, v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmacao de remocao */}
      <Dialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Remover membro
            </DialogTitle>
            <DialogDescription>
              {confirmRemove?.fullName} perderá acesso a este workspace, suas
              tarefas e documentos. A conta global no Zayon permanece. Esta ação
              registra um log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? "Removendo..." : "Confirmar remoção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de transferencia */}
      <Dialog open={!!transferTo} onOpenChange={(o) => !o && setTransferTo(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-warning" /> Transferir propriedade
            </DialogTitle>
            <DialogDescription>
              {transferTo?.fullName} se tornará o novo owner. Você será rebaixado
              para admin e poderá ser removido pelo novo owner. Esta ação é
              irreversível sem que o novo owner transfira de volta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferTo(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleTransfer}
              variant="gradient"
              disabled={transferOwnership.isPending}
            >
              {transferOwnership.isPending ? "Transferindo..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
