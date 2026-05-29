"use client";

import * as React from "react";
import {
  Activity,
  Copy,
  Crown,
  FileText,
  History,
  ListChecks,
  Mail,
  MailWarning,
  MoreVertical,
  RefreshCcw,
  Send,
  Shield,
  Trash2,
  UserCog,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { initials, relativeTime } from "@/lib/utils/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useTeam,
  useUpdateMemberMutation,
  useRemoveMemberMutation,
  useTransferOwnershipMutation,
  useInvitations,
  useResendInvitationMutation,
  useCancelInvitationMutation,
  useUpdateMemberPermissionsMutation,
  useTasks,
  useDocuments,
  useActivityLogs,
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

const PERMISSION_RESOURCES: { key: string; label: string }[] = [
  { key: "content", label: "Conteúdo" },
  { key: "tasks", label: "Tarefas" },
  { key: "finance", label: "Financeiro" },
  { key: "leads", label: "Leads" },
  { key: "ai", label: "IA" },
  { key: "team", label: "Equipe" },
];

const PERMISSION_ACTIONS: { key: string; label: string }[] = [
  { key: "read", label: "Ler" },
  { key: "write", label: "Editar" },
  { key: "delete", label: "Excluir" },
];

const TEAM_LOG_ACTIONS = new Set([
  "member_invited",
  "member_added",
  "member_removed",
  "member_role_changed",
  "ownership_transferred",
  "invitation_resent",
  "invitation_cancelled",
  "member_permissions_changed",
]);

export default function TeamPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const currentUser = useWorkspaceStore((s) => s.user);
  const { data: dbTeam = [] } = useTeam(activeWorkspaceId);
  const { data: dbInvites = [] } = useInvitations(activeWorkspaceId);
  const { data: dbTasks = [] } = useTasks(activeWorkspaceId);
  const { data: dbDocuments = [] } = useDocuments(activeWorkspaceId);
  const { data: dbActivity = [] } = useActivityLogs(activeWorkspaceId);
  const openQuickCreate = useQuickCreate((s) => s.openWith);
  const updateMember = useUpdateMemberMutation();
  const removeMember = useRemoveMemberMutation();
  const transferOwnership = useTransferOwnershipMutation();
  const resendInvitation = useResendInvitationMutation();
  const cancelInvitation = useCancelInvitationMutation();
  const updateMemberPermissions = useUpdateMemberPermissionsMutation();

  const [confirmRemove, setConfirmRemove] = React.useState<any | null>(null);
  const [editingRole, setEditingRole] = React.useState<any | null>(null);
  const [editingPermissions, setEditingPermissions] = React.useState<any | null>(
    null,
  );
  const [permissionsDraft, setPermissionsDraft] = React.useState<
    Record<string, string[]>
  >({});
  const [transferTo, setTransferTo] = React.useState<any | null>(null);
  const [detailMember, setDetailMember] = React.useState<any | null>(null);
  const [logsOpen, setLogsOpen] = React.useState(false);
  const [confirmCancelInvite, setConfirmCancelInvite] = React.useState<any | null>(
    null,
  );

  const team = dbTeam as any[];
  const invites = dbInvites as any[];
  const tasks = dbTasks as any[];
  const documents = dbDocuments as any[];
  const activity = dbActivity as any[];
  const owners = team.filter((u) => u.role === "owner");
  const onlyOwner = owners.length === 1;

  const teamLogs = React.useMemo(
    () =>
      activity
        .filter((a) => TEAM_LOG_ACTIONS.has(a.action))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [activity],
  );

  const memberStats = React.useCallback(
    (memberId: string) => {
      const assignedTasks = tasks.filter(
        (t) => t.assigneeId === memberId || t.assignee?.id === memberId,
      );
      const openTasks = assignedTasks.filter((t) => t.status !== "done");
      const createdDocs = documents.filter(
        (d) => d.authorId === memberId || d.author_id === memberId,
      );
      const recentActivity = activity
        .filter((a) => a.actorId === memberId)
        .slice(0, 5);
      return {
        assignedTasks,
        openTasks,
        createdDocs,
        recentActivity,
      };
    },
    [tasks, documents, activity],
  );

  const getMemberPermissions = React.useCallback(
    (member: any): Record<string, string[]> => {
      const wsId = activeWorkspaceId;
      if (!wsId) return {};
      const stored = member?.metadata?.workspacePermissions?.[wsId] as
        | Record<string, string[]>
        | undefined;
      return stored ?? {};
    },
    [activeWorkspaceId],
  );

  const openPermissionsEditor = (member: any) => {
    setEditingPermissions(member);
    setPermissionsDraft(getMemberPermissions(member));
  };

  const togglePermission = (resource: string, action: string) => {
    setPermissionsDraft((prev) => {
      const current = prev[resource] ?? [];
      const next = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      const out = { ...prev };
      if (next.length === 0) delete out[resource];
      else out[resource] = next;
      return out;
    });
  };

  const handleSavePermissions = async () => {
    if (!editingPermissions || !activeWorkspaceId) return;
    try {
      await updateMemberPermissions.mutateAsync({
        workspaceId: activeWorkspaceId,
        userId: editingPermissions.id,
        permissions: permissionsDraft,
      });
      toast.success(`Permissões de ${editingPermissions.fullName} atualizadas`);
      setEditingPermissions(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao atualizar permissões");
    }
  };

  const handleResendInvite = async (invite: any) => {
    try {
      await resendInvitation.mutateAsync({ invitationId: invite.id });
      toast.success(`Convite reenviado para ${invite.email}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao reenviar convite");
    }
  };

  const handleCancelInvite = async () => {
    if (!confirmCancelInvite) return;
    try {
      await cancelInvitation.mutateAsync({
        invitationId: confirmCancelInvite.id,
      });
      toast.success(`Convite de ${confirmCancelInvite.email} cancelado`);
      setConfirmCancelInvite(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao cancelar convite");
    }
  };

  const handleSendEmail = (email: string, subject?: string) => {
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    const qs = params.toString();
    window.location.href = `mailto:${email}${qs ? `?${qs}` : ""}`;
  };

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
        description={`${team.length} membro${team.length === 1 ? "" : "s"} · ${invites.length} convite${invites.length === 1 ? "" : "s"} pendente${invites.length === 1 ? "" : "s"}. Owner pode transferir propriedade, alterar papéis e gerenciar permissões granulares.`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogsOpen(true)}
            >
              <History className="h-3.5 w-3.5" /> Logs ({teamLogs.length})
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

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MailWarning className="h-4 w-4 text-warning" />
              Convites pendentes ({invites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {invites.map((inv) => {
              const expired =
                inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now();
              return (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/10 text-warning">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{inv.email}</p>
                      <Badge size="sm" variant={roleColor[inv.role] ?? "ghost"}>
                        {inv.role}
                      </Badge>
                      {expired && (
                        <Badge size="sm" variant="danger">
                          expirado
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Convidado{inv.inviter?.fullName ? ` por ${inv.inviter.fullName}` : ""}{" "}
                      · {relativeTime(inv.createdAt)}
                      {inv.expiresAt
                        ? ` · expira ${relativeTime(inv.expiresAt)}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Enviar email"
                    onClick={() =>
                      handleSendEmail(inv.email, "Seu convite ZAYON")
                    }
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResendInvite(inv)}
                    disabled={resendInvitation.isPending}
                  >
                    <RefreshCcw className="h-3 w-3" /> Reenviar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmCancelInvite(inv)}
                  >
                    <X className="h-3 w-3" /> Cancelar
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

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
            const stats = memberStats(u.id);
            return (
              <div key={u.id} className="flex items-center gap-4 p-4">
                <button
                  className="relative shrink-0"
                  onClick={() => setDetailMember(u)}
                  title="Ver detalhes do membro"
                >
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
                    title={u.online ? "Online" : "Offline"}
                  />
                </button>
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => setDetailMember(u)}
                >
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
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ListChecks className="h-3 w-3" />
                      {stats.openTasks.length} aberta{stats.openTasks.length === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {stats.createdDocs.length} doc{stats.createdDocs.length === 1 ? "" : "s"}
                    </span>
                    {stats.recentActivity[0] && (
                      <span className="inline-flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        ativo {relativeTime(stats.recentActivity[0].createdAt)}
                      </span>
                    )}
                  </div>
                </button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleSendEmail(u.email)}
                  title="Enviar email"
                >
                  <Send className="h-3.5 w-3.5" />
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
                    <DropdownMenuItem onClick={() => setDetailMember(u)}>
                      <Activity className="h-4 w-4" /> Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingRole(u)}>
                      <UserCog className="h-4 w-4" /> Editar cargo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openPermissionsEditor(u)}>
                      <Shield className="h-4 w-4" /> Editar permissão
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSendEmail(u.email)}>
                      <Send className="h-4 w-4" /> Enviar email
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

      {/* Modal de detalhes do membro */}
      <Dialog
        open={!!detailMember}
        onOpenChange={(o) => !o && setDetailMember(null)}
      >
        <DialogContent className="max-w-lg">
          {detailMember &&
            (() => {
              const stats = memberStats(detailMember.id);
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <Avatar size="sm">
                        {detailMember.avatarUrl && (
                          <AvatarImage
                            src={detailMember.avatarUrl}
                            alt={detailMember.fullName}
                          />
                        )}
                        <AvatarFallback>
                          {initials(detailMember.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">
                          {detailMember.fullName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {detailMember.email} ·{" "}
                          <span
                            className={
                              detailMember.online
                                ? "text-success"
                                : "text-muted-foreground"
                            }
                          >
                            {detailMember.online ? "online" : "offline"}
                          </span>
                        </p>
                      </div>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border border-border/60 bg-card-elevated p-3">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                          Tarefas abertas
                        </p>
                        <p className="text-lg font-semibold mt-0.5">
                          {stats.openTasks.length}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {stats.assignedTasks.length} total
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card-elevated p-3">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                          Documentos
                        </p>
                        <p className="text-lg font-semibold mt-0.5">
                          {stats.createdDocs.length}
                        </p>
                        <p className="text-[10px] text-muted-foreground">criados</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card-elevated p-3">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                          Última atividade
                        </p>
                        <p className="text-xs font-semibold mt-1">
                          {stats.recentActivity[0]
                            ? relativeTime(stats.recentActivity[0].createdAt)
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                        <ListChecks className="h-3 w-3" /> Tarefas atribuídas
                      </p>
                      <div className="rounded-lg border border-border/60 divide-y divide-border/60 max-h-40 overflow-y-auto">
                        {stats.assignedTasks.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground p-3">
                            Nenhuma tarefa atribuída.
                          </p>
                        ) : (
                          stats.assignedTasks.slice(0, 8).map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between gap-2 px-3 py-2"
                            >
                              <p className="text-xs truncate">{t.title}</p>
                              <Badge
                                size="sm"
                                variant={
                                  t.status === "done"
                                    ? "success"
                                    : t.status === "doing"
                                      ? "primary"
                                      : "outline"
                                }
                              >
                                {t.status}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Documentos criados
                      </p>
                      <div className="rounded-lg border border-border/60 divide-y divide-border/60 max-h-40 overflow-y-auto">
                        {stats.createdDocs.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground p-3">
                            Nenhum documento criado.
                          </p>
                        ) : (
                          stats.createdDocs.slice(0, 8).map((d: any) => (
                            <a
                              key={d.id}
                              href={`/documents/${d.id}`}
                              className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-accent transition"
                            >
                              <p className="text-xs truncate">{d.title}</p>
                              <span className="text-[10px] text-muted-foreground">
                                {relativeTime(d.updatedAt ?? d.createdAt)}
                              </span>
                            </a>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                        <Activity className="h-3 w-3" /> Últimas atividades
                      </p>
                      <div className="rounded-lg border border-border/60 divide-y divide-border/60 max-h-40 overflow-y-auto">
                        {stats.recentActivity.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground p-3">
                            Sem atividade recente.
                          </p>
                        ) : (
                          stats.recentActivity.map((a) => (
                            <div key={a.id} className="px-3 py-2">
                              <p className="text-xs">
                                <span className="text-muted-foreground">
                                  {a.action}
                                </span>
                                {a.entityType && (
                                  <span className="ml-1 text-[10px] text-muted-foreground/60">
                                    · {a.entityType}
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60">
                                {relativeTime(a.createdAt)}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSendEmail(detailMember.email)}
                    >
                      <Send className="h-3.5 w-3.5" /> Enviar email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDetailMember(null);
                        openPermissionsEditor(detailMember);
                      }}
                    >
                      <Shield className="h-3.5 w-3.5" /> Permissões
                    </Button>
                    <Button onClick={() => setDetailMember(null)}>Fechar</Button>
                  </DialogFooter>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Modal de edição de permissão granular */}
      <Dialog
        open={!!editingPermissions}
        onOpenChange={(o) => !o && setEditingPermissions(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Editar permissões
            </DialogTitle>
            <DialogDescription>
              {editingPermissions?.fullName} · cargo:{" "}
              <span className="font-medium">{editingPermissions?.role}</span>.
              Marque o que este membro pode fazer em cada recurso.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-card-elevated">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Recurso
                  </th>
                  {PERMISSION_ACTIONS.map((a) => (
                    <th
                      key={a.key}
                      className="text-center px-3 py-2 font-medium text-muted-foreground"
                    >
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_RESOURCES.map((r) => (
                  <tr key={r.key} className="border-t border-border/60">
                    <td className="px-3 py-2">{r.label}</td>
                    {PERMISSION_ACTIONS.map((a) => {
                      const checked = (permissionsDraft[r.key] ?? []).includes(
                        a.key,
                      );
                      return (
                        <td key={a.key} className="text-center px-3 py-2">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5"
                            checked={checked}
                            onChange={() => togglePermission(r.key, a.key)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Permissões granulares ficam armazenadas em{" "}
            <code>users.metadata.workspacePermissions</code>. O cargo principal
            ({editingPermissions?.role}) define o baseline; estas marcações
            registram exceções por recurso.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingPermissions(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSavePermissions}
              disabled={updateMemberPermissions.isPending}
            >
              {updateMemberPermissions.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de cancelamento de convite */}
      <Dialog
        open={!!confirmCancelInvite}
        onOpenChange={(o) => !o && setConfirmCancelInvite(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <X className="h-4 w-4" /> Cancelar convite
            </DialogTitle>
            <DialogDescription>
              O convite para {confirmCancelInvite?.email} será removido e o link
              deixará de funcionar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmCancelInvite(null)}
            >
              Voltar
            </Button>
            <Button
              onClick={handleCancelInvite}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelInvitation.isPending}
            >
              {cancelInvitation.isPending ? "Cancelando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de logs de alterações */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Logs de alterações
            </DialogTitle>
            <DialogDescription>
              Auditoria de ações que afetam a equipe — convites, papéis,
              permissões, remoções e transferência de propriedade.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border/60 divide-y divide-border/60 max-h-96 overflow-y-auto">
            {teamLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">
                Sem registros ainda.
              </p>
            ) : (
              teamLogs.map((log) => (
                <div key={log.id} className="px-3 py-2 flex items-start gap-3">
                  <Avatar size="xs">
                    <AvatarFallback>
                      {initials(log.actor?.fullName ?? "??")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">
                      <span className="font-medium">
                        {log.actor?.fullName ?? "Sistema"}
                      </span>{" "}
                      <span className="text-muted-foreground">{log.action}</span>
                    </p>
                    {log.payload &&
                      Object.keys(log.payload).length > 0 && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {Object.entries(log.payload)
                            .map(([k, v]) => `${k}: ${String(v)}`)
                            .join(" · ")}
                        </p>
                      )}
                    <p className="text-[10px] text-muted-foreground/60">
                      {relativeTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setLogsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
