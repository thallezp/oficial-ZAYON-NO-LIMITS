"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Edit3,
  ListChecks,
  MoreVertical,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
  Workflow as WorkflowIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_FLOWS, MOCK_PERSONAS } from "@/data";
import { relativeTime } from "@/lib/utils/format";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useFlows,
  usePersonas,
  useDeleteFlowMutation,
  useUpdateFlowMutation,
  useCreateFlowMutation,
} from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const iconMap = {
  Workflow: WorkflowIcon,
  UserPlus: UserPlus,
  ListChecks: ListChecks,
  Sparkles: Sparkles,
};

const FLOW_TEMPLATES = [
  {
    id: "content-pipeline",
    name: "Pipeline de Conteúdo",
    description: "Ideação → Roteiro → Aprovação → Captação → Edição → Publicação",
    type: "process",
    color: "#5b8cff",
    icon: "Workflow",
    nodes: [
      { id: "1", type: "step", position: { x: 0, y: 80 }, data: { kind: "trigger", title: "Ideação", description: "Brainstorm com pilares", owner: "Strategy", status: "pending" } },
      { id: "2", type: "step", position: { x: 240, y: 80 }, data: { kind: "action", title: "Roteiro", description: "Tiptap + checklist", owner: "Copy", status: "pending" } },
      { id: "3", type: "step", position: { x: 480, y: 80 }, data: { kind: "approval", title: "Aprovação", description: "Strategist + Owner", owner: "Marina", status: "pending" } },
      { id: "4", type: "step", position: { x: 720, y: 80 }, data: { kind: "action", title: "Captação", description: "B-roll + áudio", owner: "Video", status: "pending" } },
      { id: "5", type: "step", position: { x: 720, y: 260 }, data: { kind: "action", title: "Edição", description: "CapCut / Premiere", owner: "Editor", status: "pending" } },
      { id: "6", type: "step", position: { x: 960, y: 260 }, data: { kind: "approval", title: "Aprovação Final", description: "Owner", owner: "Alex", status: "pending" } },
      { id: "7", type: "step", position: { x: 1200, y: 260 }, data: { kind: "action", title: "Publicação", description: "Agendamento + boost", owner: "Social", status: "pending" } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
      { id: "e2-3", source: "2", target: "3", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
      { id: "e3-4", source: "3", target: "4", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
      { id: "e4-5", source: "4", target: "5", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
      { id: "e5-6", source: "5", target: "6", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
      { id: "e6-7", source: "6", target: "7", type: "smoothstep", animated: true, style: { stroke: "#5b8cff" } },
    ],
  },
  {
    id: "onboarding",
    name: "Onboarding de Cliente",
    description: "Contrato → Briefing → Setup → Treinamento → Ativação → Acompanhamento",
    type: "onboarding",
    color: "#10b981",
    icon: "UserPlus",
    nodes: [
      { id: "1", type: "step", position: { x: 0, y: 80 }, data: { kind: "trigger", title: "Contrato Assinado", description: "Gatilho inicial", owner: "Sales", status: "pending" } },
      { id: "2", type: "step", position: { x: 240, y: 80 }, data: { kind: "document", title: "Briefing", description: "Formulário de onboarding", owner: "CS", status: "pending" } },
      { id: "3", type: "step", position: { x: 480, y: 80 }, data: { kind: "action", title: "Setup", description: "Configurar ferramentas", owner: "Tech", status: "pending" } },
      { id: "4", type: "step", position: { x: 720, y: 80 }, data: { kind: "user", title: "Treinamento", description: "Call + vídeos", owner: "CS", status: "pending" } },
      { id: "5", type: "step", position: { x: 960, y: 80 }, data: { kind: "action", title: "Ativação", description: "Primeiro entregável", owner: "CS", status: "pending" } },
      { id: "6", type: "step", position: { x: 1200, y: 80 }, data: { kind: "review", title: "Acompanhamento 30D", description: "Check-in mensal", owner: "CS", status: "pending" } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "smoothstep", animated: true, style: { stroke: "#10b981" } },
      { id: "e2-3", source: "2", target: "3", type: "smoothstep", animated: true, style: { stroke: "#10b981" } },
      { id: "e3-4", source: "3", target: "4", type: "smoothstep", animated: true, style: { stroke: "#10b981" } },
      { id: "e4-5", source: "4", target: "5", type: "smoothstep", animated: true, style: { stroke: "#10b981" } },
      { id: "e5-6", source: "5", target: "6", type: "smoothstep", animated: true, style: { stroke: "#10b981" } },
    ],
  },
  {
    id: "approval",
    name: "Aprovação Editorial",
    description: "Submissão → Revisão → Ajuste → Aprovação → Publicação",
    type: "approval",
    color: "#f59e0b",
    icon: "ListChecks",
    nodes: [
      { id: "1", type: "step", position: { x: 0, y: 80 }, data: { kind: "trigger", title: "Submissão", description: "Conteúdo enviado para revisão", owner: "Creator", status: "pending" } },
      { id: "2", type: "step", position: { x: 240, y: 80 }, data: { kind: "review", title: "Revisão", description: "Verificar alinhamento", owner: "Editor", status: "pending" } },
      { id: "3a", type: "step", position: { x: 480, y: 0 }, data: { kind: "approval", title: "Aprovado", description: "Segue para publicação", owner: "Editor", status: "pending" } },
      { id: "3b", type: "step", position: { x: 480, y: 160 }, data: { kind: "condition", title: "Ajuste Necessário", description: "Retorna para creator", owner: "Editor", status: "pending" } },
      { id: "4", type: "step", position: { x: 720, y: 0 }, data: { kind: "action", title: "Publicação", description: "Agendamento final", owner: "Social", status: "pending" } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "smoothstep", animated: true, style: { stroke: "#f59e0b" } },
      { id: "e2-3a", source: "2", target: "3a", type: "smoothstep", animated: true, style: { stroke: "#f59e0b" } },
      { id: "e2-3b", source: "2", target: "3b", type: "smoothstep", animated: true, style: { stroke: "#f59e0b" } },
      { id: "e3a-4", source: "3a", target: "4", type: "smoothstep", animated: true, style: { stroke: "#f59e0b" } },
    ],
  },
  {
    id: "lead-nurturing",
    name: "Nutrição de Leads",
    description: "Captura → Qualificação → Sequência → Conversão → Pós-venda",
    type: "funnel",
    color: "#8b5cf6",
    icon: "Sparkles",
    nodes: [
      { id: "1", type: "step", position: { x: 0, y: 80 }, data: { kind: "trigger", title: "Captura", description: "Lead entra na base", owner: "Marketing", status: "pending" } },
      { id: "2", type: "step", position: { x: 240, y: 80 }, data: { kind: "ia", title: "Qualificação IA", description: "Score automático", owner: "System", status: "pending" } },
      { id: "3", type: "step", position: { x: 480, y: 80 }, data: { kind: "action", title: "Sequência Email", description: "5 emails automáticos", owner: "Marketing", status: "pending" } },
      { id: "4", type: "step", position: { x: 720, y: 80 }, data: { kind: "user", title: "Abordagem Humana", description: "SDR entra em contato", owner: "Sales", status: "pending" } },
      { id: "5", type: "step", position: { x: 960, y: 80 }, data: { kind: "approval", title: "Proposta", description: "Apresentação + negociação", owner: "Sales", status: "pending" } },
      { id: "6", type: "step", position: { x: 1200, y: 80 }, data: { kind: "delivery", title: "Fechamento", description: "Contrato + onboarding", owner: "Sales", status: "pending" } },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "smoothstep", animated: true, style: { stroke: "#8b5cf6" } },
      { id: "e2-3", source: "2", target: "3", type: "smoothstep", animated: true, style: { stroke: "#8b5cf6" } },
      { id: "e3-4", source: "3", target: "4", type: "smoothstep", animated: true, style: { stroke: "#8b5cf6" } },
      { id: "e4-5", source: "4", target: "5", type: "smoothstep", animated: true, style: { stroke: "#8b5cf6" } },
      { id: "e5-6", source: "5", target: "6", type: "smoothstep", animated: true, style: { stroke: "#8b5cf6" } },
    ],
  },
];

export default function FlowsPage() {
  const router = useRouter();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { openWith } = useQuickCreate();
  useNewEntityShortcut("flow");
  const { data: dbFlows = [] } = useFlows(activeWorkspaceId);
  const { data: dbPersonas = [] } = usePersonas(activeWorkspaceId);
  const deleteFlow = useDeleteFlowMutation();
  const updateFlow = useUpdateFlowMutation();
  const createFlow = useCreateFlowMutation();

  const [confirmDelete, setConfirmDelete] = React.useState<any | null>(null);
  const [editingFlow, setEditingFlow] = React.useState<any | null>(null);
  const [editForm, setEditForm] = React.useState({ name: "", description: "" });
  const [templateOpen, setTemplateOpen] = React.useState(false);
  const [creatingTemplate, setCreatingTemplate] = React.useState<string | null>(null);

  const flows = isMockModeClient && dbFlows.length === 0 ? MOCK_FLOWS : dbFlows;
  const personas =
    isMockModeClient && dbPersonas.length === 0 ? MOCK_PERSONAS : dbPersonas;

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteFlow.mutateAsync(confirmDelete.id);
      toast.success(`"${confirmDelete.name}" excluído`);
      setConfirmDelete(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao excluir flow");
    }
  };

  const handleEdit = async () => {
    if (!editingFlow) return;
    try {
      await updateFlow.mutateAsync({
        id: editingFlow.id,
        input: { name: editForm.name, description: editForm.description },
      });
      toast.success("Flow atualizado");
      setEditingFlow(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao atualizar flow");
    }
  };

  const handleCreateFromTemplate = async (template: typeof FLOW_TEMPLATES[0]) => {
    if (!activeWorkspaceId) return;
    setCreatingTemplate(template.id);
    try {
      const result: any = await createFlow.mutateAsync({
        workspaceId: activeWorkspaceId,
        name: template.name,
        description: template.description,
        type: template.type,
        color: template.color,
        icon: template.icon,
        nodes: template.nodes,
        edges: template.edges,
      });
      toast.success(`Flow "${template.name}" criado! Abrindo editor...`);
      setTemplateOpen(false);
      if (result?.id) {
        router.push(`/flows/${result.id}`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar flow a partir do template");
    } finally {
      setCreatingTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flows"
        description="Processos internos, automações, mindmaps e fluxos de aprovação · React Flow."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}>
              <Sparkles className="h-3.5 w-3.5" /> Templates
            </Button>
            <Button variant="gradient" size="sm" onClick={() => openWith("flow")}>
              <Plus className="h-4 w-4" /> Novo Flow
            </Button>
          </>
        }
      />

      {flows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/20 px-6 py-16 text-center">
          <WorkflowIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">Nenhum flow criado ainda</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crie um flow do zero ou comece com um template pronto.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}>
              <Sparkles className="h-3.5 w-3.5" /> Ver Templates
            </Button>
            <Button variant="gradient" size="sm" onClick={() => openWith("flow")}>
              <Plus className="h-4 w-4" /> Novo Flow
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {flows.map((f: any, i: number) => {
            const Icon = iconMap[f.icon as keyof typeof iconMap] ?? WorkflowIcon;
            const persona = personas.find((p: any) => p.id === f.personaId);
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                {/* Dropdown menu — stops click propagation */}
                <div
                  className="absolute top-3 right-3 z-10"
                  onClick={(e) => e.preventDefault()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingFlow(f);
                          setEditForm({ name: f.name, description: f.description ?? "" });
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-2" /> Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/flows/${f.id}`}>
                          <Edit3 className="h-3.5 w-3.5 mr-2" /> Abrir editor
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setConfirmDelete(f)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Link href={`/flows/${f.id}`} className="block">
                  <Card variant="elevated" className="group hover:border-primary/40 transition overflow-hidden relative">
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                      style={{
                        background: `radial-gradient(at top right, ${f.color || "#5b8cff"}25, transparent 60%)`,
                      }}
                    />
                    <CardContent className="p-5 space-y-4 relative">
                      <div className="flex items-start justify-between">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{
                            background: `${f.color || "#5b8cff"}30`,
                            color: f.color || "#5b8cff",
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <Badge size="sm" variant="outline">
                          {f.type}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="font-semibold leading-tight pr-8">{f.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {f.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-3">
                        <span>{(f as any).nodeCount ?? 0} nós</span>
                        {persona && (
                          <Badge variant="ghost" size="sm">
                            {persona.name}
                          </Badge>
                        )}
                        <span>{relativeTime(f.updatedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Section: Templates */}
      <Card variant="glass" className="overflow-hidden relative">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <CardContent className="relative p-8 grid sm:grid-cols-2 gap-6 items-center">
          <div>
            <Badge variant="primary" size="sm" className="w-fit">
              <Sparkles className="h-3 w-3" /> Templates
            </Badge>
            <h3 className="text-lg font-semibold mt-2">
              Comece com um fluxo pronto
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Onboarding, aprovação editorial, pipeline de criativos · ajustáveis
              em segundos.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FLOW_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleCreateFromTemplate(t)}
                disabled={creatingTemplate === t.id}
                className="rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-xs text-left hover:border-primary/40 transition disabled:opacity-60"
              >
                {creatingTemplate === t.id ? "Criando..." : t.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal: Template Gallery */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Templates de Flow
            </DialogTitle>
            <DialogDescription>
              Escolha um template para criar um flow com estrutura pronta. Você pode editar todos os nós no editor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            {FLOW_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleCreateFromTemplate(t)}
                disabled={creatingTemplate === t.id}
                className="group rounded-xl border border-border/60 bg-card-elevated p-4 text-left hover:border-primary/40 transition disabled:opacity-60 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs"
                    style={{ background: t.color }}
                  >
                    {t.nodes.length}
                  </span>
                  <p className="font-medium text-sm">{t.name}</p>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {t.description}
                </p>
                <p className="text-[10px] text-primary">
                  {creatingTemplate === t.id ? "Criando..." : `${t.nodes.length} nós · ${t.edges.length} conexões`}
                </p>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateOpen(false)}>
              Fechar
            </Button>
            <Button variant="gradient" onClick={() => { setTemplateOpen(false); openWith("flow"); }}>
              <Plus className="h-3.5 w-3.5" /> Criar em branco
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Rename Flow */}
      <Dialog open={!!editingFlow} onOpenChange={(o) => !o && setEditingFlow(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear Flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="flow-name">Nome</Label>
              <Input
                id="flow-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do flow"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="flow-desc">Descrição</Label>
              <Textarea
                id="flow-desc"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descreva o propósito deste flow"
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setEditingFlow(null)}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleEdit}
              disabled={updateFlow.isPending || !editForm.name.trim()}
            >
              {updateFlow.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirm Delete */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Excluir Flow
            </DialogTitle>
            <DialogDescription>
              "{confirmDelete?.name}" será excluído permanentemente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteFlow.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFlow.isPending ? "Excluindo..." : "Confirmar exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
