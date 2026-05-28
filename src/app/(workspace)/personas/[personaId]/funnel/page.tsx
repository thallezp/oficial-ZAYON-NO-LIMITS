"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { List, Map, Plus, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { MOCK_FUNNEL_AURORA } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { formatPercent, formatCompact, formatCurrency } from "@/lib/utils/format";
import {
  useFunnel,
  useSaveFunnelDataMutation,
  useCreateFunnelMutation,
  useDeleteFunnelMutation,
} from "@/hooks/use-queries";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspaceStore } from "@/stores/workspace-store";

const FunnelCanvas = dynamic(
  () => import("@/components/flow/funnel-canvas").then((m) => m.FunnelCanvas),
  { ssr: false, loading: () => <div className="h-[560px] rounded-xl border border-border/60 bg-card/40 animate-pulse" /> },
);

const TEMPLATES = {
  organic: {
    name: "Funil Orgânico (TikTok → Direct)",
    nodes: [
      { id: "node-1", type: "content", title: "Vídeo Orgânico TikTok", description: "Atração por alcance", position: { x: 50, y: 150 }, metrics: { traffic: 25000, conversion: 3.5, revenue: 0 } },
      { id: "node-2", type: "direct", title: "Chamada Direct", description: "Primeira qualificação", position: { x: 300, y: 150 }, metrics: { traffic: 875, conversion: 40, revenue: 0 } },
      { id: "node-3", type: "whatsapp", title: "WhatsApp Comercial", description: "Fechamento consultivo", position: { x: 550, y: 150 }, metrics: { traffic: 350, conversion: 20, revenue: 70000 } },
    ],
    edges: [
      { id: "edge-1", source: "node-1", target: "node-2" },
      { id: "edge-2", source: "node-2", target: "node-3" },
    ],
  },
  escalator: {
    name: "Escada de Valor",
    nodes: [
      { id: "node-1", type: "landing", title: "Isca Digital", description: "Lead Magnet PDF", position: { x: 50, y: 100 }, metrics: { traffic: 5000, conversion: 20, revenue: 0 } },
      { id: "node-2", type: "community", title: "Comunidade de Alunos", description: "Comunidade Low Ticket", position: { x: 280, y: 100 }, metrics: { traffic: 1000, conversion: 10, revenue: 19000 } },
      { id: "node-3", type: "checkout", title: "Curso Principal", description: "Core Offer", position: { x: 510, y: 100 }, metrics: { traffic: 100, conversion: 15, revenue: 49000 } },
      { id: "node-4", type: "call", title: "Mentoria Individual", description: "High Ticket Back-end", position: { x: 740, y: 100 }, metrics: { traffic: 15, conversion: 30, revenue: 150000 } },
    ],
    edges: [
      { id: "edge-1", source: "node-1", target: "node-2" },
      { id: "edge-2", source: "node-2", target: "node-3" },
      { id: "edge-3", source: "node-3", target: "node-4" },
    ],
  },
};

