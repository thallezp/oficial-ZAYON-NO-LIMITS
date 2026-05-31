"use client";

import * as React from "react";
import {
  Activity,
  CalendarPlus,
  CircleDollarSign,
  Copy,
  FileText,
  Folder,
  FolderPlus,
  Hammer,
  Image as ImageIcon,
  ListChecks,
  ListTree,
  Mail,
  Network,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Workflow,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useQuickCreate,
  type QuickCreateEntity,
} from "@/stores/quick-create-store";
import { useActivePersona } from "@/stores/persona-store";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useCreateTaskMutation,
  useCreateDocumentMutation,
  useCreateContentMutation,
  useCreateLeadMutation,
  useCreateFinancialMutation,
  useUpsertPersonaMutation,
  useCreateFlowMutation,
  useCreateToolMutation,
  useCreateProjectMutation,
  useCreateCalendarEventMutation,
  useCreateSubtaskMutation,
  useCreateFolderMutation,
  useCreatePromptChainMutation,
  useCreateModelingProfileMutation,
  useInviteMemberMutation,
  useProjects,
  usePersonas,
  useDocuments,
  useTeam,
  useLaunchCampaigns,
} from "@/hooks/use-queries";
import { TOOL_CATEGORIES } from "@/lib/constants/tools";
import { BrandLogo } from "@/components/ui/brand-logo";
import { getAutoPreview } from "@/lib/utils/tool-utils";

