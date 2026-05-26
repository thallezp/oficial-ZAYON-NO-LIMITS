"use client";

import * as React from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
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
import {
  CircleDollarSign,
  Edit3,
  ExternalLink,
  MessageCircle,
  Phone,
  Sparkles,
  Target,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Funnel } from "@/types";
import { formatCompact, formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";

const NODE_ICONS = {
  content: Sparkles,
  direct: MessageCircle,
  whatsapp: Phone,
  landing: ExternalLink,
  checkout: CircleDollarSign,
  email: MessageCircle,
  community: Target,
  call: Phone,
  webinar: Video,
  live: Video,
  remarketing: Target,
  custom: Edit3,
} as const;

function FunnelNodeView({
  data,
}: NodeProps<{
  title: string;
  description?: string;
  nodeType: keyof typeof NODE_ICONS;
  metrics?: { traffic?: number; conversion?: number; revenue?: number };
  accent?: string;
}>) {
  const Icon = NODE_ICONS[data.nodeType] ?? Edit3;
  const accent = data.accent ?? "#5b8cff";

  return (
    <div
      className="rounded-xl border bg-card-elevated shadow-soft hover:shadow-glow transition w-[220px]"
      style={{ borderColor: `${accent}55` }}
    >
      <div
        className="flex items-center justify-between rounded-t-xl px-3 py-2 border-b border-border/60"
        style={{ background: `${accent}18` }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md text-white"
          style={{ background: accent }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <Badge variant="outline" size="sm" className="capitalize">
          {data.nodeType}
        </Badge>
      </div>
      <div className="px-3 py-2 space-y-2">
        <div>
          <p className="text-sm font-semibold leading-tight">{data.title}</p>
          {data.description && (
            <p className="text-[10px] text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}
        </div>
        {data.metrics && (
          <div className="grid grid-cols-2 gap-1 text-[10px] border-t border-border/60 pt-2">
            <div>
              <p className="text-muted-foreground">Tráfego</p>
              <p className="num font-semibold">
                {formatCompact(data.metrics.traffic ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Conversão</p>
              <p className="num font-semibold">
                {data.metrics.conversion?.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
        {data.metrics?.revenue && (
          <div
            className="rounded-md px-2 py-1 text-[11px] font-semibold text-right"
            style={{ background: `${accent}30`, color: accent }}
          >
            {formatCurrency(data.metrics.revenue)}
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { funnel: FunnelNodeView };

interface Props {
  funnel: Funnel;
  accent?: string;
}

function FunnelInner({ funnel, accent = "#5b8cff" }: Props) {
  const initialNodes: Node[] = React.useMemo(
    () =>
      funnel.nodes.map((n) => ({
        id: n.id,
        type: "funnel",
        position: n.position,
        data: {
          title: n.title,
          description: n.description,
          nodeType: n.type,
          metrics: n.metrics,
          accent,
        },
      })),
    [funnel.nodes, accent],
  );

  const initialEdges: Edge[] = React.useMemo(
    () =>
      funnel.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "smoothstep",
        animated: true,
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 4,
        labelStyle: { fill: "rgba(180,188,210,0.9)", fontSize: 10 },
        labelBgStyle: { fill: "rgba(13,16,30,0.85)" },
        style: { stroke: accent, strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: accent },
      })),
    [funnel.edges, accent],
  );

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
            style: { stroke: accent, strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: accent },
          },
          eds,
        ),
      );
      toast.success("Conexão criada");
    },
    [accent, setEdges],
  );

  return (
    <div className="relative h-[560px] rounded-xl border border-border/60 bg-card/40 overflow-hidden">
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
        <Controls
          className="!bg-card !border-border/60 !text-foreground"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-card !border !border-border/60 !rounded-lg"
          nodeColor={() => `${accent}80`}
          maskColor="rgba(10,13,26,0.7)"
          zoomable
          pannable
        />
        <Panel position="top-right" className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Template aplicado")}
          >
            Template
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => toast.success("Novo nó adicionado")}
          >
            + Nó
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function FunnelCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <FunnelInner {...props} />
    </ReactFlowProvider>
  );
}
