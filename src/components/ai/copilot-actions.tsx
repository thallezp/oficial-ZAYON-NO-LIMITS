"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { toast } from "sonner";

/**
 * Registra as ações que o CopilotKit pode invocar no runtime de IA.
 *
 * Este componente só pode ser montado dentro de um `<CopilotKit>` provider —
 * `useCopilotAction` faz throw "must be used within CopilotKitProvider" caso
 * contrário. Por isso o Providers só o renderiza quando NEXT_PUBLIC_ENABLE_COPILOT
 * está ativo.
 */
export function CopilotActionsRegistry() {
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
      toast.success("Copilot · tarefa criada", {
        description: `${title} · ${priority ?? "medium"} · ${dueAt ?? "sem prazo"}`,
      });
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
      toast.success("Copilot · lead qualificado", {
        description: `${leadName} · score ${score} · ${reason}`,
      });
    },
  });

  return null;
}