type EntityMeta = {
  title: string;
  description: string;
  submitLabel: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ENTITY_META: Record<QuickCreateEntity, EntityMeta> = {
  task: {
    title: "Nova Tarefa",
    description: "Crie uma tarefa com prioridade, prazo e responsável.",
    submitLabel: "Criar Tarefa",
    icon: ListChecks,
  },
  subtask: {
    title: "Nova Subtarefa",
    description: "Crie uma subtarefa vinculada à tarefa principal.",
    submitLabel: "Criar Subtarefa",
    icon: ListTree,
  },
  document: {
    title: "Novo Documento",
    description: "Wiki, ata, briefing ou playbook.",
    submitLabel: "Criar Documento",
    icon: FileText,
  },
  content: {
    title: "Novo Conteúdo",
    description: "Reel, post, story, vídeo, email ou anúncio.",
    submitLabel: "Criar Conteúdo",
    icon: ImageIcon,
  },
  lead: {
    title: "Novo Lead",
    description: "Cadastro manual no CRM.",
    submitLabel: "Criar Lead",
    icon: Activity,
  },
  revenue: {
    title: "Nova Receita",
    description: "Registre uma entrada financeira.",
    submitLabel: "Criar Receita",
    icon: TrendingUp,
  },
  expense: {
    title: "Nova Despesa",
    description: "Registre uma saída financeira.",
    submitLabel: "Criar Despesa",
    icon: TrendingDown,
  },
  persona: {
    title: "Nova Persona",
    description: "Uma nova unidade de negócio.",
    submitLabel: "Criar Persona",
    icon: Sparkles,
  },
  flow: {
    title: "Novo Flow",
    description: "Processo, automação ou diagrama operacional.",
    submitLabel: "Criar Flow",
    icon: Workflow,
  },
  tool: {
    title: "Nova Ferramenta",
    description: "Adicione ao Tools Hub com link, ícone e categoria.",
    submitLabel: "Adicionar Ferramenta",
    icon: Hammer,
  },
  project: {
    title: "Novo Projeto",
    description: "Iniciativa ou campanha de longo prazo.",
    submitLabel: "Criar Projeto",
    icon: Folder,
  },
  event: {
    title: "Novo Evento",
    description: "Reunião, bloco de foco ou compromisso.",
    submitLabel: "Criar Evento",
    icon: CalendarPlus,
  },
  folder: {
    title: "Nova Pasta",
    description: "Organize materiais e arquivos.",
    submitLabel: "Criar Pasta",
    icon: FolderPlus,
  },
  promptChain: {
    title: "Nova Cadeia de Prompts",
    description: "Sequência ordenada de instruções para a IA.",
    submitLabel: "Criar Cadeia",
    icon: Network,
  },
  modelingProfile: {
    title: "Novo Perfil de Modelagem",
    description: "Adicione um perfil de referência para engenharia reversa.",
    submitLabel: "Adicionar Perfil",
    icon: Target,
  },
  invite: {
    title: "Convidar Membro",
    description: "Envie convite por email para entrar no workspace.",
    submitLabel: "Enviar Convite",
    icon: UserPlus,
  },
};

export function QuickCreateDialog() {
  const { open, entity, context, setOpen, close } = useQuickCreate();
  const persona = useActivePersona();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  if (!entity) return null;

  const meta = ENTITY_META[entity];
  const Icon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            {meta.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {meta.description}
            {persona && entity !== "persona" && entity !== "invite" && (
              <Badge size="sm" variant="primary">
                vinculado a {persona.name}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <EntityForm
          entity={entity}
          workspaceId={activeWorkspaceId}
          personaId={persona?.id ?? null}
          context={context}
          submitLabel={meta.submitLabel}
          onSuccess={() => close()}
        />
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// EntityForm — dispatcher
// ---------------------------------------------------------------------------

interface EntityFormProps {
  entity: QuickCreateEntity;
  workspaceId: string | null;
  personaId: string | null;
  context: Record<string, any>;
  submitLabel: string;
  onSuccess: () => void;
}

function EntityForm(props: EntityFormProps) {
  if (!props.workspaceId) {
    return (
      <div className="text-sm text-muted-foreground border border-dashed border-border/60 rounded-lg p-4 text-center">
        Nenhum workspace ativo. Selecione um workspace antes de criar.
      </div>
    );
  }

  switch (props.entity) {
    case "task":
      return <TaskForm {...props} />;
    case "subtask":
      return <SubtaskForm {...props} />;
    case "document":
      return <DocumentForm {...props} />;
    case "content":
      return <ContentForm {...props} />;
    case "lead":
      return <LeadForm {...props} />;
    case "revenue":
      return <FinancialForm {...props} type="revenue" />;
    case "expense":
      return <FinancialForm {...props} type="expense" />;
    case "persona":
      return <PersonaForm {...props} />;
    case "flow":
      return <FlowForm {...props} />;
    case "tool":
      return <ToolForm {...props} />;
    case "project":
      return <ProjectForm {...props} />;
    case "event":
      return <EventForm {...props} />;
    case "folder":
      return <FolderForm {...props} />;
    case "promptChain":
      return <PromptChainForm {...props} />;
    case "modelingProfile":
      return <ModelingProfileForm {...props} />;
    case "invite":
      return <InviteForm {...props} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Shared footer
// ---------------------------------------------------------------------------

function FormFooter({
  submitLabel,
  pending,
  canSubmit,
  onCancel,
}: {
  submitLabel: string;
  pending: boolean;
  canSubmit: boolean;
  onCancel: () => void;
}) {
  return (
    <DialogFooter className="gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" variant="gradient" disabled={!canSubmit || pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </DialogFooter>
  );
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

function TaskForm({ workspaceId, personaId, context, submitLabel, onSuccess }: EntityFormProps) {
  const create = useCreateTaskMutation();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<"low" | "medium" | "high" | "urgent">("medium");
  const [status, setStatus] = React.useState<"backlog" | "todo" | "doing" | "review" | "done">("todo");
  const [dueAt, setDueAt] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !workspaceId) return;
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: personaId ?? undefined,
        projectId: context.projectId ?? undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueAt: dueAt || undefined,
      });
      toast.success("Tarefa criada!", { description: title });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar tarefa");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Título" required>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Editar reel da segunda"
          autoFocus
        />
      </Field>
      <Field label="Descrição">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contexto, links, critérios…"
          rows={3}
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">A fazer</SelectItem>
              <SelectItem value="doing">Fazendo</SelectItem>
              <SelectItem value="review">Em revisão</SelectItem>
              <SelectItem value="done">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Prioridade">
          <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Prazo">
          <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </Field>
      </div>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!title.trim()}
        onCancel={onSuccess}
      />
    </form>
  );
}

function SubtaskForm({ workspaceId, personaId, context, submitLabel, onSuccess }: EntityFormProps) {
  const create = useCreateSubtaskMutation();
  const [title, setTitle] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !workspaceId || !context.parentTaskId) return;
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: personaId ?? undefined,
        parentTaskId: context.parentTaskId,
        title: title.trim(),
      });
      toast.success("Subtarefa criada!", { description: title });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar subtarefa");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Título da subtarefa" required>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Validar copy da thumbnail"
          autoFocus
        />
      </Field>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!title.trim() && !!context.parentTaskId}
        onCancel={onSuccess}
      />
    </form>
  );
}

