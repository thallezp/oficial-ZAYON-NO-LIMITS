"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Edit3, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_FLOWS } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import type { Edge, Node } from "reactflow";
import { useFlow, useSaveFlowDataMutation } from "@/hooks/use-queries";
import { toast } from "sonner";

const ProcessCanvas = dynamic(
  () => import("@/components/flow/process-canvas").then((m) => m.ProcessCanvas),
  { ssr: false, loading: () => <div className="h-[560px] rounded-xl border border-border/60 bg-card/40 animate-pulse" /> },
);

export default function FlowDetailPage() {
  const params = useParams<{ flowId: string }>();
  const flowId = params?.flowId;

  const { data: dbFlow, isLoading } = useFlow(flowId);
  const saveMutation = useSaveFlowDataMutation();

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Carregando flow...</div>
      </div>
    );
  }

  const flow =
    dbFlow ||
    (isMockModeClient
      ? MOCK_FLOWS.find((f) => f.id === flowId) || MOCK_FLOWS[0]
      : null);

  if (!flow) {
    return (
      <EmptyState
        icon={<Edit3 className="h-5 w-5" />}
        title="Flow nao encontrado"
        description="Este flow nao existe no workspace atual ou voce nao tem acesso a ele."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/flows">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para flows
            </Link>
          </Button>
        }
      />
    );
  }

  // Map initial nodes and edges from db or mock
  const initialNodes: Node[] = (flow as any).nodes?.length > 0 || !isMockModeClient ? ((flow as any).nodes ?? []) : [
    {
      id: "1",
      type: "step",
      position: { x: 0, y: 80 },
      data: { kind: "trigger", title: "Ideação", description: "Brainstorm com pilares", owner: "Strategy" },
    },
    {
      id: "2",
      type: "step",
      position: { x: 240, y: 80 },
      data: { kind: "action", title: "Roteiro", description: "Tiptap · checklist", owner: "Copy" },
    },
    {
      id: "3",
      type: "step",
      position: { x: 480, y: 80 },
      data: { kind: "approval", title: "Aprovação", description: "Strategist + Owner", owner: "Marina" },
    },
    {
      id: "4",
      type: "step",
      position: { x: 720, y: 80 },
      data: { kind: "action", title: "Captação", description: "B-roll + áudio", owner: "Vídeo" },
    },
    {
      id: "5",
      type: "step",
      position: { x: 480, y: 260 },
      data: { kind: "action", title: "Edição", description: "CapCut · Premiere", owner: "Editor" },
    },
    {
      id: "6",
      type: "step",
      position: { x: 720, y: 260 },
      data: { kind: "approval", title: "Aprovação final", description: "Owner", owner: "Alex" },
    },
    {
      id: "7",
      type: "step",
      position: { x: 960, y: 260 },
      data: { kind: "action", title: "Publicação", description: "Agendamento + boost", owner: "Social" },
    },
  ];

  const initialEdges: Edge[] = (flow as any).edges?.length > 0 || !isMockModeClient ? ((flow as any).edges ?? []) : [
    { id: "e1-2", source: "1", target: "2", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
    { id: "e2-3", source: "2", target: "3", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
    { id: "e3-4", source: "3", target: "4", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
    { id: "e4-5", source: "4", target: "5", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
    { id: "e5-6", source: "5", target: "6", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
    { id: "e6-7", source: "6", target: "7", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
  ];

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    if (!flowId) return;
    try {
      await saveMutation.mutateAsync({ flowId, nodes, edges });
      toast.success("Fluxo salvo com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar fluxo: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/flows" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Flows
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{flow.name}</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{flow.name}</h1>
            <Badge variant="outline">{flow.type}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{flow.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-3.5 w-3.5" /> Compartilhar
          </Button>
          <Button variant="outline" size="sm">
            <Sparkles className="h-3.5 w-3.5" /> Sugerir IA
          </Button>
          <Button variant="gradient" size="sm">
            <Edit3 className="h-3.5 w-3.5" /> Editar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canvas</CardTitle>
        </CardHeader>
        <CardContent>
          <ProcessCanvas initialNodes={initialNodes} initialEdges={initialEdges} onSave={handleSave} />
        </CardContent>
      </Card>
    </div>
  );
}
