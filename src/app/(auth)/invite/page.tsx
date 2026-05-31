"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  LogIn,
  LogOut,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  acceptInviteAction,
  acceptInviteAsCurrentUserAction,
  getInviteInfoAction,
  logoutAction,
} from "@/server/actions/auth";

type InviteInfo = Awaited<ReturnType<typeof getInviteInfoAction>>;

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) {
      setLoadingInfo(false);
      return;
    }
    getInviteInfoAction(token)
      .then((res) => {
        if (active) setInfo(res);
      })
      .catch(() => {
        if (active) setInfo({ status: "error", error: "Falha ao carregar" } as InviteInfo);
      })
      .finally(() => {
        if (active) setLoadingInfo(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  // Hard nav: garante cookie/sessão fresca no destino (mesmo motivo do login).
  const goDashboard = () => window.location.assign("/dashboard");

  const loginUrl = `/login?next=${encodeURIComponent(`/invite?token=${token}`)}`;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    if (password.length < 12) {
      toast.error("A senha deve conter no mínimo 12 caracteres.");
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append("token", token);
    formData.append("name", name);
    formData.append("password", password);
    try {
      const res = await acceptInviteAction(formData);
      if (res?.error) {
        toast.error(res.error);
        setSubmitting(false);
      } else {
        toast.success("Convite aceito com sucesso!");
        goDashboard();
      }
    } catch {
      toast.error("Erro ao aceitar convite.");
      setSubmitting(false);
    }
  };

  const handleAcceptLoggedIn = async () => {
    setSubmitting(true);
    try {
      const res = await acceptInviteAsCurrentUserAction(token);
      if (res?.error) {
        toast.error(res.error);
        setSubmitting(false);
      } else {
        toast.success("Você entrou no workspace!");
        goDashboard();
      }
    } catch {
      toast.error("Erro ao aceitar convite.");
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    window.location.reload();
  };

  function renderPanel() {
    if (!token) {
      return (
        <Panel title="Convite inválido">
          <p className="text-sm text-muted-foreground">
            O link não contém um token de convite.
          </p>
        </Panel>
      );
    }
    if (loadingInfo || !info) {
      return (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Carregando convite…
        </div>
      );
    }
    if (info.status === "invalid") {
      return (
        <Panel title="Convite inválido">
          <p className="text-sm text-muted-foreground">
            Este convite não existe ou foi cancelado. Peça um novo para a equipe.
          </p>
        </Panel>
      );
    }
    if (info.status === "expired") {
      return (
        <Panel title="Convite expirado">
          <p className="text-sm text-muted-foreground">
            Este convite passou da validade. Peça um novo para a equipe.
          </p>
        </Panel>
      );
    }
    if (info.status === "accepted") {
      return (
        <Panel title="Convite já aceito">
          <p className="text-sm text-muted-foreground">
            Esse convite já foi usado. Faça login para acessar o workspace.
          </p>
          <Button
            variant="gradient"
            size="lg"
            className="w-full text-white"
            onClick={() => window.location.assign(loginUrl)}
          >
            <LogIn className="h-4 w-4" /> Fazer login
          </Button>
        </Panel>
      );
    }
    if (info.status === "error") {
      return (
        <Panel title="Erro">
          <p className="text-sm text-muted-foreground">
            {info.error ?? "Não foi possível carregar o convite."}
          </p>
        </Panel>
      );
    }

    // status === "valid"
    const current = info.currentUserEmail?.toLowerCase() ?? null;
    const target = info.email.toLowerCase();

    if (current && current === target) {
      return (
        <Panel title="Aceitar convite">
          <p className="text-sm text-muted-foreground">
            Você foi convidado para entrar em{" "}
            <span className="font-medium text-foreground">{info.workspaceName}</span>{" "}
            como <span className="font-medium text-foreground">{info.role}</span>.
          </p>
          <Button
            variant="gradient"
            size="lg"
            className="w-full text-white"
            onClick={handleAcceptLoggedIn}
            disabled={submitting}
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? "Entrando…" : "Entrar no workspace"}
          </Button>
        </Panel>
      );
    }

    if (current && current !== target) {
      return (
        <Panel title="Conta diferente">
          <p className="text-sm text-muted-foreground">
            Este convite é para{" "}
            <span className="font-medium text-foreground">{info.email}</span>, mas
            você está logado como{" "}
            <span className="font-medium text-foreground">
              {info.currentUserEmail}
            </span>
            . Saia desta conta para aceitar.
          </p>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Sair desta conta
          </Button>
        </Panel>
      );
    }

    if (info.emailHasAccount) {
      return (
        <Panel title="Você já tem conta">
          <p className="text-sm text-muted-foreground">
            Faça login com{" "}
            <span className="font-medium text-foreground">{info.email}</span> para
            entrar em{" "}
            <span className="font-medium text-foreground">{info.workspaceName}</span>
            .
          </p>
          <Button
            variant="gradient"
            size="lg"
            className="w-full text-white"
            onClick={() => window.location.assign(loginUrl)}
          >
            <LogIn className="h-4 w-4" /> Fazer login para aceitar
          </Button>
        </Panel>
      );
    }

    // novo usuário (sem conta) → cadastro
    return (
      <Panel title="Aceitar convite">
        <p className="text-sm text-muted-foreground">
          Crie seu perfil para entrar em{" "}
          <span className="font-medium text-foreground">{info.workspaceName}</span>{" "}
          ({info.email}).
        </p>
        <form className="space-y-3" onSubmit={handleSignup}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              placeholder="Como te chamam"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="mínimo 12 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full text-white"
            disabled={submitting}
          >
            {submitting ? "Aceitando..." : "Entrar no workspace"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-[11px] text-muted-foreground text-center">
          Convite expira em 7 dias.
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border/60 mesh-bg p-12">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <Badge variant="primary" className="w-fit">
          <Sparkles className="h-3 w-3" /> Convite ZAYON
        </Badge>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative space-y-3 max-w-md"
        >
          <h1 className="text-3xl font-semibold tracking-tight">
            Você foi convidado para o
            <span className="block text-primary">workspace da equipe</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Aceite o convite para colaborar em personas, conteúdo, leads e
            finanças — tudo no mesmo lugar.
          </p>
        </motion.div>
        <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3 w-3" /> Acesso restrito · somente convidados
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-sm space-y-5 panel-strong p-8"
        >
          {renderPanel()}
        </motion.div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground text-sm">Carregando...</div>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