function DocumentForm({ workspaceId, personaId, submitLabel, onSuccess }: EntityFormProps) {
  const create = useCreateDocumentMutation();
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !workspaceId) return;
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: personaId ?? undefined,
        title: title.trim(),
        content: summary || "",
      });
      toast.success("Documento criado!", { description: title });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar documento");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Título" required>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Briefing Lançamento Q3"
          autoFocus
        />
      </Field>
      <Field label="Resumo / primeiro parágrafo">
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Pode editar depois no editor completo."
          rows={4}
        />
      </Field>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!title.trim()}
        onCancel={onSuccess}
      />
    </form>
  );
}

function ContentForm({ workspaceId, personaId, context, submitLabel, onSuccess }: EntityFormProps) {
  const create = useCreateContentMutation();
  const [title, setTitle] = React.useState("");
  const [hook, setHook] = React.useState("");
  const [channel, setChannel] = React.useState<string>(context.defaultChannel ?? "instagram");
  const [contentType, setContentType] = React.useState<string>(context.defaultContentType ?? "reel");
  const [status, setStatus] = React.useState<string>("idea");
  const [scheduledAt, setScheduledAt] = React.useState("");
  
  // Extra fields
  const [pillar, setPillar] = React.useState<string>("neutral");
  const [responsibleId, setResponsibleId] = React.useState<string>("");
  const [campaignId, setCampaignId] = React.useState<string>("");

  // Queries for selectors
  const { data: team = [] } = useTeam(workspaceId);
  const { data: campaigns = [] } = useLaunchCampaigns(workspaceId, personaId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !workspaceId) return;
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: personaId ?? undefined,
        title: title.trim(),
        hook: hook.trim() || undefined,
        channel,
        contentType,
        status,
        scheduledAt: scheduledAt || undefined,
        pillar: pillar && pillar !== "none" ? pillar : undefined,
        ownerId: responsibleId && responsibleId !== "none" ? responsibleId : undefined,
        metadata: {
          campaignId: campaignId && campaignId !== "none" ? campaignId : undefined,
        },
      });
      toast.success("Conteúdo criado!", { description: title });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar conteúdo");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Título" required>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Reel: 3 erros que travam vendas"
          autoFocus
        />
      </Field>
      <Field label="Hook (gancho inicial)">
        <Textarea
          value={hook}
          onChange={(e) => setHook(e.target.value)}
          placeholder="Primeira frase ou primeira cena."
          rows={2}
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Canal">
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="telegram">Telegram</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Formato">
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="reel">Reel</SelectItem>
              <SelectItem value="feed">Feed</SelectItem>
              <SelectItem value="carousel">Carrossel</SelectItem>
              <SelectItem value="story">Story</SelectItem>
              <SelectItem value="short">Short</SelectItem>
              <SelectItem value="video">Vídeo longo</SelectItem>
              <SelectItem value="post">Post</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="ad">Anúncio</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="idea">Ideia</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="scripted">Roteirizado</SelectItem>
              <SelectItem value="recorded">Gravado</SelectItem>
              <SelectItem value="editing">Editando</SelectItem>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="posted">Postado</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Field label="Pilar Editorial">
          <Select value={pillar} onValueChange={setPillar}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="attraction">Atração</SelectItem>
              <SelectItem value="educational">Educacional</SelectItem>
              <SelectItem value="tips">Dicas</SelectItem>
              <SelectItem value="opinion">Opinião</SelectItem>
              <SelectItem value="offer">Oferta</SelectItem>
              <SelectItem value="authority">Autoridade</SelectItem>
              <SelectItem value="behind">Bastidores</SelectItem>
              <SelectItem value="neutral">Neutro</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Responsável">
          <Select value={responsibleId} onValueChange={setResponsibleId}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {team.map((m: any) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.fullName || m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Campanha Lançamento">
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {campaigns.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Agendar para">
        <Input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </Field>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!title.trim()}
        onCancel={onSuccess}
      />
    </form>
  );
}

