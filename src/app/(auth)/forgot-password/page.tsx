"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border/60 mesh-bg p-12">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <Link
          href="/login"
          className="relative inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar ao login
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative space-y-4 max-w-md"
        >
          <Badge variant="primary">ZAYON</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            Recupere o acesso.
          </h1>
          <p className="text-sm text-muted-foreground">
            Enviamos um link mágico para o email do workspace.
          </p>
        </motion.div>
        <div className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} ZAYON
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-sm space-y-6 panel-strong p-8"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold tracking-tight">
              {sent ? "Email enviado" : "Esqueci minha senha"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {sent
                ? "Confira sua caixa de entrada e siga o link."
                : "Informe seu email institucional"}
            </p>
          </div>

          {!sent ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
                toast.success("Link de recuperação enviado");
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@equipe.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <Button variant="gradient" size="lg" className="w-full" type="submit">
                <Send className="h-4 w-4" /> Enviar link mágico
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-xs text-foreground/90">
                Link enviado. Expira em 15 minutos.
              </div>
              <Button variant="outline" size="lg" className="w-full" asChild>
                <Link href="/login">Voltar ao login</Link>
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
