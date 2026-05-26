"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function InvitePage() {
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
            Alex Vega te convidou como editor. Crie sua senha para entrar no
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
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Como te chamam" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="mínimo 12 caracteres" />
            </div>
            <Button variant="gradient" size="lg" className="w-full" asChild>
              <Link href="/dashboard">
                Entrar no workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
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