function LeadForm({ workspaceId, personaId, submitLabel, onSuccess }: EntityFormProps) {
  const create = useCreateLeadMutation();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [source, setSource] = React.useState("manual");
  const [campaign, setCampaign] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: personaId ?? undefined,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        instagram: instagram.trim() || undefined,
        source,
        campaign: campaign.trim() || undefined,
        status: "open",
        score: 50,
        notes: notes.trim() || undefined,
      });
      toast.success("Lead criado!", { description: name });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar lead");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Nome" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Telefone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Instagram">
          <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" />
        </Field>
        <Field label="Origem">
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="sheets">Google Sheets</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="indication">Indicação</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Campanha">
        <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="Ex: Lançamento Aurora" />
      </Field>
      <Field label="Notas">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!name.trim()}
        onCancel={onSuccess}
      />
    </form>
  );
}

function FinancialForm({
  workspaceId,
  personaId,
  submitLabel,
  onSuccess,
  type,
}: EntityFormProps & { type: "revenue" | "expense" }) {
  const create = useCreateFinancialMutation();
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState(type === "revenue" ? "Vendas" : "Operacional");
  const [status, setStatus] = React.useState<"pending" | "paid" | "overdue">("paid");
  const [occurredAt, setOccurredAt] = React.useState(
    new Date().toISOString().slice(0, 10),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !workspaceId) return;
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: personaId ?? undefined,
        type,
        amount: value,
        description: description.trim(),
        category,
        status,
        occurredAt: new Date(occurredAt).toISOString(),
      });
      toast.success(
        type === "revenue" ? "Receita registrada!" : "Despesa registrada!",
        { description: `${description} · R$ ${value.toFixed(2)}` },
      );
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao registrar lançamento");
    }
  };

  const isRevenue = type === "revenue";

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Descrição" required>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={isRevenue ? "Ex: Venda mentoria mensal" : "Ex: Anúncios Meta Ads"}
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Valor (R$)" required>
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
          />
        </Field>
        <Field label="Categoria">
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="overdue">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Data">
          <Input
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        </Field>
      </div>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!description.trim() && !!amount}
        onCancel={onSuccess}
      />
    </form>
  );
}

function PersonaForm({ workspaceId, submitLabel, onSuccess }: EntityFormProps) {
  const create = useUpsertPersonaMutation();
  const [name, setName] = React.useState("");
  const [niche, setNiche] = React.useState("");
  const [bigIdea, setBigIdea] = React.useState("");
  const [status, setStatus] = React.useState<"building" | "active" | "paused">("building");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;
    try {
      await create.mutateAsync({
        workspaceId,
        name: name.trim(),
        niche: niche.trim() || undefined,
        bigIdea: bigIdea.trim() || undefined,
        status,
      });
      toast.success("Persona criada!", { description: name });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar persona");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Nome" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="Nicho">
        <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Ex: Mentoria de vendas para coaches" />
      </Field>
      <Field label="Big idea / posicionamento">
        <Textarea value={bigIdea} onChange={(e) => setBigIdea(e.target.value)} rows={3} />
      </Field>
      <Field label="Status">
        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="building">Em construção</SelectItem>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="paused">Pausada</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!name.trim()}
        onCancel={onSuccess}
      />
    </form>
  );
}

