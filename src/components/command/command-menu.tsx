"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Activity,
  Bot,
  Brain,
  Calendar,
  ChevronRight,
  CircleDollarSign,
  Cog,
  FileText,
  Flame,
  Folders,
  Gauge,
  Hammer,
  Home,
  Image as ImageIcon,
  Instagram,
  Library,
  ListChecks,
  Music2,
  Plus,
  Search,
  Sparkles,
  Target,
  Users,
  UserCheck,
  Wand2,
  Workflow,
  Zap,
  Lightbulb,
  Rocket,
  BarChart3,
  ScrollText,
  MessageSquare,
  Timer,
  GraduationCap,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";
import { usePersonaStore } from "@/stores/persona-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import {
  useContent,
  useDocuments,
  useFlows,
  useLeads,
  useTasks,
  useTools,
} from "@/hooks/use-queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

const workspaceLinks = [
  { href: "/dashboard", label: "Home", icon: Home, group: "Workspace" },
  { href: "/tasks", label: "Tarefas", icon: ListChecks, group: "Workspace" },
  { href: "/projects", label: "Projetos", icon: Folders, group: "Workspace" },
  { href: "/study/tracks", label: "Estudos", icon: GraduationCap, group: "Workspace" },
  { href: "/study/library", label: "Biblioteca", icon: Library, group: "Workspace" },
  { href: "/study/sessions", label: "Timer de Foco", icon: Timer, group: "Workspace" },
  { href: "/calendar", label: "Calendário", icon: Calendar, group: "Workspace" },
  { href: "/documents", label: "Documentos", icon: FileText, group: "Workspace" },
  { href: "/materials", label: "Materiais", icon: Library, group: "Workspace" },
  { href: "/flows", label: "Flows", icon: Workflow, group: "Workspace" },
  { href: "/team", label: "Equipe", icon: Users, group: "Workspace" },
  { href: "/tools", label: "Tools Hub", icon: Hammer, group: "Workspace" },
  { href: "/ai", label: "AI Assistant", icon: Bot, group: "Inteligência" },
  { href: "/ai/actions", label: "AI Actions (log)", icon: Activity, group: "Inteligência" },
  { href: "/ai/history", label: "AI Histórico", icon: ScrollText, group: "Inteligência" },
  { href: "/settings", label: "Configurações", icon: Cog, group: "Sistema" },
];

const personaPages = (id: string) => [
  { href: `/personas/${id}/overview`, label: "Overview", icon: Gauge },
  { href: `/personas/${id}/look-3d`, label: "Look 3D", icon: Sparkles },
  { href: `/personas/${id}/content`, label: "Content Studio", icon: ImageIcon },
  { href: `/personas/${id}/instagram`, label: "Instagram", icon: Instagram },
  { href: `/personas/${id}/tiktok`, label: "TikTok", icon: Music2 },
  { href: `/personas/${id}/funnel`, label: "Funil", icon: Target },
  { href: `/personas/${id}/finance`, label: "Financeiro", icon: CircleDollarSign },
  { href: `/personas/${id}/launch`, label: "Lançamento", icon: Flame },
  { href: `/personas/${id}/leads`, label: "Leads", icon: Activity },
  { href: `/personas/${id}/prompts`, label: "Prompt Chains", icon: Brain },
];

// ---------------------------------------------------------------------------
// AI quick actions — cada uma envia um prompt direto à IA, que então chama
// a tool apropriada do /api/ai. As que mutam dados destrutivamente entram
// no fluxo de confirmação automaticamente.
// ---------------------------------------------------------------------------

type AIQuickAction = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
  tone?: "default" | "destructive";
};

