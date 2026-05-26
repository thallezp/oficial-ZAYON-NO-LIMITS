"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Activity,
  Bot,
  Calendar,
  ChevronRight,
  Cog,
  CircleDollarSign,
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
  Workflow,
  Wand2,
  Brain,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";
import { usePersonaStore } from "@/stores/persona-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import {
  MOCK_TASKS,
  MOCK_DOCUMENTS,
  MOCK_TOOLS,
  MOCK_LEADS,
  MOCK_CONTENT,
} from "@/data";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

const workspaceLinks = [
  { href: "/dashboard", label: "Home", icon: Home, group: "Workspace" },
  { href: "/tasks", label: "Tarefas", icon: ListChecks, group: "Workspace" },
  { href: "/projects", label: "Projetos", icon: Folders, group: "Workspace" },
  { href: "/calendar", label: "Calendário", icon: Calendar, group: "Workspace" },
  { href: "/documents", label: "Documentos", icon: FileText, group: "Workspace" },
  { href: "/materials", label: "Materiais", icon: Library, group: "Workspace" },
  { href: "/flows", label: "Flows", icon: Workflow, group: "Workspace" },
  { href: "/team", label: "Equipe", icon: Users, group: "Workspace" },
  { href: "/tools", label: "Tools Hub", icon: Hammer, group: "Workspace" },
  { href: "/ai", label: "AI Assistant", icon: Bot, group: "Inteligência" },
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

export function CommandMenu() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const personas = usePersonaStore((s) => s.personas);
  const activeId = usePersonaStore((s) => s.activePersonaId);
  const setActivePersona = usePersonaStore((s) => s.setActivePersona);
  const openQuickCreate = useQuickCreate((s) => s.openWith);

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

  const runAIAction = (label: string) => {
    setOpen(false);
    toast.success(`IA acionada: ${label}`, {
      description: "A ação foi enviada para processamento.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <Command
          className="flex h-[520px] flex-col"
          filter={(value, search) => {
            if (!search) return 1;
            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              placeholder="Buscar páginas, tarefas, leads, ferramentas, IA…"
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

            <Command.Group heading="Ações rápidas" className="mb-1">
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
                onSelect={() => runAIAction("Gerar roteiro")}
                icon={<Sparkles className="h-4 w-4" />}
                label="IA · gerar roteiro"
                hint="ai"
              />
              <CmdItem
                onSelect={() => runAIAction("Qualificar leads pendentes")}
                icon={<Wand2 className="h-4 w-4" />}
                label="IA · qualificar leads"
              />
              <CmdItem
                onSelect={() => runAIAction("Resumir reunião")}
                icon={<Bot className="h-4 w-4" />}
                label="IA · resumir reunião"
              />
            </Command.Group>

            <Command.Group heading="Trocar persona ativa">
              {personas.map((p) => (
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
                      {p.name[0]}
                    </div>
                  }
                  label={p.name}
                  trailing={p.id === activeId ? "ativa" : undefined}
                />
              ))}
            </Command.Group>

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

            <Command.Group heading="Tarefas">
              {MOCK_TASKS.slice(0, 6).map((t) => (
                <CmdItem
                  key={t.id}
                  onSelect={() => go("/tasks")}
                  icon={<ListChecks className="h-4 w-4" />}
                  label={t.title}
                  trailing={t.status}
                />
              ))}
            </Command.Group>

            <Command.Group heading="Documentos">
              {MOCK_DOCUMENTS.slice(0, 4).map((d) => (
                <CmdItem
                  key={d.id}
                  onSelect={() => go("/documents")}
                  icon={<FileText className="h-4 w-4" />}
                  label={`${d.emoji ?? ""} ${d.title}`}
                />
              ))}
            </Command.Group>

            <Command.Group heading="Ferramentas">
              {MOCK_TOOLS.slice(0, 6).map((t) => (
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

            <Command.Group heading="Leads recentes">
              {MOCK_LEADS.slice(0, 4).map((l) => (
                <CmdItem
                  key={l.id}
                  onSelect={() =>
                    go(`/personas/${l.personaId ?? "p_aurora"}/leads`)
                  }
                  icon={<Activity className="h-4 w-4" />}
                  label={l.name ?? "(sem nome)"}
                  trailing={l.status}
                />
              ))}
            </Command.Group>

            <Command.Group heading="Conteúdo">
              {MOCK_CONTENT.slice(0, 4).map((c) => (
                <CmdItem
                  key={c.id}
                  onSelect={() =>
                    go(`/personas/${c.personaId ?? "p_aurora"}/content`)
                  }
                  icon={<ImageIcon className="h-4 w-4" />}
                  label={c.title}
                  trailing={c.channel}
                />
              ))}
            </Command.Group>
          </Command.List>
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-2 text-[10px] text-muted-foreground">
            <span>NEXUS Command Menu</span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <kbd className="text-foreground">↑↓</kbd> navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="text-foreground">↵</kbd> abrir
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