function FlowForm({ workspaceId, personaId, submitLabel, onSuccess }: EntityFormProps) {
  const create = useCreateFlowMutation();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState("process");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: personaId ?? undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        type,
      });
      toast.success("Flow criado!", { description: name });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar flow");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Nome" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="Descrição">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </Field>
      <Field label="Tipo">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="process">Processo</SelectItem>
            <SelectItem value="automation">Automação</SelectItem>
            <SelectItem value="decision">Decisão</SelectItem>
            <SelectItem value="content">Conteúdo</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!name.trim()}
        onCancel={onSuccess}
      />
    </form>
  );
}

function ToolForm({ workspaceId, personaId, submitLabel, onSuccess }: EntityFormProps) {
  const create = useCreateToolMutation();
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [category, setCategory] = React.useState("IA");
  const [description, setDescription] = React.useState("");
  
  // Custom fields
  const [iconSlug, setIconSlug] = React.useState("");
  const [brandColor, setBrandColor] = React.useState("#3b82f6");
  const [embedMode, setEmbedMode] = React.useState<"new_tab" | "embed" | "modal">("new_tab");
  const [selectedPersonaId, setSelectedPersonaId] = React.useState(personaId || "");
  const [projectId, setProjectId] = React.useState("");
  const [documentId, setDocumentId] = React.useState("");
  const [tags, setTags] = React.useState("");

  // Queries for selectors
  const { data: projects = [] } = useProjects(workspaceId);
  const { data: personas = [] } = usePersonas(workspaceId);
  const { data: documents = [] } = useDocuments(workspaceId);

  // Auto detect icon and color as they type name/url
  React.useEffect(() => {
    if (name || url) {
      const detect = getAutoPreview(name, url);
      setIconSlug(detect.iconSlug);
      setBrandColor(detect.brandColor);
    }
  }, [name, url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: selectedPersonaId && selectedPersonaId !== "none" ? selectedPersonaId : undefined,
        name: name.trim(),
        url: url.trim() || "https://",
        category,
        description: description.trim() || undefined,
        iconSlug: iconSlug.trim() || undefined,
        brandColor,
        embedMode,
        projectId: projectId && projectId !== "none" ? projectId : undefined,
        documentId: documentId && documentId !== "none" ? documentId : undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success("Ferramenta adicionada!", { description: name });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao adicionar ferramenta");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8 space-y-3">
          <Field label="Nome" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="URL" required>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
            />
          </Field>
        </div>
        <div className="col-span-4 flex flex-col items-center justify-center border border-border/60 bg-card-elevated/40 rounded-xl p-2.5 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-center">Preview Logo</p>
          <div
            className="flex items-center justify-center rounded-lg text-white border border-border/60 h-14 w-14"
            style={{ background: brandColor }}
          >
            <BrandLogo slug={iconSlug} fallback={name || "?"} size={28} monochrome brandColor={brandColor} />
          </div>
          <div className="flex gap-1.5 w-full">
            <div className="flex-1">
              <Label className="text-[9px] text-muted-foreground">Slug</Label>
              <Input
                value={iconSlug}
                onChange={(e) => setIconSlug(e.target.value)}
                className="h-6 text-[10px] px-1"
                placeholder="slug"
              />
            </div>
            <div className="w-10">
              <Label className="text-[9px] text-muted-foreground">Cor</Label>
              <Input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-6 w-full p-0 border-0 bg-transparent cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Categoria">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TOOL_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        
        <Field label="Modo de abertura">
          <Select value={embedMode} onValueChange={(val: any) => setEmbedMode(val)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new_tab">Nova aba</SelectItem>
              <SelectItem value="embed">Embed (iframe)</SelectItem>
              <SelectItem value="modal">Modal</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Field label="Vincular Persona">
          <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
            <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {personas.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Vincular Projeto">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {projects.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Vincular Documento">
          <Select value={documentId} onValueChange={setDocumentId}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {documents.map((d: any) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Tags (separadas por vírgula)">
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="ex: design, llm, gratuito"
        />
      </Field>

      <Field label="Descrição">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </Field>
      
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!name.trim() && !!url.trim()}
        onCancel={onSuccess}
      />
    </form>
  );
}

function ProjectForm({ workspaceId, personaId, submitLabel, onSuccess }: EntityFormProps) {
  const create = useCreateProjectMutation();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState("#3b82f6");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: personaId ?? undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        status: "active",
      });
      toast.success("Projeto criado!", { description: name });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar projeto");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Nome do projeto" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="Descrição">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </Field>
      <Field label="Cor">
        <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-20 p-1" />
      </Field>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!name.trim()}
        onCancel={onSuccess}
      />
    </form>
  );
}

