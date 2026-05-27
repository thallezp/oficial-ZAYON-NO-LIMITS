"use client";

import { Bot, CheckCircle2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MOCK_AI_ACTIONS, MOCK_PERSONAS } from "@/data";
import { useAiActions, usePersonas } from "@/hooks/use-queries";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { relativeTime } from "@/lib/utils/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { AIAction, Persona } from "@/types";

export default function AIActionsPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbActions = [] } = useAiActions(activeWorkspaceId);
  const { data: dbPersonas = [] } = usePersonas(activeWorkspaceId);

  const actions: AIAction[] =
    isMockModeClient && dbActions.length === 0 ? MOCK_AI_ACTIONS : dbActions;
  const personas: Persona[] =
    isMockModeClient && dbPersonas.length === 0 ? MOCK_PERSONAS : dbPersonas;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Actions"
        description="Toda acao executada pela IA gera registro auditavel."
      />

      <Card>
        <CardContent className="p-0 divide-y divide-border/60">
          {actions.length === 0 ? (
            <EmptyState
              icon={<Bot className="h-5 w-5" />}
              title="Nenhuma acao de IA registrada"
              description="Quando o Copilot ou o painel de IA executar tarefas reais, o historico auditavel aparece aqui."
              className="border-0 bg-transparent"
            />
          ) : (
            actions.map((a) => {
              const persona = personas.find((p) => p.id === a.personaId);

              return (
                <div key={a.id} className="flex items-start gap-4 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    {a.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{a.name}</p>
                      <Badge
                        size="sm"
                        variant={a.status === "completed" ? "success" : "warning"}
                      >
                        {a.status}
                      </Badge>
                      {persona && (
                        <Badge size="sm" variant="outline">
                          {persona.name}
                        </Badge>
                      )}
                    </div>
                    {a.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {relativeTime(a.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
