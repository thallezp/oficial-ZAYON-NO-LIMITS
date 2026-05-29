"use client";

import * as React from "react";
import {
  CalendarDays,
  Copy,
  FileText,
  Flame,
  FolderOpen,
  Link2,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityFormDialog } from "@/components/forms/entity-form-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_ICP_PAINS, MOCK_LAUNCH_CAMPAIGNS } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useArchiveLaunchCampaignMutation,
  useContent,
  useCreateIcpPainMutation,
  useCreateLaunchCampaignMutation,
  useCreateLaunchEventMutation,
  useCreateSalesCopyMutation,
  useDeleteIcpPainMutation,
  useDeleteLaunchCampaignMutation,
  useDeleteLaunchEventMutation,
  useDeleteSalesCopyMutation,
  useDocuments,
  useFunnel,
  useIcpPains,
  useLaunchCampaigns,
  useMaterials,
  useTasks,
  useUpdateIcpPainMutation,
  useUpdateLaunchCampaignMutation,
  useUpdateLaunchEventMutation,
  useUpdateSalesCopyMutation,
} from "@/hooks/use-queries";
import type { ICPPain, LaunchCampaign, LaunchPhaseKey, SalesCopy } from "@/types";

const painVariant = {
  pain: "danger",
  frustration: "warning",
  aspiration: "primary",
  objection: "info",
  desire: "success",
  fear: "outline",
} as const;

const painLabel = {
  pain: "Dor",
  frustration: "Frustração",
  aspiration: "Aspiração",
  objection: "Objeção",
  desire: "Desejo",
  fear: "Medo",
};

const phases: { key: LaunchPhaseKey; label: string }[] = [
  { key: "research", label: "Pesquisa" },
  { key: "warming", label: "Aquecimento" },
  { key: "capture", label: "Captação" },
  { key: "event", label: "Evento" },
  { key: "sale", label: "Venda" },
  { key: "closing", label: "Fechamento" },
  { key: "post_sale", label: "Pós-venda" },
];

const copyTypeOptions = [
  { value: "sales_page", label: "Página de venda" },
  { value: "creative_script", label: "Script de criativo" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "offer", label: "Oferta" },
  { value: "headline", label: "Headline" },
];

