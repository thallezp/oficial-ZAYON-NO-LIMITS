"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Instagram,
  Mail,
  Phone,
  Plus,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { MOCK_LEADS } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { formatCurrency, initials, relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { LeadDetailDrawer } from "@/components/tables/lead-detail-drawer";
import type { Lead } from "@/types";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useLeads } from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeLeads } from "@/hooks/use-realtime";

const statusVariant = {
  open: "outline",
  approached: "primary",
  qualified: "info",
  converted: "success",
  lost: "danger",
  no_response: "ghost",
} as const;

export default function LeadsPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbLeads = [] } = useLeads(activeWorkspaceId, persona.id);
  const { openWith } = useQuickCreate();
  const queryClient = useQueryClient();

  useRealtimeLeads(activeWorkspaceId ?? undefined, persona.id, () => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  });

  const allLeads =
    isMockModeClient && dbLeads.length === 0
      ? MOCK_LEADS.filter((l) => l.personaId === persona.id)
      : dbLeads;
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [drawerLead, setDrawerLead] = React.useState<Lead | null>(null);

  const leads = allLeads.filter(
    (l: any) =>
      (statusFilter === "all" || l.status === statusFilter) &&
      (!search ||
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase())),
  );

  const converted = allLeads.filter((l: any) => l.status === "converted");
  const totalRevenue = converted.reduce(
    (sum: number, l: any) => sum + (l.convertedValue ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="CRM por persona · Google Sheets, webhooks, Supabase realtime."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeWorkspaceId) {
                  window.open(`/api/exports/leads?workspaceId=${activeWorkspaceId}&personaId=${persona.id}`, "_blank");
                }
              }}
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("A IA está analisando os leads...")}>
              <Wand2 className="h-3.5 w-3.5" /> Qualificar com IA
            </Button>
            <Button variant="gradient" size="sm" onClick={() => openWith("lead")}>
              <Plus className="h-4 w-4" /> Novo Lead
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="leads" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total de leads"
          value={String(allLeads.length)}
          icon={<ArrowUpRight className="h-4 w-4" />}
          accent="primary"
        />
        <StatCard
          label="Qualificados"
          value={String(
            allLeads.filter((l: any) => l.status === "qualified" || l.status === "converted").length,
          )}
          delta={22.7}
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
          value={String(
            Math.round(
              allLeads.reduce((s: number, l: any) => s + (l.score ?? 0), 0) /
                Math.max(allLeads.length, 1),
            ),
          )}
          icon={<Sparkles className="h-4 w-4" />}
          accent="info"
        />
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nome, email, instagram…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {["all", "open", "qualified", "converted", "lost"].map((s) => (
                <Badge
                  key={s}
                  variant={statusFilter === s ? "primary" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "all" ? "Todos" : s}
                </Badge>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <th className="px-3 py-2.5 w-8"></th>
                  <th className="px-3 py-2.5">Lead</th>
                  <th className="px-3 py-2.5">Contato</th>
                  <th className="px-3 py-2.5">Origem</th>
                  <th className="px-3 py-2.5">Score</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Resp.</th>
                  <th className="px-3 py-2.5">Quando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {leads.map((l: any) => {
                  const isOpen = expanded === l.id;
                  return (
                    <React.Fragment key={l.id}>
                      <tr
                        onClick={() => setExpanded(isOpen ? null : l.id)}
                        className="hover:bg-accent cursor-pointer"
                      >
                        <td className="px-3 py-2.5">
                          {isOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar size="xs">
                              <AvatarFallback>
                                {initials(l.name ?? "?")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{l.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {l.campaign}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {l.email && <Mail className="h-3 w-3" />}
                            {l.phone && <Phone className="h-3 w-3" />}
                            {l.instagram && <Instagram className="h-3 w-3" />}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                          {l.source}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-12 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={cn(
                                  "h-full",
                                  (l.score ?? 0) > 80
                                    ? "bg-success"
                                    : (l.score ?? 0) > 60
                                      ? "bg-warning"
                                      : "bg-muted-foreground",
                                )}
                                style={{ width: `${l.score}%` }}
                              />
                            </div>
                            <span className="num text-xs font-medium">{l.score}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge size="sm" variant={statusVariant[l.status as keyof typeof statusVariant] || "outline"}>
                            {l.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          {l.responsible && (
                            <Avatar size="xs">
                              <AvatarFallback>
                                {initials(l.responsible.fullName)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                          {relativeTime(l.createdAt)}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={8} className="bg-card/60 px-6 py-4">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="grid sm:grid-cols-2 gap-4"
                            >
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Respostas do form
                                </p>
                                {l.answers?.map((a: any, i: number) => (
                                  <div key={i}>
                                    <p className="text-[11px] text-muted-foreground">
                                      {a.question}
                                    </p>
                                    <p className="text-sm italic">
                                      "{a.answer}"
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Observações
                                </p>
                                <p className="text-sm">
                                  {l.notes ?? "Sem observações"}
                                </p>
                                {l.convertedValue && (
                                  <Badge variant="success">
                                    Valor convertido · {formatCurrency(l.convertedValue)}
                                  </Badge>
                                )}
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant="gradient"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDrawerLead(l);
                                    }}
                                  >
                                    Abrir detalhes <ArrowUpRight className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    Criar tarefa
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Wand2 className="h-3 w-3" /> Resposta IA
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
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
        onOpenChange={(o) => !o && setDrawerLead(null)}
      />
    </div>
  );
}
