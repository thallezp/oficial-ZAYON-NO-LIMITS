"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  GripVertical,
  Plus,
  Sparkles,
  TestTube,
  Trash2,
  Wand2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { relativeTime } from "@/lib/utils/format";
import {
  usePrompts,
  useUpdatePromptChainMutation,
  useDeletePromptChainMutation,
} from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";
import { toast } from "sonner";

export default function PromptsPage() {
  const persona = usePersonaFromRoute();
  const { data: dbPrompts = [] } = usePrompts(persona.id);
  const updateMutation = useUpdatePromptChainMutation();
  const deleteMutation = useDeletePromptChainMutation();

  const chains =
    dbPrompts;

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const active = chains.find((c: any) => c.id === activeId) || chains[0];
  const openQuickCreate = useQuickCreate((s) => s.openWith);
  useNewEntityShortcut("promptChain");

  const [editBasePrompt, setEditBasePrompt] = React.useState("");
  const [editChainSteps, setEditChainSteps] = React.useState<{ id: string; role: string; body: string }[]>([]);

  React.useEffect(() => {
    if (chains.length > 0 && !activeId) {
      setActiveId(chains[0].id);
    }
  }, [chains, activeId]);

  React.useEffect(() => {
    if (active) {
      setEditBasePrompt(active.basePrompt || "");
      setEditChainSteps(active.chain || []);
    } else {
      setEditBasePrompt("");
      setEditChainSteps([]);
    }
  }, [active]);

  const handleNewChain = () => {
    openQuickCreate("promptChain");
  };

  const handleSave = async () => {
    if (!active) return;
    try {
      await updateMutation.mutateAsync({
        id: active.id,
        input: {
          basePrompt: editBasePrompt,
          chain: editChainSteps,
        },
      });
      toast.success("Cadeia de prompts salva com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar cadeia: " + e.message);
    }
  };

  const handleDeleteChain = async () => {
    if (!active) return;
    if (!confirm(`Deseja mesmo apagar a cadeia "${active.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(active.id);
      setActiveId(null);
      toast.success("Cadeia excluída com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao excluir: " + e.message);
    }
  };

  const handleAddStep = () => {
    setEditChainSteps([
      ...editChainSteps,
      { id: `step-${Date.now()}`, role: "user", body: "" },
    ]);
  };

  const handleDeleteStep = (index: number) => {
    setEditChainSteps(editChainSteps.filter((_, idx) => idx !== index));
  };

  const handleStepBodyChange = (index: number, val: string) => {
    const nextSteps = [...editChainSteps];
    nextSteps[index] = { ...nextSteps[index], body: val };
    setEditChainSteps(nextSteps);
  };

  const handleStepRoleChange = (index: number, val: string) => {
    const nextSteps = [...editChainSteps];
    nextSteps[index] = { ...nextSteps[index], role: val };
    setEditChainSteps(nextSteps);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompt Chains"
        description="Banco de prompts encadeados por persona. Ajuste e salve passos de forma dinâmica."
        actions={
          <Button variant="gradient" size="sm" onClick={handleNewChain}>
            <Plus className="h-4 w-4" /> Nova Cadeia
          </Button>
        }
      />
      <PersonaHero persona={persona} pageBadge="prompts" />

      {!active ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Nenhuma cadeia de prompts cadastrada. Clique em "Nova Cadeia" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-4 space-y-2">
            {chains.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  c.id === active.id
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/60 bg-card/40 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm flex-1">{c.name}</p>
                  <Badge
                    size="sm"
                    variant={c.status === "robust" ? "success" : "warning"}
                  >
                    {c.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {c.description}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                  {c.chain?.length || 0} passos · {relativeTime(c.updatedAt)}
                </p>
              </button>
            ))}
          </aside>

          <div className="col-span-12 lg:col-span-8 space-y-4">
            <Card>
              <CardHeader className="flex-row justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {active.name}
                    <Badge variant={active.status === "robust" ? "success" : "warning"}>
                      {active.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {active.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeleteChain} className="text-destructive hover:bg-destructive/10 border-destructive/30">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">
                    Prompt base / Instrução Sistêmica
                  </div>
                  <Textarea value={editBasePrompt} onChange={(e) => setEditBasePrompt(e.target.value)} rows={4} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Cadeia · {editChainSteps.length} passos
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => toast.info("Melhorando prompt com engenharia de IA...")}>
                      <Wand2 className="h-3 w-3" /> Melhorar com IA
                    </Button>
                    <Button variant="gradient" size="sm" onClick={() => toast.success("Executando simulação de cadeia...")}>
                      <TestTube className="h-3 w-3" /> Testar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {editChainSteps.map((step: any, i: number) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex gap-3 rounded-xl border border-border/60 bg-card-elevated p-3"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 cursor-grab" />
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary text-xs font-semibold">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex justify-between items-center">
                          <select
                            value={step.role}
                            onChange={(e) => handleStepRoleChange(i, e.target.value)}
                            className="bg-transparent border border-border/60 rounded px-1.5 py-0.5 text-[10px] outline-none text-muted-foreground uppercase font-semibold"
                          >
                            <option value="user">User</option>
                            <option value="assistant">Assistant</option>
                            <option value="system">System</option>
                          </select>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteStep(i)} className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Textarea value={step.body} onChange={(e) => handleStepBodyChange(i, e.target.value)} rows={2} className="text-sm" />
                      </div>
                    </motion.div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={handleAddStep}>
                    <Plus className="h-3 w-3" /> Adicionar passo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
