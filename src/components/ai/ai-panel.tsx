"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";
import { useActivePersona } from "@/stores/persona-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";

const suggestions = [
  "Resumir reunião desta semana",
  "Gerar 5 hooks de TikTok da persona ativa",
  "Qualificar leads pendentes",
  "Criar plano de lançamento de 30 dias",
  "Transformar dores do ICP em criativos",
];

const seed: UIMessage[] = [
  {
    id: "m1",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Olá! Sou a ZAYON AI. Estou pronta para executar trabalho real — criar tarefas, documentos, conteúdos, leads, eventos, qualificar leads, montar planos de lançamento e mais. O que vamos fazer agora?",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOOL_LABEL: Record<string, string> = {
  createTask: "Tarefa criada",
  createDocument: "Documento criado",
  createContent: "Conteúdo criado",
  createLead: "Lead criado",
  createFinancial: "Lançamento financeiro",
  createCalendarEvent: "Evento na agenda",
  createHook: "Hook salvo",
  generateScript: "Roteiro gerado",
  generateCaption: "Legenda gerada",
  generateCopy: "Copy gerada",
  generateHook: "Hook tático salvo",
  summarizeDocument: "Documento resumido",
  analyzeMetrics: "Análise registrada",
  addActivityInsight: "Insight registrado",
  suggestTool: "Ferramenta sugerida",
  improvePrompt: "Prompt melhorado",
  qualifyLead: "Qualificação de lead",
  createFunnelNode: "Nó do funil",
  createLaunchPlan: "Plano de lançamento",
  insightToTask: "Insight → tarefa",
};

function getToolParts(message: UIMessage): Array<{ toolName: string; output: any; state?: string }> {
  if (!message.parts) return [];
  return message.parts
    .map((part: any) => {
      // AI SDK v5 emits parts like { type: 'tool-<name>', state, output, ... }
      if (typeof part.type === "string" && part.type.startsWith("tool-")) {
        return {
          toolName: part.type.replace(/^tool-/, ""),
          output: part.output ?? part.result ?? null,
          state: part.state,
        };
      }
      return null;
    })
    .filter(Boolean) as any;
}

// ---------------------------------------------------------------------------
// AIPanel
// ---------------------------------------------------------------------------

export function AIPanel() {
  const open = useUIStore((s) => s.aiPanelOpen);
  const setOpen = useUIStore((s) => s.setAIPanelOpen);
  const pendingAIPrompt = useUIStore((s) => s.pendingAIPrompt);
  const setPendingAIPrompt = useUIStore((s) => s.setPendingAIPrompt);
  const persona = useActivePersona();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const queryClient = useQueryClient();

  const storageKey = React.useMemo(() => {
    return `zayon.chat.${activeWorkspaceId || "global"}.${persona?.id || "global"}`;
  }, [activeWorkspaceId, persona?.id]);

  const [input, setInput] = React.useState("");

  const {
    messages,
    status,
    sendMessage,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai",
      body: {
        workspaceId: activeWorkspaceId,
        personaId: persona?.id,
      },
    }),
    onError: (err) => {
      toast.error("Erro na resposta da IA", {
        description: err.message || "Verifique se suas chaves de API estão configuradas.",
      });
    },
    onFinish: () => {
      // Refresh queries que podem ter sido afetadas
      queryClient.invalidateQueries({ queryKey: ["aiActions"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["contentHooks"] });
      queryClient.invalidateQueries({ queryKey: ["funnel"] });
      queryClient.invalidateQueries({ queryKey: ["launchCampaigns"] });
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Carrega histórico do localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setMessages(JSON.parse(stored));
        } catch {
          setMessages(seed);
        }
      } else {
        setMessages(seed);
      }
    }
  }, [storageKey, setMessages]);

  // Persiste histórico
  React.useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  // Consome pendingAIPrompt assim que o painel está aberto
  React.useEffect(() => {
    if (open && pendingAIPrompt && !isLoading) {
      const text = pendingAIPrompt;
      setPendingAIPrompt(null);
      // pequeno delay para garantir que o painel renderizou
      const t = setTimeout(() => {
        sendMessage({ text });
        toast.info("IA processando…", { description: text });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [open, pendingAIPrompt, isLoading, sendMessage, setPendingAIPrompt]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  };

  const handleSuggestionClick = (text: string) => {
    if (isLoading) return;
    sendMessage({ text });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 480, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 480, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed right-0 top-14 z-30 flex h-[calc(100vh-3.5rem)] w-full max-w-md flex-col border-l border-border/60 bg-card/95 backdrop-blur-2xl shadow-glow-strong"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold">ZAYON AI</p>
                <p className="text-[10px] text-muted-foreground">
                  contexto: {persona?.name ?? "workspace global"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground p-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse delay-100" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse delay-200" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border/60 p-3 space-y-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="shrink-0 rounded-full border border-border/60 bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  <Wand2 className="h-3 w-3 inline mr-1" />
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-background px-2.5 py-1.5"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte qualquer coisa…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                size="icon-sm"
                variant="gradient"
                type="submit"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-3 w-3" />
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center">
              Toda ação é registrada em <Badge variant="outline" size="sm" className="mx-1">AI Actions</Badge>
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// MessageBubble + Tool result cards
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: UIMessage }) {
  const toolParts = getToolParts(message);
  const textParts = (message.parts || []).filter((p: any) => p.type === "text");
  const isUser = message.role === "user";

  return (
    <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
      {textParts.length > 0 && (
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "border border-border/60 bg-card rounded-bl-md",
          )}
        >
          {textParts.map((part: any, idx: number) => (
            <React.Fragment key={idx}>{part.text}</React.Fragment>
          ))}
        </div>
      )}

      {toolParts.map((tp, idx) => (
        <ToolResultCard key={idx} toolName={tp.toolName} output={tp.output} />
      ))}

      {!isUser && textParts.length > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Sparkles className="h-3 w-3" /> contextual · personalizado
        </div>
      )}
    </div>
  );
}

function ToolResultCard({ toolName, output }: { toolName: string; output: any }) {
  const queryClient = useQueryClient();
  const [confirmState, setConfirmState] = React.useState<
    "idle" | "confirming" | "cancelling" | "done" | "cancelled" | "failed"
  >("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const label = TOOL_LABEL[toolName] || toolName;

  // Toast de sucesso/erro para qualquer tool que retorna direto (sem confirmação)
  const completedActionIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!output) return;
    if (output.__completed && output.actionId && completedActionIdRef.current !== output.actionId) {
      completedActionIdRef.current = output.actionId;
      const title =
        output.result?.title ||
        output.result?.name ||
        output.result?.taskTitle ||
        "";
      toast.success(`${label} ✓`, {
        description: title ? String(title) : "Ação registrada em ai_actions.",
      });
    }
  }, [output, label]);

  if (!output) return null;

  // ---------- Awaiting confirmation card ----------
  if (output.__awaitingConfirmation) {
    const isResolved = confirmState === "done" || confirmState === "cancelled";

    const handleDecision = async (decision: "confirm" | "cancel") => {
      setConfirmState(decision === "confirm" ? "confirming" : "cancelling");
      setErrorMsg(null);
      try {
        const res = await fetch("/api/ai/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionId: output.actionId, decision }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Falha ao confirmar");
        }
        if (decision === "confirm") {
          setConfirmState("done");
          toast.success(`${label} executado!`);
          queryClient.invalidateQueries();
        } else {
          setConfirmState("cancelled");
          toast.info("Ação cancelada");
        }
      } catch (err: any) {
        setConfirmState("failed");
        setErrorMsg(err.message || "Erro");
        toast.error("Erro ao confirmar ação", { description: err.message });
      }
    };

    return (
      <div className="w-full max-w-[90%] rounded-xl border border-warning/40 bg-warning/5 p-3 text-xs">
        <div className="flex items-center gap-2 text-warning/90">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="font-semibold uppercase tracking-wide">
            Confirmação necessária · {label}
          </span>
        </div>
        <p className="mt-1 text-foreground/90 leading-relaxed">{output.summary}</p>
        {output.args && (
          <details className="mt-1.5">
            <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
              ver detalhes
            </summary>
            <pre className="mt-1 overflow-auto rounded bg-background/60 p-2 text-[10px] text-muted-foreground">
              {JSON.stringify(output.args, null, 2)}
            </pre>
          </details>
        )}
        {!isResolved && (
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              variant="gradient"
              onClick={() => handleDecision("confirm")}
              disabled={confirmState !== "idle"}
            >
              {confirmState === "confirming" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDecision("cancel")}
              disabled={confirmState !== "idle"}
            >
              <X className="h-3 w-3" />
              Cancelar
            </Button>
          </div>
        )}
        {confirmState === "done" && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-success">
            <CheckCircle2 className="h-3 w-3" /> Executado com sucesso
          </p>
        )}
        {confirmState === "cancelled" && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Cancelado — nada foi alterado.
          </p>
        )}
        {confirmState === "failed" && (
          <p className="mt-2 text-[11px] text-destructive">{errorMsg}</p>
        )}
      </div>
    );
  }

  // ---------- Completed action card ----------
  if (output.__completed) {
    const result = output.result;
    const title =
      result?.title || result?.name || result?.taskTitle || (result?.id ? `#${String(result.id).slice(0, 6)}` : "");
    return (
      <div className="w-full max-w-[90%] rounded-xl border border-success/30 bg-success/5 p-2.5 text-xs">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-semibold">{label}</span>
        </div>
        {title && (
          <p className="mt-1 truncate text-foreground/90">
            {String(title)}
          </p>
        )}
      </div>
    );
  }

  // ---------- Fallback (raw payload) ----------
  return (
    <div className="w-full max-w-[90%] rounded-xl border border-border/60 bg-card-elevated p-2.5 text-xs">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="font-semibold">{label}</span>
      </div>
      <pre className="mt-1 overflow-auto max-h-32 text-[10px] text-muted-foreground">
        {JSON.stringify(output, null, 2)}
      </pre>
    </div>
  );
}
