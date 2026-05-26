"use client";

import * as React from "react";
import IframeResizer from "@iframe-resizer/react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  url: string;
  title?: string;
  height?: number | string;
  className?: string;
}

/**
 * Embed iframe-resizer para ferramentas externas (quando o site permitir).
 * Muitos sites (Google, Notion etc) bloqueiam embed via X-Frame-Options;
 * nesse caso mostramos fallback com botão "Abrir em nova aba".
 */
export function ToolEmbed({ url, title, height = 600, className }: Props) {
  const [blocked, setBlocked] = React.useState(false);

  React.useEffect(() => {
    setBlocked(false);
  }, [url]);

  if (blocked) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/30 py-16 px-6 text-center",
          className,
        )}
        style={{ minHeight: height }}
      >
        <Globe className="h-8 w-8 mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">
          Este serviço bloqueia incorporação direta.
        </p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Sites como Google, Notion e Hotmart definem cabeçalhos X-Frame-Options
          que impedem embed. Abra em uma nova aba.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Abrir {title ?? "ferramenta"}
        </a>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card",
        className,
      )}
      style={{ minHeight: height }}
    >
      <IframeResizer
        license="GPLv3"
        src={url}
        title={title}
        style={{
          width: "100%",
          minHeight: typeof height === "number" ? `${height}px` : height,
          border: 0,
          background: "transparent",
        }}
        checkOrigin={false}
        onLoad={(messageData: any) => {
          // detecta se carregou conteúdo válido
          if (!messageData?.iframe?.contentWindow) {
            setBlocked(true);
          }
        }}
      />
    </div>
  );
}
