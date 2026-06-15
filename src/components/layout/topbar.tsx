"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  CalendarPlus,
  FileText,
  Flame,
  Folders,
  Hammer,
  Image as ImageIcon,
  Instagram,
  Library,
  ListChecks,
  Music2,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  User as UserIcon,
  UserPlus,
  Users,
  Workflow,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/ui-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import { usePersonaStore } from "@/stores/persona-store";
import { useStudyStore } from "@/stores/study-store";
import { logoutAction } from "@/server/actions/auth";
import { initials } from "@/lib/utils/format";
import { toast } from "sonner";
import { NotificationsPopover } from "./notifications-popover";
import { MobileSidebar } from "./mobile-sidebar";

export function Topbar() {
  const router = useRouter();
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const toggleAI = useUIStore((s) => s.toggleAIPanel);
  const user = useWorkspaceStore((s) => s.user);
  const openQuickCreate = useQuickCreate((s) => s.openWith);
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const personas = usePersonaStore((s) => s.personas);
  const [createOpen, setCreateOpen] = React.useState(false);

  const targetPersonaId =
    activePersonaId ?? personas[0]?.id ?? null;

  const goToPersonaPage = (segment: string) => {
    setCreateOpen(false);
    if (!targetPersonaId) {
      toast.error("Selecione uma persona ativa primeiro");
      router.push("/personas");
      return;
    }
    router.push(`/personas/${targetPersonaId}/${segment}`);
  };

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setCreateOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-2xl">
      <MobileSidebar />

      <button
        onClick={() => setCommandOpen(true)}
        className="hidden sm:flex flex-1 max-w-md items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-2.5 py-1.5 text-left text-sm text-muted-foreground transition hover:bg-card"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1">Buscar páginas, tarefas, leads, IA…</span>
        <Kbd>⌘K</Kbd>
      </button>

      <button
        onClick={() => setCommandOpen(true)}
        className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
        aria-label="Buscar"
      >
        <Search className="h-4 w-4" />
      </button>

      <div className="flex sm:hidden flex-1" />

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleAI} aria-label="IA">
          <Bot className="h-4 w-4" />
        </Button>

        <FocusTimerBadge />

        <NotificationsPopover />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 p-0.5 pr-2 transition hover:bg-card">
              <Avatar size="sm">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback>
                  {initials(user?.fullName ?? "AV")}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-xs font-medium">
                {user?.fullName
                  ? user.fullName.split(" ")[0]
                  : user?.email?.split("@")[0] ?? "Usuário"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="p-2 flex items-center gap-3">
              <Avatar size="md">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback>
                  {initials(user?.fullName ?? "AV")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.fullName || user?.email?.split("@")[0] || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
                <Badge size="sm" variant="primary" className="mt-1">
                  {user?.role}
                </Badge>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/settings")}
            >
              <UserIcon className="h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={async () => {
                await logoutAction();
                // Limpar Zustand
                useWorkspaceStore.getState().setUser(null);
                useWorkspaceStore.getState().setActiveWorkspace("");
                usePersonaStore.getState().setPersonas([]);
                usePersonaStore.getState().setActivePersona(null);
                window.location.replace("/login");
              }}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={createOpen} onOpenChange={setCreateOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="gradient"
              size="sm"
              className="ml-2 hidden md:inline-flex"
              aria-label="Criar"
            >
              <Plus className="h-4 w-4" />
              Criar
              <Kbd className="ml-1 hidden lg:inline-flex">⌘⇧N</Kbd>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-72 max-h-[80vh] overflow-y-auto"
          >
            <DropdownMenuLabel>Trabalho</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openQuickCreate("task")}>
              <ListChecks className="h-4 w-4" />
              Nova Tarefa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openQuickCreate("project")}>
              <Folders className="h-4 w-4" />
              Novo Projeto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openQuickCreate("document")}>
              <FileText className="h-4 w-4" />
              Novo Documento
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setCreateOpen(false);
                router.push("/materials");
              }}
            >
              <Library className="h-4 w-4" />
              Novo Material
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openQuickCreate("tool")}>
              <Hammer className="h-4 w-4" />
              Nova Ferramenta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openQuickCreate("flow")}>
              <Workflow className="h-4 w-4" />
              Novo Flow
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Personas & conteúdo</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openQuickCreate("persona")}>
              <Users className="h-4 w-4" />
              Nova Persona
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openQuickCreate("content")}>
              <ImageIcon className="h-4 w-4" />
              Novo Conteúdo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                openQuickCreate("content", {
                  defaultChannel: "instagram",
                  defaultContentType: "reel",
                })
              }
            >
              <Instagram className="h-4 w-4" />
              Novo Roteiro Instagram
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                openQuickCreate("content", {
                  defaultChannel: "tiktok",
                  defaultContentType: "video",
                })
              }
            >
              <Music2 className="h-4 w-4" />
              Novo Roteiro TikTok
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => goToPersonaPage("funnel")}>
              <Target className="h-4 w-4" />
              Novo Funil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => goToPersonaPage("launch")}>
              <Flame className="h-4 w-4" />
              Novo Lançamento
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Vendas</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openQuickCreate("lead")}>
              <UserPlus className="h-4 w-4" />
              Novo Lead
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Financeiro</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openQuickCreate("revenue")}>
              <TrendingUp className="h-4 w-4" />
              Nova Receita
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openQuickCreate("expense")}>
              <TrendingDown className="h-4 w-4" />
              Nova Despesa
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Estudo & Foco</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                setCreateOpen(false);
                router.push("/study/sessions");
              }}
            >
              <Timer className="h-4 w-4" />
              Novo Foco (Timer)
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Outros</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openQuickCreate("event")}>
              <CalendarPlus className="h-4 w-4" />
              Novo Evento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleAI}>
              <Sparkles className="h-4 w-4" />
              Nova Conversa com IA
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function FocusTimerBadge() {
  const router = useRouter();
  const sessionId = useStudyStore((s) => s.sessionId);
  const startedAt = useStudyStore((s) => s.startedAt);
  const paused = useStudyStore((s) => s.paused);
  const baseSeconds = useStudyStore((s) => s.baseSeconds);

  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    if (!sessionId) {
      setSeconds(0);
      return;
    }

    const update = () => {
      if (paused) {
        setSeconds(baseSeconds);
      } else if (startedAt) {
        const elapsed = baseSeconds + Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(elapsed);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sessionId, startedAt, paused, baseSeconds]);

  if (!sessionId) return null;

  const format = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-2 bg-success/10 border-success/30 hover:bg-success/20 text-success font-mono animate-pulse rounded-full"
      onClick={() => router.push("/study/sessions")}
    >
      <span className="h-2 w-2 rounded-full bg-success animate-ping shrink-0" />
      <Timer className="h-3.5 w-3.5" />
      <span className="text-xs">{format(seconds)}</span>
    </Button>
  );
}
