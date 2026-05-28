"use client";

import * as React from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { Check, Clock, FileText, ListChecks, UserPlus, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ICONS = {
  trigger: Workflow,
  action: ListChecks,
  approval: Check,
  document: FileText,
  delay: Clock,
  user: UserPlus,
} as const;

function StepNode({
  data,
}: NodeProps<{
  title: string;
  description?: string;
  kind: keyof typeof ICONS;
  owner?: string;
}>) {
  const Icon = ICONS[data.kind] ?? Workflow;
  return (
    <div className="rounded-xl border border-border/60 bg-card-elevated shadow-soft w-[200px]">
      <div className="flex items-center justify-between bg-primary/10 rounded-t-xl px-3 py-2 border-b border-border/60">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/30 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <Badge variant="outline" size="sm" className="capitalize">
          {data.kind}
        </Badge>
      </div>
      <div className="px-3 py-2 space-y-1">
        <p className="text-sm font-semibold leading-tight">{data.title}</p>
        {data.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2">
            {data.description}
          </p>
        )}
        {data.owner && (
          <Badge variant="ghost" size="sm" className="mt-1">
            {data.owner}
          </Badge>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { step: StepNode };

interface Props {
  initialNodes: Node[];
  initialEdges: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void> | void;
}

function ProcessInner({ initialNodes, initialEdges, onSave }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = React.useCallback(
    (c: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...c,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#5b8cff", strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#5b8cff" },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(nodes, edges);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStep = React.useCallback(
    (kind: keyof typeof ICONS) => {
      const id = `n_${Date.now()}`;
      // posiciona novo node em grid 240px x 180px baseado no count atual
      const existing = nodes.length;
      const col = existing % 4;
      const row = Math.floor(existing / 4);
      const newNode: Node = {
        id,
        type: "step",
        position: { x: col * 240, y: 80 + row * 180 },
        data: {
          kind,
          title: kind === "trigger" ? "Novo gatilho" : kind === "approval" ? "Nova aprovação" : "Nova etapa",
          description: "Clique para editar",
          owner: "—",
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, setNodes],
  );

  return (
    <div className="h-[560px] rounded-xl border border-border/60 bg-card/40 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5">
        <button
          onClick={() => handleAddStep("action")}
          className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/80 px-2.5 py-1.5 text-[11px] font-medium hover:border-primary/40 hover:bg-card transition"
        >
          + Ação
        </button>
        <button
          onClick={() => handleAddStep("trigger")}
          className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/80 px-2.5 py-1.5 text-[11px] font-medium hover:border-primary/40 hover:bg-card transition"
        >
          + Gatilho
        </button>
        <button
          onClick={() => handleAddStep("approval")}
          className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/80 px-2.5 py-1.5 text-[11px] font-medium hover:border-primary/40 hover:bg-card transition"
        >
          + Aprovação
        </button>
        <button
          onClick={() => handleAddStep("document")}
          className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/80 px-2.5 py-1.5 text-[11px] font-medium hover:border-primary/40 hover:bg-card transition"
        >
          + Documento
        </button>
      </div>
      {onSave && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground px-3.5 py-2 text-xs font-semibold shadow-md disabled:opacity-50 transition"
        >
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </button>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ animated: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
        <Controls className="!bg-card !border-border/60 !text-foreground" showInteractive={false} />
        <MiniMap
          className="!bg-card !border !border-border/60 !rounded-lg"
          nodeColor="rgba(91,140,255,0.6)"
          maskColor="rgba(10,13,26,0.7)"
        />
      </ReactFlow>
    </div>
  );
}

export function ProcessCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <ProcessInner {...props} />
    </ReactFlowProvider>
  );
}
