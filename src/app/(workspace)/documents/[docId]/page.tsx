"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  History,
  MessageSquare,
  Share2,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RichEditor } from "@/components/editor/rich-editor";
import { MOCK_DOCUMENTS, MOCK_PERSONAS } from "@/data";
import { initials, relativeTime } from "@/lib/utils/format";
import { toast } from "sonner";
import { RoomProvider, useOthers, useUpdateMyPresence } from "@/lib/liveblocks";

const SAMPLE_HTML = `
<h1>Posicionamento · Aurora Voss</h1>
<p><em>Documento vivo · atualizado conforme a persona evolui.</em></p>
<h2>Big idea</h2>
<p>Construa uma vida exuberante sem pedir permissão. Cada peça da Aurora respira autoridade emocional, não performance.</p>
<h2>Tom de voz</h2>
<ul>
  <li>Afetiva · íntima · cinematográfica</li>
  <li>Frases curtas. Silêncio entre elas.</li>
  <li>Nunca usa "polêmica", "fofa", "gente"</li>
</ul>
<h2>Pilares de conteúdo</h2>
<ol>
  <li>Autoridade silenciosa</li>
  <li>Ritual estético</li>
  <li>Narrativa pessoal</li>
  <li>Oferta sem performance</li>
</ol>
<h2>Checklist editorial</h2>
<ul data-type="taskList">
  <li data-checked="true"><label><input type="checkbox" checked><span></span></label><div>Definir guideline de captação</div></li>
  <li data-checked="true"><label><input type="checkbox" checked><span></span></label><div>Validar 3 hooks ancestrais</div></li>
  <li data-checked="false"><label><input type="checkbox"><span></span></label><div>Mapear gatilhos por canal</div></li>
  <li data-checked="false"><label><input type="checkbox"><span></span></label><div>Calibrar IA contextual</div></li>
</ul>
<blockquote>O silêncio é parte da entrega. Não preencha tudo só porque pode.</blockquote>
<h3>Referências cinematográficas</h3>
<p>Filmes 35mm · tons quentes · enquadramentos generosos · ritmo lento.</p>
`;

function CollaborativeDocumentContent({ docId }: { docId: string }) {
  const doc =
    MOCK_DOCUMENTS.find((d) => d.id === docId) ?? MOCK_DOCUMENTS[0];
  const persona = MOCK_PERSONAS.find((p) => p.id === doc.personaId);

  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<Date>(new Date());

  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  const onChange = React.useCallback(() => {
    setSaving(true);
    const id = setTimeout(() => {
      setSaving(false);
      setSavedAt(new Date());
    }, 800);
    return () => clearTimeout(id);
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateMyPresence({ cursor: { x, y } });
  };

  const handlePointerLeave = () => {
    updateMyPresence({ cursor: null });
  };

  const onlineNames = others.map((o) => o.info?.name || "Membro ZAYON").join(", ");
  const presenceText = onlineNames ? ` · ${onlineNames}` : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/documents"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Documentos
        </Link>
        <ChevronRight className="h-3 w-3" />
        {persona && (
          <>
            <Link
              href={`/personas/${persona.id}/overview`}
              className="hover:text-foreground"
            >
              {persona.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-foreground">{doc.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-4xl">{doc.emoji ?? "📄"}</span>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">
                {doc.title}
              </h1>
              {doc.isStarred && (
                <Star className="h-4 w-4 text-warning fill-warning" />
              )}
              {persona && <Badge variant="outline">{persona.name}</Badge>}
              {doc.tags?.map((t) => (
                <Badge key={t} variant="ghost" size="sm">
                  #{t}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Avatar size="xs">
                  <AvatarFallback>
                    {initials(doc.author?.fullName ?? "AV")}
                  </AvatarFallback>
                </Avatar>
                {doc.author?.fullName ?? "Equipe ZAYON"}
              </span>
              <span>·</span>
              <span>Atualizado {relativeTime(doc.updatedAt)}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                {saving ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                    salvando
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    salvo {savedAt.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <Avatar size="sm" className="ring-2 ring-background">
              <AvatarFallback>Você</AvatarFallback>
            </Avatar>
            {others.map(({ connectionId, info }) => (
              <Avatar key={connectionId} size="sm" className="ring-2 ring-background">
                <AvatarFallback>{initials(info?.name || "M")}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Compartilhamento copiado")}
          >
            <Share2 className="h-3.5 w-3.5" /> Compartilhar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Resumo gerado pela IA")}
          >
            <Sparkles className="h-3.5 w-3.5" /> Resumir
          </Button>
          <Button variant="ghost" size="icon-sm" title="Comentários">
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Histórico">
            <History className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-b border-border/60 pb-2">
        <Users className="h-3 w-3 text-success" />
        {others.length + 1} {others.length === 0 ? "pessoa online" : "pessoas online"} · você{presenceText}
      </div>

      <div
        className="relative mx-auto max-w-3xl pb-24"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {/* Render live cursors */}
        {others.map(({ connectionId, presence, info }) => {
          if (!presence?.cursor) return null;
          return (
            <div
              key={connectionId}
              className="absolute pointer-events-none transition-transform duration-75 z-50"
              style={{
                left: presence.cursor.x,
                top: presence.cursor.y,
              }}
            >
              <svg
                className="h-5 w-5 text-brand-500 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V19a1 1 0 002 0v-3.429a1 1 0 00.725-.976l5 1.43a1 1 0 001.169-1.41l-7-14z" />
              </svg>
              <span className="ml-3 rounded bg-brand-500 px-1.5 py-0.5 text-[9px] text-white font-medium whitespace-nowrap shadow-md">
                {info?.name || "Membro"}
              </span>
            </div>
          );
        })}
        <RichEditor initialContent={SAMPLE_HTML} onChange={onChange} />
      </div>
    </div>
  );
}

export default function DocumentDetailPage() {
  const params = useParams<{ docId: string }>();
  const docId = params?.docId || "global-doc";

  return (
    <RoomProvider id={`room-${docId}`} initialPresence={{ cursor: null, typing: false }}>
      <CollaborativeDocumentContent docId={docId} />
    </RoomProvider>
  );
}

