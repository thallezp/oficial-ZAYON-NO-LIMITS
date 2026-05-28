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
import {
  Brain,
  Check,
  Clock,
  Copy,
  FileText,
  GitBranch,
  ListChecks,
  PackageCheck,
  Save,
  Search,
  Trash2,
  UserPlus,
  Webhook,
  Workflow,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

const ICONS = {
  trigger: Workflow,
  action: ListChecks,
  approval: Check,
  document: FileText,
  delay: Clock,
  user: UserPlus,
  condition: GitBranch,
  ia: Brain,
  webhook: Webhook,
  checklist: ListChecks,
  delivery: PackageCheck,
  review: Search,
} as const;

const KIND_LABELS: Record<keyof typeof ICONS, string> = {
  trigger: "Gatilho",
  action: "Ação",
  approval: "Aprovação",
  document: "Documento",
  delay: "Espera",
  user: "Pessoa",
  condition: "Condição",
  ia: "IA",
  webhook: "Webhook",
  checklist: "Checklist",
  delivery: "Entrega",
  review: "Revisão",
};

const KIND_COLORS: Record<keyof typeof ICONS, string> = {
  trigger: "from-violet-500/20 to-violet-500/5 border-violet-500/40 text-violet-300",
  action: "from-primary/20 to-primary/5 border-primary/40 text-primary",
  approval: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/40 text-emerald-300",
  document: "from-amber-500/20 to-amber-500/5 border-amber-500/40 text-amber-300",
  delay: "from-zinc-500/20 to-zinc-500/5 border-zinc-500/40 text-zinc-300",
  user: "from-pink-500/20 to-pink-500/5 border-pink-500/40 text-pink-300",
  condition: "from-orange-500/20 to-orange-500/5 border-orange-500/40 text-orange-300",
  ia: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/40 text-cyan-300",
  webhook: "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/40 text-fuchsia-300",
  checklist: "from-teal-500/20 to-teal-500/5 border-teal-500/40 text-teal-300",
  delivery: "from-lime-500/20 to-lime-500/5 border-lime-500/40 text-lime-300",
  review: "from-blue-500/20 to-blue-500/5 border-blue-500/40 text-blue-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  doing: "Fazendo",
  done: "Concluída",
  blocked: "Bloqueada",
};

interface NodeData {
  title: string;
  description?: string;
  kind: keyof typeof ICONS;
  owner?: string;
  status?: string;
  checklist?: { id: string; text: string; done: boolean }[];
  links?: string[];
  dueAt?: string;
  tags?: string[];
}

function StepNode({ data, selected }: NodeProps<NodeData>) {
  const Icon = ICONS[data.kind] ?? Workflow;
  const colorClass = KIND_COLORS[data.kind] ?? KIND_COLORS.action;
  const checklistDone = data.checklist?.filter((c) => c.done).length ?? 0;
  const checklistTotal = data.checklist?.length ?? 0;
  return (
    <div
      className={cn(
        "rounded-xl border bg-card-elevated shadow-soft w-[220px] transition",
        "bg-gradient-to-br",
        colorClass,
        selected && "ring-2 ring-primary shadow-glow",
      )}
    >
      <div className="flex items-center justify-between rounded-t-xl px-3 py-2 border-b border-border/60">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-background/40">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <Badge variant="outline" size="sm" className="capitalize bg-background/40">
          {KIND_LABELS[data.kind]}
        </Badge>
      </div>
      <div className="px-3 py-2 space-y-1 bg-card-elevated/95 rounded-b-xl">
        <p className="text-sm font-semibold leading-tight text-foreground">
          {data.title}
        </p>
        {data.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2">
            {data.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1 mt-1.5">
          {data.owner && data.owner !== "—" && (
            <Badge variant="ghost" size="sm">
              {data.owner}
            </Badge>
          )}
          {data.status && (
            <Badge size="sm" variant={data.status === "done" ? "success" : "outline"}>
              {STATUS_LABELS[data.status] ?? data.status}
            </Badge>
          )}
          {checklistTotal > 0 && (
            <Badge size="sm" variant="ghost">
              {checklistDone}/{checklistTotal}
            </Badge>
          )}
        </div>
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
  const [isDirty, setIsDirty] = React.useState(false);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setNodes(initialNodes);
    setIsDirty(false);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // marca dirty quando nodes/edges mudam apos mount
  const mountedRef = React.useRef(false);
  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setIsDirty(true);
  }, [nodes, edges]);

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

  const handleSave = React.useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(nodes, edges);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, onSave]);

  // atalhos: Cmd/Ctrl+S salva, Delete remove selecionado
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
        if (selectedNodeId) {
          e.preventDefault();
          setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
          setEdges((eds) =>
            eds.filter(
              (e2) => e2.source !== selectedNodeId && e2.target !== selectedNodeId,
            ),
          );
          setSelectedNodeId(null);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, selectedNodeId, setNodes, setEdges]);

  // aviso ao sair com alteracoes nao salvas
  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const handleAddStep = React.useCallback(
    (kind: keyof typeof ICONS) => {
      const id = `n_${Date.now()}`;
      const existing = nodes.length;
      const col = existing % 4;
      const row = Math.floor(existing / 4);
      const newNode: Node = {
        id,
        type: "step",
        position: { x: col * 260, y: 80 + row * 200 },
        data: {
          kind,
          title: `${KIND_LABELS[kind]}`,
          description: "Clique para editar",
          owner: "",
          status: "pending",
          checklist: [],
        } as NodeData,
      };
      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(id);
      setMenuOpen(false);
    },
    [nodes, setNodes],
  );

  const handleNodeClick = React.useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [],
  );

  const handlePaneClick = React.useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleUpdateNode = React.useCallback(
    (id: string, patch: Partial<NodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...(n.data as NodeData), ...patch } } : n,
        ),
      );
    },
    [setNodes],
  );

  const handleDeleteNode = React.useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) =>
        eds.filter((e) => e.source !== id && e.target !== id),
      );
      setSelectedNodeId(null);
    },
    [setNodes, setEdges],
  );

  const handleDuplicateNode = React.useCallback(
    (id: string) => {
      const original = nodes.find((n) => n.id === id);
      if (!original) return;
      const newId = `n_${Date.now()}`;
      const copy: Node = {
        ...original,
        id: newId,
        position: {
          x: original.position.x + 40,
          y: original.position.y + 40,
        },
        selected: false,
      };
      setNodes((nds) => [...nds, copy]);
      setSelectedNodeId(newId);
    },
    [nodes, setNodes],
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const NODE_KINDS: (keyof typeof ICONS)[] = [
    "trigger",
    "action",
    "approval",
    "document",
    "delay",
    "user",
    "condition",
    "ia",
    "webhook",
    "checklist",
    "delivery",
    "review",
  ];

  return (
    <div className="relative flex gap-3">
      <div className="flex-1 h-[640px] rounded-xl border border-border/60 bg-card/40 overflow-hidden relative">
        {/* toolbar superior */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition"
            >
              + Adicionar nó
            </button>
            {menuOpen && (
              <div className="absolute top-full mt-1 left-0 grid grid-cols-2 gap-1 bg-card border border-border/60 rounded-lg p-1.5 shadow-glow z-20 min-w-[280px]">
                {NODE_KINDS.map((k) => {
                  const Icon = ICONS[k];
                  return (
                    <button
                      key={k}
                      onClick={() => handleAddStep(k)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-left hover:bg-card-elevated transition"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {KIND_LABELS[k]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {selectedNodeId && (
            <>
              <button
                onClick={() => handleDuplicateNode(selectedNodeId)}
                className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/80 px-2.5 py-1.5 text-[11px] font-medium hover:border-primary/40 hover:bg-card transition"
              >
                <Copy className="h-3 w-3" /> Duplicar
              </button>
              <button
                onClick={() => handleDeleteNode(selectedNodeId)}
                className="flex items-center gap-1 rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-[11px] font-medium text-destructive hover:bg-destructive/20 transition"
              >
                <Trash2 className="h-3 w-3" /> Excluir
              </button>
            </>
          )}
        </div>

        {/* save */}
        {onSave && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            {isDirty && (
              <span className="text-[11px] text-warning animate-pulse">
                Alterações não salvas
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground px-3.5 py-2 text-xs font-semibold shadow-md disabled:opacity-50 transition"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
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
            nodeColor="rgba(91,140,255,0.6)"
            maskColor="rgba(10,13,26,0.7)"
          />
        </ReactFlow>
      </div>

      {/* drawer lateral de edicao */}
      {selectedNode && (
        <NodeEditorDrawer
          node={selectedNode}
          kinds={NODE_KINDS}
          onClose={() => setSelectedNodeId(null)}
          onChange={(patch) => handleUpdateNode(selectedNode.id, patch)}
          onDelete={() => handleDeleteNode(selectedNode.id)}
          onDuplicate={() => handleDuplicateNode(selectedNode.id)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Drawer lateral de edicao
// ----------------------------------------------------------------------------

interface DrawerProps {
  node: Node<NodeData>;
  kinds: (keyof typeof ICONS)[];
  onClose: () => void;
  onChange: (patch: Partial<NodeData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function NodeEditorDrawer({
  node,
  kinds,
  onClose,
  onChange,
  onDelete,
  onDuplicate,
}: DrawerProps) {
  const data = (node.data ?? {}) as NodeData;
  const checklist = data.checklist ?? [];

  const addChecklistItem = () => {
    const next = [
      ...checklist,
      { id: `cl_${Date.now()}`, text: "", done: false },
    ];
    onChange({ checklist: next });
  };

  const updateChecklistItem = (
    id: string,
    patch: Partial<{ text: string; done: boolean }>,
  ) => {
    onChange({
      checklist: checklist.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const removeChecklistItem = (id: string) => {
    onChange({ checklist: checklist.filter((c) => c.id !== id) });
  };

  return (
    <aside className="w-[340px] shrink-0 h-[640px] rounded-xl border border-border/60 bg-card/60 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card/80">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Editar nó
          </p>
          <p className="text-sm font-semibold truncate">{data.title || "Sem título"}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-card transition"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Tipo
          </Label>
          <Select
            value={data.kind}
            onValueChange={(v) => onChange({ kind: v as keyof typeof ICONS })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {kinds.map((k) => (
                <SelectItem key={k} value={k}>
                  {KIND_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Título
          </Label>
          <Input
            value={data.title ?? ""}
            onChange={(e) => onChange({ title: e.target.value })}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Descrição
          </Label>
          <Textarea
            value={data.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={3}
            className="text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Responsável
            </Label>
            <Input
              value={data.owner ?? ""}
              onChange={(e) => onChange({ owner: e.target.value })}
              placeholder="Ex: Alex"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Status
            </Label>
            <Select
              value={data.status ?? "pending"}
              onValueChange={(v) => onChange({ status: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="doing">Fazendo</SelectItem>
                <SelectItem value="done">Concluída</SelectItem>
                <SelectItem value="blocked">Bloqueada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Prazo
          </Label>
          <Input
            type="datetime-local"
            value={data.dueAt ?? ""}
            onChange={(e) => onChange({ dueAt: e.target.value })}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Tags (separadas por vírgula)
          </Label>
          <Input
            value={(data.tags ?? []).join(", ")}
            onChange={(e) =>
              onChange({
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            className="h-8 text-xs"
            placeholder="ex: urgente, conteudo"
          />
        </div>

        <div className="space-y-1.5 rounded-lg border border-border/60 p-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Checklist ({checklist.filter((c) => c.done).length}/{checklist.length})
            </Label>
            <button
              onClick={addChecklistItem}
              className="text-[10px] text-primary hover:underline"
            >
              + item
            </button>
          </div>
          <div className="space-y-1">
            {checklist.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={c.done}
                  onChange={(e) =>
                    updateChecklistItem(c.id, { done: e.target.checked })
                  }
                  className="h-3 w-3"
                />
                <Input
                  value={c.text}
                  onChange={(e) =>
                    updateChecklistItem(c.id, { text: e.target.value })
                  }
                  className={cn(
                    "h-7 text-xs flex-1",
                    c.done && "line-through text-muted-foreground",
                  )}
                />
                <button
                  onClick={() => removeChecklistItem(c.id)}
                  className="text-muted-foreground hover:text-destructive transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {checklist.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">
                Sem itens. Clique em "+ item" para adicionar.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Links (um por linha)
          </Label>
          <Textarea
            value={(data.links ?? []).join("\n")}
            onChange={(e) =>
              onChange({
                links: e.target.value
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean),
              })
            }
            rows={2}
            className="text-xs"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="border-t border-border/60 p-2 flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={onDuplicate} className="flex-1">
          <Copy className="h-3 w-3" /> Duplicar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="flex-1 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Excluir
        </Button>
      </div>
    </aside>
  );
}

export function ProcessCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <ProcessInner {...props} />
    </ReactFlowProvider>
  );
}
