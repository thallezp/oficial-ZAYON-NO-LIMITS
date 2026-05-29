"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { EntityFormDialog } from "@/components/forms/entity-form-dialog";
import { LeadDetailDrawer } from "@/components/tables/lead-detail-drawer";
import { MOCK_LEADS } from "@/data";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import {
  useArchiveLeadMutation,
  useCreateTaskMutation,
  useDeleteLeadMutation,
  useLeads,
  useTeam,
  useUpdateLeadMutation,
} from "@/hooks/use-queries";
import { useRealtimeLeads } from "@/hooks/use-realtime";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, initials, relativeTime } from "@/lib/utils/format";
import type { Lead } from "@/types";

const statusVariant = {
  open: "outline",
  approached: "primary",
  qualified: "info",
  converted: "success",
  lost: "danger",
  no_response: "ghost",
} as const;

const statusLabel = {
  open: "Aberto",
  approached: "Abordado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
  no_response: "Sem resposta",
} as const;

export default function LeadsPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const { openWith } = useQuickCreate();
  const queryClient = useQueryClient();
  const { data: dbLeads = [] } = useLeads(activeWorkspaceId, persona.id);
  const { data: team = [] } = useTeam(activeWorkspaceId);
  const updateLeadMutation = useUpdateLeadMutation();
  const archiveLeadMutation = useArchiveLeadMutation();
  const deleteLeadMutation = useDeleteLeadMutation();
  const createTaskMutation = useCreateTaskMutation();
  useNewEntityShortcut("lead");

  useRealtimeLeads(activeWorkspaceId ?? undefined, persona.id, () => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  });

  const allLeads =
    isMockModeClient && dbLeads.length === 0
      ? MOCK_LEADS.filter((lead) => lead.personaId === persona.id)
      : dbLeads;

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");
  const [campaignFilter, setCampaignFilter] = React.useState<string>("all");
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [drawerLead, setDrawerLead] = React.useState<Lead | null>(null);
  const [editingLead, setEditingLead] = React.useState<Lead | null>(null);

  const sourceOptions = Array.from(
    new Set(allLeads.map((lead: any) => lead.source).filter(Boolean)),
  ) as string[];
  const campaignOptions = Array.from(
    new Set(allLeads.map((lead: any) => lead.campaign).filter(Boolean)),
  ) as string[];

  const leads = allLeads.filter((lead: any) => {
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    const matchesCampaign = campaignFilter === "all" || lead.campaign === campaignFilter;
    const haystack = [
      lead.name,
      lead.email,
      lead.phone,
      lead.instagram,
      lead.source,
      lead.campaign,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesStatus && matchesSource && matchesCampaign && (!search || haystack.includes(search.toLowerCase()));
  });

  const converted = allLeads.filter((lead: any) => lead.status === "converted");
  const totalRevenue = converted.reduce(
    (sum: number, lead: any) => sum + Number(lead.convertedValue ?? 0),
    0,
  );
  const averageScore = Math.round(
    allLeads.reduce((sum: number, lead: any) => sum + Number(lead.score ?? 0), 0) /
      Math.max(allLeads.length, 1),
  );

  const copyValue = async (value?: string | null, label = "Copiado") => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success(label);
  };

  const openWhatsApp = (lead: Lead) => {
    if (!lead.phone) return;
    const clean = lead.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${clean}`, "_blank", "noopener,noreferrer");
  };

  const createFollowUpTask = async (lead: Lead) => {
    if (!activeWorkspaceId) return;
    try {
      await createTaskMutation.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: persona.id,
        title: `Follow-up lead · ${lead.name || "sem nome"}`,
        description: `Origem: ${lead.source || "manual"}\nCampanha: ${lead.campaign || "sem campanha"}`,
        priority: "medium",
        status: "todo",
        relatedEntity: { type: "lead", id: lead.id, title: lead.name || "Lead" },
      });
      toast.success("Tarefa criada e vinculada ao lead");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar tarefa");
    }
  };

  const generateApproach = async (lead: Lead) => {
    try {
      const response = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "lead-approach",
          input: {
            name: lead.name,
            campaign: lead.campaign,
            source: lead.source,
            primaryPain: lead.answers?.[0]?.answer ?? lead.notes,
            answers: lead.answers,
          },
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Erro ao gerar abordagem");
      await navigator.clipboard.writeText(json.data.text);
      toast.success("Abordagem copiada para a área de transferência");
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar abordagem");
    }
  };

  const qualifyVisibleLeads = async () => {
    try {
      await Promise.all(
        leads.map(async (lead: any) => {
          const response = await fetch("/api/generate-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "lead-qualification",
              input: {
                name: lead.name,
                source: lead.source,
                campaign: lead.campaign,
                notes: lead.notes,
                answers: lead.answers,
                email: lead.email,
                phone: lead.phone,
              },
            }),
          });
          const json = await response.json();
          if (!response.ok || !json.ok) {
            throw new Error(json.error || "Erro na qualificação");
          }

          await updateLeadMutation.mutateAsync({
            id: lead.id,
            input: {
              score: json.data.score,
              status: json.data.status,
              notes: [lead.notes, `IA: ${json.data.rationale}`].filter(Boolean).join("\n\n"),
            },
          });
        }),
      );
      toast.success(`IA qualificou ${leads.length} leads`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao qualificar leads");
    }
  };

  const saveLeadEdit = async (values: Record<string, string>) => {
    if (!editingLead) return;
    await updateLeadMutation.mutateAsync({
      id: editingLead.id,
        input: {
          name: values.name,
          email: values.email || null,
          phone: values.phone || null,
          instagram: values.instagram || null,
          source: values.source || null,
          campaign: values.campaign || null,
          status: values.status || "open",
          score: values.score ? Number(values.score) : 0,
          responsibleId: values.responsibleId && values.responsibleId !== "__none__" ? values.responsibleId : null,
          notes: values.notes || null,
        },
      });
    toast.success("Lead atualizado");
    setEditingLead(null);
  };

  const archiveLead = async (lead: Lead) => {
    try {
      await archiveLeadMutation.mutateAsync(lead.id);
      toast.success("Lead arquivado");
    } catch (error: any) {
      toast.error(error.message || "Erro ao arquivar lead");
    }
  };

  const deleteLead = async (lead: Lead) => {
    if (!window.confirm(`Excluir o lead ${lead.name || "sem nome"}?`)) return;
    try {
      await deleteLeadMutation.mutateAsync(lead.id);
      toast.success("Lead excluído");
      if (drawerLead?.id === lead.id) setDrawerLead(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir lead");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="CRM prático por persona, com qualificação, histórico, comentários e follow-up operacional."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeWorkspaceId) {
                  window.open(
                    `/api/exports/leads?workspaceId=${activeWorkspaceId}&personaId=${persona.id}`,
                    "_blank",
                  );
                }
              }}
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={qualifyVisibleLeads} disabled={!leads.length}>
              <Wand2 className="h-3.5 w-3.5" /> Qualificar com IA
            </Button>
            <Button variant="gradient" size="sm" onClick={() => openWith("lead")}>
              <Plus className="h-4 w-4" /> Novo lead
            </Button>
          </>
        }
      />

      <PersonaHero persona={persona} pageBadge="leads" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total de leads"
          value={String(allLeads.length)}
          icon={<ArrowUpRight className="h-4 w-4" />}
          accent="primary"
        />
        <StatCard
          label="Qualificados"
          value={String(allLeads.filter((lead: any) => ["qualified", "converted"].includes(lead.status)).length)}
          icon={<Sparkles className="h-4 w-4" />}
          accent="success"
        />
        <StatCard
          label="Convertidos"
          value={String(converted.length)}
          icon={<ArrowUpRight className="h-4 w-4" />}
          accent="success"
          hint={`receita ${formatCurrency(totalRevenue)}`}
        />
        <StatCard
          label="Score médio"
          value={String(averageScore)}
          icon={<Sparkles className="h-4 w-4" />}
          accent="info"
          hint={`persona ${persona.name}`}
        />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar nome, email, telefone, origem..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusLabel).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                {sourceOptions.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Campanha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as campanhas</SelectItem>
                {campaignOptions.map((campaign) => (
                  <SelectItem key={campaign} value={campaign}>
                    {campaign}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant="outline">persona {persona.name}</Badge>
            <Badge variant="outline">{leads.length} visíveis</Badge>
            {sourceFilter !== "all" ? <Badge variant="ghost">origem {sourceFilter}</Badge> : null}
            {campaignFilter !== "all" ? <Badge variant="ghost">campanha {campaignFilter}</Badge> : null}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="w-8 px-3 py-2.5"></th>
                  <th className="px-3 py-2.5">Lead</th>
                  <th className="px-3 py-2.5">Contato</th>
                  <th className="px-3 py-2.5">Origem</th>
                  <th className="px-3 py-2.5">Campanha</th>
                  <th className="px-3 py-2.5">Score</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Resp.</th>
                  <th className="px-3 py-2.5">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {leads.map((lead: any) => {
                  const isOpen = expanded === lead.id;
                  return (
                    <React.Fragment key={lead.id}>
                      <tr className="hover:bg-accent/40">
                        <td
                          className="cursor-pointer px-3 py-2.5"
                          onClick={() => setExpanded(isOpen ? null : lead.id)}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </td>
                        <td className="cursor-pointer px-3 py-2.5" onClick={() => setDrawerLead(lead)}>
                          <div className="flex items-center gap-2">
                            <Avatar size="xs">
                              <AvatarFallback>{initials(lead.name ?? "?")}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{lead.name || "Sem nome"}</p>
                              <p className="truncate text-[10px] text-muted-foreground">
                                {lead.answers?.[0]?.answer || "Sem resposta principal"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                          <div className="space-y-1">
                            {lead.phone ? <p>{lead.phone}</p> : null}
                            {lead.email ? <p>{lead.email}</p> : null}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                          {lead.source || "manual"}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                          {lead.campaign || "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-12 overflow-hidden rounded-full bg-secondary">
                              <div
                                className={cn(
                                  "h-full",
                                  (lead.score ?? 0) > 80
                                    ? "bg-success"
                                    : (lead.score ?? 0) > 60
                                      ? "bg-warning"
                                      : "bg-muted-foreground",
                                )}
                                style={{ width: `${lead.score ?? 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{lead.score ?? 0}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge size="sm" variant={statusVariant[lead.status as keyof typeof statusVariant] || "outline"}>
                            {statusLabel[lead.status as keyof typeof statusLabel] || lead.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                          {lead.responsible?.fullName || "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openWhatsApp(lead)}>
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyValue(lead.phone, "Telefone copiado")}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => generateApproach(lead)}>
                              <Wand2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr>
                          <td colSpan={9} className="bg-card/60 px-6 py-4">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="grid gap-4 md:grid-cols-2"
                            >
                              <div className="space-y-3">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Respostas completas
                                </p>
                                {lead.answers?.length ? (
                                  lead.answers.map((answer: any, index: number) => (
                                    <div key={`${answer.question}-${index}`}>
                                      <p className="text-[11px] text-muted-foreground">{answer.question}</p>
                                      <p className="text-sm italic">"{answer.answer}"</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground">Sem respostas registradas.</p>
                                )}
                              </div>
                              <div className="space-y-3">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Observações e histórico
                                </p>
                                <p className="text-sm whitespace-pre-line">
                                  {lead.notes || "Sem observações"}
                                </p>
                                <div className="space-y-1">
                                  {lead.history?.slice(0, 3).map((item: any) => (
                                    <div key={item.id} className="text-xs text-muted-foreground">
                                      {statusLabel[item.toStatus as keyof typeof statusLabel] || item.toStatus} · {relativeTime(item.changedAt)}
                                    </div>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                  <Button size="sm" variant="gradient" onClick={() => setDrawerLead(lead)}>
                                    Abrir detalhes <ArrowUpRight className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => createFollowUpTask(lead)}>
                                    Criar tarefa
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingLead(lead)}>
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      updateLeadMutation.mutateAsync({
                                        id: lead.id,
                                        input: { status: "converted" },
                                      }).then(() => toast.success("Lead marcado como convertido"))
                                    }
                                  >
                                    Converter
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => archiveLead(lead)}>
                                    Arquivar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => deleteLead(lead)}>
                                    <Trash2 className="h-3 w-3" /> Excluir
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <LeadDetailDrawer
        lead={drawerLead}
        open={!!drawerLead}
        onOpenChange={(nextOpen) => !nextOpen && setDrawerLead(null)}
        onEdit={(lead) => setEditingLead(lead)}
        onCreateTask={(lead) => createFollowUpTask(lead)}
      />

      <EntityFormDialog
        open={!!editingLead}
        onOpenChange={(nextOpen) => !nextOpen && setEditingLead(null)}
        title={`Editar lead${editingLead?.name ? ` · ${editingLead.name}` : ""}`}
        description="Atualize dados, responsável, score e contexto do lead."
        submitLabel="Salvar lead"
        values={
          editingLead
            ? {
                name: editingLead.name || "",
                email: editingLead.email || "",
                phone: editingLead.phone || "",
                instagram: editingLead.instagram || "",
                source: editingLead.source || "",
                campaign: editingLead.campaign || "",
                status: editingLead.status,
                score: String(editingLead.score ?? 0),
                responsibleId: editingLead.responsibleId || "__none__",
                notes: editingLead.notes || "",
              }
            : undefined
        }
        fields={[
          { name: "name", label: "Nome", type: "text", required: true },
          { name: "email", label: "Email", type: "text" },
          { name: "phone", label: "Telefone", type: "text" },
          { name: "instagram", label: "Instagram", type: "text" },
          { name: "source", label: "Origem", type: "text" },
          { name: "campaign", label: "Campanha", type: "text" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: Object.entries(statusLabel).map(([value, label]) => ({ value, label })),
          },
          { name: "score", label: "Score", type: "number" },
          {
            name: "responsibleId",
            label: "Responsável",
            type: "select",
            options: [
              { value: "__none__", label: "Sem responsável" },
              ...team.map((member: any) => ({
                value: member.id,
                label: member.fullName || member.email,
              })),
            ],
          },
          { name: "notes", label: "Observações", type: "textarea", colSpan: 2 },
        ]}
        onSubmit={saveLeadEdit}
      />
    </div>
  );
}
