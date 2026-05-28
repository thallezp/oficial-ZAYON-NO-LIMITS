import { streamText, zodSchema } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { db } from "@/lib/db";
import * as s from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 30;

const zs = zodSchema as any;

// Função auxiliar para rodar a operação do banco registrando logs de auditoria e status da IA
async function executeWithLogging(
  workspaceId: string,
  personaId: string | null,
  toolName: string,
  args: any,
  executeFn: () => Promise<any>
) {
  // 1. Registrar início da ação da IA
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
    // 2. Executar a ação de banco real
    const result = await executeFn();

    // 3. Registrar sucesso da ação da IA
    await db
      .update(s.aiActions)
      .set({
        status: "completed",
        output: result,
        finishedAt: new Date(),
      })
      .where(eq(s.aiActions.id, aiAction.id));

    // 4. Registrar a chamada da ferramenta
    await db.insert(s.aiToolCalls).values({
      actionId: aiAction.id,
      toolName,
      args,
      result,
    });

    // 5. Registrar no log de atividades geral do workspace
    await db.insert(s.activityLogs).values({
      workspaceId,
      personaId: personaId || null,
      action: `ai_${toolName}`,
      entityType: toolName.replace("create", "").toLowerCase(),
      entityId: result?.id ? String(result.id) : null,
      payload: result,
    });

    return result;
  } catch (err: any) {
    // Registrar erro no painel
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

export async function POST(req: Request) {
  const { messages, workspaceId, personaId } = await req.json();

  const wsId = workspaceId || "11111111-1111-1111-1111-111111111111"; // fallback padrão para o seed
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
- Você tem acesso a ferramentas de banco reais para criar tarefas, documentos, planejar posts, registrar leads, finanças e compromissos. Use-as sempre que o usuário pedir para criar, agendar ou registrar algo.
- Escreva em português.`;

  try {
    const result = await streamText({
      model: provider(modelName),
      system: systemPrompt,
      messages,
      tools: {
        createTask: {
          description: "Cria uma nova tarefa no workspace ativo",
          inputSchema: zs(z.object({
            title: z.string().describe("Título da tarefa"),
            description: z.string().optional().describe("Descrição da tarefa"),
            priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium").describe("Prioridade da tarefa"),
            status: z.enum(["backlog", "todo", "doing", "review", "done"]).optional().default("todo").describe("Status inicial"),
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
                })
                .returning();
              return task;
            });
          },
        } as any,
        createDocument: {
          description: "Cria um novo documento ou página de wiki/ playbook",
          inputSchema: zs(z.object({
            title: z.string().describe("Título do documento"),
            content: z.string().describe("Conteúdo em formato markdown ou texto puro"),
            emoji: z.string().optional().default("📄").describe("Emoji representativo"),
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
            title: z.string().describe("Título do conteúdo ou tema"),
            channel: z.enum(["instagram", "tiktok", "youtube", "whatsapp", "email", "telegram"]).describe("Canal de publicação"),
            contentType: z.enum(["reel", "feed", "carousel", "story", "short", "video", "post", "email", "live", "ad"]).describe("Formato"),
            caption: z.string().optional().describe("Legenda ou roteiro preliminar"),
            pillar: z.enum(["attraction", "educational", "tips", "opinion", "neutral", "offer", "authority", "behind"]).optional().describe("Pilar tático"),
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
            name: z.string().describe("Nome do contato"),
            email: z.string().email().optional().describe("Email"),
            phone: z.string().optional().describe("WhatsApp ou telefone"),
            instagram: z.string().optional().describe("Usuário do Instagram"),
            notes: z.string().optional().describe("Notas e qualificações adicionais"),
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
          description: "Registra uma transação financeira de receita ou despesa",
          inputSchema: zs(z.object({
            type: z.enum(["revenue", "expense"]).describe("Tipo do lançamento"),
            amount: z.number().describe("Valor numérico"),
            description: z.string().describe("Descrição do item"),
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
          description: "Cria um compromisso na agenda do calendário",
          inputSchema: zs(z.object({
            title: z.string().describe("Título do compromisso"),
            description: z.string().optional().describe("Notas extras"),
            startAt: z.string().describe("Data/Hora ISO de início"),
            endAt: z.string().optional().describe("Data/Hora ISO de término"),
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
                })
                .returning();
              return evt;
            });
          },
        } as any,
        addActivityInsight: {
          description: "Registra um insight estratégico no audit log de atividades do workspace",
          inputSchema: zs(z.object({
            insight: z.string().describe("Texto completo do insight"),
          })),
          execute: async (args: any) => {
            return executeWithLogging(wsId, persId, "addActivityInsight", args, async () => {
              const [log] = await db
                .insert(s.activityLogs)
                .values({
                  workspaceId: wsId,
                  personaId: persId || null,
                  action: "ai_insight_registered",
                  entityType: "insight",
                  payload: { insight: args.insight },
                })
                .returning();
              return log;
            });
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