function EventForm({ workspaceId, personaId, submitLabel, onSuccess }: EntityFormProps) {
  const create = useCreateCalendarEventMutation();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startAt, setStartAt] = React.useState("");
  const [endAt, setEndAt] = React.useState("");
  const [category, setCategory] = React.useState("meeting");
  const [allDay, setAllDay] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startAt || !workspaceId) return;
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: personaId ?? undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        category,
        allDay,
      });
      toast.success("Evento criado!", { description: title });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar evento");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Título" required>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </Field>
      <Field label="Descrição">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Início" required>
          <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        </Field>
        <Field label="Fim">
          <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </Field>
      </div>
      <Field label="Categoria">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="meeting">Reunião</SelectItem>
            <SelectItem value="focus">Bloco de foco</SelectItem>
            <SelectItem value="content">Gravação / conteúdo</SelectItem>
            <SelectItem value="launch">Lançamento</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        Evento de dia inteiro
      </label>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!title.trim() && !!startAt}
        onCancel={onSuccess}
      />
    </form>
  );
}

function FolderForm({ workspaceId, personaId, submitLabel, onSuccess }: EntityFormProps) {
  const create = useCreateFolderMutation();
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#6366f1");
  const [driveUrl, setDriveUrl] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;
    const url = driveUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      toast.error("URL precisa começar com http(s)://");
      return;
    }
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: personaId ?? undefined,
        name: name.trim(),
        color,
        driveUrl: url || undefined,
        driveProvider: url
          ? url.includes("drive.google.com")
            ? "google"
            : url.includes("dropbox.com")
              ? "dropbox"
              : url.includes("onedrive")
                ? "onedrive"
                : "external"
          : undefined,
      });
      toast.success("Pasta criada!", { description: name });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar pasta");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Nome da pasta" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex: Brand kit" />
      </Field>
      <Field label="Cor">
        <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-20 p-1" />
      </Field>
      <Field label="Link Google Drive / OneDrive / Dropbox (opcional)">
        <Input
          value={driveUrl}
          onChange={(e) => setDriveUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Quando preenchido, a pasta será navegada como Drive embed dentro do sistema.
        </p>
      </Field>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!name.trim()}
        onCancel={onSuccess}
      />
    </form>
  );
}

function PromptChainForm({ workspaceId, personaId, submitLabel, onSuccess }: EntityFormProps) {
  const create = useCreatePromptChainMutation();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [basePrompt, setBasePrompt] = React.useState("");
  const [status, setStatus] = React.useState<"building" | "robust" | "deprecated">("building");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: personaId ?? undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        basePrompt: basePrompt.trim() || undefined,
        status,
      });
      toast.success("Cadeia criada!", { description: name });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar cadeia");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Nome da cadeia" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex: Roteiro Reel Brutal" />
      </Field>
      <Field label="Descrição">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </Field>
      <Field label="Prompt base">
        <Textarea
          value={basePrompt}
          onChange={(e) => setBasePrompt(e.target.value)}
          rows={3}
          placeholder="Instrução inicial que abre a cadeia."
        />
      </Field>
      <Field label="Status">
        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="building">Em construção</SelectItem>
            <SelectItem value="robust">Robusta</SelectItem>
            <SelectItem value="deprecated">Depreciada</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!name.trim()}
        onCancel={onSuccess}
      />
    </form>
  );
}

