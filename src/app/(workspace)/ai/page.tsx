"use client";

import * as React from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ExternalLink,
  History,
  PictureInPicture2,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_AI_ACTIONS } from "@/data";
import { useAiActions } from "@/hooks/use-queries";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { relativeTime } from "@/lib/utils/format";
import { useActivePersona } from "@/stores/persona-store";
import { useUIStore } from "@/stores/ui-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { AIAction } from "@/types";

const nativeActions = [
  {
    title: "Gerar roteiro de Reel",
    desc: "Hook + 4 cenas + CTA com contexto da persona",
    icon: Sparkles,
  },
  {
    title: "Qualificar leads pendentes",
    desc: "Aplicar score e marcar prioridades no CRM",
    icon: Wand2,
  },
  {
    title: "Resumir reuniao",
    desc: "Decisoes, acoes, blockers e tarefas derivadas",
    icon: Bot,
  },
  {
    title: "Plano de lancamento 30 dias",
    desc: "Cronograma, conteudos, campanhas e KPIs",
    icon: Sparkles,
  },
  {
    title: "Dores ICP para criativos",
    desc: "Transformar dores em hooks de anuncio",
    icon: Wand2,
  },
  {
    title: "Auditar funil",
    desc: "Detectar gargalos e sugerir otimizacoes",
    icon: Bot,
  },
];

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
        description="IA contextual integrada a operacao. Use o agente nativo para agir no Zayon e provedores externos em aba segura."
        badge={
          <Badge variant="primary">
            <Sparkles className="h-3 w-3" />
            contexto: {persona?.name ?? "global"}
          </Badge>
        }
        actions={
          <Button variant="gradient" size="sm" onClick={() => setAIPanelOpen(true)}>
            <Bot className="h-4 w-4" />
            Abrir painel
          </Button>
        }
      />

      <Tabs defaultValue="native" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="native">Agente Nativo</TabsTrigger>
          <TabsTrigger value="external">IAs pessoais</TabsTrigger>
        </TabsList>

        <TabsContent value="native" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {nativeActions.map((action) => (
              <Card
                key={action.title}
                variant="elevated"
                className="group cursor-pointer hover:border-primary/40"
                onClick={() => setAIPanelOpen(true)}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 text-primary">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {action.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle>Historico recente</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cada acao executada pela IA gera registro em{" "}
                  <Badge variant="outline" size="sm">
                    ai_actions
                  </Badge>
                  .
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href="/ai/actions">
                  <History className="h-3.5 w-3.5" />
                  Ver tudo
                </a>
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
                aiActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-card-elevated p-3"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{action.name}</p>
                        <Badge
                          size="sm"
                          variant={
                            action.status === "completed" ? "success" : "warning"
                          }
                        >
                          {action.status}
                        </Badge>
                      </div>
                      {action.description && (
                        <p className="text-[11px] text-muted-foreground">
                          {action.description}
                        </p>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                      {relativeTime(action.createdAt)}
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

const providers = [
  {
    value: "chatgpt",
    label: "ChatGPT (OpenAI)",
    url: "https://chatgpt.com",
    iframeSafe: false,
    description: "Bloqueia iframe — abre em janela ancorada",
  },
  {
    value: "claude",
    label: "Claude (Anthropic)",
    url: "https://claude.ai",
    iframeSafe: false,
    description: "Bloqueia iframe — abre em janela ancorada",
  },
  {
    value: "gemini",
    label: "Gemini (Google)",
    url: "https://gemini.google.com",
    iframeSafe: false,
    description: "Bloqueia iframe — abre em janela ancorada",
  },
  {
    value: "perplexity",
    label: "Perplexity AI",
    url: "https://www.perplexity.ai",
    iframeSafe: true,
    description: "Permite embed direto",
  },
  {
    value: "phind",
    label: "Phind (search AI)",
    url: "https://www.phind.com",
    iframeSafe: true,
    description: "Permite embed direto",
  },
  {
    value: "huggingchat",
    label: "HuggingChat",
    url: "https://huggingface.co/chat",
    iframeSafe: true,
    description: "Open source, permite embed",
  },
  {
    value: "custom",
    label: "URL custom com permissão de embed",
    url: "",
    iframeSafe: true,
    description: "Cole qualquer URL que aceite iframe",
  },
] as const;

/**
 * Abre/foca uma janela popup ancorada para o provedor de IA.
 * O navegador mantém a sessão (cookies de login persistem mesmo após fechar
 * o popup). O usuário loga uma vez e usa a janela ao lado do Zayon.
 */
function openAnchoredWindow(url: string, name: string) {
  if (typeof window === "undefined") return null;
  const w = 480;
  const h = Math.min(window.screen.availHeight - 40, 900);
  // ancora a janela na lateral direita da tela
  const left = window.screen.availWidth - w - 20;
  const top = 40;
  const features = `width=${w},height=${h},left=${left},top=${top},popup=yes,resizable=yes,scrollbars=yes,status=yes,location=yes`;
  return window.open(url, name, features);
}

function ExternalAIEmbed() {
  const [selectedProvider, setSelectedProvider] = React.useState<string>("chatgpt");
  const [externalUrl, setExternalUrl] = React.useState<string>("https://chatgpt.com");
  // window ref pra manter handle e poder focar/checar se fechou
  const popupRef = React.useRef<Window | null>(null);
  const [popupOpen, setPopupOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const savedProvider =
      localStorage.getItem("zayon.ai.externalProvider") || "chatgpt";
    const savedUrl = localStorage.getItem("zayon.ai.externalUrl") || "";
    const provider = providers.find((item) => item.value === savedProvider);
    setSelectedProvider(savedProvider);
    setExternalUrl(savedUrl || provider?.url || "https://chatgpt.com");
  }, []);

  // poll a cada 1s pra detectar se o popup foi fechado pelo usuário
  React.useEffect(() => {
    if (!popupOpen) return;
    const id = setInterval(() => {
      if (popupRef.current?.closed) {
        setPopupOpen(false);
        popupRef.current = null;
      }
    }, 1000);
    return () => clearInterval(id);
  }, [popupOpen]);

  const currentProvider = providers.find((item) => item.value === selectedProvider);
  const canEmbed = Boolean(currentProvider?.iframeSafe && externalUrl.trim());

  const handleProviderChange = (value: string) => {
    const provider = providers.find((item) => item.value === value);
    const nextUrl = provider?.url || "";
    setSelectedProvider(value);
    setExternalUrl(nextUrl);
    localStorage.setItem("zayon.ai.externalProvider", value);
    localStorage.setItem("zayon.ai.externalUrl", nextUrl);
  };

  const handleUrlChange = (value: string) => {
    setExternalUrl(value);
    localStorage.setItem("zayon.ai.externalUrl", value);
  };

  // Abre a janela ancorada. Se já existir e estiver aberta, foca.
  const handleOpenAnchored = () => {
    const url = externalUrl.trim();
    if (!url) return;
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      return;
    }
    const name = `zayon-ai-${selectedProvider}`;
    const w = openAnchoredWindow(url, name);
    if (!w) {
      // popup bloqueado pelo navegador
      return;
    }
    popupRef.current = w;
    setPopupOpen(true);
    w.focus();
  };

  const handleCloseAnchored = () => {
    popupRef.current?.close();
    popupRef.current = null;
    setPopupOpen(false);
  };

  const openInNewTab = () => {
    const url = externalUrl.trim();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        {/* Status da janela ancorada */}
        {popupOpen ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-300">
                {currentProvider?.label} ativo em janela ancorada
              </p>
              <p className="text-[11px] text-emerald-400/70">
                A janela continua aberta enquanto você navega no Zayon. Cookies de
                login persistem se você fechar e reabrir.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenAnchored}>
              <PictureInPicture2 className="h-3.5 w-3.5" /> Focar janela
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseAnchored}
              className="text-destructive"
            >
              <X className="h-3.5 w-3.5" /> Fechar
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-2 text-warning/90">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" />
              ChatGPT, Claude e Gemini não permitem login dentro de iframe
            </p>
            <p className="text-xs leading-relaxed">
              Esses provedores enviam <code>X-Frame-Options: DENY</code> + CSP
              que bloqueia embed por design (anti-clickjacking). A solução é{" "}
              <strong>abrir em janela popup ancorada</strong>: fica do lado direito
              da tela, persiste enquanto você navega no Zayon, e os cookies de
              login ficam salvos no navegador. Outra opção: usar provedores que{" "}
              <strong>permitem embed</strong> (Perplexity, Phind, HuggingChat) →
              esses funcionam direto no iframe abaixo.
            </p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4 rounded-xl border border-border/60 bg-card-elevated p-4">
            <div>
              <p className="text-sm font-semibold">Provedor externo</p>
              <p className="text-xs text-muted-foreground">
                Escolha o provedor. O modo de abertura é automático.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Provedor
              </label>
              <select
                value={selectedProvider}
                onChange={(event) => handleProviderChange(event.target.value)}
                className="h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
              >
                {providers.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
              {currentProvider && (
                <p className="text-[10px] text-muted-foreground">
                  {currentProvider.iframeSafe ? "✓ " : "⚠ "}
                  {currentProvider.description}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                URL
              </label>
              <input
                type="text"
                value={externalUrl}
                onChange={(event) => handleUrlChange(event.target.value)}
                className="h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                placeholder="https://chatgpt.com, https://claude.ai..."
              />
            </div>

            <div className="space-y-2">
              <Button
                variant="gradient"
                className="w-full"
                onClick={handleOpenAnchored}
                disabled={!externalUrl.trim()}
              >
                <PictureInPicture2 className="h-4 w-4" />
                {popupOpen ? "Focar janela ancorada" : "Abrir janela ancorada"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={openInNewTab}
                disabled={!externalUrl.trim()}
              >
                <ExternalLink className="h-4 w-4" />
                Abrir em nova aba
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <strong>Como funciona:</strong> "Janela ancorada" abre uma janela
              de 480px ancorada na lateral direita da tela. Você loga uma vez,
              navega no Zayon do outro lado, e a janela permanece. Se o
              navegador bloquear o popup, libere para este site.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-background/40 p-4">
            <p className="text-sm font-semibold">3 modos de operação</p>
            <div className="space-y-2">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <PictureInPicture2 className="h-3 w-3" /> Janela ancorada (recomendado)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Funciona com ChatGPT, Claude, Gemini e qualquer URL. Mantém
                  login persistente. Fica ao lado do Zayon.
                </p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                <p className="text-xs font-semibold text-primary">
                  Embed direto (iframe)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Funciona apenas com provedores que permitem
                  <code> X-Frame-Options </code>aberto: Perplexity, Phind,
                  HuggingChat, custom URLs.
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-card/60 p-3 space-y-1">
                <p className="text-xs font-semibold">Agente Nativo (API)</p>
                <p className="text-[11px] text-muted-foreground">
                  Aba ao lado: a IA com OpenAI/Anthropic API key opera o Zayon de
                  verdade — cria tarefas, qualifica leads, gera roteiros.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Iframe — só renderiza para provedores embed-friendly */}
        {canEmbed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Embed direto · {currentProvider?.label}
              </p>
              <Button variant="ghost" size="sm" onClick={openInNewTab}>
                <ExternalLink className="h-3 w-3" /> Abrir em aba
              </Button>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-border/60 bg-black/30 shadow-glow">
              <iframe
                src={externalUrl}
                className="h-[680px] w-full border-none"
                allow="microphone; camera; clipboard-read; clipboard-write; encrypted-media"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
              />
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<PictureInPicture2 className="h-5 w-5" />}
            title="Embed iframe não disponível para este provedor"
            description={`${currentProvider?.label ?? "Este site"} bloqueia iframe. Clique em "Abrir janela ancorada" — você loga uma vez e a janela fica ao lado do Zayon enquanto você trabalha.`}
            action={
              <div className="flex items-center gap-2">
                <Button
                  variant="gradient"
                  onClick={handleOpenAnchored}
                  disabled={!externalUrl.trim()}
                >
                  <PictureInPicture2 className="h-4 w-4" /> Abrir janela ancorada
                </Button>
                <Button variant="outline" onClick={openInNewTab}>
                  Abrir em nova aba
                </Button>
              </div>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
