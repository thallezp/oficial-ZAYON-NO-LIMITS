"use client";

import dynamic from "next/dynamic";
import { Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { MOCK_FUNNEL_AURORA } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { formatPercent } from "@/lib/utils/format";
import { useFunnel, useSaveFunnelDataMutation } from "@/hooks/use-queries";
import { toast } from "sonner";

const FunnelCanvas = dynamic(
  () => import("@/components/flow/funnel-canvas").then((m) => m.FunnelCanvas),
  { ssr: false, loading: () => <div className="h-[560px] rounded-xl border border-border/60 bg-card/40 animate-pulse" /> },
);

export default function FunnelPage() {
  const persona = usePersonaFromRoute();
  const { data: dbFunnel, isLoading } = useFunnel(persona.id);
  const saveMutation = useSaveFunnelDataMutation();

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Carregando funil...</div>
      </div>
    );
  }

  const funnel = dbFunnel || (isMockModeClient ? MOCK_FUNNEL_AURORA : null);

  if (!funnel) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Funil de Vendas"
          description="Nenhum funil real cadastrado para esta persona."
          actions={
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" /> Criar funil
            </Button>
          }
        />
        <PersonaHero persona={persona} pageBadge="funil" />
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Crie o primeiro funil para conectar canais, etapas e metricas reais.
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async (nodes: any[], edges: any[]) => {
    if (!funnel.id) {
      toast.error("ID do funil não disponível");
      return;
    }
    try {
      await saveMutation.mutateAsync({
        funnelId: funnel.id,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data?.nodeType || n.type || "custom",
          title: n.data?.title || "",
          description: n.data?.description || "",
          position: n.position,
          data: n.data || null,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label || null,
          data: e.data || null,
        })),
      });
      toast.success("Funil salvo com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar funil: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funil de Vendas"
        description="React Flow com pan, zoom, drag de nós, conexão entre canais e métricas por etapa."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" /> Sugerir otimização
            </Button>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" /> Novo nó
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="funil" />

      <Card>
        <CardHeader className="flex-row justify-between">
          <div>
            <CardTitle>{funnel.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{funnel.description}</p>
          </div>
          <Badge variant="success">
            conversão · {formatPercent((Number(funnel.conversionRate) ?? 0) / 100)}
          </Badge>
        </CardHeader>
        <CardContent>
          <FunnelCanvas funnel={funnel as any} accent={persona.accent} onSave={handleSave} />
        </CardContent>
      </Card>

      <Card variant="glass" className="overflow-hidden relative">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <CardContent className="p-6 relative space-y-2">
          <Badge variant="primary" size="sm" className="w-fit">
            <Sparkles className="h-3 w-3" /> Insight IA
          </Badge>
          <p className="text-sm">
            O nó <span className="font-semibold">Direct Aurora</span> está com
            queda de 12% na conversão para WhatsApp. Sugestão: testar variação do
            gatilho de chamada nos últimos 3 reels publicados.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm">
              Aceitar
            </Button>
            <Button variant="gradient" size="sm">
              Aplicar sugestão
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