export default function LaunchPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const { data: dbCampaigns = [] } = useLaunchCampaigns(activeWorkspaceId, persona.id);
  const { data: dbPains = [] } = useIcpPains(persona.id);
  const { data: tasks = [] } = useTasks(activeWorkspaceId, persona.id);
  const { data: content = [] } = useContent(activeWorkspaceId, persona.id);
  const { data: documents = [] } = useDocuments(activeWorkspaceId, persona.id);
  const { data: materials = [] } = useMaterials(activeWorkspaceId, persona.id);
  const { data: funnel = null } = useFunnel(persona.id);

  const createCampaignMutation = useCreateLaunchCampaignMutation();
  const updateCampaignMutation = useUpdateLaunchCampaignMutation();
  const archiveCampaignMutation = useArchiveLaunchCampaignMutation();
  const deleteCampaignMutation = useDeleteLaunchCampaignMutation();
  const createEventMutation = useCreateLaunchEventMutation();
  const updateEventMutation = useUpdateLaunchEventMutation();
  const deleteEventMutation = useDeleteLaunchEventMutation();
  const createPainMutation = useCreateIcpPainMutation();
  const updatePainMutation = useUpdateIcpPainMutation();
  const deletePainMutation = useDeleteIcpPainMutation();
  const createCopyMutation = useCreateSalesCopyMutation();
  const updateCopyMutation = useUpdateSalesCopyMutation();
  const deleteCopyMutation = useDeleteSalesCopyMutation();

  const campaigns =
    isMockModeClient && dbCampaigns.length === 0
      ? MOCK_LAUNCH_CAMPAIGNS.filter((campaign) => campaign.personaId === persona.id)
      : dbCampaigns;

  const pains =
    isMockModeClient && dbPains.length === 0
      ? MOCK_ICP_PAINS.filter((pain) => pain.personaId === persona.id)
      : dbPains;

  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string | null>(campaigns[0]?.id ?? null);
  const [campaignDialogOpen, setCampaignDialogOpen] = React.useState(false);
  const [campaignDraft, setCampaignDraft] = React.useState<LaunchCampaign | null>(null);
  const [eventDraft, setEventDraft] = React.useState<any | null>(null);
  const [painDraft, setPainDraft] = React.useState<ICPPain | null>(null);
  const [copyDraft, setCopyDraft] = React.useState<SalesCopy | null>(null);

  React.useEffect(() => {
    if (!campaigns.length) {
      setSelectedCampaignId(null);
      return;
    }
    if (!selectedCampaignId || !campaigns.some((campaign: any) => campaign.id === selectedCampaignId)) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  const campaign = campaigns.find((item: any) => item.id === selectedCampaignId) ?? null;
  const linkedTaskIds = (campaign?.metadata as any)?.linkedTaskIds || [];
  const linkedContentIds = (campaign?.metadata as any)?.linkedContentIds || [];
  const linkedDocumentIds = (campaign?.metadata as any)?.linkedDocumentIds || [];
  const linkedMaterialIds = (campaign?.metadata as any)?.linkedMaterialIds || [];
  const linkedTasks = tasks.filter((task: any) => linkedTaskIds.includes(task.id));
  const linkedContent = content.filter((item: any) => linkedContentIds.includes(item.id));
  const linkedDocuments = documents.filter((item: any) => linkedDocumentIds.includes(item.id));
  const linkedMaterials = materials.filter((item: any) => linkedMaterialIds.includes(item.id));
  const selectedCopies = (campaign?.copies || []) as SalesCopy[];
  const selectedEvents = [...(campaign?.events || [])].sort(
    (left: any, right: any) =>
      new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
  );

  const createBlueprint = async () => {
    if (!activeWorkspaceId) return;
    try {
      const result = await createCampaignMutation.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: persona.id,
        name: `${persona.name} · lançamento principal`,
        description: "Blueprint inicial com fases, narrativas e ativos vinculados.",
        status: "planning",
        metadata: {
          funnelId: funnel?.id || null,
          phaseNotes: Object.fromEntries(phases.map((phase) => [phase.key, "Definir meta e entregas."])),
          copyPlan: "Emails, WhatsApp, VSL, páginas e criativos da campanha.",
          creativeScripts: "Criativos de abertura, prova, objeção e urgência.",
          emails: "Sequência de 5 emails: aquecimento, história, prova, oferta e fechamento.",
          whatsapp: "Abordagem consultiva, follow-up e fechamento curto.",
          salesPages: "Página principal, checkout e recuperação.",
        },
      });
      setSelectedCampaignId((result as any)?.data?.id ?? null);
      toast.success("Blueprint de lançamento criado");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar blueprint");
    }
  };

  const removeCampaign = async () => {
    if (!campaign) return;
    if (!window.confirm(`Excluir a campanha ${campaign.name}?`)) return;
    try {
      await deleteCampaignMutation.mutateAsync(campaign.id);
      toast.success("Campanha excluída");
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir campanha");
    }
  };

  const archiveCampaign = async () => {
    if (!campaign) return;
    try {
      await archiveCampaignMutation.mutateAsync(campaign.id);
      toast.success("Campanha arquivada");
    } catch (error: any) {
      toast.error(error.message || "Erro ao arquivar campanha");
    }
  };

  const savePain = async (values: Record<string, string>) => {
    const input = {
      workspaceId: activeWorkspaceId!,
      personaId: persona.id,
      category: values.category,
      body: values.body,
      intensity: values.intensity || null,
      tags: values.tags
        ? values.tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    };

    if (painDraft) {
      await updatePainMutation.mutateAsync({ id: painDraft.id, input });
      toast.success("Dor atualizada");
    } else {
      await createPainMutation.mutateAsync(input);
      toast.success("Dor adicionada");
    }

    setPainDraft(null);
  };

  const saveEvent = async (values: Record<string, string>) => {
    if (!campaign) return;
    const input = {
      campaignId: campaign.id,
      title: values.title,
      description: values.description || null,
      startAt: values.startAt,
      endAt: values.endAt || null,
      type: values.type || null,
    };

    if (eventDraft) {
      await updateEventMutation.mutateAsync({ id: eventDraft.id, input });
      toast.success("Evento atualizado");
    } else {
      await createEventMutation.mutateAsync(input);
      toast.success("Evento criado");
    }
    setEventDraft(null);
  };

  const saveCopy = async (values: Record<string, string>) => {
    if (!activeWorkspaceId || !campaign) return;
    const input = {
      workspaceId: activeWorkspaceId,
      personaId: persona.id,
      campaignId: campaign.id,
      type: values.type,
      title: values.title,
      body: values.body,
      status: values.status || "draft",
    };

    if (copyDraft) {
      await updateCopyMutation.mutateAsync({ id: copyDraft.id, input });
      toast.success("Copy atualizada");
    } else {
      await createCopyMutation.mutateAsync(input);
      toast.success("Copy criada");
    }
    setCopyDraft(null);
  };

  const generateCopyWithAi = async (base?: Partial<SalesCopy> & { pain?: string }) => {
    if (!campaign) return;
    try {
      const response = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "launch-copy",
          input: {
            type: base?.type || "sales_page",
            title: base?.title || campaign.name,
            goal: campaign.goal,
            pain: base?.pain,
            campaign: campaign.name,
            description: campaign.description,
            cta: "WhatsApp e página de venda",
          },
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Erro ao gerar copy");

      if (base?.id) {
        await updateCopyMutation.mutateAsync({
          id: base.id,
          input: {
            ...base,
            body: json.data.text,
          },
        });
        toast.success("Copy refinada com IA");
      } else {
        await createCopyMutation.mutateAsync({
          workspaceId: activeWorkspaceId,
          personaId: persona.id,
          campaignId: campaign.id,
          type: base?.type || "sales_page",
          title: base?.title || `Copy IA · ${campaign.name}`,
          body: json.data.text,
          status: "draft",
        });
        toast.success("Nova copy criada com IA");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar copy");
    }
  };

  if (!campaign) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Lançamento"
          description="Operação completa da campanha, do aquecimento ao pós-venda."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={createBlueprint}>
                <Sparkles className="h-3.5 w-3.5" /> Plano em 30 dias
              </Button>
              <Button variant="gradient" size="sm" onClick={() => setCampaignDialogOpen(true)}>
                <Plus className="h-4 w-4" /> Nova campanha
              </Button>
            </>
          }
        />
        <PersonaHero persona={persona} pageBadge="lançamento" />
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <Target className="mx-auto h-10 w-10 text-primary" />
            <div>
              <p className="text-lg font-semibold">Nenhuma campanha criada ainda</p>
              <p className="text-sm text-muted-foreground">
                Crie uma campanha completa com fases, calendário, dores, copys e ativos vinculados.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={createBlueprint}>
                Blueprint rápido
              </Button>
              <Button variant="gradient" onClick={() => setCampaignDialogOpen(true)}>
                Criar campanha
              </Button>
            </div>
          </CardContent>
        </Card>
        <LaunchCampaignDialog
          open={campaignDialogOpen}
          onOpenChange={setCampaignDialogOpen}
          onSubmit={async (payload) => {
            await createCampaignMutation.mutateAsync(payload);
            toast.success("Campanha criada");
          }}
          workspaceId={activeWorkspaceId}
          personaId={persona.id}
          tasks={tasks as any[]}
          content={content as any[]}
          documents={documents as any[]}
          materials={materials as any[]}
          funnelId={funnel?.id}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lançamento"
        description="Campanhas, calendário, fases, dores, copies e ativos vinculados em uma única operação."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={createBlueprint}>
              <Sparkles className="h-3.5 w-3.5" /> Blueprint
            </Button>
            <Button variant="gradient" size="sm" onClick={() => { setCampaignDraft(null); setCampaignDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Nova campanha
            </Button>
          </>
        }
      />

      <PersonaHero persona={persona} pageBadge="lançamento" />

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Campanhas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.map((item: any) => (
              <button
                key={item.id}
                onClick={() => setSelectedCampaignId(item.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  item.id === campaign.id
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/60 bg-card-elevated hover:border-primary/20"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{item.name}</p>
                  <Badge size="sm" variant={item.status === "active" ? "success" : "outline"}>
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(item.events || []).length} eventos · {(item.copies || []).length} copys
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{campaign.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{campaign.description || "Sem descrição"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCampaignDraft(campaign);
                    setCampaignDialogOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={archiveCampaign}>
                  Arquivar
                </Button>
                <Button size="sm" variant="outline" onClick={removeCampaign}>
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <MetricCard label="Período" value={formatRange(campaign.startsAt, campaign.endsAt)} />
              <MetricCard label="Eventos" value={String(selectedEvents.length)} />
              <MetricCard label="Copys" value={String(selectedCopies.length)} />
              <MetricCard label="Ativos" value={String(linkedTasks.length + linkedContent.length + linkedDocuments.length + linkedMaterials.length)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fases do lançamento</CardTitle>
              <p className="text-xs text-muted-foreground">
                Da pesquisa ao pós-venda, com notas de operação por fase.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {phases.map((phase, index) => {
                const window = buildPhaseWindow(campaign.startsAt, campaign.endsAt, index, phases.length);
                return (
                  <div key={phase.key} className="rounded-xl border border-border/60 bg-card-elevated p-3">
                    <Badge size="sm" variant="outline">
                      {window}
                    </Badge>
                    <p className="mt-2 font-medium">{phase.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(campaign.metadata as any)?.phaseNotes?.[phase.key] || "Sem orientação definida."}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Calendário de lançamento</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Lives, deadlines, marcos e entregas principais da campanha.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEventDraft({})}>
                <CalendarDays className="h-3.5 w-3.5" /> Novo evento
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedEvents.length ? (
                selectedEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card-elevated p-3">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.startAt)} · {event.type || "evento"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEventDraft(event)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await deleteEventMutation.mutateAsync(event.id);
                          toast.success("Evento removido");
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum evento definido ainda.</p>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">
                <Link2 className="h-3.5 w-3.5" /> Vínculos
              </TabsTrigger>
              <TabsTrigger value="pains">
                <Target className="h-3.5 w-3.5" /> Banco de dores
              </TabsTrigger>
              <TabsTrigger value="copies">
                <Flame className="h-3.5 w-3.5" /> Plano de copys
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 lg:grid-cols-2">
                <NarrativeCard
                  title="Plano de copys"
                  body={(campaign.metadata as any)?.copyPlan}
                  icon={<Copy className="h-4 w-4" />}
                />
                <NarrativeCard
                  title="Scripts de criativos"
                  body={(campaign.metadata as any)?.creativeScripts}
                  icon={<Wand2 className="h-4 w-4" />}
                />
                <NarrativeCard
                  title="Emails e WhatsApp"
                  body={[(campaign.metadata as any)?.emails, (campaign.metadata as any)?.whatsapp]
                    .filter(Boolean)
                    .join("\n\n")}
                  icon={<Sparkles className="h-4 w-4" />}
                />
                <NarrativeCard
                  title="Páginas de venda"
                  body={(campaign.metadata as any)?.salesPages}
                  icon={<FileText className="h-4 w-4" />}
                />
              </div>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Ativos vinculados</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <LinkedListCard title="Tarefas" items={linkedTasks.map((item: any) => item.title)} />
                  <LinkedListCard title="Conteúdos" items={linkedContent.map((item: any) => item.title)} />
                  <LinkedListCard title="Documentos" items={linkedDocuments.map((item: any) => item.title)} />
                  <LinkedListCard title="Materiais" items={linkedMaterials.map((item: any) => item.title)} />
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Funil vinculado</CardTitle>
                </CardHeader>
                <CardContent>
                  {funnel ? (
                    <div className="rounded-xl border border-border/60 bg-card-elevated p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{funnel.name}</p>
                          <p className="text-xs text-muted-foreground">{funnel.description}</p>
                        </div>
                        <Badge size="sm" variant="success">
                          {funnel.conversionRate?.toFixed(1)}% conv.
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum funil vinculado.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pains">
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Banco de dores</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Use dores para abastecer hooks, criativos, emails e páginas.
                    </p>
                  </div>
                  <Button size="sm" variant="gradient" onClick={() => setPainDraft({} as any)}>
                    <Plus className="h-4 w-4" /> Nova dor
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {pains.map((pain: any) => (
                    <Card key={pain.id} variant="elevated">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-center justify-between">
                          <Badge size="sm" variant={painVariant[pain.category as keyof typeof painVariant] || "outline"}>
                            {painLabel[pain.category as keyof typeof painLabel] || pain.category}
                          </Badge>
                          <Badge size="sm" variant="ghost">
                            {pain.intensity || "sem intensidade"}
                          </Badge>
                        </div>
                        <p className="text-sm leading-relaxed">"{pain.body}"</p>
                        <div className="flex flex-wrap gap-1">
                          {(pain.tags || []).map((tag: string) => (
                            <Badge key={tag} size="sm" variant="ghost">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 border-t border-border/60 pt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(pain.body);
                              toast.success("Dor copiada");
                            }}
                          >
                            <Copy className="h-3 w-3" /> Copiar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              generateCopyWithAi({
                                type: "creative_script",
                                title: `Criativo IA · ${painLabel[pain.category as keyof typeof painLabel] || "dor"}`,
                                pain: pain.body,
                              })
                            }
                          >
                            <Wand2 className="h-3 w-3" /> Virar copy
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setPainDraft(pain)}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await deletePainMutation.mutateAsync(pain.id);
                              toast.success("Dor removida");
                            }}
                          >
                            Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="copies">
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Plano de copys</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Scripts de criativos, emails, WhatsApp e páginas de venda vinculados à campanha.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Sparkles className="h-3.5 w-3.5" /> Gerar com IA
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Tipo de copy a gerar
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {copyTypeOptions.map((opt) => (
                          <DropdownMenuItem
                            key={opt.value}
                            onClick={() =>
                              generateCopyWithAi({
                                type: opt.value as SalesCopy["type"],
                                title: `${opt.label} · ${campaign.name}`,
                              })
                            }
                          >
                            <Wand2 className="h-3.5 w-3.5" /> {opt.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="gradient" onClick={() => setCopyDraft({} as any)}>
                      <Plus className="h-4 w-4" /> Nova copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {selectedCopies.length ? (
                    selectedCopies.map((copy) => (
                      <Card key={copy.id} variant="elevated">
                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <Badge size="sm" variant="outline">
                              {copyTypeOptions.find((option) => option.value === copy.type)?.label || copy.type}
                            </Badge>
                            <Badge size="sm" variant={copy.status === "approved" ? "success" : "warning"}>
                              {copy.status}
                            </Badge>
                          </div>
                          <p className="font-medium">{copy.title}</p>
                          <p className="line-clamp-4 text-sm text-muted-foreground">{copy.body}</p>
                          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-2">
                            <Button size="sm" variant="ghost" onClick={() => setCopyDraft(copy)}>
                              Abrir
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setCopyDraft(copy);
                                void generateCopyWithAi(copy);
                              }}
                            >
                              <Wand2 className="h-3 w-3" /> Refinar IA
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                await deleteCopyMutation.mutateAsync(copy.id);
                                toast.success("Copy removida");
                              }}
                            >
                              Excluir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma copy vinculada ainda.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <LaunchCampaignDialog
        open={campaignDialogOpen}
        onOpenChange={(open) => {
          setCampaignDialogOpen(open);
          if (!open) setCampaignDraft(null);
        }}
        campaign={campaignDraft}
        workspaceId={activeWorkspaceId}
        personaId={persona.id}
        tasks={tasks as any[]}
        content={content as any[]}
        documents={documents as any[]}
        materials={materials as any[]}
        funnelId={funnel?.id}
        onSubmit={async (payload) => {
          if (campaignDraft) {
            await updateCampaignMutation.mutateAsync({ id: campaignDraft.id, input: payload });
            toast.success("Campanha atualizada");
          } else {
            await createCampaignMutation.mutateAsync(payload);
            toast.success("Campanha criada");
          }
        }}
      />

      <EntityFormDialog
        open={!!painDraft}
        onOpenChange={(open) => !open && setPainDraft(null)}
        title={painDraft?.id ? "Editar dor" : "Nova dor"}
        description="Cadastre dores, objeções e desejos que alimentam as copys do lançamento."
        submitLabel="Salvar dor"
        values={
          painDraft
            ? {
                category: painDraft.category || "pain",
                body: painDraft.body || "",
                intensity: painDraft.intensity || "medium",
                tags: (painDraft.tags || []).join(", "),
              }
            : undefined
        }
        fields={[
          {
            name: "category",
            label: "Categoria",
            type: "select",
            options: Object.entries(painLabel).map(([value, label]) => ({ value, label })),
          },
          {
            name: "intensity",
            label: "Intensidade",
            type: "select",
            options: [
              { value: "low", label: "Baixa" },
              { value: "medium", label: "Média" },
              { value: "high", label: "Alta" },
            ],
          },
          { name: "body", label: "Dor", type: "textarea", colSpan: 2, required: true },
          { name: "tags", label: "Tags", type: "text", colSpan: 2, placeholder: "objeção, desejo, urgência" },
        ]}
        onSubmit={savePain}
      />

      <EntityFormDialog
        open={!!eventDraft}
        onOpenChange={(open) => !open && setEventDraft(null)}
        title={eventDraft?.id ? "Editar evento" : "Novo evento"}
        description="Adicione lives, deadlines, reuniões e marcos da campanha."
        submitLabel="Salvar evento"
        values={
          eventDraft
            ? {
                title: eventDraft.title || "",
                description: eventDraft.description || "",
                startAt: eventDraft.startAt ? normalizeDateTimeLocal(eventDraft.startAt) : "",
                endAt: eventDraft.endAt ? normalizeDateTimeLocal(eventDraft.endAt) : "",
                type: eventDraft.type || "",
              }
            : undefined
        }
        fields={[
          { name: "title", label: "Título", type: "text", required: true },
          { name: "type", label: "Tipo", type: "text", placeholder: "live, deadline, reunião..." },
          { name: "startAt", label: "Início", type: "datetime", required: true },
          { name: "endAt", label: "Fim", type: "datetime" },
          { name: "description", label: "Descrição", type: "textarea", colSpan: 2 },
        ]}
        onSubmit={async (values) =>
          saveEvent({
            ...values,
            startAt: new Date(values.startAt).toISOString(),
            endAt: values.endAt ? new Date(values.endAt).toISOString() : "",
          })
        }
      />

      <EntityFormDialog
        open={!!copyDraft}
        onOpenChange={(open) => !open && setCopyDraft(null)}
        title={copyDraft?.id ? "Editar copy" : "Nova copy"}
        description="Emails, WhatsApp, scripts, páginas e materiais de venda."
        submitLabel="Salvar copy"
        values={
          copyDraft
            ? {
                type: copyDraft.type || "sales_page",
                title: copyDraft.title || "",
                body: copyDraft.body || "",
                status: copyDraft.status || "draft",
              }
            : undefined
        }
        fields={[
          { name: "type", label: "Tipo", type: "select", options: copyTypeOptions },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "draft", label: "Draft" },
              { value: "review", label: "Em revisão" },
              { value: "approved", label: "Aprovada" },
            ],
          },
          { name: "title", label: "Título", type: "text", required: true, colSpan: 2 },
          { name: "body", label: "Copy", type: "textarea", required: true, colSpan: 2 },
        ]}
        onSubmit={saveCopy}
      />
    </div>
  );
}

function LaunchCampaignDialog({
  open,
  onOpenChange,
  campaign,
  workspaceId,
  personaId,
  tasks,
  content,
  documents,
  materials,
  funnelId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: LaunchCampaign | null;
  workspaceId?: string | null;
  personaId: string;
  tasks: any[];
  content: any[];
  documents: any[];
  materials: any[];
  funnelId?: string | null;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [form, setForm] = React.useState<any>({
    name: "",
    description: "",
    goal: "",
    startsAt: "",
    endsAt: "",
    status: "planning",
    copyPlan: "",
    creativeScripts: "",
    emails: "",
    whatsapp: "",
    salesPages: "",
    phaseNotes: {} as Record<string, string>,
    linkedTaskIds: [] as string[],
    linkedContentIds: [] as string[],
    linkedDocumentIds: [] as string[],
    linkedMaterialIds: [] as string[],
  });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setForm({
      name: campaign?.name || "",
      description: campaign?.description || "",
      goal: campaign?.goal || "",
      startsAt: campaign?.startsAt ? normalizeDateInput(campaign.startsAt) : "",
      endsAt: campaign?.endsAt ? normalizeDateInput(campaign.endsAt) : "",
      status: campaign?.status || "planning",
      copyPlan: (campaign?.metadata as any)?.copyPlan || "",
      creativeScripts: (campaign?.metadata as any)?.creativeScripts || "",
      emails: (campaign?.metadata as any)?.emails || "",
      whatsapp: (campaign?.metadata as any)?.whatsapp || "",
      salesPages: (campaign?.metadata as any)?.salesPages || "",
      phaseNotes: Object.fromEntries(
        phases.map((phase) => [phase.key, (campaign?.metadata as any)?.phaseNotes?.[phase.key] || ""]),
      ),
      linkedTaskIds: [...(((campaign?.metadata as any)?.linkedTaskIds || []) as string[])],
      linkedContentIds: [...(((campaign?.metadata as any)?.linkedContentIds || []) as string[])],
      linkedDocumentIds: [...(((campaign?.metadata as any)?.linkedDocumentIds || []) as string[])],
      linkedMaterialIds: [...(((campaign?.metadata as any)?.linkedMaterialIds || []) as string[])],
    });
  }, [campaign, open]);

  const toggleListValue = (field: string, value: string) => {
    setForm((current: any) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item: string) => item !== value)
        : [...current[field], value],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspaceId || !form.name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        workspaceId,
        personaId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        goal: form.goal.trim() || null,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        status: form.status,
        metadata: {
          funnelId: funnelId || null,
          linkedTaskIds: form.linkedTaskIds,
          linkedContentIds: form.linkedContentIds,
          linkedDocumentIds: form.linkedDocumentIds,
          linkedMaterialIds: form.linkedMaterialIds,
          copyPlan: form.copyPlan.trim() || null,
          creativeScripts: form.creativeScripts.trim() || null,
          emails: form.emails.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          salesPages: form.salesPages.trim() || null,
          phaseNotes: form.phaseNotes,
        },
      });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar campanha");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? "Editar campanha" : "Nova campanha"}</DialogTitle>
          <DialogDescription>
            Configure datas, narrativa, ativos vinculados e entregáveis do lançamento.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome" required>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="archived">Arquivada</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Início">
              <Input type="date" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
            </Field>
            <Field label="Fim">
              <Input type="date" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
            </Field>
          </div>

          <Field label="Descrição">
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} />
          </Field>
          <Field label="Meta do lançamento">
            <Textarea value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })} rows={2} />
          </Field>

          <div className="grid gap-3 lg:grid-cols-2">
            <Field label="Plano de copys">
              <Textarea value={form.copyPlan} onChange={(event) => setForm({ ...form, copyPlan: event.target.value })} rows={4} />
            </Field>
            <Field label="Scripts de criativos">
              <Textarea value={form.creativeScripts} onChange={(event) => setForm({ ...form, creativeScripts: event.target.value })} rows={4} />
            </Field>
            <Field label="Emails">
              <Textarea value={form.emails} onChange={(event) => setForm({ ...form, emails: event.target.value })} rows={4} />
            </Field>
            <Field label="WhatsApp / follow-up">
              <Textarea value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} rows={4} />
            </Field>
          </div>

          <Field label="Páginas de venda">
            <Textarea value={form.salesPages} onChange={(event) => setForm({ ...form, salesPages: event.target.value })} rows={3} />
          </Field>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {phases.map((phase) => (
              <Field key={phase.key} label={`Fase · ${phase.label}`}>
                <Textarea
                  value={form.phaseNotes[phase.key] || ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phaseNotes: {
                        ...form.phaseNotes,
                        [phase.key]: event.target.value,
                      },
                    })
                  }
                  rows={3}
                />
              </Field>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SelectionBlock
              title="Tarefas vinculadas"
              items={tasks}
              selected={form.linkedTaskIds}
              onToggle={(value) => toggleListValue("linkedTaskIds", value)}
            />
            <SelectionBlock
              title="Conteúdos vinculados"
              items={content}
              selected={form.linkedContentIds}
              onToggle={(value) => toggleListValue("linkedContentIds", value)}
            />
            <SelectionBlock
              title="Documentos vinculados"
              items={documents}
              selected={form.linkedDocumentIds}
              onToggle={(value) => toggleListValue("linkedDocumentIds", value)}
            />
            <SelectionBlock
              title="Materiais vinculados"
              items={materials}
              selected={form.linkedMaterialIds}
              onToggle={(value) => toggleListValue("linkedMaterialIds", value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting || !workspaceId}>
              {submitting ? "Salvando..." : "Salvar campanha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

function SelectionBlock({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: any[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card-elevated p-3">
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="max-h-52 space-y-2 overflow-y-auto">
        {items.length ? (
          items.map((item) => (
            <label key={item.id} className="flex items-start gap-2 rounded-lg border border-border/50 px-2 py-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => onToggle(item.id)}
              />
              <span>{item.title || item.name}</span>
            </label>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum item disponível.</p>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card-elevated p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function NarrativeCard({
  title,
  body,
  icon,
}: {
  title: string;
  body?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line text-sm text-muted-foreground">
          {body || "Sem conteúdo definido ainda."}
        </p>
      </CardContent>
    </Card>
  );
}

function LinkedListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card-elevated p-4">
      <div className="mb-2 flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-primary" />
        <p className="font-medium">{title}</p>
      </div>
      {items.length ? (
        <div className="space-y-1">
          {items.slice(0, 4).map((item) => (
            <p key={item} className="text-sm text-muted-foreground">
              {item}
            </p>
          ))}
          {items.length > 4 ? (
            <p className="text-xs text-muted-foreground">+{items.length - 4} itens</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum item vinculado.</p>
      )}
    </div>
  );
}

function buildPhaseWindow(
  startsAt?: string | null,
  endsAt?: string | null,
  index = 0,
  total = 1,
) {
  if (!startsAt || !endsAt) return "sem datas";
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const diff = end.getTime() - start.getTime();
  if (Number.isNaN(diff) || diff <= 0) return "sem datas";
  const slice = diff / total;
  const phaseStart = new Date(start.getTime() + slice * index);
  const phaseEnd = new Date(start.getTime() + slice * (index + 1));
  return `${formatDate(phaseStart.toISOString())} - ${formatDate(phaseEnd.toISOString())}`;
}

function formatDate(value?: string | null) {
  if (!value) return "sem data";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatRange(startsAt?: string | null, endsAt?: string | null) {
  if (!startsAt && !endsAt) return "sem datas";
  return `${formatDate(startsAt)} → ${formatDate(endsAt)}`;
}

function normalizeDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function normalizeDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
