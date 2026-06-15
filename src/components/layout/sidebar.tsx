"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  Bot,
  Brain,
  Calendar,
  CircleDollarSign,
  ClipboardList,
  Cog,
  Compass,
  FileText,
  Flame,
  Folders,
  Gauge,
  GraduationCap,
  Hammer,
  History,
  Home,
  Image as ImageIcon,
  Instagram,
  LayoutDashboard,
  Library,
  ListChecks,
  Music2,
  Plus,
  Sparkles,
  Target,
  Users,
  Wand2,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { PersonaSwitcher } from "./persona-switcher";
import { useUIStore } from "@/stores/ui-store";
import { usePersonaStore } from "@/stores/persona-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import { cn } from "@/lib/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const workspaceNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/tasks", label: "Tasks", icon: ListChecks, badge: "12" },
  { href: "/projects", label: "Projects", icon: Folders },
  { href: "/study/tracks", label: "Estudos", icon: GraduationCap },
  { href: "/study/library", label: "Biblioteca", icon: Library },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/materials", label: "Materials", icon: Library },
  { href: "/flows", label: "Flows", icon: Workflow },
  { href: "/team", label: "Team", icon: Users },
  { href: "/tools", label: "Tools Hub", icon: Hammer },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: "5" },
];

const personaNav = (id: string): NavItem[] => [
  { href: `/personas/${id}/overview`, label: "Overview", icon: Gauge },
  { href: `/personas/${id}/look-3d`, label: "Look 3D", icon: Sparkles },
  { href: `/personas/${id}/content`, label: "Content Studio", icon: ImageIcon },
  { href: `/personas/${id}/instagram`, label: "Instagram", icon: Instagram },
  { href: `/personas/${id}/tiktok`, label: "TikTok", icon: Music2 },
  { href: `/personas/${id}/modeling`, label: "Modelagem", icon: Compass },
  { href: `/personas/${id}/prompts`, label: "Prompt Chains", icon: Brain },
  { href: `/personas/${id}/funnel`, label: "Funil de Vendas", icon: Target },
  { href: `/personas/${id}/finance`, label: "Financeiro", icon: CircleDollarSign },
  { href: `/personas/${id}/launch`, label: "Lançamento", icon: Flame },
  { href: `/personas/${id}/leads`, label: "Leads", icon: Activity },
];

const intelligenceNav: NavItem[] = [
  { href: "/ai", label: "AI Assistant", icon: Bot },
  { href: "/ai/actions", label: "AI Actions", icon: Wand2 },
  { href: "/ai/history", label: "AI History", icon: History },
];

const systemNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Cog },
  { href: "/settings/workspace", label: "Workspace", icon: LayoutDashboard },
  { href: "/settings/persona", label: "Persona", icon: ClipboardList },
];

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
        {label}
      </p>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition",
                active
                  ? "bg-card text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <Badge
                  variant={active ? "primary" : "outline"}
                  size="sm"
                  className="ml-auto"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function SidebarContent() {
  const pathname = usePathname();
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const personas = usePersonaStore((s) => s.personas);
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const openQuickCreate = useQuickCreate((s) => s.openWith);
  const defaultPersonaId = activePersonaId ?? personas[0]?.id ?? "";
  const personaItems = personaNav(defaultPersonaId);

  return (
    <>
      <div className="p-3 space-y-2">
        <WorkspaceSwitcher />
        <PersonaSwitcher />
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={() => setCommandOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1.5 text-left text-sm text-muted-foreground transition hover:bg-card"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="flex-1">Buscar ou criar…</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 no-scrollbar space-y-5">
        <NavGroup label="Workspace" items={workspaceNav} pathname={pathname} />
        <NavGroup label="Persona Ops" items={personaItems} pathname={pathname} />
        <NavGroup label="Inteligência" items={intelligenceNav} pathname={pathname} />
        <NavGroup label="Sistema" items={systemNav} pathname={pathname} />
      </div>

      <div className="border-t border-border/60 p-3">
        <Button
          variant="gradient"
          size="sm"
          className="w-full"
          onClick={() => openQuickCreate("task")}
        >
          <Plus className="h-4 w-4" />
          Criar rápido
        </Button>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex h-screen w-[260px] shrink-0 flex-col border-r border-border/60 bg-background/60 backdrop-blur-xl">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebarContent() {
  return (
    <div className="flex h-screen w-full flex-col">
      <SidebarContent />
    </div>
  );
}
