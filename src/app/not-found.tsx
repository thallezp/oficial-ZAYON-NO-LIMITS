import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-5 panel-strong p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
          <Compass className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            404 · ZAYON
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Página fora do mapa
          </h1>
          <p className="text-sm text-muted-foreground">
            Esse caminho não existe no workspace. Volte para a home ou use o
            command menu (⌘K) para encontrar o que procura.
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/dashboard">
            <Home className="h-4 w-4" /> Voltar ao dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
