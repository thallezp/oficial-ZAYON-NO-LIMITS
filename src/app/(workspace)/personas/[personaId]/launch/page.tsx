"use client";

import {
  Copy,
  Flame,
  Plus,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { MOCK_ICP_PAINS } from "@/data";

const categoryStyle = {
  pain: "danger",
  frustration: "warning",
  aspiration: "primary",
  objection: "info",
  desire: "success",
  fear: "outline",
} as const;

const labelMap = {
  pain: "Dor",
  frustration: "Frustração",
  aspiration: "Aspiração",
  objection: "Objeção",
  desire: "Desejo",
  fear: "Medo",
};

const phases = [
  { label: "Pré-aquecimento", days: "Dia -14 a -7", color: "#5b8cff" },
  { label: "Aquecimento brutal", days: "Dia -7 a -2", color: "#c08a3d" },
  { label: "Abertura de carrinho", days: "Dia 0", color: "#22c55e" },
  { label: "Janela aberta", days: "Dia 0 a +3", color: "#9b8cff" },
  { label: "Fechamento", days: "Dia +3 a +5", color: "#f97369" },
];

export default function LaunchPage() {
  const persona = usePersonaFromRoute();
  const pains = MOCK_ICP_PAINS.filter((p) => p.personaId === persona.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lançamento Brutal"
        description="Cronograma, banco de dores ICP e copies vinculados à campanha."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" /> Plano em 30 dias
            </Button>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" /> Nova campanha
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="lançamento" />

      <Card>
        <CardHeader>
          <CardTitle>Cronograma do lançamento</CardTitle>
          <p className="text-xs text-muted-foreground">
            Fases · datas · responsáveis · conteúdos vinculados.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {phases.map((p) => (
              <div
                key={p.label}
                className="rounded-xl border border-border/60 bg-card-elevated p-3"
              >
                <Badge
                  size="sm"
                  variant="outline"
                  style={{ borderColor: `${p.color}50`, color: p.color }}
                >
                  {p.days}
                </Badge>
                <p className="mt-2 font-semibold text-sm">{p.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  3 conteúdos · 2 emails · 1 live
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pains">
        <TabsList>
          <TabsTrigger value="pains">
            <Target className="h-3.5 w-3.5" /> Dores ICP
          </TabsTrigger>
          <TabsTrigger value="copies">
            <Flame className="h-3.5 w-3.5" /> Plano de copys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pains">
          <Card>
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle>Banco de dores ICP</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Cada dor pode virar hook, anúncio, email ou roteiro com 1 clique.
                </p>
              </div>
              <Button variant="gradient" size="sm">
                <Plus className="h-4 w-4" /> Nova dor
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pains.map((p) => (
                <Card
                  key={p.id}
                  variant="elevated"
                  className="group hover:border-primary/40 transition"
                >
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Badge size="sm" variant={categoryStyle[p.category]}>
                        {labelMap[p.category]}
                      </Badge>
                      <Badge size="sm" variant="ghost">
                        intensidade {p.intensity}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed">"{p.body}"</p>
                    <div className="flex flex-wrap gap-1">
                      {p.tags?.map((t) => (
                        <Badge key={t} size="sm" variant="ghost">
                          #{t}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-2 border-t border-border/60">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(p.body);
                          toast.success("Copiado para a área de transferência");
                        }}
                      >
                        <Copy className="h-3 w-3" /> Copiar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toast.success("IA gerando criativo…")}>
                        <Wand2 className="h-3 w-3" /> Virar criativo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="copies">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { type: "Página de venda", title: "Aurora · oferta principal", status: "robust" },
              { type: "Script de criativo", title: "VSL 90s · ICP frustrada", status: "draft" },
              { type: "Email", title: "E03 · A janela está fechando", status: "draft" },
              { type: "WhatsApp", title: "Mensagem #1 · qualificação", status: "robust" },
              { type: "Anúncio", title: "Ad principal · Reels", status: "draft" },
              { type: "Headlines", title: "10 variações · página", status: "robust" },
            ].map((c) => (
              <Card key={c.title} variant="elevated" className="hover:border-primary/40">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge size="sm" variant="outline">
                      {c.type}
                    </Badge>
                    <Badge size="sm" variant={c.status === "robust" ? "success" : "warning"}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">{c.title}</p>
                  <div className="flex gap-1 pt-2 border-t border-border/60">
                    <Button size="sm" variant="ghost">
                      Abrir
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Wand2 className="h-3 w-3" /> Refinar IA
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
