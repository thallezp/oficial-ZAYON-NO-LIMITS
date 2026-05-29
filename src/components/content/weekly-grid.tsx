"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Filter,
  GripVertical,
  MoveRight,
  Plus,
  Repeat,
  Trash2,
  X,
  Sparkles,
  BarChart2,
  Clock,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  useTeam,
  useLaunchCampaigns,
  useCreateTaskMutation,
} from "@/hooks/use-queries";

// ---------------------------------------------------------------------------
// Pilares
// ---------------------------------------------------------------------------
export const PILLARS = [
  { id: "attraction", label: "Atração", bg: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  { id: "educational", label: "Educacional", bg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  { id: "tips", label: "Dicas", bg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  { id: "opinion", label: "Opinião", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { id: "neutral", label: "Neutro", bg: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
  { id: "offer", label: "Oferta", bg: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { id: "authority", label: "Autoridade", bg: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  { id: "behind", label: "Bastidores", bg: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
];

const PILLAR_BY_ID = Object.fromEntries(PILLARS.map((p) => [p.id, p]));

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
const STATUS_OPTIONS = [
  { id: "idea", label: "Ideia", color: "bg-zinc-700/40 text-zinc-300 border-zinc-700/60" },
  { id: "pending", label: "Pendente", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { id: "scripted", label: "Roteirizado", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { id: "recorded", label: "Gravado", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { id: "editing", label: "Editando", color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30" },
  { id: "scheduled", label: "Agendado", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  { id: "posted", label: "Postado", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { id: "analyzed", label: "Analisado", color: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
];

const STATUS_BY_ID = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.id, s]));

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
  const day = d.getDay();
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

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatHHmm(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface ContentItem {
  id: string;
  workspaceId?: string;
  personaId?: string;
  title: string;
  hook?: string | null;
  script?: string | null;
  caption?: string | null;
  visualBrief?: string | null;
  audioReference?: string | null;
  referenceLinks?: any;
  channel?: string;
  contentType?: string | null;
  pillar?: string | null;
  status?: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  mediaUrl?: string | null;
  ownerId?: string | null;
  metadata?: any;
  metrics?: any;
  owner?: any;
}

interface Props {
  items: ContentItem[];
  channel: string;
  workspaceId: string | null;
  personaId: string;
  defaultContentType?: string;
}

export function WeeklyGrid({
  items,
  channel,
  workspaceId,
  personaId,
  defaultContentType = "reel",
}: Props) {
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date()));
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [pillarFilter, setPillarFilter] = React.useState<string>("all");
  const [newSlotTime, setNewSlotTime] = React.useState("18:00");

  const [editing, setEditing] = React.useState<{
    date: Date;
    time?: string;
    contentType?: string;
    item?: ContentItem;
  } | null>(null);

  const [dragItem, setDragItem] = React.useState<ContentItem | null>(null);
  const [dragOverCell, setDragOverCell] = React.useState<string | null>(null); // "day-time"

  const update = useUpdateContentMutation();

  // Load and save slots per channel from localStorage
  const [slotTimes, setSlotTimes] = React.useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`zayon_slots_${channel}`);
      if (saved) {
        try {
          return JSON.parse(saved).sort();
        } catch {}
      }
    }
    return ["09:00", "15:00", "21:00"];
  });

  const handleAddSlot = () => {
    if (!newSlotTime || slotTimes.includes(newSlotTime)) return;
    const next = [...slotTimes, newSlotTime].sort();
    setSlotTimes(next);
    localStorage.setItem(`zayon_slots_${channel}`, JSON.stringify(next));
    toast.success(`Slot das ${newSlotTime} adicionado!`);
  };

  const handleRemoveSlot = (time: string) => {
    const next = slotTimes.filter((t) => t !== time);
    setSlotTimes(next);
    localStorage.setItem(`zayon_slots_${channel}`, JSON.stringify(next));
    toast.success(`Slot das ${time} removido.`);
  };

  const weekDates = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const weekEnd = addDays(weekStart, 6);

  // Group items by day
  const itemsByDay = React.useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    weekDates.forEach((wd) => map.set(wd.toDateString(), []));
    items.forEach((it) => {
      if (!it.scheduledAt || it.channel !== channel) return;
      if (statusFilter !== "all" && it.status !== statusFilter) return;
      if (pillarFilter !== "all" && it.pillar !== pillarFilter) return;
      const d = new Date(it.scheduledAt);
      const matchDay = weekDates.find((wd) => sameDay(wd, d));
      if (!matchDay) return;
      const key = matchDay.toDateString();
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    });
    return map;
  }, [items, weekDates, channel, statusFilter, pillarFilter]);

  const handleDrop = async (date: Date, time: string) => {
    if (!dragItem?.id) return;
    const [hh, mm] = time.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hh, mm, 0, 0);

    try {
      await update.mutateAsync({
        id: dragItem.id,
        input: { scheduledAt: newDate.toISOString() },
      });
      toast.success("Slot reagendado com sucesso!");
    } catch {
      toast.error("Erro ao reagendar slot");
    }
    setDragItem(null);
    setDragOverCell(null);
  };

  return (
    <div className="space-y-4">
      {/* Header: navegacao + filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/40 bg-card/25 px-4 py-3 backdrop-blur-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekStart((d) => addDays(d, -7))}
          className="border border-white/5 bg-white/5 hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <span className="text-sm font-medium">
          Semana: <span className="text-primary font-mono">{formatDM(weekStart)}</span>{" "}
          a <span className="text-primary font-mono">{formatDM(weekEnd)}</span>
        </span>
        <div className="flex items-center gap-2.5 ml-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 text-xs bg-card border border-border/60 rounded-md px-2 outline-none focus:border-primary cursor-pointer text-foreground"
            >
              <option value="all">Todos os status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <select
            value={pillarFilter}
            onChange={(e) => setPillarFilter(e.target.value)}
            className="h-8 text-xs bg-card border border-border/60 rounded-md px-2 outline-none focus:border-primary cursor-pointer text-foreground"
          >
            <option value="all">Todos os pilares</option>
            {PILLARS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            className="border border-white/5 bg-white/5 hover:bg-white/10"
          >
            Próxima <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Row-by-day Weekly Slots Grid */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/30 backdrop-blur-md">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-card/60">
              <th className="px-4 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider w-36">Dia da Semana</th>
              {slotTimes.map((time) => (
                <th key={time} className="px-4 py-3.5 font-semibold text-muted-foreground text-center relative group min-w-[200px]">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-primary/80" />
                    <span className="font-mono text-sm text-foreground font-bold">{time}</span>
                    <button
                      onClick={() => handleRemoveSlot(time)}
                      className="absolute right-2 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-destructive transition duration-200"
                      title="Excluir Horário"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3.5 font-semibold text-muted-foreground text-center min-w-[200px]">Outros Horários</th>
              <th className="px-4 py-3.5 font-semibold text-muted-foreground text-center w-48">Gerenciar Slots</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {weekDates.map((date) => {
              const dayKey = date.toDateString();
              const dayItems = itemsByDay.get(dayKey) ?? [];
              const dayIndex = (weekDates.indexOf(date) + 1) % 7;
              const isToday = sameDay(date, new Date());

              // Map items to slot columns
              const matchedIds = new Set<string>();
              const slotColumns = slotTimes.map((time) => {
                const cellItems = dayItems.filter((it) => {
                  if (!it.scheduledAt) return false;
                  const itemTime = formatHHmm(new Date(it.scheduledAt));
                  return itemTime === time;
                });
                cellItems.forEach((it) => matchedIds.add(it.id));
                return cellItems;
              });

              // Leftovers (items with non-standard times)
              const extraItems = dayItems.filter((it) => !matchedIds.has(it.id));

              return (
                <tr
                  key={dayKey}
                  className={cn(
                    "hover:bg-white/[0.02] transition-colors duration-150",
                    isToday && "bg-primary/5 hover:bg-primary/[0.07]"
                  )}
                >
                  {/* Row header: Day name */}
                  <td className="px-4 py-3.5 font-medium border-r border-border/40">
                    <div className={cn("font-bold text-xs uppercase tracking-wider", isToday ? "text-primary" : "text-foreground")}>
                      {WEEKDAYS_FULL[dayIndex]}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      {formatDM(date)} {isToday && <span className="ml-1 text-[8px] bg-primary/20 text-primary border border-primary/30 px-1 rounded">Hoje</span>}
                    </div>
                  </td>

                  {/* Standard slot columns */}
                  {slotTimes.map((time, idx) => {
                    const cellItems = slotColumns[idx];
                    const cellKey = `${dayKey}-${time}`;
                    const isDragOver = dragOverCell === cellKey;

                    return (
                      <td
                        key={time}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverCell(cellKey);
                        }}
                        onDragLeave={() => setDragOverCell(null)}
                        onDrop={() => handleDrop(date, time)}
                        className={cn(
                          "px-2 py-2 border-r border-border/40 text-center min-h-[80px] vertical-align-top transition duration-200",
                          isDragOver && "bg-primary/10 border-dashed border-primary"
                        )}
                      >
                        <div className="space-y-1.5 flex flex-col justify-start h-full min-h-[60px]">
                          {cellItems.map((item) => (
                            <MiniContentCard
                              key={item.id}
                              item={item}
                              onDragStart={() => setDragItem(item)}
                              onClick={() => setEditing({ date, item })}
                            />
                          ))}
                          {cellItems.length === 0 && (
                            <button
                              onClick={() => setEditing({ date, time })}
                              className="flex-1 w-full flex items-center justify-center py-4 border border-dashed border-border/30 hover:border-primary/40 rounded-lg text-muted-foreground/30 hover:text-primary transition duration-200"
                              title="Agendar neste horário"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Non-standard slots column */}
                  <td className="px-2 py-2 border-r border-border/40">
                    <div className="space-y-1.5 flex flex-col justify-start h-full min-h-[60px]">
                      {extraItems.map((item) => (
                        <MiniContentCard
                          key={item.id}
                          item={item}
                          onDragStart={() => setDragItem(item)}
                          onClick={() => setEditing({ date, item })}
                          showTime
                        />
                      ))}
                      {extraItems.length === 0 && (
                        <div className="flex-grow flex items-center justify-center py-4 text-[10px] text-muted-foreground/20 italic">
                          Vazio
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Add Slot Action */}
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center gap-1">
                      <Input
                        type="time"
                        value={newSlotTime}
                        onChange={(e) => setNewSlotTime(e.target.value)}
                        className="h-8 text-xs font-mono w-24 bg-card/60"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
                        onClick={handleAddSlot}
                        title="Adicionar Horário"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slot editor dialog */}
      {editing && (
        <SlotEditorDialog
          open
          onClose={() => setEditing(null)}
          date={editing.date}
          defaultTime={editing.time}
          defaultContentType={editing.contentType ?? defaultContentType}
          item={editing.item}
          channel={channel}
          workspaceId={workspaceId}
          personaId={personaId}
          weekDates={weekDates}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MINI CARD DE CONTEÚDO (PARA CÉLULA DO GRID)
// ---------------------------------------------------------------------------
function MiniContentCard({
  item,
  onDragStart,
  onClick,
  showTime = false,
}: {
  item: ContentItem;
  onDragStart: () => void;
  onClick: () => void;
  showTime?: boolean;
}) {
  const pilar = item.pillar ? PILLAR_BY_ID[item.pillar] : null;
  const status = item.status ? STATUS_BY_ID[item.status] : null;
  const time = item.scheduledAt ? formatHHmm(new Date(item.scheduledAt)) : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="group relative rounded-lg border border-border/50 bg-card-elevated/70 p-2 cursor-grab hover:border-primary/50 hover:bg-card-elevated transition duration-200 text-left space-y-1"
    >
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1">
          <GripVertical className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition shrink-0 cursor-grab" />
          <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground bg-white/5 border border-white/10 rounded px-1">
            {item.contentType}
          </span>
        </div>
        {showTime && time && (
          <span className="text-[9px] font-mono text-primary font-bold shrink-0">{time}</span>
        )}
      </div>

      <p className="text-[10px] leading-tight line-clamp-2 text-foreground font-medium">
        {item.title}
      </p>

      <div className="flex gap-1 items-center flex-wrap pt-0.5">
        {pilar && (
          <Badge
            size="sm"
            variant="outline"
            className={cn("px-1 py-0 text-[7px] font-medium leading-none capitalize", pilar.bg)}
          >
            {pilar.label}
          </Badge>
        )}
        {status && (
          <Badge
            size="sm"
            variant="outline"
            className={cn("px-1 py-0 text-[7px] font-semibold leading-none", status.color)}
          >
            {status.label}
          </Badge>
        )}
        {item.owner && (
          <div
            className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-[7px] shrink-0"
            title={`Responsável: ${item.owner.fullName}`}
          >
            {item.owner.fullName?.charAt(0).toUpperCase() || <User className="h-2 w-2" />}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SLOT EDITOR DIALOG (FULL)
// ---------------------------------------------------------------------------
interface EditorProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  defaultTime?: string;
  defaultContentType: string;
  item?: ContentItem;
  channel: string;
  workspaceId: string | null;
  personaId: string;
  weekDates: Date[];
}

export function SlotEditorDialog({
  open,
  onClose,
  date,
  defaultTime,
  defaultContentType,
  item,
  channel,
  workspaceId,
  personaId,
  weekDates,
}: EditorProps) {
  const create = useCreateContentMutation();
  const update = useUpdateContentMutation();
  const remove = useDeleteContentMutation();
  const duplicateCreate = useCreateContentMutation();
  const createTask = useCreateTaskMutation();

  const handleCreateEditorTask = async () => {
    if (!workspaceId || !item?.id) return;
    try {
      await createTask.mutateAsync({
        workspaceId,
        personaId: personaId || undefined,
        title: `Editar: ${title}`,
        description: `Gravação/Edição do conteúdo: "${title}".\nCanal: ${channel}\nTipo: ${contentType}\nRoteiro: ${script || ''}\nVisual: ${visualBrief || ''}`,
        priority: "medium",
        status: "todo",
        relatedEntity: {
          type: "content",
          id: item.id,
          title: title,
        },
      });
      toast.success("Tarefa de edição criada no Kanban da equipe!");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar tarefa");
    }
  };

  const existingTime = item?.scheduledAt ? formatHHmm(new Date(item.scheduledAt)) : undefined;

  const [selectedDate, setSelectedDate] = React.useState(date);
  const [time, setTime] = React.useState(defaultTime ?? existingTime ?? "20:00");
  const [contentType, setContentType] = React.useState(item?.contentType ?? defaultContentType);
  const [pillar, setPillar] = React.useState(item?.pillar ?? "tips");
  const [title, setTitle] = React.useState(item?.title ?? "");
  const [hook, setHook] = React.useState(item?.hook ?? "");
  const [script, setScript] = React.useState(item?.script ?? "");
  const [caption, setCaption] = React.useState(item?.caption ?? "");
  const [visualBrief, setVisualBrief] = React.useState(item?.visualBrief ?? "");
  const [audioReference, setAudioReference] = React.useState(item?.audioReference ?? "");
  const [referenceLinks, setReferenceLinks] = React.useState(
    item?.referenceLinks
      ? Array.isArray(item.referenceLinks)
        ? item.referenceLinks.join("\n")
        : String(item.referenceLinks)
      : ""
  );
  const [status, setStatus] = React.useState(item?.status ?? "idea");
  const [notes, setNotes] = React.useState(item?.metadata?.notes ?? "");
  
  // Custom metadata links
  const [responsibleId, setResponsibleId] = React.useState(item?.ownerId ?? "");
  const [campaignId, setCampaignId] = React.useState(item?.metadata?.campaignId ?? "");

  // AI Generation loader
  const [isGenerating, setIsGenerating] = React.useState<string | null>(null);

  // Metrics states
  const [metricsViews, setMetricsViews] = React.useState(item?.metrics?.views ?? 0);
  const [metricsLikes, setMetricsLikes] = React.useState(item?.metrics?.likes ?? 0);
  const [metricsComments, setMetricsComments] = React.useState(item?.metrics?.comments ?? 0);
  const [metricsShares, setMetricsShares] = React.useState(item?.metrics?.shares ?? 0);
  const [metricsSaves, setMetricsSaves] = React.useState(item?.metrics?.saves ?? 0);
  const [metricsReach, setMetricsReach] = React.useState(item?.metrics?.reach ?? 0);
  const [metricsRetention, setMetricsRetention] = React.useState(item?.metrics?.retention ?? 0);
  const [metricsEngagementRate, setMetricsEngagementRate] = React.useState(item?.metrics?.engagementRate ?? 0);

  // Query linked resources
  const { data: team = [] } = useTeam(workspaceId);
  const { data: campaigns = [] } = useLaunchCampaigns(workspaceId, personaId);

  const isEditing = !!item?.id;
  const dayLabel = `${WEEKDAYS_FULL[selectedDate.getDay()]} ${formatDM(selectedDate)}`;

  function buildScheduledAt() {
    const [hh, mm] = (time || "20:00").split(":").map(Number);
    const d = new Date(selectedDate);
    d.setHours(hh || 0, mm || 0, 0, 0);
    return d.toISOString();
  }

  function buildPayload() {
    const refs = referenceLinks
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);
      
    return {
      title: title.trim(),
      hook: hook || null,
      script: script || null,
      caption: caption || null,
      visualBrief: visualBrief || null,
      audioReference: audioReference || null,
      referenceLinks: refs.length > 0 ? refs : null,
      pillar,
      channel,
      contentType,
      status,
      scheduledAt: buildScheduledAt(),
      ownerId: responsibleId && responsibleId !== "none" ? responsibleId : null,
      metadata: {
        ...(item?.metadata || {}),
        notes: notes || null,
        campaignId: campaignId && campaignId !== "none" ? campaignId : null,
      },
      metrics: {
        views: Number(metricsViews) || 0,
        likes: Number(metricsLikes) || 0,
        comments: Number(metricsComments) || 0,
        shares: Number(metricsShares) || 0,
        saves: Number(metricsSaves) || 0,
        reach: Number(metricsReach) || 0,
        retention: Number(metricsRetention) || 0,
        engagementRate: Number(metricsEngagementRate) || 0,
      }
    };
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Defina um título para o conteúdo");
      return;
    }
    if (!workspaceId) {
      toast.error("Workspace não disponível");
      return;
    }
    try {
      const payload = buildPayload();
      if (isEditing) {
        await update.mutateAsync({ id: item!.id, input: payload });
        toast.success("Conteúdo atualizado!");
      } else {
        await create.mutateAsync({
          workspaceId,
          personaId,
          ...payload,
        });
        toast.success("Conteúdo criado!");
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

  const handleDuplicate = async () => {
    if (!workspaceId) return;
    try {
      const payload = buildPayload();
      await duplicateCreate.mutateAsync({
        workspaceId,
        personaId,
        ...payload,
        title: `${payload.title} (Cópia)`,
        status: "idea",
      });
      toast.success("Slot duplicado!");
      onClose();
    } catch {
      toast.error("Erro ao duplicar");
    }
  };

  const handleGenerateAI = async (type: "script" | "caption" | "cta") => {
    if (!title.trim()) {
      toast.warning("Digite um título antes de invocar a IA.");
      return;
    }
    setIsGenerating(type);
    toast.loading(`Gerando ${type} com a inteligência do Zayon...`);
    
    // Simulate AI Generation
    setTimeout(() => {
      toast.dismiss();
      if (type === "script") {
        setScript(
          `[GANCHO - IA]: ${title}\n[VISUAL]: Foco médio na câmera, expressão séria.\n[ÁUDIO FALADO]: Sabe qual é o maior erro da sua equipe hoje? É tentar economizar no que traz tração. Não poupe no essencial. \n[CTA]: Comente 'ZAYON' e libere nosso blueprint.`
        );
        toast.success("Roteiro estruturado gerado!");
      } else if (type === "caption") {
        setCaption(
          `Pare de economizar no motor do seu crescimento.\n\nSe você quer resultados fora da curva, precisa parar de rodar em frameworks básicos. A decisão está nas suas mãos.\n\n👉 Inscreva-se pelo link da bio.`
        );
        toast.success("Legenda persuasiva gerada!");
      } else if (type === "cta") {
        setCaption((prev) => prev + "\n\n🚀 Toque no link da bio e comece agora!");
        toast.success("CTA adicionado ao final da legenda!");
      }
      setIsGenerating(null);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {isEditing ? "Editar Slot" : "Novo Slot"} · {channel.toUpperCase()} · {dayLabel}
          </DialogTitle>
          <DialogDescription>
            Planeje os roteiros semanais, legendas e monitore as métricas pós-postagem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Row 1: Date + Time + Type */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Data</Label>
              <Select
                value={selectedDate.toDateString()}
                onValueChange={(v) => {
                  const d = weekDates.find((wd) => wd.toDateString() === v);
                  if (d) setSelectedDate(d);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekDates.map((d) => (
                    <SelectItem key={d.toDateString()} value={d.toDateString()}>
                      {WEEKDAYS_FULL[d.getDay()]} {formatDM(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Horário</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Conteúdo</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reel">Reels</SelectItem>
                  <SelectItem value="feed">Feed Post</SelectItem>
                  <SelectItem value="carousel">Carrossel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="ad">Anúncio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Pillar + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Pilar de Conteúdo</Label>
              <Select value={pillar} onValueChange={setPillar}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PILLARS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className={cn("inline-block w-2 h-2 rounded-full mr-2", p.bg)} />
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status de Produção</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className={cn("inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold mr-2", s.color)}>
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linked Resources Row */}
          <div className="grid grid-cols-2 gap-3 border-y border-border/20 py-3">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" /> Responsável</Label>
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {team.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.fullName || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><Sparkles className="h-3 w-3" /> Campanha Associada</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {campaigns.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label className="text-xs">Título da Peça</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: POV: O dia em que virei o jogo"
            />
          </div>

          {/* AI Helper buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[10px] gap-1 h-7 border-primary/20 hover:bg-primary/5 text-primary"
              onClick={() => handleGenerateAI("script")}
              disabled={!!isGenerating}
            >
              <Sparkles className="h-3 w-3" /> Gerar Roteiro (IA)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[10px] gap-1 h-7 border-primary/20 hover:bg-primary/5 text-primary"
              onClick={() => handleGenerateAI("caption")}
              disabled={!!isGenerating}
            >
              <Sparkles className="h-3 w-3" /> Gerar Legenda (IA)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[10px] gap-1 h-7 border-primary/20 hover:bg-primary/5 text-primary"
              onClick={() => handleGenerateAI("cta")}
              disabled={!!isGenerating}
            >
              <Sparkles className="h-3 w-3" /> Gerar CTA (IA)
            </Button>
          </div>

          {/* Hook & Script */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Gancho Falado (Hook)</Label>
              <Input
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                placeholder="Ex: Esse é o maior erro de React..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ação Visual / Briefing</Label>
              <Input
                value={visualBrief}
                onChange={(e) => setVisualBrief(e.target.value)}
                placeholder="Ex: Câmera estática no espelho"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Roteiro / Conteúdo Escrito</Label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Hook → Roteiro Falado → Ação Visual → CTA"
              rows={4}
              className="font-mono text-xs"
            />
          </div>

          {/* Caption & References */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Legenda Publicação</Label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Legenda para a postagem..."
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono">Referências / Links (1 por linha)</Label>
              <Textarea
                value={referenceLinks}
                onChange={(e) => setReferenceLinks(e.target.value)}
                placeholder="https://instagram.com/reel/abc"
                rows={3}
                className="font-mono text-xs"
              />
            </div>
          </div>

          {/* Production Extra info */}
          <div className="grid grid-cols-2 gap-3 border-t border-border/20 pt-3">
            <div className="space-y-1">
              <Label className="text-xs">Música / Áudio Referência</Label>
              <Input
                value={audioReference}
                onChange={(e) => setAudioReference(e.target.value)}
                placeholder="Link do áudio trend"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Observações Internas</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas..." />
            </div>
          </div>

          {/* METRICS RECORDING BLOCK (PÓS-POSTAGEM) */}
          {(status === "posted" || status === "analyzed") && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 space-y-3 mt-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4" /> Métricas e Resultados (Pós-Postagem)
              </h4>
              <div className="grid grid-cols-4 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Views</Label>
                  <Input
                    type="number"
                    value={metricsViews}
                    onChange={(e) => setMetricsViews(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Likes</Label>
                  <Input
                    type="number"
                    value={metricsLikes}
                    onChange={(e) => setMetricsLikes(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Comentários</Label>
                  <Input
                    type="number"
                    value={metricsComments}
                    onChange={(e) => setMetricsComments(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Compartilhados</Label>
                  <Input
                    type="number"
                    value={metricsShares}
                    onChange={(e) => setMetricsShares(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Salvos</Label>
                  <Input
                    type="number"
                    value={metricsSaves}
                    onChange={(e) => setMetricsSaves(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Alcance (Reach)</Label>
                  <Input
                    type="number"
                    value={metricsReach}
                    onChange={(e) => setMetricsReach(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Taxa Engaj. (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={metricsEngagementRate}
                    onChange={(e) => setMetricsEngagementRate(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Retenção Média (%)</Label>
                  <Input
                    type="number"
                    value={metricsRetention}
                    onChange={(e) => setMetricsRetention(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-wrap border-t border-border/20 pt-3 mt-3">
          {isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={remove.isPending}
                className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                disabled={duplicateCreate.isPending}
              >
                <Copy className="h-3.5 w-3.5" /> Duplicar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateEditorTask}
                disabled={createTask.isPending}
                className="border-primary/20 hover:bg-primary/5 text-primary"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Criar Tarefa para Editor
              </Button>
            </>
          )}
          <div className="flex-grow" />
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleSave}
            disabled={create.isPending || update.isPending}
          >
            {isEditing ? "Salvar Alterações" : "Criar Slot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
