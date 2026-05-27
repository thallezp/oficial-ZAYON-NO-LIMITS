"use client";

import * as React from "react";
import { Bot, History, Sparkles, Wand2, AlertTriangle, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MOCK_AI_ACTIONS } from "@/data";
import { useAiActions } from "@/hooks/use-queries";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { useUIStore } from "@/stores/ui-store";
import { useActivePersona } from "@/stores/persona-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { relativeTime } from "@/lib/utils/format";
import type { AIAction } from "@/types";

export default function AIAssistantPage() {
  const setAIPanelOpen = useUIStore((s) => s.setAIPanelOpen);
  const persona = useActivePersona();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbActions = [] } = useAiActions(activeWorkspaceId, persona?.id);
  const aiActions: AIAction[] =
    isMockModeClient && dbActions.length === 0 ? MOCK_AI_ACTIONS : dbActions;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        description="IA contextual integrada à operação. Use o agente nativo ou conecte suas contas pessoais do ChatGPT e Claude."
        badge={
          <Badge variant="primary">
            <Sparkles className="h-3 w-3" /> contexto: {persona?.name ?? "global"}
          </Badge>
        }
        actions={
          <Button variant="gradient" size="sm" onClick={() => setAIPanelOpen(true)}>
            <Bot className="h-4 w-4" /> Abrir painel
          </Button>
        }
      />

      <Tabs defaultValue="native" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="native">Agente Nativo</TabsTrigger>
          <TabsTrigger value="external">Embed de IA Pessoal (ChatGPT / Claude)</TabsTrigger>
        </TabsList>

        <TabsContent value="native" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Gerar roteiro de Reel",
                desc: "Hook + 4 cenas + CTA · pegada cinematográfica",
                icon: Sparkles,
              },
              {
                title: "Qualificar leads pendentes",
                desc: "Aplicar regra de score · marcar prioritários",
                icon: Wand2,
              },
              {
                title: "Resumir reunião",
                desc: "Decisões, ações, blockers · gerar tarefas",
                icon: Bot,
              },
              {
                title: "Plano de lançamento 30 dias",
                desc: "Cronograma · conteúdos · campanhas · KPIs",
                icon: Sparkles,
              },
              {
                title: "Dores ICP → criativos",
                desc: "Transformar dores em hooks de anúncio",
                icon: Wand2,
              },
              {
                title: "Auditar funil",
                desc: "Detectar gargalos e sugerir otimizações",
                icon: Bot,
              },
            ].map((a) => (
              <Card
                key={a.title}
                variant="elevated"
                className="group hover:border-primary/40 cursor-pointer"
                onClick={() => setAIPanelOpen(true)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 text-primary">
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {a.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle>Histórico recente</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Cada ação executada pela IA gera registro em <Badge variant="outline" size="sm">ai_actions</Badge>.
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <History className="h-3.5 w-3.5" /> Ver tudo
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {aiActions.length === 0 ? (
                <EmptyState
                  icon={<History className="h-5 w-5" />}
                  title="Sem historico de IA ainda"
                  description="As execucoes reais do agente aparecem aqui assim que CopilotKit ou o painel nativo registrarem acoes."
                  className="py-10"
                />
              ) : (
                aiActions.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-card-elevated p-3"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{a.name}</p>
                        <Badge
                          size="sm"
                          variant={a.status === "completed" ? "success" : "warning"}
                        >
                          {a.status}
                        </Badge>
                      </div>
                      {a.description && (
                        <p className="text-[11px] text-muted-foreground">
                          {a.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {relativeTime(a.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="external">
          <ExternalAIEmbed />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente separado para o embed externo — mantém estado isolado
// ---------------------------------------------------------------------------
const PROVIDERS = [
  { value: "chatgpt", label: "ChatGPT (OpenAI)", url: "https://chatgpt.com", loginUrl: "https://chatgpt.com/auth/login" },
  { value: "claude", label: "Claude (Anthropic)", url: "https://claude.ai", loginUrl: "https://claude.ai/login" },
  { value: "gemini", label: "Gemini (Google)", url: "https://gemini.google.com", loginUrl: "https://gemini.google.com" },
  { value: "custom", label: "URL Customizada (Custom GPT / Claude Project)", url: "", loginUrl: "" },
] as const;

function ExternalAIEmbed() {
  const [selectedProvider, setSelectedProvider] = React.useState<string>("chatgpt");
  const [embedUrl, setEmbedUrl] = React.useState<string>("https://chatgpt.com");
  const [iframeKey, setIframeKey] = React.useState<number>(0);
  const [loginPopup, setLoginPopup] = React.useState<Window | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const savedProvider = localStorage.getItem("zayon.ai.embedProvider") || "chatgpt";
    const savedUrl = localStorage.getItem("zayon.ai.embedUrl") || "";
    setSelectedProvider(savedProvider);
    const prov = PROVIDERS.find((p) => p.value === savedProvider);
    setEmbedUrl(savedUrl || prov?.url || "https://chatgpt.com");
  }, []);

  const handleProviderChange = (val: string) => {
    setSelectedProvider(val);
    localStorage.setItem("zayon.ai.embedProvider", val);
    const prov = PROVIDERS.find((p) => p.value === val);
    const url = prov?.url || "";
    setEmbedUrl(url);
    localStorage.setItem("zayon.ai.embedUrl", url);
  };

  const handleUrlChange = (val: string) => {
    setEmbedUrl(val);
    localStorage.setItem("zayon.ai.embedUrl", val);
  };

  const openLoginPopup = () => {
    const prov = PROVIDERS.find((p) => p.value === selectedProvider);
    const loginUrl = prov?.loginUrl || embedUrl;
    if (!loginUrl) return;

    // Fecha popup anterior se existir
    if (loginPopup && !loginPopup.closed) loginPopup.close();

    const w = 520;
    const h = 680;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;

    const popup = window.open(
      loginUrl,
      "zayon_ai_login",
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`,
    );
    setLoginPopup(popup);

    // Quando o popup fechar, recarrega o iframe
    const interval = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(interval);
        setLoginPopup(null);
        setIframeKey((k) => k + 1); // recarrega iframe
      }
    }, 800);
  };

  const reloadIframe = () => setIframeKey((k) => k + 1);

  const currentProvider = PROVIDERS.find((p) => p.value === selectedProvider);

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        {/* Guia simplificado */}
        <div className="rounded-xl border border-border/50 bg-card-elevated p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Como usar o ChatGPT / Claude dentro do Zayon</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2 rounded-lg bg-background/60 p-3 border border-border/40">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px] shrink-0 mt-0.5">1</span>
              <span>Selecione o provedor (ChatGPT, Claude, Gemini) e clique em <strong className="text-foreground">Login em Popup</strong>.</span>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-background/60 p-3 border border-border/40">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px] shrink-0 mt-0.5">2</span>
              <span>Faça login normalmente na janela que abrir (Google, Apple, e-mail — tudo funciona no popup).</span>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-background/60 p-3 border border-border/40">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px] shrink-0 mt-0.5">3</span>
              <span>Feche o popup. O embed abaixo recarrega automaticamente com a sessão ativa.</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/70 border-t border-border/40 pt-2">
            ⚡ Se o iframe ainda bloquear após o login, instale a extensão{" "}
            <a
              href="https://chromewebstore.google.com/detail/ignore-x-frame-options-he/glechfehkchbkchbocgoeciponldbego"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary hover:opacity-80"
            >
              Ignore X-Frame-Options
            </a>
            {" "}no Chrome e clique em{" "}
            <button onClick={reloadIframe} className="underline text-primary hover:opacity-80">Recarregar iframe</button>.
          </p>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground">Provedor</label>
            <select
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus:border-primary transition"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 flex-[2] min-w-[260px]">
            <label className="text-xs font-medium text-muted-foreground">URL do Chat</label>
            <input
              type="text"
              value={embedUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus:border-primary transition"
              placeholder="Cole a URL do ChatGPT, Claude ou de um Custom GPT..."
            />
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="gradient"
              className="h-10 whitespace-nowrap"
              onClick={openLoginPopup}
              disabled={!embedUrl && !currentProvider?.loginUrl}
            >
              {loginPopup && !loginPopup.closed ? "⏳ Aguardando login..." : "🔐 Login em Popup"}
            </Button>
            <Button
              variant="outline"
              className="h-10"
              onClick={reloadIframe}
              title="Recarregar iframe"
            >
              ↻
            </Button>
            <Button
              variant="outline"
              className="h-10 whitespace-nowrap"
              onClick={() => window.open(embedUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Iframe */}
        <div className="relative rounded-xl border border-border/60 bg-black/30 overflow-hidden shadow-glow">
          {loginPopup && !loginPopup.closed && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-3">
              <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Aguardando conclusão do login no popup...</p>
              <Button variant="outline" size="sm" onClick={() => { loginPopup?.focus(); }}>
                Focar no popup
              </Button>
            </div>
          )}
          <iframe
            key={iframeKey}
            src={embedUrl || "about:blank"}
            className="w-full h-[680px] border-none"
            allow="microphone; camera; clipboard-read; clipboard-write; encrypted-media"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          />
        </div>
      </CardContent>
    </Card>
  );
}


