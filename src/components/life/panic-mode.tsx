"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { X, Wind, ShieldCheck } from "lucide-react";

const PHASES = [
  { label: "Inspire", secs: 4, scale: 1.55 },
  { label: "Segure", secs: 4, scale: 1.55 },
  { label: "Expire", secs: 4, scale: 0.85 },
  { label: "Segure", secs: 4, scale: 0.85 },
];

// Reframes próprios (não copiados de nenhum app).
const REFRAMES = [
  "Essa vontade é uma onda: sobe, atinge o pico e sempre passa.",
  "Você não é o impulso. Você é quem observa o impulso.",
  "Cada vez que você resiste, o circuito antigo enfraquece um pouco.",
  "Daqui a 10 minutos isso vai parecer pequeno. Respire.",
  "Seu eu de amanhã vai agradecer pela escolha de agora.",
  "Adia em 5 minutos. Quase sempre, a vontade já foi embora.",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reasons: string[];
  onResisted: () => void;
  onRelapse: () => void;
}

export function PanicMode({ open, onOpenChange, reasons, onResisted, onRelapse }: Props) {
  const [phase, setPhase] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const [reframe, setReframe] = React.useState(0);

  React.useEffect(() => {
    if (!open) {
      setPhase(0);
      setElapsed(0);
      return;
    }
    setReframe(Math.floor(Math.random() * REFRAMES.length));
    const phaseTimer = setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 4000);
    const secTimer = setInterval(() => setElapsed((e) => e + 1), 1000);
    const reframeTimer = setInterval(() => setReframe((r) => (r + 1) % REFRAMES.length), 8000);
    return () => {
      clearInterval(phaseTimer);
      clearInterval(secTimer);
      clearInterval(reframeTimer);
    };
  }, [open]);

  if (!open) return null;
  const current = PHASES[phase];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-7 overflow-y-auto bg-background/95 p-6 backdrop-blur-xl">
      <button
        onClick={() => onOpenChange(false)}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:bg-accent hover:text-foreground"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Modo pânico</p>
        <h2 className="text-2xl font-semibold tracking-tight">Respire. Isso vai passar.</h2>
        <p className="text-xs text-muted-foreground">segurando há {elapsed}s · respiração em caixa</p>
      </div>

      {/* Círculo de respiração */}
      <div className="relative flex h-56 w-56 items-center justify-center">
        <div
          className="absolute h-36 w-36 rounded-full bg-primary/20 ring-1 ring-primary/30 ease-in-out"
          style={{ transform: `scale(${current.scale})`, transition: `transform ${current.secs}s ease-in-out` }}
        />
        <div className="z-10 text-center">
          <Wind className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-1 text-lg font-medium">{current.label}</p>
        </div>
      </div>

      <p className="max-w-md text-center text-sm italic text-muted-foreground">“{REFRAMES[reframe]}”</p>

      {reasons.length > 0 && (
        <div className="w-full max-w-md">
          <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Lembre dos seus porquês
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {reasons.map((r, i) => (
              <span key={i} className="rounded-full border border-border/60 bg-card px-3 py-1 text-xs">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <Button variant="gradient" size="lg" onClick={() => { onResisted(); onOpenChange(false); }}>
          <ShieldCheck className="h-4 w-4" /> A vontade passou
        </Button>
        <button
          onClick={() => { onRelapse(); onOpenChange(false); }}
          className="text-xs text-muted-foreground underline-offset-2 transition hover:text-destructive hover:underline"
        >
          Registrar uma recaída
        </button>
      </div>
    </div>
  );
}
