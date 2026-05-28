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
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Funnel } from "@/types";
import { formatCompact, formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void> | void;
}

function FunnelInner({ funnel, accent = "#5b8cff", onSave }: Props) {
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(nodes, edges);
    } finally {
      setIsSaving(false);
    }
  };
  const [selectedNode, setSelectedNode] = React.useState<Node | null>(null);

  // Edit fields state
  const [editTitle, setEditTitle] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [editTraffic, setEditTraffic] = React.useState(0);
  const [editConversion, setEditConversion] = React.useState(0);
  const [editRevenue, setEditRevenue] = React.useState(0);
  const [editNodeType, setEditNodeType] = React.useState<keyof typeof NODE_ICONS>("content");

  React.useEffect(() => {
    if (selectedNode) {
      setEditTitle(selectedNode.data.title || "");
      setEditDesc(selectedNode.data.description || "");
      setEditTraffic(selectedNode.data.metrics?.traffic ?? 0);
      setEditConversion(selectedNode.data.metrics?.conversion ?? 0);
      setEditRevenue(selectedNode.data.metrics?.revenue ?? 0);
      setEditNodeType(selectedNode.data.nodeType || "content");
    }
  }, [selectedNode]);

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

  const onNodeClick = React.useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleSaveNode = () => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNode.id) {
          return {
            ...n,
            data: {
              ...n.data,
              title: editTitle,
              description: editDesc,
              nodeType: editNodeType,
              metrics: {
                traffic: Number(editTraffic),
                conversion: Number(editConversion),
                revenue: Number(editRevenue),
              },
            },
          };
        }
        return n;
      })
    );
    setSelectedNode(null);
    toast.success("Métricas do nó salvas com sucesso");
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    toast.success("Nó removido do canvas");
  };

  return (
    <div className="relative h-[560px] rounded-xl border border-border/60 bg-card/40 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
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
          {onSave && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? "Salvando..." : "Salvar Funil"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const escalator = {
                nodes: [
                  { id: "node-1", type: "landing", title: "Isca Digital", description: "Lead Magnet PDF", position: { x: 50, y: 100 }, metrics: { traffic: 5000, conversion: 20, revenue: 0 } },
                  { id: "node-2", type: "community", title: "Comunidade de Alunos", description: "Comunidade Low Ticket", position: { x: 280, y: 100 }, metrics: { traffic: 1000, conversion: 10, revenue: 19000 } },
                  { id: "node-3", type: "checkout", title: "Curso Principal", description: "Core Offer", position: { x: 510, y: 100 }, metrics: { traffic: 100, conversion: 15, revenue: 49000 } },
                  { id: "node-4", type: "call", title: "Mentoria Individual", description: "High Ticket Back-end", position: { x: 740, y: 100 }, metrics: { traffic: 15, conversion: 30, revenue: 150000 } },
                ],
                edges: [
                  { source: "node-1", target: "node-2" },
                  { source: "node-2", target: "node-3" },
                  { source: "node-3", target: "node-4" },
                ],
              };
              const formattedNodes = escalator.nodes.map(n => ({
                id: n.id,
                type: "funnel",
                position: n.position,
                data: {
                  title: n.title,
                  description: n.description,
                  nodeType: n.type,
                  metrics: n.metrics,
                  accent,
                }
              }));
              const formattedEdges = escalator.edges.map((e, idx) => ({
                id: `edge-${idx}-${Date.now()}`,
                source: e.source,
                target: e.target,
                type: "smoothstep",
                animated: true,
                style: { stroke: accent, strokeWidth: 1.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: accent },
              }));
              setNodes(formattedNodes);
              setEdges(formattedEdges);
              toast.success("Template Escada de Valor aplicado!");
            }}
          >
            Template
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => {
              const id = `node-${Date.now()}`;
              const newNode: Node = {
                id,
                type: "funnel",
                position: { x: 100, y: 100 },
                data: {
                  title: "Novo nó",
                  description: "Mídia paga / Tráfego",
                  nodeType: "content",
                  metrics: { traffic: 1000, conversion: 10, revenue: 0 },
                  accent,
                },
              };
              setNodes((nds) => [...nds, newNode]);
              toast.success("Novo nó adicionado");
            }}
          >
            + Nó
          </Button>
        </Panel>
      </ReactFlow>

      {/* Editor Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-0 right-0 z-30 flex h-full w-[280px] flex-col border-l border-border/60 bg-card/95 backdrop-blur-md p-4 space-y-4 shadow-xl overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div>
                <h3 className="font-semibold text-sm">Editar Nó</h3>
                <p className="text-[10px] text-muted-foreground">ID: {selectedNode.id}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setSelectedNode(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-3 flex-1 text-xs">
              <div className="space-y-1.5">
                <label className="text-muted-foreground font-medium">Título</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground font-medium">Descrição</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full h-16 rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground font-medium">Tipo do Nó</label>
                <select
                  value={editNodeType}
                  onChange={(e) => setEditNodeType(e.target.value as any)}
                  className="w-full h-8 rounded-md border border-border/60 bg-background px-2 text-xs text-foreground outline-none focus:border-primary/60"
                >
                  {Object.keys(NODE_ICONS).map((type) => (
                    <option key={type} value={type}>
                      {type.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-border/40 my-2 pt-2 space-y-2">
                <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">Métricas do Nó</p>
                
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">Tráfego (Cliques)</label>
                  <input
                    type="number"
                    value={editTraffic}
                    onChange={(e) => setEditTraffic(Number(e.target.value))}
                    className="w-full rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">Taxa de Conversão (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editConversion}
                    onChange={(e) => setEditConversion(Number(e.target.value))}
                    className="w-full rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">Receita Estimada (R$)</label>
                  <input
                    type="number"
                    value={editRevenue}
                    onChange={(e) => setEditRevenue(Number(e.target.value))}
                    className="w-full rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary/60"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedNode(null)}>
                  Cancelar
                </Button>
                <Button variant="gradient" size="sm" className="flex-1" onClick={handleSaveNode}>
                  Salvar
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleDeleteNode} className="text-destructive hover:bg-destructive/10 border-destructive/30">
                Excluir Nó
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

