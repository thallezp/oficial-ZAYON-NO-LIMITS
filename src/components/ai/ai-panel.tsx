"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ChevronDown, Send, Sparkles, X, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";
import { useActivePersona } from "@/stores/persona-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

const suggestions = [
  "Resumir reunião desta semana",
  "Gerar 5 hooks de TikTok da persona ativa",
  "Qualificar leads pendentes",
  "Criar plano de lançamento de 30 dias",
  "Transformar dores do ICP em criativos",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const seed: Message[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "Estou contextualizada com a Aurora. Os 42 leads abertos foram triados — score médio 78. Quer que eu gere o roteiro do reel desta semana ou que avance no plano de lançamento?",
  },
];

export function AIPanel() {
  const open = useUIStore((s) => s.aiPanelOpen);
  const setOpen = useUIStore((s) => s.setAIPanelOpen);
  const persona = useActivePersona();
  const [messages, setMessages] = React.useState<Message[]>(seed);
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const send = (text?: string) => {
    const body = (text ?? input).trim();
    if (!body) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: body }]);
    setInput("");
    setPending(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `(simulação) Processando '${body}' no contexto de ${persona?.name ?? "workspace"}. Resultados aparecem no painel correspondente.`,
        },
      ]);
      setPending(false);
      toast.success("IA executou a ação", {
        description: "Resultado registrado em AI History.",
      });
    }, 800);
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
                <p className="text-sm font-semibold">NEXUS AI</p>
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
              <div
                key={m.id}
                className={cn(
                  "flex flex-col gap-1",
                  m.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "border border-border/60 bg-card rounded-bl-md",
                  )}
                >
                  {m.content}
                </div>
                {m.role === "assistant" && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Sparkles className="h-3 w-3" /> contextual · personalizado
                  </div>
                )}
              </div>
            ))}
            {pending && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse delay-100" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse delay-200" />
              </div>
            )}
          </div>

          <div className="border-t border-border/60 p-3 space-y-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="shrink-0 rounded-full border border-border/60 bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  <Wand2 className="h-3 w-3 inline mr-1" />
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background px-2.5 py-1.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte qualquer coisa…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <Button
                size="icon-sm"
                variant="gradient"
                onClick={() => send()}
                disabled={!input.trim() || pending}
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Toda ação é registrada em <Badge variant="outline" size="sm" className="mx-1">AI Actions</Badge>
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
