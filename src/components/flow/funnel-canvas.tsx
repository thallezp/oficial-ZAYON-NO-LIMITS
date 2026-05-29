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
  Briefcase,
  CircleDollarSign,
  Crown,
  Edit3,
  ExternalLink,
  Gift,
  Heart,
  Magnet,
  Mail,
  MessageCircle,
  Phone,
  Radio,
  Repeat,
  Send,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Video,
  X,
  FileText,
  CheckSquare,
  Paperclip,
  PlusCircle,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Funnel } from "@/types";
import { formatCompact, formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useDocuments, useTasks, useMaterials } from "@/hooks/use-queries";

// 15 tipos de card — Lennon-style
export const NODE_TYPES = {
  product: { label: "Produto", icon: Briefcase, color: "#5b8cff" },
  lead_magnet: { label: "Isca / Lead Magnet", icon: Magnet, color: "#10b981" },
  community: { label: "Comunidade", icon: Users, color: "#a855f7" },
  mentorship: { label: "Mentoria", icon: Crown, color: "#f59e0b" },
  main_offer: { label: "Oferta Principal", icon: Sparkles, color: "#06b6d4" },
  upsell: { label: "Upsell", icon: TrendingUp, color: "#22c55e" },
  downsell: { label: "Downsell", icon: TrendingDown, color: "#eab308" },
  checkout: { label: "Checkout", icon: ShoppingCart, color: "#3b82f6" },
  whatsapp: { label: "WhatsApp", icon: Phone, color: "#25d366" },
  direct: { label: "Direct / DM", icon: MessageCircle, color: "#e879f9" },
  landing: { label: "Landing Page", icon: ExternalLink, color: "#f43f5e" },
  live: { label: "Live", icon: Radio, color: "#ef4444" },
  webinar: { label: "Webinar", icon: Video, color: "#8b5cf6" },
  email: { label: "Email", icon: Mail, color: "#fb923c" },
  remarketing: { label: "Remarketing", icon: Repeat, color: "#0ea5e9" },
  content: { label: "Conteúdo Orgânico", icon: Sparkles, color: "#14b8a6" },
  call: { label: "Chamada / Sales", icon: Phone, color: "#ec4899" },
  custom: { label: "Personalizado", icon: Edit3, color: "#94a3b8" },
} as const;

type NodeTypeKey = keyof typeof NODE_TYPES;

interface ProductData {
  // basicos
  title: string;
  description?: string;
  nodeType: NodeTypeKey;
  accent?: string;
  status?: "draft" | "active" | "paused" | "archived";
  documentIds?: string[];
  taskIds?: string[];
  materialIds?: string[];
  customLinks?: { title: string; url: string }[];
  // produto
  price?: number;
  saleUrl?: string;
  cta?: string;
  promise?: string;
  transformation?: string;
  icp?: string;
  pains?: string;
  modules?: string;
  bonuses?: string;
  guarantee?: string;
  objections?: string;
  owner?: string;
  tags?: string;
  briefing?: string;
  // metrics
  metrics?: {
    traffic?: number;
    conversion?: number;
    revenue?: number;
    visits?: number;
    leads?: number;
    checkouts?: number;
    sales?: number;
    averageTicket?: number;
  };
}

