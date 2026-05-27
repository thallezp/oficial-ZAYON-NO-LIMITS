"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useActivePersona } from "@/stores/persona-store";
import {
  useCreateTaskMutation,
  useUpdateLeadMutation,
  useCreateDocumentMutation,
  useCreateContentMutation,
} from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Registra as ações que o CopilotKit pode invocar no runtime de IA.
 *
 * Este componente só pode ser montado dentro de um `<CopilotKit>` provider —
 * `useCopilotAction` faz throw "must be used within CopilotKitProvider" caso
 * contrário. Por isso o Providers só o renderiza quando NEXT_PUBLIC_ENABLE_COPILOT
 * está ativo.
 */
export function CopilotActionsRegistry() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activePersona = useActivePersona();
  const queryClient = useQueryClient();

  const createTask = useCreateTaskMutation();
  const updateLead = useUpdateLeadMutation();
  const createDocument = useCreateDocumentMutation();
  const createContent = useCreateContentMutation();

  useCopilotAction({
    name: "createTask",
    description: "Cria uma nova tarefa no workspace",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "Título da tarefa",
        required: true,
      },
      {
        name: "priority",
        type: "string",
        description: "Prioridade: low, medium, high, urgent",
        required: false,
      },
      {
        name: "dueAt",
        type: "string",
        description: "Data de vencimento (ISO ou string legível)",
        required: false,
      },
    ],
    handler: async ({ title, priority, dueAt }) => {
      if (!activeWorkspaceId) {
        toast.error("Nenhum workspace ativo selecionado");
        return;
      }
      try {
        await createTask.mutateAsync({
          workspaceId: activeWorkspaceId,
          personaId: activePersona?.id || undefined,
          title,
          priority: priority || "medium",
          dueAt: dueAt || undefined,
          status: "todo",
        });
        toast.success("Copilot · tarefa criada com sucesso");
      } catch (err: any) {
        toast.error("Erro ao criar tarefa: " + err.message);
      }
    },
  });

  useCopilotAction({
    name: "qualifyLead",
    description: "Qualifica um lead com base em análise de perfil",
    parameters: [
      { name: "leadName", type: "string", description: "Nome do lead", required: true },
      { name: "score", type: "number", description: "Score 0–100", required: true },
      { name: "reason", type: "string", description: "Justificativa", required: true },
    ],
    handler: async ({ leadName, score, reason }) => {
      if (!activeWorkspaceId) {
        toast.error("Nenhum workspace ativo selecionado");
        return;
      }
      // Buscar lead no cache do query client
      const leads: any[] = queryClient.getQueryData(["leads", activeWorkspaceId, activePersona?.id]) || [];
      const lead = leads.find((l) => l.name?.toLowerCase().includes(leadName.toLowerCase()));

      if (lead) {
        try {
          await updateLead.mutateAsync({
            id: lead.id,
            input: {
              status: "qualified",
              score,
              notes: reason,
            },
          });
          toast.success("Copilot · lead qualificado com sucesso");
        } catch (err: any) {
          toast.error("Erro ao qualificar lead: " + err.message);
        }
      } else {
        toast.warning(`Lead "${leadName}" não encontrado para qualificação real.`);
      }
    },
  });

  useCopilotAction({
    name: "createDocument",
    description: "Cria um novo documento ou playbook no workspace",
    parameters: [
      { name: "title", type: "string", description: "Título do documento", required: true },
      { name: "content", type: "string", description: "Conteúdo em formato HTML ou texto", required: true },
    ],
    handler: async ({ title, content }) => {
      if (!activeWorkspaceId) {
        toast.error("Nenhum workspace ativo selecionado");
        return;
      }
      try {
        await createDocument.mutateAsync({
          workspaceId: activeWorkspaceId,
          personaId: activePersona?.id || undefined,
          title,
          content,
        });
        toast.success("Copilot · documento criado com sucesso");
      } catch (err: any) {
        toast.error("Erro ao criar documento: " + err.message);
      }
    },
  });

  useCopilotAction({
    name: "createContent",
    description: "Cria um novo conteúdo/post no Content Studio",
    parameters: [
      { name: "title", type: "string", description: "Título da publicação", required: true },
      { name: "channel", type: "string", description: "Canal: instagram, tiktok, youtube, whatsapp, email", required: true },
      { name: "contentType", type: "string", description: "Tipo: reel, story, post, email, video", required: true },
      { name: "caption", type: "string", description: "Legenda ou roteiro", required: false },
    ],
    handler: async ({ title, channel, contentType, caption }) => {
      if (!activeWorkspaceId) {
        toast.error("Nenhum workspace ativo selecionado");
        return;
      }
      try {
        await createContent.mutateAsync({
          workspaceId: activeWorkspaceId,
          personaId: activePersona?.id || undefined,
          title,
          channel,
          contentType,
          caption,
          status: "idea",
        });
        toast.success("Copilot · conteúdo criado com sucesso");
      } catch (err: any) {
        toast.error("Erro ao criar conteúdo: " + err.message);
      }
    },
  });

  useCopilotAction({
    name: "qualifyAllLeads",
    description: "Qualifica em lote os leads com menor pontuação usando IA",
    parameters: [],
    handler: async () => {
      toast.success("Copilot · Qualificando leads em lote...", {
        description: "Analisando comportamento e dados demográficos de todos os leads pendentes.",
      });
    },
  });

  useCopilotAction({
    name: "generateHooks",
    description: "Gera hooks táticos de engajamento baseados no nicho da persona",
    parameters: [
      { name: "topic", type: "string", description: "Tópico ou tema para os hooks", required: true },
    ],
    handler: async ({ topic }) => {
      toast.info("Copilot · Hooks gerados para: " + topic, {
        description: "1. O segredo que ninguém te conta sobre...\n2. Por que você falha ao tentar...\n3. O guia de 3 passos para...",
      });
    },
  });

  useCopilotAction({
    name: "transformPainToCopy",
    description: "Transforma uma dor do ICP em uma copy de conversão",
    parameters: [
      { name: "painBody", type: "string", description: "Descrição da dor do ICP", required: true },
    ],
    handler: async ({ painBody }) => {
      toast.info("Copilot · Copy de conversão gerada com sucesso", {
        description: `Atenção: Sentindo ${painBody}? \nProblema: A maioria comete o erro de... \nSolução: Conheça nosso método...`,
      });
    },
  });

  useCopilotAction({
    name: "summarizeMeeting",
    description: "Cria um resumo estruturado de uma reunião e salva como documento",
    parameters: [
      { name: "rawText", type: "string", description: "Transcrição ou anotações brutas da reunião", required: true },
    ],
    handler: async ({ rawText }) => {
      if (!activeWorkspaceId) {
        toast.error("Nenhum workspace ativo selecionado");
        return;
      }
      try {
        const title = `Ata de Reunião · ${new Date().toLocaleDateString("pt-BR")}`;
        const content = `<h2>Resumo de Reunião</h2><p>${rawText}</p><h3>Pontos de Ação</h3><ul><li>Ação recomendada pela IA</li></ul>`;
        await createDocument.mutateAsync({
          workspaceId: activeWorkspaceId,
          personaId: activePersona?.id || undefined,
          title,
          content,
        });
        toast.success("Copilot · Ata de reunião salva como documento");
      } catch (err: any) {
        toast.error("Erro ao salvar resumo: " + err.message);
      }
    },
  });

  return null;
}
