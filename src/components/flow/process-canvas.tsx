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
}

function ProcessInner({ initialNodes, initialEdges }: Props) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  return (
    <div className="h-[560px] rounded-xl border border-border/60 bg-card/40 overflow-hidden">
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