function FunnelNodeView({ data, selected }: NodeProps<ProductData>) {
  const meta = NODE_TYPES[data.nodeType] ?? NODE_TYPES.custom;
  const Icon = meta.icon;
  const accent = data.accent ?? meta.color;

  return (
    <div
      className={`rounded-xl border bg-card-elevated shadow-soft hover:shadow-glow transition w-[220px] ${
        selected ? "ring-2 ring-primary" : ""
      }`}
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
          {meta.label}
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

        {/* Status + Preço */}
        <div className="flex items-center gap-1 flex-wrap">
          {data.status && (
            <Badge
              size="sm"
              variant={
                data.status === "active"
                  ? "success"
                  : data.status === "paused"
                    ? "warning"
                    : data.status === "archived"
                      ? "ghost"
                      : "outline"
              }
            >
              {data.status}
            </Badge>
          )}
          {data.price && data.price > 0 && (
            <Badge size="sm" variant="primary">
              {formatCurrency(data.price)}
            </Badge>
          )}
        </div>

        {data.metrics && (data.metrics.traffic || data.metrics.conversion) && (
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
                {(data.metrics.conversion ?? 0).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
        {data.metrics?.revenue && data.metrics.revenue > 0 && (
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

// ============================================================================
// Templates de funil (7 + começar vazio)
// ============================================================================

export const FUNNEL_TEMPLATES = {
  organic: {
    name: "TikTok → Direct → WhatsApp → Checkout",
    nodes: [
      { id: "t-1", type: "content", title: "Vídeo TikTok", description: "Atração orgânica", position: { x: 50, y: 150 }, metrics: { traffic: 25000, conversion: 3.5, revenue: 0 } },
      { id: "t-2", type: "direct", title: "Direct Message", description: "Primeira qualificação", position: { x: 280, y: 150 }, metrics: { traffic: 875, conversion: 40, revenue: 0 } },
      { id: "t-3", type: "whatsapp", title: "WhatsApp Comercial", description: "Fechamento consultivo", position: { x: 510, y: 150 }, metrics: { traffic: 350, conversion: 20, revenue: 0 } },
      { id: "t-4", type: "checkout", title: "Checkout", description: "Compra final", position: { x: 740, y: 150 }, metrics: { traffic: 70, conversion: 80, revenue: 70000 } },
    ],
    edges: [
      { source: "t-1", target: "t-2" },
      { source: "t-2", target: "t-3" },
      { source: "t-3", target: "t-4" },
    ],
  },
  escalator: {
    name: "Escada de Valor",
    nodes: [
      { id: "e-1", type: "lead_magnet", title: "Isca Digital", description: "Lead Magnet PDF gratuito", position: { x: 50, y: 100 }, metrics: { traffic: 5000, conversion: 20, revenue: 0 } },
      { id: "e-2", type: "community", title: "Comunidade Low Ticket", description: "R$ 19/mês — base de alunos", position: { x: 280, y: 100 }, metrics: { traffic: 1000, conversion: 10, revenue: 19000 } },
      { id: "e-3", type: "main_offer", title: "Core Offer", description: "Curso premium", position: { x: 510, y: 100 }, metrics: { traffic: 100, conversion: 15, revenue: 49000 } },
      { id: "e-4", type: "mentorship", title: "Mentoria Individual", description: "Back-end high ticket", position: { x: 740, y: 100 }, metrics: { traffic: 15, conversion: 30, revenue: 150000 } },
    ],
    edges: [
      { source: "e-1", target: "e-2" },
      { source: "e-2", target: "e-3" },
      { source: "e-3", target: "e-4" },
    ],
  },
  launch: {
    name: "Lançamento (CPL → CPV → Carrinho)",
    nodes: [
      { id: "l-1", type: "landing", title: "Página de Inscrição", description: "Captura de leads do evento", position: { x: 50, y: 150 }, metrics: { traffic: 50000, conversion: 25, revenue: 0 } },
      { id: "l-2", type: "email", title: "Aquecimento por Email", description: "Sequência de 4 dias", position: { x: 280, y: 150 }, metrics: { traffic: 12500, conversion: 80, revenue: 0 } },
      { id: "l-3", type: "live", title: "CPL Ao Vivo", description: "Conteúdo + virada de chave", position: { x: 510, y: 150 }, metrics: { traffic: 10000, conversion: 60, revenue: 0 } },
      { id: "l-4", type: "webinar", title: "Aula de Vendas (CPV)", description: "Pitch + condições", position: { x: 740, y: 150 }, metrics: { traffic: 6000, conversion: 30, revenue: 0 } },
      { id: "l-5", type: "checkout", title: "Carrinho Aberto", description: "Janela de 5 dias", position: { x: 970, y: 150 }, metrics: { traffic: 1800, conversion: 12, revenue: 432000 } },
    ],
    edges: [
      { source: "l-1", target: "l-2" },
      { source: "l-2", target: "l-3" },
      { source: "l-3", target: "l-4" },
      { source: "l-4", target: "l-5" },
    ],
  },
  perpetuo: {
    name: "Perpétuo (Anúncio → Webinar Evergreen → Vendas)",
    nodes: [
      { id: "p-1", type: "content", title: "Anúncio Pago", description: "Meta/Google Ads sempre ativo", position: { x: 50, y: 150 }, metrics: { traffic: 100000, conversion: 8, revenue: 0 } },
      { id: "p-2", type: "landing", title: "Página do Webinar", description: "Captura + agendamento", position: { x: 280, y: 150 }, metrics: { traffic: 8000, conversion: 35, revenue: 0 } },
      { id: "p-3", type: "webinar", title: "Webinar Evergreen", description: "Pitch automático", position: { x: 510, y: 150 }, metrics: { traffic: 2800, conversion: 25, revenue: 0 } },
      { id: "p-4", type: "checkout", title: "Oferta Final", description: "Bump + Upsell incluídos", position: { x: 740, y: 150 }, metrics: { traffic: 700, conversion: 18, revenue: 252000 } },
      { id: "p-5", type: "upsell", title: "Upsell One-Click", description: "Adicional na sequência", position: { x: 970, y: 80 }, metrics: { traffic: 126, conversion: 25, revenue: 31500 } },
      { id: "p-6", type: "remarketing", title: "Remarketing 30d", description: "Carrinhos abandonados", position: { x: 970, y: 220 }, metrics: { traffic: 5000, conversion: 6, revenue: 30000 } },
    ],
    edges: [
      { source: "p-1", target: "p-2" },
      { source: "p-2", target: "p-3" },
      { source: "p-3", target: "p-4" },
      { source: "p-4", target: "p-5" },
      { source: "p-4", target: "p-6" },
    ],
  },
  mentoria: {
    name: "Mentoria High Ticket (Aplicação → Call → Fechamento)",
    nodes: [
      { id: "m-1", type: "content", title: "Conteúdo Autoridade", description: "Posts + Reels orgânicos", position: { x: 50, y: 150 }, metrics: { traffic: 30000, conversion: 4, revenue: 0 } },
      { id: "m-2", type: "lead_magnet", title: "Diagnóstico Gratuito", description: "Quiz / aplicação", position: { x: 280, y: 150 }, metrics: { traffic: 1200, conversion: 60, revenue: 0 } },
      { id: "m-3", type: "call", title: "Sales Call 1-1", description: "Diagnóstico aprofundado", position: { x: 510, y: 150 }, metrics: { traffic: 720, conversion: 30, revenue: 0 } },
      { id: "m-4", type: "mentorship", title: "Mentoria 12 meses", description: "Programa premium", position: { x: 740, y: 150 }, metrics: { traffic: 216, conversion: 40, revenue: 1296000 } },
    ],
    edges: [
      { source: "m-1", target: "m-2" },
      { source: "m-2", target: "m-3" },
      { source: "m-3", target: "m-4" },
    ],
  },
  comunidade: {
    name: "Comunidade Recorrente",
    nodes: [
      { id: "c-1", type: "lead_magnet", title: "Newsletter Gratuita", description: "Conteúdo semanal", position: { x: 50, y: 150 }, metrics: { traffic: 20000, conversion: 35, revenue: 0 } },
      { id: "c-2", type: "community", title: "Comunidade Mensal", description: "R$ 39/mês recorrente", position: { x: 280, y: 150 }, metrics: { traffic: 7000, conversion: 8, revenue: 21840 } },
      { id: "c-3", type: "upsell", title: "Workshop Premium", description: "Add-on bimestral", position: { x: 510, y: 150 }, metrics: { traffic: 560, conversion: 25, revenue: 28000 } },
      { id: "c-4", type: "main_offer", title: "Curso Anual VIP", description: "Migração para anual", position: { x: 740, y: 150 }, metrics: { traffic: 140, conversion: 20, revenue: 56000 } },
    ],
    edges: [
      { source: "c-1", target: "c-2" },
      { source: "c-2", target: "c-3" },
      { source: "c-2", target: "c-4" },
    ],
  },
  lowtohigh: {
    name: "Low Ticket → High Ticket",
    nodes: [
      { id: "lh-1", type: "content", title: "Tráfego Pago", description: "Captura no Reels/Story", position: { x: 50, y: 150 }, metrics: { traffic: 40000, conversion: 6, revenue: 0 } },
      { id: "lh-2", type: "main_offer", title: "Produto R$ 27", description: "Front-end / tripwire", position: { x: 280, y: 150 }, metrics: { traffic: 2400, conversion: 12, revenue: 7776 } },
      { id: "lh-3", type: "upsell", title: "Order Bump", description: "Add-on no checkout", position: { x: 510, y: 80 }, metrics: { traffic: 288, conversion: 40, revenue: 5760 } },
      { id: "lh-4", type: "mentorship", title: "Mentoria R$ 4.997", description: "Back-end consultivo", position: { x: 510, y: 220 }, metrics: { traffic: 288, conversion: 8, revenue: 115128 } },
    ],
    edges: [
      { source: "lh-1", target: "lh-2" },
      { source: "lh-2", target: "lh-3" },
      { source: "lh-2", target: "lh-4" },
    ],
  },
};

// ============================================================================

interface Props {
  funnel: Funnel;
  accent?: string;
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void> | void;
  workspaceId?: string | null;
  personaId?: string | null;
}

function FunnelInner({ funnel, accent = "#5b8cff", onSave, workspaceId, personaId }: Props) {
  const initialNodes: Node[] = React.useMemo(
    () =>
      (funnel.nodes ?? []).map((n: any) => ({
        id: n.id,
        type: "funnel",
        position: n.position,
        data: {
          title: n.title,
          description: n.description,
          nodeType: n.type,
          metrics: n.metrics,
          accent,
          ...(n.data ?? {}),
        } as ProductData,
      })),
    [funnel.nodes, accent],
  );

  const initialEdges: Edge[] = React.useMemo(
    () =>
      (funnel.edges ?? []).map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "smoothstep",
        animated: true,
        labelBgPadding: [6, 4] as [number, number],
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
  const [isDirty, setIsDirty] = React.useState(false);
  const [selectedNode, setSelectedNode] = React.useState<Node | null>(null);
  const [showTemplates, setShowTemplates] = React.useState(false);

  React.useEffect(() => {
    setNodes(initialNodes);
    setIsDirty(false);
  }, [initialNodes, setNodes]);
  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const mountedRef = React.useRef(false);
  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setIsDirty(true);
  }, [nodes, edges]);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(nodes, edges);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

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

  const onNodeClick = React.useCallback(
    (_: React.MouseEvent, node: Node) => setSelectedNode(node),
    [],
  );

  // atalhos: Cmd/Ctrl+S salva, Delete remove
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void handleSave();
      } else if ((e.key === "Delete" || e.key === "Backspace") && !isEditing) {
        if (selectedNode) {
          e.preventDefault();
          handleDeleteNode();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode, nodes, edges]);

  const handleUpdateNode = (patch: Partial<ProductData>) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...(n.data as ProductData), ...patch } }
          : n,
      ),
    );
    setSelectedNode((sn) =>
      sn ? { ...sn, data: { ...(sn.data as ProductData), ...patch } } : null,
    );
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id,
      ),
    );
    setSelectedNode(null);
    toast.success("Card removido");
  };

  const handleDuplicateNode = () => {
    if (!selectedNode) return;
    const newId = `n_${Date.now()}`;
    const copy: Node = {
      ...selectedNode,
      id: newId,
      position: {
        x: selectedNode.position.x + 40,
        y: selectedNode.position.y + 40,
      },
      selected: false,
    };
    setNodes((nds) => [...nds, copy]);
    setSelectedNode(copy);
    toast.success("Card duplicado");
  };

  const handleAddNode = (type: NodeTypeKey) => {
    const id = `n_${Date.now()}`;
    const meta = NODE_TYPES[type];
    const existing = nodes.length;
    const col = existing % 4;
    const row = Math.floor(existing / 4);
    const newNode: Node = {
      id,
      type: "funnel",
      position: { x: col * 240 + 50, y: row * 180 + 80 },
      data: {
        title: meta.label,
        description: "Clique para editar",
        nodeType: type,
        accent,
        status: "draft",
        metrics: { traffic: 0, conversion: 0, revenue: 0 },
      } as ProductData,
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
  };

  const applyTemplate = (templateKey: keyof typeof FUNNEL_TEMPLATES) => {
    const tmpl = FUNNEL_TEMPLATES[templateKey];
    const newNodes: Node[] = tmpl.nodes.map((n) => ({
      id: n.id,
      type: "funnel",
      position: n.position,
      data: {
        title: n.title,
        description: n.description,
        nodeType: n.type as NodeTypeKey,
        metrics: n.metrics,
        accent,
        status: "draft",
      } as ProductData,
    }));
    const newEdges: Edge[] = tmpl.edges.map((e, idx) => ({
      id: `e_${Date.now()}_${idx}`,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      animated: true,
      style: { stroke: accent, strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: accent },
    }));
    setNodes(newNodes);
    setEdges(newEdges);
    setShowTemplates(false);
    toast.success(`Template "${tmpl.name}" aplicado`);
  };

  const layoutGrid = () => {
    setNodes((nds) =>
      nds.map((n, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        return {
          ...n,
          position: { x: col * 260 + 50, y: row * 200 + 80 },
        };
      })
    );
    toast.success("Organizado em Grade");
  };

  const layoutMindMap = () => {
    // horizontal tree layout centering nodes vertically by level
    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    nodes.forEach((n) => {
      adjacency.set(n.id, []);
      inDegree.set(n.id, 0);
    });
    edges.forEach((e) => {
      adjacency.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
    });

    const levels = new Map<string, number>();
    const queue: string[] = [];
    nodes.forEach((n) => {
      if ((inDegree.get(n.id) ?? 0) === 0) {
        levels.set(n.id, 0);
        queue.push(n.id);
      }
    });

    // Fallback in case of cycles or empty in-degree nodes
    if (queue.length === 0 && nodes.length > 0) {
      levels.set(nodes[0].id, 0);
      queue.push(nodes[0].id);
    }

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const curLevel = levels.get(cur) ?? 0;
      for (const next of adjacency.get(cur) ?? []) {
        if (!levels.has(next) || (levels.get(next) ?? 0) < curLevel + 1) {
          levels.set(next, curLevel + 1);
          queue.push(next);
        }
      }
    }

    const levelNodesMap = new Map<number, string[]>();
    nodes.forEach((n) => {
      const lvl = levels.get(n.id) ?? 0;
      const list = levelNodesMap.get(lvl) ?? [];
      list.push(n.id);
      levelNodesMap.set(lvl, list);
    });

    setNodes((nds) =>
      nds.map((n) => {
        const lvl = levels.get(n.id) ?? 0;
        const nodesInLevel = levelNodesMap.get(lvl) ?? [];
        const idx = nodesInLevel.indexOf(n.id);
        const total = nodesInLevel.length;
        const yOffset = 250 - ((total - 1) * 200) / 2;
        return {
          ...n,
          position: { x: lvl * 280 + 50, y: yOffset + idx * 200 },
        };
      })
    );
    toast.success("Organizado em Mind Map");
  };

  const autoLayout = () => {
    // layout horizontal simples baseado em ordem das edges
    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    nodes.forEach((n) => {
      adjacency.set(n.id, []);
      inDegree.set(n.id, 0);
    });
    edges.forEach((e) => {
      adjacency.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
    });
    // BFS por nivel
    const levels = new Map<string, number>();
    const queue: string[] = [];
    nodes.forEach((n) => {
      if ((inDegree.get(n.id) ?? 0) === 0) {
        levels.set(n.id, 0);
        queue.push(n.id);
      }
    });
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const curLevel = levels.get(cur) ?? 0;
      for (const next of adjacency.get(cur) ?? []) {
        if (!levels.has(next) || (levels.get(next) ?? 0) < curLevel + 1) {
          levels.set(next, curLevel + 1);
          queue.push(next);
        }
      }
    }
    const perLevel = new Map<number, number>();
    setNodes((nds) =>
      nds.map((n) => {
        const lvl = levels.get(n.id) ?? 0;
        const idxInLevel = perLevel.get(lvl) ?? 0;
        perLevel.set(lvl, idxInLevel + 1);
        return {
          ...n,
          position: { x: 50 + lvl * 260, y: 80 + idxInLevel * 200 },
        };
      }),
    );
    toast.success("Layout reorganizado");
  };

  return (
    <div className="relative h-[720px] rounded-xl border border-border/60 bg-card/40 overflow-hidden flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedNode(null)}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ animated: true }}
          deleteKeyCode={null}
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

          <Panel position="top-left" className="flex gap-1.5 flex-wrap max-w-[640px]">
            <div className="relative">
              <button
                onClick={() => setShowTemplates((o) => !o)}
                className="flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition"
              >
                <Sparkles className="h-3 w-3" /> Templates
              </button>
              {showTemplates && (
                <div className="absolute top-full mt-1 left-0 bg-card border border-border/60 rounded-lg p-1.5 shadow-glow z-20 min-w-[280px] space-y-0.5">
                  {(Object.keys(FUNNEL_TEMPLATES) as (keyof typeof FUNNEL_TEMPLATES)[]).map(
                    (k) => (
                      <button
                        key={k}
                        onClick={() => applyTemplate(k)}
                        className="w-full text-left rounded-md px-2 py-1.5 text-[11px] hover:bg-card-elevated transition"
                      >
                        {FUNNEL_TEMPLATES[k].name}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
            <button
              onClick={layoutGrid}
              className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/80 px-2.5 py-1.5 text-[11px] font-medium hover:border-primary/40 hover:bg-card transition"
            >
              <Target className="h-3 w-3 text-sky-400" /> Layout Grade
            </button>
            <button
              onClick={layoutMindMap}
              className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/80 px-2.5 py-1.5 text-[11px] font-medium hover:border-primary/40 hover:bg-card transition"
            >
              <Target className="h-3 w-3 text-purple-400" /> Layout Mind Map
            </button>
            <button
              onClick={autoLayout}
              className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/80 px-2.5 py-1.5 text-[11px] font-medium hover:border-primary/40 hover:bg-card transition"
            >
              <Target className="h-3 w-3 text-emerald-400" /> Auto Organizar
            </button>
            <NodeAdderMenu onAdd={handleAddNode} />
          </Panel>

          <Panel position="top-right" className="flex items-center gap-2">
            {isDirty && (
              <span className="text-[11px] text-warning animate-pulse">
                Alterações não salvas
              </span>
            )}
            {onSave && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSaving ? "Salvando..." : "Salvar Funil"}
              </Button>
            )}
          </Panel>
        </ReactFlow>
      </div>

      {/* Editor Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            className="w-[380px] shrink-0 flex flex-col border-l border-border/60 bg-card/95 backdrop-blur-md"
          >
            <NodeEditorDrawer
              key={selectedNode.id}
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onChange={handleUpdateNode}
              onDelete={handleDeleteNode}
              onDuplicate={handleDuplicateNode}
              workspaceId={workspaceId || funnel.workspaceId}
              personaId={personaId || funnel.personaId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Menu "Adicionar nó" com os 15+ tipos
// ----------------------------------------------------------------------------

function NodeAdderMenu({ onAdd }: { onAdd: (type: NodeTypeKey) => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20 transition"
      >
        + Adicionar card
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-card border border-border/60 rounded-lg p-1.5 shadow-glow z-20 grid grid-cols-2 gap-1 min-w-[320px]">
          {(Object.entries(NODE_TYPES) as [NodeTypeKey, (typeof NODE_TYPES)[NodeTypeKey]][]).map(
            ([k, meta]) => {
              const Icon = meta.icon;
              return (
                <button
                  key={k}
                  onClick={() => {
                    onAdd(k);
                    setOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-left hover:bg-card-elevated transition"
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: meta.color }}
                  />
                  {meta.label}
                </button>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Drawer de edição do card de funil (Lennon-style com campos extensos)
// ----------------------------------------------------------------------------

interface DrawerProps {
  node: Node;
  onClose: () => void;
  onChange: (patch: Partial<ProductData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  workspaceId?: string | null;
  personaId?: string | null;
}

function NodeEditorDrawer({
  node,
  onClose,
  onChange,
  onDelete,
  onDuplicate,
  workspaceId,
  personaId,
}: DrawerProps) {
  const data = node.data as ProductData;
  const meta = NODE_TYPES[data.nodeType] ?? NODE_TYPES.custom;

  const { data: documents = [] } = useDocuments(workspaceId, personaId);
  const { data: tasks = [] } = useTasks(workspaceId, personaId);
  const { data: materials = [] } = useMaterials(workspaceId, personaId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {meta.label}
          </p>
          <p className="text-sm font-semibold truncate max-w-[260px]">
            {data.title || "Sem título"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-card transition"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Tipo + Status */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Tipo do card">
            <select
              value={data.nodeType}
              onChange={(e) =>
                onChange({ nodeType: e.target.value as NodeTypeKey })
              }
              className="w-full h-8 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary"
            >
              {(Object.entries(NODE_TYPES) as [NodeTypeKey, any][]).map(
                ([k, m]) => (
                  <option key={k} value={k}>
                    {m.label}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={data.status ?? "draft"}
              onChange={(e) => onChange({ status: e.target.value as any })}
              className="w-full h-8 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary"
            >
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
              <option value="archived">Arquivado</option>
            </select>
          </Field>
        </div>

        <Field label="Nome do produto / etapa" required>
          <Input
            value={data.title ?? ""}
            onChange={(e) => onChange({ title: e.target.value })}
            className="h-8 text-xs"
          />
        </Field>

        <Field label="Descrição resumida">
          <Textarea
            value={data.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            className="text-xs"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Preço (R$)">
            <Input
              type="number"
              step="0.01"
              value={data.price ?? 0}
              onChange={(e) => onChange({ price: Number(e.target.value) || 0 })}
              className="h-8 text-xs num"
            />
          </Field>
          <Field label="Responsável">
            <Input
              value={data.owner ?? ""}
              onChange={(e) => onChange({ owner: e.target.value })}
              className="h-8 text-xs"
              placeholder="Ex: Alex"
            />
          </Field>
        </div>

        <Field label="Link de venda / página">
          <Input
            value={data.saleUrl ?? ""}
            onChange={(e) => onChange({ saleUrl: e.target.value })}
            placeholder="https://..."
            className="h-8 text-xs"
          />
        </Field>

        <Field label="CTA principal">
          <Input
            value={data.cta ?? ""}
            onChange={(e) => onChange({ cta: e.target.value })}
            placeholder="Ex: Quero garantir minha vaga"
            className="h-8 text-xs"
          />
        </Field>

        <div className="rounded-lg border border-border/60 p-3 space-y-2">
          <Label className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
            Estratégia
          </Label>
          <Field label="Promessa">
            <Textarea
              value={data.promise ?? ""}
              onChange={(e) => onChange({ promise: e.target.value })}
              rows={2}
              className="text-xs"
              placeholder="O que esse produto promete?"
            />
          </Field>
          <Field label="Transformação">
            <Textarea
              value={data.transformation ?? ""}
              onChange={(e) => onChange({ transformation: e.target.value })}
              rows={2}
              className="text-xs"
              placeholder="De que estado para qual estado?"
            />
          </Field>
          <Field label="ICP / Avatar">
            <Textarea
              value={data.icp ?? ""}
              onChange={(e) => onChange({ icp: e.target.value })}
              rows={2}
              className="text-xs"
              placeholder="Para quem é exatamente?"
            />
          </Field>
          <Field label="Dores que resolve">
            <Textarea
              value={data.pains ?? ""}
              onChange={(e) => onChange({ pains: e.target.value })}
              rows={2}
              className="text-xs"
            />
          </Field>
          <Field label="Objeções comuns">
            <Textarea
              value={data.objections ?? ""}
              onChange={(e) => onChange({ objections: e.target.value })}
              rows={2}
              className="text-xs"
            />
          </Field>
        </div>

        <div className="rounded-lg border border-border/60 p-3 space-y-2">
          <Label className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
            Entrega
          </Label>
          <Field label="Módulos / o que entrega">
            <Textarea
              value={data.modules ?? ""}
              onChange={(e) => onChange({ modules: e.target.value })}
              rows={2}
              className="text-xs"
            />
          </Field>
          <Field label="Bônus">
            <Textarea
              value={data.bonuses ?? ""}
              onChange={(e) => onChange({ bonuses: e.target.value })}
              rows={2}
              className="text-xs"
            />
          </Field>
          <Field label="Garantia">
            <Input
              value={data.guarantee ?? ""}
              onChange={(e) => onChange({ guarantee: e.target.value })}
              placeholder="Ex: 7 dias incondicional"
              className="h-8 text-xs"
            />
          </Field>
        </div>

        <div className="rounded-lg border border-border/60 p-3 space-y-2">
          <Label className="text-[10px] uppercase tracking-wider text-primary font-semibold">
            Métricas
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Tráfego/Visitas">
              <Input
                type="number"
                value={data.metrics?.traffic ?? 0}
                onChange={(e) =>
                  onChange({
                    metrics: {
                      ...(data.metrics ?? {}),
                      traffic: Number(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-xs num"
              />
            </Field>
            <Field label="Conversão (%)">
              <Input
                type="number"
                step="0.1"
                value={data.metrics?.conversion ?? 0}
                onChange={(e) =>
                  onChange({
                    metrics: {
                      ...(data.metrics ?? {}),
                      conversion: Number(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-xs num"
              />
            </Field>
            <Field label="Leads">
              <Input
                type="number"
                value={data.metrics?.leads ?? 0}
                onChange={(e) =>
                  onChange({
                    metrics: {
                      ...(data.metrics ?? {}),
                      leads: Number(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-xs num"
              />
            </Field>
            <Field label="Vendas">
              <Input
                type="number"
                value={data.metrics?.sales ?? 0}
                onChange={(e) =>
                  onChange({
                    metrics: {
                      ...(data.metrics ?? {}),
                      sales: Number(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-xs num"
              />
            </Field>
            <Field label="Receita (R$)">
              <Input
                type="number"
                step="0.01"
                value={data.metrics?.revenue ?? 0}
                onChange={(e) =>
                  onChange({
                    metrics: {
                      ...(data.metrics ?? {}),
                      revenue: Number(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-xs num"
              />
            </Field>
            <Field label="Ticket médio">
              <Input
                type="number"
                step="0.01"
                value={data.metrics?.averageTicket ?? 0}
                onChange={(e) =>
                  onChange({
                    metrics: {
                      ...(data.metrics ?? {}),
                      averageTicket: Number(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-xs num"
              />
            </Field>
          </div>
        </div>

        {/* --- DOCUMENTOS VINCULADOS --- */}
        <div className="rounded-lg border border-border/60 p-3 space-y-3">
          <Label className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" /> Documentos Vinculados
          </Label>
          <div className="flex gap-1.5">
            <select
              value=""
              onChange={(e) => {
                const docId = e.target.value;
                if (!docId) return;
                const current = data.documentIds ?? [];
                if (!current.includes(docId)) {
                  onChange({ documentIds: [...current, docId] });
                  toast.success("Documento vinculado!");
                }
              }}
              className="flex-1 h-8 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
            >
              <option value="">Vincular documento...</option>
              {documents
                .filter((d: any) => !(data.documentIds ?? []).includes(d.id))
                .map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.emoji || "📄"} {d.title}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            {(data.documentIds ?? []).map((docId) => {
              const doc = documents.find((d: any) => d.id === docId);
              return (
                <div key={docId} className="flex items-center justify-between p-1.5 rounded bg-card/60 border border-border/40 text-[11px]">
                  <a
                    href={`/documents/${docId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline font-medium truncate max-w-[80%]"
                  >
                    <span>{doc?.emoji || "📄"}</span>
                    <span className="truncate">{doc?.title || `Doc (${docId.slice(0, 6)})`}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  <button
                    onClick={() => {
                      const next = (data.documentIds ?? []).filter((id) => id !== docId);
                      onChange({ documentIds: next });
                      toast.success("Documento desvinculado");
                    }}
                    className="p-0.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            {(data.documentIds ?? []).length === 0 && (
              <p className="text-[10px] text-muted-foreground/60 italic">Nenhum documento vinculado.</p>
            )}
          </div>
        </div>

        {/* --- TAREFAS VINCULADAS --- */}
        <div className="rounded-lg border border-border/60 p-3 space-y-3">
          <Label className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold flex items-center gap-1">
            <CheckSquare className="h-3.5 w-3.5" /> Tarefas Vinculadas
          </Label>
          <div className="flex gap-1.5">
            <select
              value=""
              onChange={(e) => {
                const taskId = e.target.value;
                if (!taskId) return;
                const current = data.taskIds ?? [];
                if (!current.includes(taskId)) {
                  onChange({ taskIds: [...current, taskId] });
                  toast.success("Tarefa vinculada!");
                }
              }}
              className="flex-1 h-8 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
            >
              <option value="">Vincular tarefa...</option>
              {tasks
                .filter((t: any) => !(data.taskIds ?? []).includes(t.id))
                .map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.status})
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            {(data.taskIds ?? []).map((taskId) => {
              const task = tasks.find((t: any) => t.id === taskId);
              return (
                <div key={taskId} className="flex items-center justify-between p-1.5 rounded bg-card/60 border border-border/40 text-[11px]">
                  <div className="flex items-center gap-1.5 truncate max-w-[80%]">
                    <Badge variant={task?.status === "done" ? "success" : task?.status === "doing" ? "warning" : "outline"} size="sm" className="text-[8px] uppercase tracking-wide">
                      {task?.status || "todo"}
                    </Badge>
                    <span className="truncate font-medium">{task?.title || `Tarefa (${taskId.slice(0, 6)})`}</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = (data.taskIds ?? []).filter((id) => id !== taskId);
                      onChange({ taskIds: next });
                      toast.success("Tarefa desvinculada");
                    }}
                    className="p-0.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            {(data.taskIds ?? []).length === 0 && (
              <p className="text-[10px] text-muted-foreground/60 italic">Nenhuma tarefa vinculada.</p>
            )}
          </div>
        </div>

        {/* --- ANEXOS / MATERIAIS --- */}
        <div className="rounded-lg border border-border/60 p-3 space-y-3">
          <Label className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5" /> Anexos / Materiais
          </Label>
          <div className="flex gap-1.5">
            <select
              value=""
              onChange={(e) => {
                const matId = e.target.value;
                if (!matId) return;
                const current = data.materialIds ?? [];
                if (!current.includes(matId)) {
                  onChange({ materialIds: [...current, matId] });
                  toast.success("Material anexado!");
                }
              }}
              className="flex-1 h-8 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
            >
              <option value="">Anexar material...</option>
              {materials
                .filter((m: any) => !(data.materialIds ?? []).includes(m.id))
                .map((m: any) => (
                  <option key={m.id} value={m.id}>
                    📦 {m.title} ({m.fileType})
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            {(data.materialIds ?? []).map((matId) => {
              const mat = materials.find((m: any) => m.id === matId);
              return (
                <div key={matId} className="flex items-center justify-between p-1.5 rounded bg-card/60 border border-border/40 text-[11px]">
                  <a
                    href={mat?.fileUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline font-medium truncate max-w-[80%]"
                  >
                    <span>📦</span>
                    <span className="truncate">{mat?.title || `Arquivo (${matId.slice(0, 6)})`}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  <button
                    onClick={() => {
                      const next = (data.materialIds ?? []).filter((id) => id !== matId);
                      onChange({ materialIds: next });
                      toast.success("Material desvinculado");
                    }}
                    className="p-0.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            {(data.materialIds ?? []).length === 0 && (
              <p className="text-[10px] text-muted-foreground/60 italic">Nenhum material anexado.</p>
            )}
          </div>
        </div>

        {/* --- LINKS ADICIONAIS DE VENDA --- */}
        <div className="rounded-lg border border-border/60 p-3 space-y-3">
          <Label className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold flex items-center gap-1">
            <Link2 className="h-3.5 w-3.5" /> Links Adicionais de Venda
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            <Input
              id="custom-link-title"
              placeholder="Nome (ex: Checkout Boleto)"
              className="h-8 text-xs bg-background"
            />
            <div className="flex gap-1">
              <Input
                id="custom-link-url"
                placeholder="https://..."
                className="h-8 text-xs bg-background"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 text-primary border-primary/20 hover:bg-primary/5"
                onClick={() => {
                  const titleEl = document.getElementById("custom-link-title") as HTMLInputElement;
                  const urlEl = document.getElementById("custom-link-url") as HTMLInputElement;
                  if (!titleEl?.value || !urlEl?.value) {
                    toast.warning("Preencha o Nome e a URL do link.");
                    return;
                  }
                  const title = titleEl.value.trim();
                  const url = urlEl.value.trim();
                  const current = data.customLinks ?? [];
                  onChange({ customLinks: [...current, { title, url }] });
                  titleEl.value = "";
                  urlEl.value = "";
                  toast.success("Link adicional adicionado!");
                }}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            {(data.customLinks ?? []).map((link, idx) => (
              <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-card/60 border border-border/40 text-[11px]">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline font-medium truncate max-w-[80%]"
                >
                  <Link2 className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{link.title}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <button
                  onClick={() => {
                    const next = (data.customLinks ?? []).filter((_, i) => i !== idx);
                    onChange({ customLinks: next });
                    toast.success("Link removido");
                  }}
                  className="p-0.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {(data.customLinks ?? []).length === 0 && (
              <p className="text-[10px] text-muted-foreground/60 italic">Nenhum link adicional cadastrado.</p>
            )}
          </div>
        </div>

        <Field label="Briefing completo (notas)">
          <Textarea
            value={data.briefing ?? ""}
            onChange={(e) => onChange({ briefing: e.target.value })}
            rows={4}
            className="text-xs"
            placeholder="Espaço livre para anotações, plano, copys de referência, links..."
          />
        </Field>

        <Field label="Tags (vírgula)">
          <Input
            value={data.tags ?? ""}
            onChange={(e) => onChange({ tags: e.target.value })}
            placeholder="ex: lancamento, mentoria"
            className="h-8 text-xs"
          />
        </Field>
      </div>

      <div className="border-t border-border/60 p-3 flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicate}
          className="flex-1"
        >
          <Gift className="h-3 w-3" /> Duplicar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="flex-1 text-destructive hover:text-destructive"
        >
          <Heart className="h-3 w-3" /> Excluir
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
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