const AI_QUICK_ACTIONS: AIQuickAction[] = [
  {
    label: "Gerar roteiro de Reel",
    icon: Sparkles,
    prompt:
      "Gere um roteiro completo de Reel para a persona ativa. Use a tool generateScript com hook forte, 4-5 cenas e um CTA claro.",
  },
  {
    label: "Gerar hook tático",
    icon: Zap,
    prompt:
      "Gere 1 hook tático de alta retenção sobre o nicho da persona ativa. Use a tool generateHook e salve no banco de hooks.",
  },
  {
    label: "Gerar legenda",
    icon: MessageSquare,
    prompt:
      "Gere uma legenda otimizada (com ganchos e CTA) para o último conteúdo planejado. Use a tool generateCaption.",
  },
  {
    label: "Gerar copy de venda",
    icon: ScrollText,
    prompt:
      "Crie uma copy de venda (anúncio) com headline, corpo e CTA para o produto principal da persona ativa. Use a tool generateCopy.",
  },
  {
    label: "Qualificar leads pendentes",
    icon: UserCheck,
    prompt:
      "Liste os 3 leads abertos mais recentes da persona ativa, proponha score e justificativa, e chame qualifyLead para cada (com confirmação).",
    tone: "destructive",
  },
  {
    label: "Resumir documento",
    icon: FileText,
    prompt:
      "Peça ao usuário qual documento resumir e use a tool summarizeDocument para criar um novo documento resumo (3-7 bullets).",
  },
  {
    label: "Criar evento no calendário",
    icon: Calendar,
    prompt:
      "Pergunte os detalhes de um compromisso e use a tool createCalendarEvent para registrá-lo na agenda.",
  },
  {
    label: "Adicionar nó no funil",
    icon: Workflow,
    prompt:
      "Adicione um nó no funil de vendas da persona ativa. Pergunte o tipo (landing, checkout, etc) e o nome, e use createFunnelNode.",
    tone: "destructive",
  },
  {
    label: "Sugerir ferramenta",
    icon: Hammer,
    prompt:
      "Pergunte o objetivo do usuário e use a tool suggestTool para recomendar a ferramenta certa do Tools Hub.",
  },
  {
    label: "Montar plano de lançamento",
    icon: Rocket,
    prompt:
      "Monte um plano de lançamento de 30 dias para a persona ativa: campanha + 6-10 eventos importantes (warm-up, abertura, fechamento). Use createLaunchPlan.",
    tone: "destructive",
  },
  {
    label: "Melhorar prompt",
    icon: Brain,
    prompt:
      "Peça ao usuário o prompt cru e use a tool improvePrompt para devolver uma versão melhor estruturada (papel, contexto, formato esperado).",
  },
  {
    label: "Analisar métricas",
    icon: BarChart3,
    prompt:
      "Analise métricas recentes de conteúdo, leads e finanças da persona ativa. Use a tool analyzeMetrics para registrar insight + recomendação.",
  },
  {
    label: "Transformar insight em tarefa",
    icon: Lightbulb,
    prompt:
      "Pergunte qual insight transformar em tarefa e use a tool insightToTask para criar uma tarefa acionável (com confirmação).",
    tone: "destructive",
  },
  {
    label: "Resumir reunião",
    icon: Bot,
    prompt:
      "Resuma a última reunião que o usuário descrever em decisões, blockers e próximas ações, e salve com createDocument.",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandMenu() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const triggerAIPrompt = useUIStore((s) => s.triggerAIPrompt);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const personas = usePersonaStore((s) => s.personas);
  const activeId = usePersonaStore((s) => s.activePersonaId);
  const setActivePersona = usePersonaStore((s) => s.setActivePersona);
  const openQuickCreate = useQuickCreate((s) => s.openWith);

  // Só busca dados de pesquisa quando a paleta está aberta — evita ~6 queries
  // rodando em toda página (custo de carga inicial + refetch em massa).
  const wsForSearch = open ? activeWorkspaceId : null;
  const { data: dbTasks = [] } = useTasks(wsForSearch);
  const { data: dbDocuments = [] } = useDocuments(wsForSearch);
  const { data: dbTools = [] } = useTools(wsForSearch);
  const { data: dbLeads = [] } = useLeads(wsForSearch);
  const { data: dbContent = [] } = useContent(wsForSearch, activeId);
  const { data: dbFlows = [] } = useFlows(wsForSearch);

  const defaultPersonaId = activeId ?? personas[0]?.id ?? "";

  const taskItems = dbTasks;
  const documentItems =
    dbDocuments;
  const toolItems = dbTools;
  const leadItems = dbLeads;
  const contentItems =
    dbContent;
  const flowItems = dbFlows;
  const personaItems =
    personas;

  // Cmd+K / Ctrl+K para abrir
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target as HTMLElement)?.tagName === "INPUT" ||
          (e.target as HTMLElement)?.tagName === "TEXTAREA"
        ) {
          if (e.key !== "k") return;
        }
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const runAIAction = (action: AIQuickAction) => {
    setOpen(false);
    triggerAIPrompt(action.prompt);
    toast.success(`IA acionada · ${action.label}`, {
      description: action.tone === "destructive"
        ? "Será necessário confirmar antes de aplicar mudanças."
        : "O painel da IA já está processando.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <Command
          className="flex h-[560px] flex-col"
          filter={(value, search) => {
            if (!search) return 1;
            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              placeholder="Buscar páginas, tarefas, leads, ferramentas, fluxos, personas, IA…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <Badge variant="outline" size="sm" className="hidden sm:inline-flex">
              esc para fechar
            </Badge>
          </div>

          <Command.List className="flex-1 overflow-y-auto p-2">
            <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
              Nada encontrado.
            </Command.Empty>

            {/* ===== Ações de criação ===== */}
            <Command.Group heading="Criar" className="mb-1">
              <CmdItem
                onSelect={() => {
                  setOpen(false);
                  openQuickCreate("task");
                }}
                icon={<Plus className="h-4 w-4" />}
                label="Nova tarefa"
                hint="t"
              />
              <CmdItem
                onSelect={() => {
                  setOpen(false);
                  openQuickCreate("document");
                }}
                icon={<FileText className="h-4 w-4" />}
                label="Novo documento"
                hint="d"
              />
              <CmdItem
                onSelect={() => {
                  setOpen(false);
                  openQuickCreate("content");
                }}
                icon={<ImageIcon className="h-4 w-4" />}
                label="Novo conteúdo"
                hint="c"
              />
              <CmdItem
                onSelect={() => {
                  setOpen(false);
                  openQuickCreate("lead");
                }}
                icon={<Activity className="h-4 w-4" />}
                label="Novo lead"
                hint="l"
              />
              <CmdItem
                onSelect={() => {
                  setOpen(false);
                  openQuickCreate("event");
                }}
                icon={<Calendar className="h-4 w-4" />}
                label="Novo evento"
                hint="e"
              />
              <CmdItem
                onSelect={() => {
                  setOpen(false);
                  openQuickCreate("flow");
                }}
                icon={<Workflow className="h-4 w-4" />}
                label="Novo flow"
              />
              <CmdItem
                onSelect={() => {
                  setOpen(false);
                  openQuickCreate("tool");
                }}
                icon={<Hammer className="h-4 w-4" />}
                label="Nova ferramenta"
              />
              <CmdItem
                onSelect={() => {
                  setOpen(false);
                  openQuickCreate("revenue");
                }}
                icon={<CircleDollarSign className="h-4 w-4" />}
                label="Nova receita"
              />
            </Command.Group>

            {/* ===== Ações de IA reais ===== */}
            <Command.Group heading="Ações de IA · execução real">
              {AI_QUICK_ACTIONS.map((action) => (
                <CmdItem
                  key={action.label}
                  onSelect={() => runAIAction(action)}
                  icon={<action.icon className="h-4 w-4" />}
                  label={action.label}
                  trailing={action.tone === "destructive" ? "confirma" : "IA"}
                />
              ))}
            </Command.Group>

            {/* ===== Personas ===== */}
            <Command.Group heading="Trocar persona ativa">
              {personaItems.map((p: any) => (
                <CmdItem
                  key={p.id}
                  onSelect={() => {
                    setActivePersona(p.id);
                    setOpen(false);
                    toast.success(`Persona ativa: ${p.name}`);
                  }}
                  icon={
                    <div
                      className="h-5 w-5 rounded text-[9px] font-bold flex items-center justify-center text-white"
                      style={{
                        background: `linear-gradient(135deg, ${p.accent ?? "#5b8cff"}, #2a3ef5)`,
                      }}
                    >
                      {p.name?.[0] ?? "?"}
                    </div>
                  }
                  label={p.name}
                  trailing={p.id === activeId ? "ativa" : undefined}
                />
              ))}
            </Command.Group>

            {/* ===== Buscar persona (navegação direta) ===== */}
            <Command.Group heading="Abrir persona">
              {personaItems.map((p: any) => (
                <CmdItem
                  key={`open-${p.id}`}
                  onSelect={() => go(`/personas/${p.id}/overview`)}
                  icon={
                    <div
                      className="h-5 w-5 rounded text-[9px] font-bold flex items-center justify-center text-white"
                      style={{
                        background: `linear-gradient(135deg, ${p.accent ?? "#5b8cff"}, #2a3ef5)`,
                      }}
                    >
                      {p.name?.[0] ?? "?"}
                    </div>
                  }
                  label={`Overview · ${p.name}`}
                  trailing={p.niche ?? p.status}
                />
              ))}
            </Command.Group>

            {/* ===== Páginas ===== */}
            <Command.Group heading="Páginas · Workspace">
              {workspaceLinks.map((l) => (
                <CmdItem
                  key={l.href}
                  onSelect={() => go(l.href)}
                  icon={<l.icon className="h-4 w-4" />}
                  label={l.label}
                  trailing={l.group}
                />
              ))}
            </Command.Group>

            {activeId && (
              <Command.Group heading="Páginas · Persona ativa">
                {personaPages(activeId).map((l) => (
                  <CmdItem
                    key={l.href}
                    onSelect={() => go(l.href)}
                    icon={<l.icon className="h-4 w-4" />}
                    label={l.label}
                  />
                ))}
              </Command.Group>
            )}

            {/* ===== Tarefas ===== */}
            <Command.Group heading="Tarefas">
              {taskItems.slice(0, 6).map((t: any) => (
                <CmdItem
                  key={t.id}
                  onSelect={() => go("/tasks")}
                  icon={<ListChecks className="h-4 w-4" />}
                  label={t.title}
                  trailing={t.status}
                />
              ))}
            </Command.Group>

            {/* ===== Documentos ===== */}
            <Command.Group heading="Documentos">
              {documentItems.slice(0, 4).map((d: any) => (
                <CmdItem
                  key={d.id}
                  onSelect={() => go("/documents")}
                  icon={<FileText className="h-4 w-4" />}
                  label={`${d.emoji ?? ""} ${d.title}`}
                />
              ))}
            </Command.Group>

            {/* ===== Fluxos ===== */}
            <Command.Group heading="Fluxos">
              {flowItems.slice(0, 6).map((f: any) => (
                <CmdItem
                  key={f.id}
                  onSelect={() => go(`/flows/${f.id}`)}
                  icon={<Workflow className="h-4 w-4" />}
                  label={f.name}
                  trailing={f.type}
                />
              ))}
            </Command.Group>

            {/* ===== Ferramentas ===== */}
            <Command.Group heading="Ferramentas">
              {toolItems.slice(0, 6).map((t: any) => (
                <CmdItem
                  key={t.id}
                  onSelect={() => {
                    setOpen(false);
                    window.open(t.url, "_blank");
                  }}
                  icon={<Hammer className="h-4 w-4" />}
                  label={t.name}
                  trailing={t.category}
                />
              ))}
            </Command.Group>

            {/* ===== Leads ===== */}
            <Command.Group heading="Leads recentes">
              {leadItems.slice(0, 4).map((l: any) => (
                <CmdItem
                  key={l.id}
                  onSelect={() => go(`/personas/${l.personaId ?? defaultPersonaId}/leads`)}
                  icon={<Activity className="h-4 w-4" />}
                  label={l.name ?? "(sem nome)"}
                  trailing={l.status}
                />
              ))}
            </Command.Group>

            {/* ===== Conteúdo ===== */}
            <Command.Group heading="Conteúdo">
              {contentItems.slice(0, 4).map((c: any) => (
                <CmdItem
                  key={c.id}
                  onSelect={() => go(`/personas/${c.personaId ?? defaultPersonaId}/content`)}
                  icon={<ImageIcon className="h-4 w-4" />}
                  label={c.title}
                  trailing={c.channel}
                />
              ))}
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-border/60 px-4 py-2 text-[10px] text-muted-foreground">
            <span>ZAYON Command Menu</span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <kbd className="text-foreground">↑↓</kbd> navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="text-foreground">↵</kbd> abrir
              </span>
              <span className="flex items-center gap-1">
                <kbd className="text-foreground">⌘K</kbd> abrir / fechar
              </span>
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CmdItem({
  onSelect,
  icon,
  label,
  hint,
  trailing,
}: {
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  trailing?: string;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      value={label}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm text-foreground/90",
        "data-[selected=true]:bg-accent data-[selected=true]:text-foreground",
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-card/60 text-muted-foreground">
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {trailing && (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {trailing}
        </span>
      )}
      {hint && (
        <Badge variant="outline" size="sm">
          {hint}
        </Badge>
      )}
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 data-[selected=true]:opacity-100" />
    </Command.Item>
  );
}
