"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { acceptInviteAction } from "@/server/actions/auth";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Token de convite ausente na URL.");
      return;
    }
    if (!name || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    if (password.length < 12) {
      toast.error("A senha deve conter no mínimo 12 caracteres.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("token", token);
    formData.append("name", name);
    formData.append("password", password);

    try {
      const res = await acceptInviteAction(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Convite aceito com sucesso!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast.error("Erro ao aceitar convite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border/60 mesh-bg p-12">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <Badge variant="primary" className="w-fit">
          <Sparkles className="h-3 w-3" /> Convite NEXUS
        </Badge>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative space-y-3 max-w-md"
        >
          <h1 className="text-3xl font-semibold tracking-tight">
            Você foi convidado para
            <span className="block text-primary">NEXUS HQ</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            A equipe te convidou como membro. Crie seu perfil e senha para entrar no
            workspace.
          </p>
        </motion.div>
        <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3 w-3" /> 6 membros · 3 personas ativas
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-sm space-y-5 panel-strong p-8"
        >
          <h2 className="text-xl font-semibold tracking-tight">Aceitar convite</h2>
          <form className="space-y-3" onSubmit={handleSubmit}>
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
              disabled={loading}
            >
              {loading ? "Aceitando..." : "Entrar no workspace"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-[11px] text-muted-foreground text-center">
            Convite expira em 7 dias.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}

