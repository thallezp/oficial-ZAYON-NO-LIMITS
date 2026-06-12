"use client";

import Link from "next/link";
import { Bot, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function AIHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI History"
        description="Threads · todo o contexto da IA fica salvo e retomável a qualquer momento."
      />

      <EmptyState
        icon={<Bot className="h-5 w-5" />}
        title="Nenhuma conversa salva ainda"
        description="As conversas com o assistente aparecem aqui quando o histórico em nuvem estiver ativo. Por enquanto, o histórico fica no seu navegador, dentro do próprio chat."
        action={
          <Button variant="gradient" size="sm" asChild>
            <Link href="/ai">
              <MessageSquare className="h-3.5 w-3.5" /> Abrir AI Assistant
            </Link>
          </Button>
        }
      />
    </div>
  );
}
