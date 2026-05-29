import { streamText, zodSchema } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { db } from "@/lib/db";
import * as s from "@/drizzle/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export const maxDuration = 30;

const zs = zodSchema as any;

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

/**
 * Cria o registro inicial de ai_actions (status running) ou retorna um
 * "proposal" que aguarda confirmação do usuário (status queued + flag no input).
 *
 * Quando `requiresConfirmation === true`, NÃO executa a mutação: apenas grava
 * o que seria feito e devolve a proposta. O front renderiza um card de
 * confirmação que dispara POST /api/ai/confirm.
 */
async function executeWithLogging(
  workspaceId: string,
  personaId: string | null,
  toolName: string,
  args: any,
  executeFn: () => Promise<any>,
  options: { requiresConfirmation?: boolean; summary?: string } = {},
) {
  if (options.requiresConfirmation) {
    const [aiAction] = await db
      .insert(s.aiActions)
      .values({
        workspaceId,
        personaId: personaId || null,
        name: toolName,
        description:
          options.summary ||
          `IA solicita confirmação para executar ${toolName}`,
        status: "queued",
        input: { ...args, __awaitingConfirmation: true },
      })
      .returning();

    return {
      __awaitingConfirmation: true,
      actionId: aiAction.id,
      toolName,
      args,
      summary:
        options.summary || `Confirme para executar a ação ${toolName}.`,
    };
  }

  const [aiAction] = await db
    .insert(s.aiActions)
    .values({
      workspaceId,
      personaId: personaId || null,
      name: toolName,
      description: `Ação da IA acionada via chat`,
      status: "running",
      input: args,
      startedAt: new Date(),
    })
    .returning();

  try {
    const result = await executeFn();

    await db
      .update(s.aiActions)
      .set({
        status: "completed",
        output: result,
        finishedAt: new Date(),
      })
      .where(eq(s.aiActions.id, aiAction.id));

    await db.insert(s.aiToolCalls).values({
      actionId: aiAction.id,
      toolName,
      args,
      result,
    });

    await db.insert(s.activityLogs).values({
      workspaceId,
      personaId: personaId || null,
      action: `ai_${toolName}`,
      actorType: "ai",
      entityType: toolName.replace(/^create|^update|^qualify/i, "").toLowerCase() || null,
      entityId: result?.id ? String(result.id) : null,
      payload: result,
    });

    return { __completed: true, actionId: aiAction.id, result };
  } catch (err: any) {
    await db
      .update(s.aiActions)
      .set({
        status: "failed",
        error: err.message || String(err),
        finishedAt: new Date(),
      })
      .where(eq(s.aiActions.id, aiAction.id));

    await db.insert(s.aiToolCalls).values({
      actionId: aiAction.id,
      toolName,
      args,
      error: err.message || String(err),
    });

    throw err;
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const { messages, workspaceId, personaId } = await req.json();

  const wsId = workspaceId || "11111111-1111-1111-1111-111111111111";
  const persId = personaId || null;

  let provider: any = null;
  let modelName = "";

  if (process.env.OPENAI_API_KEY) {
    provider = openai;
    modelName = "gpt-4o";
  } else if (process.env.ANTHROPIC_API_KEY) {
    provider = anthropic;
    modelName = "claude-3-5-sonnet-20240620";
  } else if (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY
  ) {
    provider = google;
    modelName = "gemini-1.5-pro";
  }

  if (!provider) {
    return new Response(
      JSON.stringify({
        error:
          "Nenhuma chave de API configurada para OpenAI, Claude ou Gemini nas variáveis de ambiente.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const systemPrompt = `Você é a ZAYON AI, assistente integrada ao Workspace OS.
Contexto Operacional:
- Workspace ID: ${wsId}
- Persona ID: ${persId || "nenhuma"}

Instruções:
- Seja extremamente conciso, profissional, objetivo e focado na produtividade.
- Você tem acesso a ferramentas de banco reais. SEMPRE chame a tool apropriada quando o usuário pedir para criar, agendar, registrar, qualificar, gerar, resumir, analisar ou planejar.
- Toda execução é persistida em ai_actions + ai_tool_calls + activity_logs.
- Para ações destrutivas (qualifyLead, createLaunchPlan, insightToTask, createFunnelNode), a tool retorna __awaitingConfirmation: peça brevemente para o usuário confirmar pelo card que apareceu.
- Quando uma tool retornar __completed: true, confirme o sucesso em uma linha e descreva o que foi criado.
- Para qualifyLead e ações sobre entidades, peça o ID se não estiver no contexto.
- Escreva em português.`;

  try {
    const result = await streamText({
      model: provider(modelName),
      system: systemPrompt,
      messages,
      tools: {
        // ====================================================================
        // CRIAÇÃO BÁSICA (sem confirmação - criar é seguro)
        // ====================================================================
        createTask: {
          description: "Cria uma nova tarefa no workspace ativo",
          inputSchema: zs(z.object({
            title: z.string().describe("Título da tarefa"),
            description: z.string().optional().describe("Descrição da tarefa"),
            priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
            status: z.enum(["backlog", "todo", "doing", "review", "done"]).optional().default("todo"),
            dueAt: z.string().optional().describe("ISO date opcional"),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "createTask", args, async () => {
              const [task] = await db
                .insert(s.tasks)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  title: args.title,
                  description: args.description || null,
                  status: args.status as any,
                  priority: args.priority as any,
                  dueAt: args.dueAt ? new Date(args.dueAt) : null,
                })
                .returning();
              return task;
            });
          },
        } as any,

        createDocument: {
          description: "Cria um novo documento ou página de wiki/playbook",
          inputSchema: zs(z.object({
            title: z.string().describe("Título do documento"),
            content: z.string().describe("Conteúdo em markdown ou texto"),
            emoji: z.string().optional().default("📄"),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "createDocument", args, async () => {
              const [doc] = await db
                .insert(s.documents)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  title: args.title,
                  content: args.content,
                  emoji: args.emoji,
                  type: "doc",
                })
                .returning();
              return doc;
            });
          },
        } as any,

        createContent: {
          description: "Cria um planejamento de post ou roteiro para redes sociais",
          inputSchema: zs(z.object({
            title: z.string(),
            channel: z.enum(["instagram", "tiktok", "youtube", "whatsapp", "email", "telegram"]),
            contentType: z.enum(["reel", "feed", "carousel", "story", "short", "video", "post", "email", "live", "ad"]),
            caption: z.string().optional(),
            script: z.string().optional(),
            pillar: z.enum(["attraction", "educational", "tips", "opinion", "neutral", "offer", "authority", "behind"]).optional(),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "createContent", args, async () => {
              const [content] = await db
                .insert(s.contentItems)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  title: args.title,
                  channel: args.channel as any,
                  contentType: args.contentType as any,
                  caption: args.caption || null,
                  script: args.script || null,
                  pillar: args.pillar as any || null,
                  status: "idea",
                })
                .returning();
              return content;
            });
          },
        } as any,

        createLead: {
          description: "Adiciona um novo lead no CRM de vendas",
          inputSchema: zs(z.object({
            name: z.string(),
            email: z.string().email().optional(),
            phone: z.string().optional(),
            instagram: z.string().optional(),
            notes: z.string().optional(),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "createLead", args, async () => {
              const [lead] = await db
                .insert(s.leads)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  name: args.name,
                  email: args.email || null,
                  phone: args.phone || null,
                  instagram: args.instagram || null,
                  notes: args.notes || null,
                  status: "open",
                })
                .returning();
              return lead;
            });
          },
        } as any,

        createFinancial: {
          description: "Registra uma transação financeira",
          inputSchema: zs(z.object({
            type: z.enum(["revenue", "expense"]),
            amount: z.number(),
            description: z.string(),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "createFinancial", args, async () => {
              const [tx] = await db
                .insert(s.financialTransactions)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  type: args.type as any,
                  amount: args.amount.toString(),
                  description: args.description,
                  status: "paid",
                  occurredAt: new Date(),
                })
                .returning();
              return tx;
            });
          },
        } as any,

        createCalendarEvent: {
          description: "Cria um compromisso na agenda",
          inputSchema: zs(z.object({
            title: z.string(),
            description: z.string().optional(),
            startAt: z.string().describe("ISO datetime"),
            endAt: z.string().optional(),
            category: z.string().optional().default("meeting"),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "createCalendarEvent", args, async () => {
              const [evt] = await db
                .insert(s.calendarEvents)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  title: args.title,
                  description: args.description || null,
                  startAt: new Date(args.startAt),
                  endAt: args.endAt ? new Date(args.endAt) : null,
                  category: args.category || "meeting",
                })
                .returning();
              return evt;
            });
          },
        } as any,

        createHook: {
          description: "Salva um hook no Banco de Hooks da persona ativa",
          inputSchema: zs(z.object({
            text: z.string(),
            category: z.enum(["educational", "objection", "authority", "pain", "curiosity", "contrast", "custom"]).optional().default("custom"),
            tag: z.string().optional(),
            notes: z.string().optional(),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "createHook", args, async () => {
              const [hook] = await db
                .insert(s.contentHooks)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  text: args.text,
                  category: args.category ?? "custom",
                  tag: args.tag || null,
                  notes: args.notes || null,
                })
                .returning();
              return hook;
            });
          },
        } as any,

        // ====================================================================
        // GERAÇÃO DE TEXTO (criativo - salva como sales_copy / hook / content)
        // ====================================================================

        generateScript: {
          description:
            "Gera um roteiro completo (hook + cenas + CTA) e salva como rascunho em conteúdo",
          inputSchema: zs(z.object({
            title: z.string(),
            channel: z.enum(["instagram", "tiktok", "youtube"]).default("instagram"),
            contentType: z.enum(["reel", "story", "short", "video", "carousel"]).default("reel"),
            theme: z.string().describe("Tema central do roteiro"),
            hook: z.string().describe("Hook inicial"),
            scenes: z.array(z.string()).describe("Lista ordenada de cenas/momentos"),
            cta: z.string().describe("Call to action final"),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "generateScript", args, async () => {
              const scriptText = [
                `🎬 ${args.title}`,
                `\n🪝 HOOK: ${args.hook}`,
                "\n📍 CENAS:",
                ...args.scenes.map((s: string, i: number) => `${i + 1}. ${s}`),
                `\n🎯 CTA: ${args.cta}`,
              ].join("\n");
              const [content] = await db
                .insert(s.contentItems)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  title: args.title,
                  channel: args.channel as any,
                  contentType: args.contentType as any,
                  hook: args.hook,
                  script: scriptText,
                  status: "scripted",
                })
                .returning();
              return content;
            });
          },
        } as any,

        generateCaption: {
          description: "Gera uma legenda otimizada e anexa ao conteúdo informado (ou cria um novo)",
          inputSchema: zs(z.object({
            contentId: z.string().optional().describe("UUID do content_item existente"),
            caption: z.string(),
            title: z.string().optional().describe("Título se for criar novo"),
            channel: z.enum(["instagram", "tiktok", "youtube", "whatsapp", "email", "telegram"]).optional().default("instagram"),
            contentType: z.enum(["reel", "feed", "carousel", "story", "short", "video", "post"]).optional().default("post"),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "generateCaption", args, async () => {
              if (args.contentId) {
                const [updated] = await db
                  .update(s.contentItems)
                  .set({ caption: args.caption, updatedAt: new Date() })
                  .where(eq(s.contentItems.id, args.contentId))
                  .returning();
                return updated;
              }
              const [content] = await db
                .insert(s.contentItems)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  title: args.title || "Legenda gerada pela IA",
                  channel: args.channel as any,
                  contentType: args.contentType as any,
                  caption: args.caption,
                  status: "idea",
                })
                .returning();
              return content;
            });
          },
        } as any,

        generateCopy: {
          description:
            "Gera uma copy de venda (anúncio, email, página) e salva em sales_copies",
          inputSchema: zs(z.object({
            title: z.string(),
            body: z.string(),
            type: z.enum(["ad", "email", "page", "vsl", "sms", "whatsapp"]).default("ad"),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "generateCopy", args, async () => {
              const [copy] = await db
                .insert(s.salesCopies)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  title: args.title,
                  body: args.body,
                  type: args.type,
                  status: "draft",
                })
                .returning();
              return copy;
            });
          },
        } as any,

        generateHook: {
          description: "Gera um hook tático e salva no banco de hooks",
          inputSchema: zs(z.object({
            text: z.string(),
            category: z.enum(["educational", "objection", "authority", "pain", "curiosity", "contrast", "custom"]).default("custom"),
            tag: z.string().optional(),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "generateHook", args, async () => {
              const [hook] = await db
                .insert(s.contentHooks)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  text: args.text,
                  category: args.category,
                  tag: args.tag || "IA",
                })
                .returning();
              return hook;
            });
          },
        } as any,

        // ====================================================================
        // ANÁLISE / SÍNTESE
        // ====================================================================

        summarizeDocument: {
          description:
            "Lê um documento existente e salva uma versão resumida como novo documento (3-7 bullets)",
          inputSchema: zs(z.object({
            documentId: z.string().describe("UUID do documento a resumir"),
            summary: z.string().describe("Resumo curto produzido pela IA (bullets ou parágrafo)"),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "summarizeDocument", args, async () => {
              const [source] = await db
                .select()
                .from(s.documents)
                .where(eq(s.documents.id, args.documentId))
                .limit(1);
              if (!source) throw new Error("Documento não encontrado");
              const [newDoc] = await db
                .insert(s.documents)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  title: `Resumo · ${source.title}`,
                  summary: args.summary,
                  content: args.summary,
                  emoji: "📝",
                  type: "summary",
                  parentId: source.id,
                })
                .returning();
              return newDoc;
            });
          },
        } as any,

        analyzeMetrics: {
          description:
            "Analisa métricas recentes (conteúdo, leads, financeiro) e salva um insight estruturado",
          inputSchema: zs(z.object({
            scope: z.enum(["content", "leads", "finance", "overall"]).default("overall"),
            insight: z.string().describe("Insight estruturado em 3-5 frases"),
            recommendation: z.string().describe("Próxima ação recomendada"),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "analyzeMetrics", args, async () => {
              const [log] = await db
                .insert(s.activityLogs)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  action: "ai_metrics_analysis",
                  actorType: "ai",
                  entityType: "metrics",
                  payload: {
                    scope: args.scope,
                    insight: args.insight,
                    recommendation: args.recommendation,
                  },
                })
                .returning();
              return log;
            });
          },
        } as any,

        addActivityInsight: {
          description: "Registra um insight estratégico no audit log",
          inputSchema: zs(z.object({
            insight: z.string(),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "addActivityInsight", args, async () => {
              const [log] = await db
                .insert(s.activityLogs)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  action: "ai_insight_registered",
                  actorType: "ai",
                  entityType: "insight",
                  payload: { insight: args.insight },
                })
                .returning();
              return log;
            });
          },
        } as any,

        // ====================================================================
        // SUGESTÃO (somente lê / propõe - sem mutação)
        // ====================================================================

        suggestTool: {
          description:
            "Lê o catálogo de tools do workspace e devolve uma sugestão de ferramenta para um objetivo",
          inputSchema: zs(z.object({
            objective: z.string().describe("Objetivo do usuário"),
            rationale: z.string().describe("Justificativa curta"),
            preferredToolId: z.string().optional().describe("UUID de tool sugerida, se aplicável"),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "suggestTool", args, async () => {
              const catalog = await db
                .select({
                  id: s.tools.id,
                  name: s.tools.name,
                  url: s.tools.url,
                })
                .from(s.tools)
                .where(eq(s.tools.workspaceId, wsId))
                .limit(50);
              const picked = args.preferredToolId
                ? catalog.find((t: any) => t.id === args.preferredToolId)
                : null;
              return {
                objective: args.objective,
                rationale: args.rationale,
                suggestion: picked,
                catalogSize: catalog.length,
              };
            });
          },
        } as any,

        improvePrompt: {
          description:
            "Recebe um prompt cru e devolve uma versão melhorada (sem salvar). O usuário decide se vira prompt chain.",
          inputSchema: zs(z.object({
            original: z.string(),
            improved: z.string(),
            notes: z.string().optional(),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "improvePrompt", args, async () => {
              return {
                original: args.original,
                improved: args.improved,
                notes: args.notes || null,
              };
            });
          },
        } as any,

        // ====================================================================
        // DESTRUTIVAS / IMPORTANTES → requerem confirmação
        // ====================================================================

        qualifyLead: {
          description:
            "Qualifica um lead: atualiza score 0-100 + status + nota. REQUER CONFIRMAÇÃO DO USUÁRIO.",
          inputSchema: zs(z.object({
            leadId: z.string(),
            score: z.number().min(0).max(100),
            rationale: z.string(),
            status: z.enum(["open", "approached", "qualified", "converted", "lost", "no_response"]).optional(),
          })),
          execute: async (args: any) => {
            return executeWithLogging(
              wsId,
              persId,
              "qualifyLead",
              args,
              async () => {
                const patch: any = {
                  score: args.score,
                  notes: args.rationale,
                  updatedAt: new Date(),
                };
                if (args.status) patch.status = args.status;
                const [updated] = await db
                  .update(s.leads)
                  .set(patch)
                  .where(eq(s.leads.id, args.leadId))
                  .returning();
                return updated;
              },
              {
                requiresConfirmation: true,
                summary: `Qualificar lead ${args.leadId} com score ${args.score} (${args.status || "sem mudar status"}).`,
              },
            );
          },
        } as any,

        createFunnelNode: {
          description:
            "Cria um novo nó dentro de um funil de vendas. REQUER CONFIRMAÇÃO.",
          inputSchema: zs(z.object({
            funnelId: z.string().describe("UUID do funnel"),
            nodeType: z.enum([
              "content", "direct", "whatsapp", "landing", "checkout",
              "email", "community", "call", "webinar", "live", "remarketing", "custom",
            ]).default("custom"),
            title: z.string(),
            description: z.string().optional(),
          })),
          execute: async (args: any) => {
            return executeWithLogging(
              wsId,
              persId,
              "createFunnelNode",
              args,
              async () => {
                const [node] = await db
                  .insert(s.funnelNodes)
                  .values({
                    funnelId: args.funnelId,
                    nodeType: args.nodeType as any,
                    title: args.title,
                    description: args.description || null,
                    position: { x: 0, y: 0 },
                    data: {},
                  })
                  .returning();
                return node;
              },
              {
                requiresConfirmation: true,
                summary: `Adicionar nó "${args.title}" (${args.nodeType}) no funil ${args.funnelId}.`,
              },
            );
          },
        } as any,

        createLaunchPlan: {
          description:
            "Monta um plano de lançamento (campanha + N eventos). REQUER CONFIRMAÇÃO porque cria múltiplos registros.",
          inputSchema: zs(z.object({
            name: z.string(),
            description: z.string().optional(),
            goal: z.string().optional(),
            startsAt: z.string().describe("ISO date"),
            endsAt: z.string().describe("ISO date"),
            events: z.array(z.object({
              title: z.string(),
              description: z.string().optional(),
              startAt: z.string(),
              endAt: z.string().optional(),
              type: z.string().optional(),
            })),
          })),
          execute: async (args: any) => {
            return executeWithLogging(
              wsId,
              persId,
              "createLaunchPlan",
              args,
              async () => {
                const [campaign] = await db
                  .insert(s.launchCampaigns)
                  .values({
                    workspaceId: wsId,
                    personaId: persId || null,
                    name: args.name,
                    description: args.description || null,
                    goal: args.goal || null,
                    startsAt: args.startsAt,
                    endsAt: args.endsAt,
                    status: "planning",
                  })
                  .returning();
                const events = await Promise.all(
                  args.events.map((evt: any) =>
                    db
                      .insert(s.launchEvents)
                      .values({
                        campaignId: campaign.id,
                        title: evt.title,
                        description: evt.description || null,
                        startAt: new Date(evt.startAt),
                        endAt: evt.endAt ? new Date(evt.endAt) : null,
                        type: evt.type || "milestone",
                      })
                      .returning()
                      .then((rows: any[]) => rows[0]),
                  ),
                );
                return { campaign, events, count: events.length };
              },
              {
                requiresConfirmation: true,
                summary: `Criar campanha "${args.name}" com ${args.events.length} eventos (${args.startsAt} → ${args.endsAt}).`,
              },
            );
          },
        } as any,

        insightToTask: {
          description:
            "Transforma um insight estratégico em uma tarefa acionável. REQUER CONFIRMAÇÃO.",
          inputSchema: zs(z.object({
            insight: z.string(),
            taskTitle: z.string(),
            taskDescription: z.string().optional(),
            priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
            dueAt: z.string().optional(),
          })),
          execute: async (args: any) => {
            return executeWithLogging(
              wsId,
              persId,
              "insightToTask",
              args,
              async () => {
                const [task] = await db
                  .insert(s.tasks)
                  .values({
                    workspaceId: wsId,
                    personaId: persId || null,
                    title: args.taskTitle,
                    description: `${args.taskDescription || ""}\n\n💡 Insight base: ${args.insight}`.trim(),
                    priority: args.priority as any,
                    status: "todo",
                    dueAt: args.dueAt ? new Date(args.dueAt) : null,
                    labels: ["IA", "insight"],
                  })
                  .returning();
                await db.insert(s.activityLogs).values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  action: "ai_insight_to_task",
                  actorType: "ai",
                  entityType: "task",
                  entityId: task.id,
                  payload: { insight: args.insight, taskId: task.id },
                });
                return task;
              },
              {
                requiresConfirmation: true,
                summary: `Transformar insight em tarefa "${args.taskTitle}" (${args.priority}).`,
              },
            );
          },
        } as any,
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || "Erro durante a execução do LLM",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

// Suprime warning de import não usado (drizzle helpers podem ser usados em
// queries futuras dentro deste arquivo)
void and;
void desc;
void gte;
void sql;
