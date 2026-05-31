"use client";

import * as React from "react";
import { Building2, Key, Shield, Sparkles, User, Database } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useSanitizeDatabaseEncodingMutation,
  useUpdateProfileMutation,
} from "@/hooks/use-queries";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { initials } from "@/lib/utils/format";
import { UploadButton } from "@/lib/uploadthing";
import { toast } from "sonner";

export default function SettingsPage() {
  const sanitizeMutation = useSanitizeDatabaseEncodingMutation();
  const isSanitizing = sanitizeMutation.isPending;

  const user = useWorkspaceStore((s) => s.user);
  const setUser = useWorkspaceStore((s) => s.setUser);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const updateProfile = useUpdateProfileMutation();

  const [fullName, setFullName] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [timezone, setTimezone] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");

  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? "");
      setJobTitle(((user.metadata as any)?.jobTitle as string) ?? "");
      setTimezone(((user.metadata as any)?.timezone as string) ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
    }
  }, [user]);

  const dirty =
    !!user &&
    (fullName !== (user.fullName ?? "") ||
      jobTitle !== (((user.metadata as any)?.jobTitle as string) ?? "") ||
      timezone !== (((user.metadata as any)?.timezone as string) ?? "") ||
      avatarUrl !== (user.avatarUrl ?? ""));

  const resetProfile = () => {
    setFullName(user?.fullName ?? "");
    setJobTitle(((user?.metadata as any)?.jobTitle as string) ?? "");
    setTimezone(((user?.metadata as any)?.timezone as string) ?? "");
    setAvatarUrl(user?.avatarUrl ?? "");
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error("O nome não pode ficar vazio.");
      return;
    }
    try {
      await updateProfile.mutateAsync({
        fullName: fullName.trim(),
        jobTitle: jobTitle.trim() || null,
        timezone: timezone.trim() || null,
        avatarUrl: avatarUrl || null,
      });
      if (user) {
        setUser({
          ...user,
          fullName: fullName.trim(),
          avatarUrl: avatarUrl || undefined,
          metadata: {
            ...(user.metadata || {}),
            jobTitle: jobTitle.trim() || null,
            timezone: timezone.trim() || null,
          },
        });
      }
      toast.success("Perfil atualizado!");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar perfil.");
    }
  };

  const handleSanitize = async () => {
    try {
      const res = await sanitizeMutation.mutateAsync();
      if (res?.ok) {
        toast.success("Encoding do banco de dados higienizado com sucesso!");
      } else {
        toast.error("Erro ao higienizar. Nenhuma alteração feita.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao higienizar banco de dados.");
    }
  };

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
              <div className="sm:col-span-2 flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border/60 bg-card-elevated flex items-center justify-center">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                      onError={(e) =>
                        ((e.currentTarget as HTMLImageElement).style.display =
                          "none")
                      }
                    />
                  ) : (
                    <span className="text-lg font-semibold text-muted-foreground">
                      {initials(fullName || user?.email || "U")}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Foto de perfil</Label>
                  <div className="flex items-center gap-2">
                    <UploadButton
                      endpoint="avatar"
                      content={{
                        button: "Upar foto",
                        allowedContent: "Imagem até 4MB",
                      }}
                      appearance={{
                        button:
                          "rounded-md bg-primary text-primary-foreground text-xs h-9 px-3 ut-uploading:cursor-not-allowed",
                        allowedContent: "text-[10px] text-muted-foreground",
                      }}
                      onClientUploadComplete={(res) => {
                        const url = res?.[0]?.url;
                        if (url) {
                          setAvatarUrl(url);
                          toast.success(
                            "Foto carregada — clique em Salvar alterações.",
                          );
                        }
                      }}
                      onUploadError={(e: Error) => {
                        toast.error(`Erro no upload: ${e.message}`);
                      }}
                    />
                    {avatarUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAvatarUrl("")}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  value={user?.email ?? ""}
                  type="email"
                  disabled
                  title="O email é gerenciado pela autenticação e não pode ser alterado aqui."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Função</Label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ex: Founder · Strategist"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fuso horário</Label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="America/Sao_Paulo"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Papel no workspace</Label>
                <div>
                  <Badge variant="primary">{user?.role ?? "—"}</Badge>
                </div>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={resetProfile}
                  disabled={!dirty || updateProfile.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleSaveProfile}
                  disabled={!dirty || updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace">
          <Card>
            <CardHeader>
              <CardTitle>
                Workspace · {activeWorkspace?.name ?? "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome do workspace</Label>
                <Input value={activeWorkspace?.name ?? ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={activeWorkspace?.slug ?? ""} disabled />
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

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-500" />
                Manutenção do Banco de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card-elevated px-4 py-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Higienizar Encoding</p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Corrige caracteres corrompidos com acentuação inválida (UTF-8) em Ferramentas, Personas e Projetos no banco de dados.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSanitize}
                  disabled={isSanitizing}
                >
                  {isSanitizing ? "Corrigindo..." : "Corrigir Encoding"}
                </Button>
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
                  <p className="text-sm font-medium">Row Level Security</p>
                  <p className="text-xs text-muted-foreground">
                    Políticas RLS aplicadas a todas as tabelas operacionais.
                  </p>
                </div>
                <Badge variant="success" size="sm">
                  Ativo
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card-elevated px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Sessão</p>
                  <p className="text-xs text-muted-foreground">
                    Autenticação via Supabase. Saia pelo menu do usuário no topo.
                  </p>
                </div>
                <Badge variant="success" size="sm">
                  Conectado
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
              <p className="text-sm text-muted-foreground">
                A IA contextual está disponível pelo botão{" "}
                <span className="text-foreground font-medium">ZAYON AI</span> no
                topo e pelo Command Menu (⌘K). Ela executa ações reais no sistema
                (tarefas, conteúdo, leads, funis) com confirmação quando necessário.
              </p>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card-elevated px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Ações reais no sistema</p>
                  <p className="text-xs text-muted-foreground">
                    IA pode criar tarefas, qualificar leads, montar funis.
                  </p>
                </div>
                <Badge variant="success" size="sm">
                  Ativo
                </Badge>
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
                { name: "Supabase", desc: "Banco + Auth + Storage" },
                { name: "Vercel", desc: "Hospedagem" },
                { name: "UploadThing", desc: "Upload de arquivos e fotos" },
                { name: "Resend", desc: "Email transacional" },
              ].map((i) => (
                <div
                  key={i.name}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card-elevated px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="text-[11px] text-muted-foreground">{i.desc}</p>
                  </div>
                  <Badge size="sm" variant="success">
                    conectado
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
