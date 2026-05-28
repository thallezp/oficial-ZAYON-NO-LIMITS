"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Filter, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import {
  useCreateContentMutation,
  useUpdateContentMutation,
  useDeleteContentMutation,
} from "@/hooks/use-queries";

// Paleta de pilares conforme o exemplo do usuário ----------------------------

export const PILLARS = [
  { id: "atracao", label: "ATRAÇÃO", bg: "bg-rose-500", text: "text-white" },
  { id: "educacional", label: "EDUCACIONAL", bg: "bg-indigo-500", text: "text-white" },
  { id: "dicas_praticas", label: "DICAS PRÁTICAS", bg: "bg-cyan-400", text: "text-slate-900" },
  { id: "mind_blowing", label: "MIND-BLOWING", bg: "bg-teal-400", text: "text-slate-900" },
  { id: "opinioes_fortes", label: "OPINIÕES FORTES", bg: "bg-emerald-400", text: "text-slate-900" },
  { id: "neutro", label: "NEUTRO", bg: "bg-zinc-500", text: "text-white" },
];

const PILLAR_BY_ID: Record<string, (typeof PILLARS)[number]> = Object.fromEntries(
  PILLARS.map((p) => [p.id, p]),
);

// Helpers de data ------------------------------------------------------------

const WEEKDAYS_FULL = [
  "DOMINGO",
  "SEGUNDA",
  "TERÇA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SÁBADO",
];

