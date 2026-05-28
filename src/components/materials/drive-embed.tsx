"use client";

import * as React from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Extrai o folder ID de uma URL de pasta do Google Drive.
 * Formatos suportados:
 *  - https://drive.google.com/drive/folders/<id>?usp=sharing
 *  - https://drive.google.com/drive/u/0/folders/<id>
 *  - https://drive.google.com/folderview?id=<id>
 *  - https://drive.google.com/embeddedfolderview?id=<id>
 */
function extractGoogleDriveFolderId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("drive.google.com")) return null;
    const match = u.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    const idParam = u.searchParams.get("id");
    if (idParam) return idParam;
    return null;
  } catch {
    return null;
  }
}

/**
 * Converte a URL fornecida pelo usuário para um endpoint embedável.
 * O endpoint /embeddedfolderview do Google Drive permite renderizar em iframe.
 */
export function toGoogleDriveEmbed(url: string, viewMode: "grid" | "list" = "grid") {
  const id = extractGoogleDriveFolderId(url);
  if (!id) return null;
  return `https://drive.google.com/embeddedfolderview?id=${id}#${viewMode}`;
}

interface DriveEmbedProps {
  url: string;
  folderName?: string;
}

export function DriveEmbed({ url, folderName }: DriveEmbedProps) {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [iframeKey, setIframeKey] = React.useState(0);

  const embedUrl = React.useMemo(() => toGoogleDriveEmbed(url, viewMode), [url, viewMode]);
  const isDrive = url.includes("drive.google.com");

  if (!isDrive) {
    // Provedor externo nao-Google: tenta abrir em iframe direto, mas adverte
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
          <p className="text-xs text-warning">
            Provedor externo. Alguns sites bloqueiam embed em iframe — se ficar em
            branco, use o botão "Abrir em nova aba".
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Abrir
          </Button>
        </div>
        <iframe
          key={iframeKey}
          src={url}
          title={folderName ?? "External folder"}
          className="w-full h-[640px] rounded-xl border border-border/60 bg-card/40"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center space-y-2">
        <p className="text-sm font-medium text-destructive">
          URL do Google Drive inválida
        </p>
        <p className="text-xs text-muted-foreground">
          Cole a URL completa de uma pasta compartilhada, ex:
          <br />
          <code className="text-foreground">
            https://drive.google.com/drive/folders/&lt;id&gt;
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap rounded-lg border border-border/60 bg-card/40 px-3 py-2">
        <div className="flex items-center gap-1 bg-card border border-border/60 rounded-md p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-2 py-1 text-[11px] font-medium rounded ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Grade
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-2 py-1 text-[11px] font-medium rounded ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Lista
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIframeKey((k) => k + 1)}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Recarregar
        </Button>
        <span className="text-[10px] text-muted-foreground ml-auto">
          Embed Google Drive · somente leitura
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-3.5 w-3.5" /> Abrir no Drive
        </Button>
      </div>
      <iframe
        key={iframeKey}
        src={embedUrl}
        title={folderName ?? "Google Drive"}
        className="w-full h-[640px] rounded-xl border border-border/60 bg-card/40"
        // embeddedfolderview suporta leitura sem cookies
      />
    </div>
  );
}
