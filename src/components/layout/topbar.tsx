"use client";

import * as React from "react";
import {
  Bot,
  CalendarPlus,
  FileText,
  Image as ImageIcon,
  ListChecks,
  Plus,
  Search,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User as UserIcon,
  UserPlus,
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
import { initials } from "@/lib/utils/format";
import { NotificationsPopover } from "./notifications-popover";
import { MobileSidebar } from "./mobile-sidebar";

export function Topbar() {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const toggleAI = useUIStore((s) => s.toggleAIPanel);
  const user = useWorkspaceStore((s) => s.user);
  const openQuickCreate = useQuickCreate((s) => s.openWith);
  const [createOpen, setCreateOpen] = React.useState(false);

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
                {user?.fullName ? user.fullName.split(" ")[0] : "Usuário"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="p-2 flex items-center gap-3">
              <Avatar size="md">
                <AvatarFallback>
                  {initials(user?.fullName ?? "AV")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
                <Badge size="sm" variant="primary" className="mt-1">
                  {user?.role}
                </Badge>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Sair</DropdownMenuItem>
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
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Criação rápida</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openQuickCreate("task")}>
              <ListChecks className="h-4 w-4" />
              Nova Tarefa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openQuickCreate("document")}>
              <FileText className="h-4 w-4" />
              Novo Documento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openQuickCreate("content")}>
              <ImageIcon className="h-4 w-4" />
              Novo Conteúdo
            </DropdownMenuItem>
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
