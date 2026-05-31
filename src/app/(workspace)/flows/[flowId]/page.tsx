"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Edit3, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Edge, Node } from "reactflow";
import {
  useFlow,
  useSaveFlowDataMutation,
  useDocuments,
  useCreateTaskMutation,
  useCreateProjectMutation,
} from "@/hooks/use-queries";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { toast } from "sonner";
import type { NodeData } from "@/components/flow/process-canvas";

const ProcessCanvas = dynamic(
  () => import("@/components/flow/process-canvas").then((m) => m.ProcessCanvas),
  { ssr: false, loading: () => <div className="h-[560px] rounded-xl border border-border/60 bg-card/40 animate-pulse" /> },
);

export default function FlowDetailPage() {
  const params = useParams<{ flowId: string }>();
  const router = useRouter();
  const flowId = params?.flowId;
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const user = useWorkspaceStore((s) => s.user);

  const { data: dbFlow, isLoading } = useFlow(flowId);
  const { data: dbDocuments = [] } = useDocuments(activeWorkspaceId);
  const saveMutation = useSaveFlowDataMutation();
  const createTaskMutation = useCreateTaskMutation();
  const createProjectMutation = useCreateProjectMutation();

  // Hooks devem rodar sempre na mesma ordem — manter antes de qualquer early return.
  const documents = React.useMemo(
    () =>
      (dbDocuments as any[]).map((d) => ({
        id: d.id,
        title: d.title ?? "(sem título)",
      })),
    [dbDocuments],
  );

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Carregando flow...</div>
      </div>
    );
  }

  const flow = dbFlow || null;

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

  // Template default: quando o flow nao tem nodes (real ou mock), oferece um
  // ponto de partida em vez de canvas em branco. Apenas vira o "state inicial"
  // do canvas — so persiste no banco quando o usuario clicar em "Salvar".
  const DEFAULT_NODES: Node[] = [
    {
      id: "1",
      type: "step",
      position: { x: 0, y: 80 },
      data: { kind: "trigger", title: "Ideacao", description: "Brainstorm com pilares", owner: "Strategy" },
    },
    {
      id: "2",
      type: "step",
      position: { x: 240, y: 80 },
      data: { kind: "action", title: "Roteiro", description: "Tiptap + checklist", owner: "Copy" },
    },
    {
      id: "3",
      type: "step",
      position: { x: 480, y: 80 },
      data: { kind: "approval", title: "Aprovacao", description: "Strategist + Owner", owner: "Marina" },
    },
    {
      id: "4",
      type: "step",
      position: { x: 720, y: 80 },
      data: { kind: "action", title: "Captacao", description: "B-roll + audio", owner: "Video" },
    },
    {
      id: "5",
      type: "step",
      position: { x: 480, y: 260 },
      data: { kind: "action", title: "Edicao", description: "CapCut / Premiere", owner: "Editor" },
    },
    {
      id: "6",
      type: "step",
      position: { x: 720, y: 260 },
      data: { kind: "approval", title: "Aprovacao final", description: "Owner", owner: "Alex" },
    },
    {
      id: "7",
      type: "step",
      position: { x: 960, y: 260 },
      data: { kind: "action", title: "Publicacao", description: "Agendamento + boost", owner: "Social" },
    },
  ];

  const DEFAULT_EDGES: Edge[] = [
    { id: "e1-2", source: "1", target: "2", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
    { id: "e2-3", source: "2", target: "3", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
    { id: "e3-4", source: "3", target: "4", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
    { id: "e4-5", source: "4", target: "5", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
    { id: "e5-6", source: "5", target: "6", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
    { id: "e6-7", source: "6", target: "7", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
  ];

  const dbNodes = ((flow as any).nodes ?? []) as Node[];
  const dbEdges = ((flow as any).edges ?? []) as Edge[];

  // Se o flow do banco tem nodes salvos, usa eles. Caso contrario, mostra o
  // template default. Isso elimina o canvas em branco que confundia o usuario.
  const initialNodes: Node[] = dbNodes.length > 0 ? dbNodes : DEFAULT_NODES;
  const initialEdges: Edge[] = dbNodes.length > 0 ? dbEdges : DEFAULT_EDGES;

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    if (!flowId) return;
    try {
      await saveMutation.mutateAsync({ flowId, nodes, edges });
      toast.success("Fluxo salvo com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar fluxo: " + e.message);
    }
  };

  const mapNodeStatusToTaskStatus = (status?: string) => {
    if (status === "done") return "done";
    if (status === "doing") return "doing";
    if (status === "blocked") return "todo";
    return "todo";
  };

  const handleCreateTaskFromNode = async (node: NodeData) => {
    if (!activeWorkspaceId) {
      toast.error("Workspace ativo não encontrado");
      return;
    }
    try {
      await createTaskMutation.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: (flow as any)?.personaId ?? undefined,
        title: node.title || "Tarefa do fluxo",
        description: node.description ?? undefined,
        status: mapNodeStatusToTaskStatus(node.status),
        dueAt: node.dueAt
          ? new Date(node.dueAt).toISOString()
          : undefined,
        labels: node.tags && node.tags.length > 0 ? node.tags : undefined,
      });
      toast.success(`Tarefa "${node.title}" criada`);
    } catch (e: any) {
      toast.error("Erro ao criar tarefa: " + (e?.message ?? "desconhecido"));
    }
  };

  const handleConvertToProject = async (nodes: Node[]) => {
    if (!activeWorkspaceId) {
      toast.error("Workspace ativo não encontrado");
      return;
    }
    try {
      const created: any = await createProjectMutation.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: (flow as any)?.personaId ?? undefined,
        name: flow.name,
        description: flow.description ?? undefined,
        color: (flow as any).color ?? undefined,
        icon: (flow as any).icon ?? undefined,
      });
      const projectId = created?.id ?? created?.data?.id;
      if (!projectId) {
        toast.success("Projeto criado");
        return;
      }
      let createdTasks = 0;
      for (const n of nodes) {
        const data = n.data as NodeData;
        try {
          await createTaskMutation.mutateAsync({
            workspaceId: activeWorkspaceId,
            personaId: (flow as any)?.personaId ?? undefined,
            projectId,
            title: data.title || "Etapa",
            description: data.description ?? undefined,
            status: mapNodeStatusToTaskStatus(data.status),
            dueAt: data.dueAt
              ? new Date(data.dueAt).toISOString()
              : undefined,
            labels: data.tags && data.tags.length > 0 ? data.tags : undefined,
          });
          createdTasks += 1;
        } catch (err) {
          // segue com os outros nós mesmo se um falhar
        }
      }
      toast.success(
        `Projeto "${flow.name}" criado com ${createdTasks} tarefa${createdTasks === 1 ? "" : "s"}`,
      );
      router.push(`/projects?focus=${projectId}`);
    } catch (e: any) {
      toast.error("Erro ao converter em projeto: " + (e?.message ?? "desconhecido"));
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
          <ProcessCanvas
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            onSave={handleSave}
            documents={documents}
            onCreateTaskFromNode={handleCreateTaskFromNode}
            onConvertToProject={handleConvertToProject}
            currentUserName={user?.fullName}
          />
        </CardContent>
      </Card>
    </div>
  );
}
