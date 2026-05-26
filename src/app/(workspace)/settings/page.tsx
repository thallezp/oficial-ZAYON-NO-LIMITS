"use client";

import { Building2, Cog, Key, Shield, Sparkles, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Workspace, perfil, segurança, IA e integrações."
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-3.5 w-3.5" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="workspace">
            <Building2 className="h-3.5 w-3.5" /> Workspace
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-3.5 w-3.5" /> Segurança
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="h-3.5 w-3.5" /> IA
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Key className="h-3.5 w-3.5" /> Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input defaultValue="Alex Vega" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input defaultValue="alex@nexus.team" type="email" />
              </div>
              <div className="space-y-1.5">
                <Label>Função</Label>
                <Input defaultValue="Founder · Strategist" />
              </div>
              <div className="space-y-1.5">
                <Label>Fuso horário</Label>
                <Input defaultValue="America/Sao_Paulo" />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button variant="gradient">Salvar alterações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace">
          <Card>
            <CardHeader>
              <CardTitle>Workspace · NEXUS HQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome do workspace</Label>
                <Input defaultValue="NEXUS HQ" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input defaultValue="nexus" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card-elevated px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Realtime sincronização</p>
                  <p className="text-xs text-muted-foreground">
                    Supabase realtime ativa em tarefas, leads, financeiro.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card-elevated px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Logs de auditoria</p>
                  <p className="text-xs text-muted-foreground">
                    Registra ações sensíveis (deletes, financeiro, IA).
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card-elevated px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Autenticação em 2 fatores</p>
                  <p className="text-xs text-muted-foreground">
                    Obrigatório para owner e admin.
                  </p>
                </div>
                <Badge variant="success" size="sm">
                  Ativo
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card-elevated px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Row Level Security</p>
                  <p className="text-xs text-muted-foreground">
                    Políticas RLS aplicadas a todas as tabelas operacionais.
                  </p>
                </div>
                <Badge variant="success" size="sm">
                  Ativo
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>IA Operacional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Modelo padrão</Label>
                <Input defaultValue="claude-opus-4-7" />
              </div>
              <div className="space-y-1.5">
                <Label>Modelo de rascunho</Label>
                <Input defaultValue="claude-haiku-4-5-20251001" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card-elevated px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Permitir ações reais no sistema</p>
                  <p className="text-xs text-muted-foreground">
                    IA pode criar tarefas, qualificar leads, montar funis.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {[
                { name: "Supabase", desc: "Banco + Auth + Storage", status: "connected" },
                { name: "Vercel", desc: "Hospedagem", status: "connected" },
                { name: "Resend", desc: "Email transacional", status: "connected" },
                { name: "Liveblocks", desc: "Colaboração ao vivo", status: "connected" },
                { name: "Google Sheets", desc: "Entrada de leads", status: "connected" },
                { name: "Hotmart", desc: "Receita Aurora", status: "connected" },
                { name: "Stripe", desc: "Pagamentos", status: "connected" },
                { name: "UploadThing", desc: "Uploads", status: "pending" },
              ].map((i) => (
                <div
                  key={i.name}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card-elevated px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="text-[11px] text-muted-foreground">{i.desc}</p>
                  </div>
                  <Badge
                    size="sm"
                    variant={i.status === "connected" ? "success" : "warning"}
                  >
                    {i.status === "connected" ? "conectado" : "pendente"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