function startOfWeek(d: Date) {
  // semana começa na segunda
  const day = d.getDay(); // 0 = dom
  const diff = day === 0 ? -6 : 1 - day;
  const r = new Date(d);
  r.setDate(d.getDate() + diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

function formatDM(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function combineDateAndSlot(date: Date, slot: string) {
  // slot ex: "12h00" ou "18h00" ou "Extra"
  const m = slot.match(/^(\d{1,2})h(\d{2})?/i);
  const r = new Date(date);
  if (m) {
    r.setHours(Number(m[1]), Number(m[2] ?? "0"), 0, 0);
  } else {
    // slot livre (Extra): meia-noite
    r.setHours(23, 59, 0, 0);
  }
  return r;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function slotForDate(d: Date, slots: string[]) {
  // tenta achar slot cujo horário bate com o da data
  const hh = d.getHours();
  for (const s of slots) {
    const m = s.match(/^(\d{1,2})h/i);
    if (m && Number(m[1]) === hh) return s;
  }
  return slots[slots.length - 1] ?? null;
}

// ----------------------------------------------------------------------------

interface ContentItem {
  id: string;
  workspaceId?: string;
  personaId?: string;
  title: string;
  hook?: string | null;
  script?: string | null;
  caption?: string | null;
  channel?: string;
  contentType?: string | null;
  pillar?: string | null;
  status?: string;
  scheduledAt?: string | null;
  mediaUrl?: string | null;
  metrics?: any;
}

interface Props {
  items: ContentItem[];
  channel: string; // "instagram" | "tiktok" etc.
  workspaceId: string | null;
  personaId: string;
  defaultContentType?: string; // "reel" para IG, etc
}

const DEFAULT_SLOTS = ["12h00", "18h00", "Extra"];

const STATUS_OPTIONS: { id: string; label: string; color: string }[] = [
  { id: "idea", label: "Ideia", color: "bg-zinc-700/60 text-zinc-300" },
  { id: "scripted", label: "Roteirizado", color: "bg-amber-500/30 text-amber-200" },
  { id: "recorded", label: "Gravado", color: "bg-blue-500/30 text-blue-200" },
  { id: "editing", label: "Editando", color: "bg-fuchsia-500/30 text-fuchsia-200" },
  { id: "scheduled", label: "Agendado", color: "bg-indigo-500/30 text-indigo-200" },
  { id: "posted", label: "Postado", color: "bg-emerald-500/30 text-emerald-200" },
];

const STATUS_BY_ID = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.id, s]));

export function WeeklyGrid({
  items,
  channel,
  workspaceId,
  personaId,
  defaultContentType = "reel",
}: Props) {
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date()));
  const [slots, setSlots] = React.useState<string[]>(DEFAULT_SLOTS);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [editing, setEditing] = React.useState<{
    date: Date;
    slot: string;
    item?: ContentItem;
  } | null>(null);
  // Modal de "adicionar slot" especifico de um dia
  const [addingSlotForDate, setAddingSlotForDate] = React.useState<Date | null>(null);
  const [newSlotInput, setNewSlotInput] = React.useState("");

  const weekDates = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const weekEnd = addDays(weekStart, 6);

  // index: items por dia + slot (com filtro de status)
  const itemsByCell = React.useMemo(() => {
    const map = new Map<string, ContentItem>();
    items.forEach((it) => {
      if (!it.scheduledAt || it.channel !== channel) return;
      if (statusFilter !== "all" && it.status !== statusFilter) return;
      const d = new Date(it.scheduledAt);
      const matchDay = weekDates.find((wd) => sameDay(wd, d));
      if (!matchDay) return;
      const slot = slotForDate(d, slots);
      if (!slot) return;
      const key = `${matchDay.toDateString()}|${slot}`;
      map.set(key, it);
    });
    return map;
  }, [items, weekDates, slots, channel, statusFilter]);

  const handleAddSlotToDay = (date: Date, slotName: string) => {
    const v = slotName.trim();
    if (!v) return;
    // adiciona slot a lista de slots globais (eles aparecem em todos os dias)
    if (!slots.includes(v)) {
      setSlots((s) => [...s, v]);
    }
    // abre direto o modal de edicao para criar conteudo naquele dia+slot
    setAddingSlotForDate(null);
    setNewSlotInput("");
    setEditing({ date, slot: v });
  };

  const handleRemoveSlot = (s: string) => {
    if (slots.length <= 1) return;
    setSlots((arr) => arr.filter((x) => x !== s));
  };

  return (
    <div className="space-y-4">
      {/* navegação semana + filtro de status */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekStart((d) => addDays(d, -7))}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Anterior
        </Button>
        <span className="text-sm font-medium">
          Semana: <span className="text-foreground">{formatDM(weekStart)}</span>{" "}
          a <span className="text-foreground">{formatDM(weekEnd)}</span>
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-7 text-[11px] bg-card border border-border/60 rounded-md px-2 outline-none focus:border-primary"
          >
            <option value="all">Todos os status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart((d) => addDays(d, 7))}
          >
            Próxima <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* tabela */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/30">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/60">
              <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-left w-20">
                HORA
              </th>
              {weekDates.map((d, i) => (
                <th
                  key={d.toDateString()}
                  className="px-3 py-3 text-[10px] uppercase tracking-wider text-emerald-400 font-semibold text-left border-l border-border/60 align-top"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div>{WEEKDAYS_FULL[(i + 1) % 7]}</div>
                      <div className="font-mono text-emerald-500/80 text-[10px] mt-0.5">
                        {formatDM(d)}
                      </div>
                    </div>
                    <button
                      onClick={() => setAddingSlotForDate(d)}
                      title="Adicionar slot neste dia"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot} className="border-b border-border/60 last:border-b-0">
                <td className="px-3 py-3 text-muted-foreground font-medium text-[11px] uppercase align-top">
                  <div className="flex items-center gap-1.5">
                    <span>{slot}</span>
                    {slots.length > 1 && (
                      <button
                        onClick={() => handleRemoveSlot(slot)}
                        className="opacity-0 group-hover/row:opacity-60 hover:opacity-100 transition"
                        title="Remover slot"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </td>
                {weekDates.map((d) => {
                  const key = `${d.toDateString()}|${slot}`;
                  const item = itemsByCell.get(key);
                  const pillar = item?.pillar
                    ? PILLAR_BY_ID[item.pillar] ?? PILLAR_BY_ID.neutro
                    : PILLAR_BY_ID.neutro;
                  return (
                    <td
                      key={key}
                      onClick={() => setEditing({ date: d, slot, item })}
                      className="px-2 py-2 border-l border-border/60 align-top cursor-pointer hover:bg-card/50 transition min-w-[140px]"
                    >
                      {item ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span
                              className={cn(
                                "inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase",
                                pillar.bg,
                                pillar.text,
                              )}
                            >
                              {pillar.label}
                            </span>
                            {item.status && STATUS_BY_ID[item.status] && (
                              <span
                                className={cn(
                                  "inline-block rounded px-1.5 py-0.5 text-[8px] font-semibold tracking-wide uppercase",
                                  STATUS_BY_ID[item.status].color,
                                )}
                              >
                                {STATUS_BY_ID[item.status].label}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] leading-tight line-clamp-2 text-foreground">
                            {item.title}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <span className="inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase bg-zinc-700/60 text-zinc-300">
                            VAZIO
                          </span>
                          <p className="text-[11px] italic text-muted-foreground/70">
                            Clique para planejar
                          </p>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        Dica: clique no <Plus className="inline h-3 w-3" /> no cabeçalho de cada
        dia para adicionar um slot novo (ex: 20h00, Stories, Live) — ou clique
        numa célula vazia para planejar conteúdo num slot existente.
      </p>

      {/* Modal: adicionar slot a um dia especifico */}
      {addingSlotForDate && (
        <Dialog
          open
          onOpenChange={(o) => {
            if (!o) {
              setAddingSlotForDate(null);
              setNewSlotInput("");
            }
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                Adicionar slot · {formatDM(addingSlotForDate)}
              </DialogTitle>
              <DialogDescription>
                Crie um novo horário/categoria para planejar conteúdo neste dia.
                O slot aparece em todos os dias da tabela (mantendo a estrutura
                semanal consistente).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label className="text-xs">Nome do slot</Label>
              <Input
                value={newSlotInput}
                onChange={(e) => setNewSlotInput(e.target.value)}
                placeholder="Ex: 20h00, Stories, Live, Extra"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddSlotToDay(addingSlotForDate, newSlotInput);
                  }
                }}
              />
              <div className="flex gap-1 flex-wrap mt-2">
                {["06h00", "08h00", "10h00", "12h00", "14h00", "16h00", "18h00", "20h00", "22h00", "Stories", "Live"].map(
                  (preset) => (
                    <button
                      key={preset}
                      onClick={() => setNewSlotInput(preset)}
                      className="text-[10px] rounded-full border border-border/60 px-2 py-0.5 hover:border-primary/40 hover:bg-card transition"
                    >
                      {preset}
                    </button>
                  ),
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddingSlotForDate(null);
                  setNewSlotInput("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={() => handleAddSlotToDay(addingSlotForDate, newSlotInput)}
                disabled={!newSlotInput.trim()}
              >
                Adicionar e planejar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* modal de edição */}
      {editing && (
        <SlotEditorDialog
          open
          onClose={() => setEditing(null)}
          date={editing.date}
          slot={editing.slot}
          item={editing.item}
          channel={channel}
          workspaceId={workspaceId}
          personaId={personaId}
          defaultContentType={defaultContentType}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Modal de edição do slot
// ----------------------------------------------------------------------------

interface DialogProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  slot: string;
  item?: ContentItem;
  channel: string;
  workspaceId: string | null;
  personaId: string;
  defaultContentType: string;
}

function SlotEditorDialog({
  open,
  onClose,
  date,
  slot,
  item,
  channel,
  workspaceId,
  personaId,
  defaultContentType,
}: DialogProps) {
  const create = useCreateContentMutation();
  const update = useUpdateContentMutation();
  const remove = useDeleteContentMutation();

  const [pillar, setPillar] = React.useState(item?.pillar ?? "dicas_praticas");
  const [title, setTitle] = React.useState(item?.title ?? "");
  const [script, setScript] = React.useState(item?.script ?? "");
  const [mediaUrl, setMediaUrl] = React.useState(item?.mediaUrl ?? "");
  const [views, setViews] = React.useState(item?.metrics?.views ?? 0);
  const [likes, setLikes] = React.useState(item?.metrics?.likes ?? 0);
  const [comments, setComments] = React.useState(item?.metrics?.comments ?? 0);
  const [shares, setShares] = React.useState(item?.metrics?.shares ?? 0);
  const [saves, setSaves] = React.useState(item?.metrics?.saves ?? 0);
  const [engagement, setEngagement] = React.useState(
    item?.metrics?.engagement ?? 0,
  );

  const channelLabel = channel.toUpperCase();
  const slotLabel = slot.toUpperCase();
  const headerLabel = `${channelLabel} · ${WEEKDAYS_FULL[date.getDay()]} ${slotLabel}`;

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Defina um título para o conteúdo");
      return;
    }
    if (!workspaceId) {
      toast.error("Workspace não disponível");
      return;
    }
    const metrics = {
      views: Number(views) || 0,
      likes: Number(likes) || 0,
      comments: Number(comments) || 0,
      shares: Number(shares) || 0,
      saves: Number(saves) || 0,
      engagement: Number(engagement) || 0,
    };
    const scheduledAt = combineDateAndSlot(date, slot).toISOString();
    try {
      if (item?.id) {
        await update.mutateAsync({
          id: item.id,
          input: {
            title: title.trim(),
            script,
            mediaUrl,
            pillar,
            channel,
            scheduledAt,
            metrics,
          },
        });
        toast.success("Conteúdo atualizado");
      } else {
        await create.mutateAsync({
          workspaceId,
          personaId,
          title: title.trim(),
          script,
          mediaUrl,
          pillar,
          channel,
          contentType: defaultContentType,
          status: "scripted",
          scheduledAt,
          metrics,
        });
        toast.success("Conteúdo planejado");
      }
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    }
  };

  const handleDelete = async () => {
    if (!item?.id) return;
    try {
      await remove.mutateAsync(item.id);
      toast.success("Conteúdo removido");
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao remover");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold tracking-wide">
            {headerLabel}
          </DialogTitle>
          <DialogDescription>
            Planeje conteúdo deste slot · {formatDM(date)} {slot}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Pilar de Conteúdo</Label>
            <Select value={pillar} onValueChange={setPillar}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PILLARS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span
                      className={cn(
                        "inline-block w-2.5 h-2.5 rounded-full mr-2",
                        p.bg,
                      )}
                    />
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Título do Conteúdo</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: 3 Formas de aumentar engajamento"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Roteiro / Descrição (Hook → Story → Value → CTA)
            </Label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Escreva o roteiro completo aqui..."
              rows={5}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              📎 Link do vídeo (Drive / YouTube / arquivo)
            </Label>
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-3">
            <Label className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
              📊 Métricas de Performance
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Views" value={views} onChange={setViews} />
              <Metric label="Likes" value={likes} onChange={setLikes} />
              <Metric
                label="Comentários"
                value={comments}
                onChange={setComments}
              />
              <Metric
                label="Compartilhamentos"
                value={shares}
                onChange={setShares}
              />
              <Metric label="Salvamentos" value={saves} onChange={setSaves} />
              <Metric
                label="Taxa de engajamento (%)"
                value={engagement}
                onChange={setEngagement}
                step="0.1"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {item?.id && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={remove.isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="gradient"
            onClick={handleSave}
            disabled={create.isPending || update.isPending}
          >
            {item?.id ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Metric({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Input
        type="number"
        step={step ?? "1"}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-8 text-xs num"
      />
    </div>
  );
}