function ModelingProfileForm({ workspaceId, personaId, submitLabel, onSuccess }: EntityFormProps) {
  const create = useCreateModelingProfileMutation();
  const [name, setName] = React.useState("");
  const [socialNetwork, setSocialNetwork] = React.useState("instagram");
  const [link, setLink] = React.useState("");
  const [niche, setNiche] = React.useState("");
  const [country, setCountry] = React.useState("BR");
  const [category, setCategory] = React.useState("emerging");
  const [notes, setNotes] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;
    try {
      await create.mutateAsync({
        workspaceId,
        personaId: personaId ?? undefined,
        name: name.trim(),
        socialNetwork,
        link: link.trim() || undefined,
        niche: niche.trim() || undefined,
        country,
        category,
        notes: notes.trim() || undefined,
      });
      toast.success("Perfil adicionado!", { description: name });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao adicionar perfil");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Nome / handle" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="@perfil_referencia" />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Rede social">
          <Select value={socialNetwork} onValueChange={setSocialNetwork}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="twitter">Twitter / X</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="other">Outra</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="País">
          <Input value={country} onChange={(e) => setCountry(e.target.value)} />
        </Field>
      </div>
      <Field label="Link do perfil">
        <Input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Nicho">
          <Input value={niche} onChange={(e) => setNiche(e.target.value)} />
        </Field>
        <Field label="Categoria">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="emerging">Emergente</SelectItem>
              <SelectItem value="hidden_gem">Hidden gem</SelectItem>
              <SelectItem value="big_creator">Big creator</SelectItem>
              <SelectItem value="authority">Autoridade</SelectItem>
              <SelectItem value="competitor">Concorrente</SelectItem>
              <SelectItem value="international">Internacional</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Observações">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field>
      <FormFooter
        submitLabel={submitLabel}
        pending={create.isPending}
        canSubmit={!!name.trim()}
        onCancel={onSuccess}
      />
    </form>
  );
}

function InviteForm({ workspaceId, submitLabel, onSuccess }: EntityFormProps) {
  const invite = useInviteMemberMutation();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"owner" | "admin" | "editor" | "viewer" | "financeiro">("editor");
  const [message, setMessage] = React.useState("");

  const [createdLink, setCreatedLink] = React.useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !workspaceId) return;
    try {
      const res = await invite.mutateAsync({
        workspaceId,
        email: email.trim(),
        role,
        message: message.trim() || undefined,
      });
      const token = (res as any)?.data?.token as string | undefined;
      if (token && typeof window !== "undefined") {
        setInvitedEmail(email.trim());
        setCreatedLink(`${window.location.origin}/invite?token=${token}`);
        toast.success(`Convite criado para ${email}`, {
          description: "Copie o link abaixo e envie para a pessoa.",
        });
      } else {
        toast.success(`Convite enviado para ${email}`, {
          description: `Papel: ${role}`,
        });
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao enviar convite");
    }
  };

  const copyLink = async () => {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não consegui copiar — selecione o link e copie manualmente.");
    }
  };

  if (createdLink) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-success/30 bg-success/5 p-3">
          <p className="text-sm font-medium text-success">
            Convite criado para {invitedEmail}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Não há envio de email automático. Copie o link e mande para a pessoa
            (WhatsApp, etc). Ela abre o link, faz login (ou cria conta) e entra no
            workspace compartilhado.
          </p>
        </div>
        <Field label="Link do convite (expira em 7 dias)">
          <div className="flex gap-2">
            <Input
              readOnly
              value={createdLink}
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button type="button" variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4" /> Copiar
            </Button>
          </div>
        </Field>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setCreatedLink(null);
              setEmail("");
              setMessage("");
            }}
          >
            Convidar outro
          </Button>
          <Button type="button" variant="gradient" onClick={onSuccess}>
            Concluir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Email" required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="membro@exemplo.com"
          autoFocus
        />
      </Field>
      <Field label="Papel">
        <Select value={role} onValueChange={(v) => setRole(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="financeiro">Financeiro</SelectItem>
            <SelectItem value="viewer">Visualizador</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Mensagem (opcional)">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Adicione um contexto para a pessoa convidada."
        />
      </Field>
      <FormFooter
        submitLabel={submitLabel}
        pending={invite.isPending}
        canSubmit={!!email.trim()}
        onCancel={onSuccess}
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Field helper
// ---------------------------------------------------------------------------

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
    <div className="space-y-1">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