export default function FunnelPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbFunnel, isLoading } = useFunnel(persona.id);
  const saveMutation = useSaveFunnelDataMutation();
  const createMutation = useCreateFunnelMutation();
  const deleteMutation = useDeleteFunnelMutation();

  const [viewMode, setViewMode] = React.useState<"canvas" | "list">("canvas");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [funnelName, setFunnelName] = React.useState("");
  const [funnelDesc, setFunnelDesc] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState<keyof typeof TEMPLATES | "empty">("organic");

  const funnel = dbFunnel || (isMockModeClient ? MOCK_FUNNEL_AURORA : null);

  const handleSave = async (nodes: any[], edges: any[]) => {
    if (!funnel?.id) {
      toast.error("ID do funil não disponível");
      return;
    }
    // Calculate global conversion rate: first node traffic vs final node revenue or traffic
    const firstNodeTraffic = nodes[0]?.metrics?.traffic || 1;
    const finalNodeSales = nodes[nodes.length - 1]?.metrics?.traffic * (nodes[nodes.length - 1]?.metrics?.conversion / 100) || 0;
    const computedConversion = Number(((finalNodeSales / firstNodeTraffic) * 100).toFixed(2)) || 2.5;

    try {
      await saveMutation.mutateAsync({
        funnelId: funnel.id,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data?.nodeType || n.type || "custom",
          title: n.data?.title || n.title || "",
          description: n.data?.description || n.description || "",
          position: n.position,
          data: n.data || null,
          metrics: n.metrics || n.data?.metrics || null,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label || null,
          data: e.data || null,
        })),
        conversionRate: computedConversion,
      });
      toast.success("Funil salvo com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar funil: " + e.message);
    }
  };

  const handleCreateFunnel = async () => {
    if (!funnelName.trim()) {
      toast.error("Insira o nome do funil");
      return;
    }
    if (!activeWorkspaceId) {
      toast.error("Workspace ativo não encontrado");
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: persona.id,
        name: funnelName,
        description: funnelDesc,
      });
      
      const newFunnelId = (result as any)?.data?.id || (result as any)?.id;
      if (newFunnelId && selectedTemplate !== "empty") {
        const tmpl = TEMPLATES[selectedTemplate];
        await saveMutation.mutateAsync({
          funnelId: newFunnelId,
          nodes: tmpl.nodes,
          edges: tmpl.edges,
          conversionRate: 5.0,
        });
      }
      toast.success("Funil criado com sucesso!");
      setCreateOpen(false);
      setFunnelName("");
      setFunnelDesc("");
    } catch (e: any) {
      toast.error("Erro ao criar funil: " + e.message);
    }
  };

  const handleDeleteFunnel = async () => {
    if (!funnel?.id) return;
    if (!confirm("Tem certeza que deseja excluir este funil?")) return;
    try {
      await deleteMutation.mutateAsync({ id: funnel.id, personaId: persona.id });
      toast.success("Funil excluído");
    } catch (e: any) {
      toast.error("Erro ao excluir: " + e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Carregando funil...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funil de Vendas"
        description="Planeje funis visuais ou confira a planilha de métricas, tráfego e taxas de conversão."
        actions={
          <>
            {funnel && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(v => v === "canvas" ? "list" : "canvas")}
                >
                  {viewMode === "canvas" ? (
                    <><List className="h-3.5 w-3.5" /> Ver Lista</>
                  ) : (
                    <><Map className="h-3.5 w-3.5" /> Ver Mapa</>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeleteFunnel} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir Funil
                </Button>
              </>
            )}
            <Button variant="gradient" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Novo Funil
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="funil" />

      {!funnel ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground space-y-4">
            <p>Nenhum funil real cadastrado para esta persona.</p>
            <Button variant="gradient" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Criar Primeiro Funil
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "canvas" ? (
        <Card>
          <CardHeader className="flex-row justify-between items-center">
            <div>
              <CardTitle>{funnel.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{funnel.description}</p>
            </div>
            <Badge variant="success" className="text-sm">
              conversão · {formatPercent((Number(funnel.conversionRate) ?? 0) / 100)}
            </Badge>
          </CardHeader>
          <CardContent>
            <FunnelCanvas funnel={funnel as any} accent={persona.accent} onSave={handleSave} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{funnel.name} · Detalhamento de Etapas</CardTitle>
            <p className="text-xs text-muted-foreground">Visão consolidada de todas as etapas e conversão.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/50">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                    <th className="px-4 py-3">Nome da Etapa</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Tráfego (Cliques)</th>
                    <th className="px-4 py-3">Conversão (%)</th>
                    <th className="px-4 py-3 text-right">Receita Estimada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {funnel.nodes?.map((node: any) => (
                    <tr key={node.id} className="hover:bg-accent">
                      <td className="px-4 py-3 font-medium">{node.title}</td>
                      <td className="px-4 py-3 capitalize"><Badge variant="outline">{node.type}</Badge></td>
                      <td className="px-4 py-3 num">{formatCompact(node.metrics?.traffic ?? 0)}</td>
                      <td className="px-4 py-3 num">{(node.metrics?.conversion ?? 0).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right num text-success font-medium">
                        {formatCurrency(node.metrics?.revenue ?? 0)}
                      </td>
                    </tr>
                  ))}
                  {(!funnel.nodes || funnel.nodes.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma etapa criada neste funil.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para criação de funil */}
      {createOpen && (
        <Dialog open onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Funil de Vendas</DialogTitle>
              <DialogDescription>
                Configure as propriedades iniciais do seu funil e escolha um template operacional para começar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome do Funil</Label>
                <Input
                  value={funnelName}
                  onChange={(e) => setFunnelName(e.target.value)}
                  placeholder="Ex: Lançamento Perpétuo Aurora"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={funnelDesc}
                  onChange={(e) => setFunnelDesc(e.target.value)}
                  placeholder="Ex: Tráfego pago direto para checkouts e grupos do WhatsApp."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Template Inicial</Label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-border/60 bg-background px-3 py-1 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="organic">Funil Orgânico (TikTok → Direct → WhatsApp)</option>
                  <option value="escalator">Escada de Valor (Isca → Low ticket → Core Offer → Mentoria)</option>
                  <option value="empty">Começar Vazio</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button variant="gradient" onClick={handleCreateFunnel}>Criar e Aplicar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
