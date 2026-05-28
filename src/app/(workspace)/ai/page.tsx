"use client";

import * as React from "react";
import {
  AlertTriangle,
  Bot,
  ExternalLink,
  History,
  Sparkles,
  Wand2,
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
  },
  {
    value: "claude",
    label: "Claude (Anthropic)",
    url: "https://claude.ai",
    iframeSafe: false,
  },
  {
    value: "gemini",
    label: "Gemini (Google)",
    url: "https://gemini.google.com",
    iframeSafe: false,
  },
  {
    value: "custom",
    label: "URL custom com permissao de embed",
    url: "",
    iframeSafe: true,
  },
] as const;

function ExternalAIEmbed() {
  const [selectedProvider, setSelectedProvider] = React.useState<string>("chatgpt");
  const [externalUrl, setExternalUrl] = React.useState<string>("https://chatgpt.com");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const savedProvider =
      localStorage.getItem("zayon.ai.externalProvider") || "chatgpt";
    const savedUrl = localStorage.getItem("zayon.ai.externalUrl") || "";
    const provider = providers.find((item) => item.value === savedProvider);

    setSelectedProvider(savedProvider);
    setExternalUrl(savedUrl || provider?.url || "https://chatgpt.com");
  }, []);

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

  const openExternalUrl = () => {
    const url = externalUrl.trim();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-2 rounded-xl border border-warning/30 bg-warning/5 p-4 text-warning/90">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Login oficial em iframe nao e suportado
          </p>
          <p className="text-xs leading-relaxed">
            ChatGPT, Claude e Gemini bloqueiam login dentro de iframes por CSP,
            cookies de terceiros e protecao anti-clickjacking. Por isso o fluxo
            confiavel e abrir o provedor em uma aba dedicada. Para a IA operar o
            Zayon de verdade, use o Agente Nativo/CopilotKit com API.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4 rounded-xl border border-border/60 bg-card-elevated p-4">
            <div>
              <p className="text-sm font-semibold">Provedor externo</p>
              <p className="text-xs text-muted-foreground">
                Abra sua conta pessoal em uma aba segura do navegador.
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

            <Button
              variant="gradient"
              className="w-full"
              onClick={openExternalUrl}
              disabled={!externalUrl.trim()}
            >
              <ExternalLink className="h-4 w-4" />
              Abrir e fazer login
            </Button>
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-background/40 p-4">
            <p className="text-sm font-semibold">Operacao recomendada no Zayon</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 bg-card/60 p-3">
                <p className="text-xs font-medium">Agente Nativo</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use o painel do Zayon para criar tarefas, leads, documentos e
                  conteudos com logs em ai_actions.
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-card/60 p-3">
                <p className="text-xs font-medium">Custom GPT / Claude Project</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Configure uma API/Webhook do Zayon para acesso real aos dados,
                  em vez de tentar autenticar um provedor externo dentro do iframe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {canEmbed ? (
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-black/30 shadow-glow">
            <iframe
              src={externalUrl}
              className="h-[680px] w-full border-none"
              allow="microphone; camera; clipboard-read; clipboard-write; encrypted-media"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            />
          </div>
        ) : (
          <EmptyState
            icon={<ExternalLink className="h-5 w-5" />}
            title="Embed desativado para provedores oficiais"
            description="Abra ChatGPT, Claude ou Gemini em nova aba para fazer login. O iframe fica disponivel apenas para URLs custom que permitam embed."
            action={
              <Button
                variant="gradient"
                onClick={openExternalUrl}
                disabled={!externalUrl.trim()}
              >
                Abrir em nova aba
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
