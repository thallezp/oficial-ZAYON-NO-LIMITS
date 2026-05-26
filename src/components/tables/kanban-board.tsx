"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export interface KanbanColumn<TId extends string = string> {
  id: TId;
  label: string;
  tone?: string;
}

export interface KanbanItem<TStatus extends string = string> {
  id: string;
  status: TStatus;
}

interface KanbanBoardProps<C extends string, I extends KanbanItem<C>> {
  columns: KanbanColumn<C>[];
  items: I[];
  onChange: (next: I[]) => void;
  renderCard: (item: I) => React.ReactNode;
  onAdd?: (columnId: C) => void;
}

export function KanbanBoard<C extends string, I extends KanbanItem<C>>({
  columns,
  items,
  onChange,
  renderCard,
  onAdd,
}: KanbanBoardProps<C, I>) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const itemMap = React.useMemo(() => {
    const m = new Map<string, I>();
    items.forEach((i) => m.set(i.id, i));
    return m;
  }, [items]);

  const byColumn = React.useMemo(() => {
    const map = new Map<C, I[]>();
    columns.forEach((c) => map.set(c.id, []));
    items.forEach((i) => {
      if (map.has(i.status)) map.get(i.status)!.push(i);
    });
    return map;
  }, [items, columns]);

  const findColumn = (id: string): C | null => {
    if (columns.find((c) => c.id === id)) return id as C;
    const item = itemMap.get(id);
    return item?.status ?? null;
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeColumn = findColumn(String(active.id));
    const overColumn = findColumn(String(over.id));
    if (!activeColumn || !overColumn || activeColumn === overColumn) return;
    onChange(
      items.map((i) =>
        i.id === active.id ? ({ ...i, status: overColumn } as I) : i,
      ),
    );
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeColumn = findColumn(String(active.id));
    const overColumn = findColumn(String(over.id));
    if (!activeColumn || !overColumn) return;

    if (activeColumn === overColumn && active.id !== over.id) {
      const col = byColumn.get(activeColumn) ?? [];
      const oldIndex = col.findIndex((i) => i.id === active.id);
      const newIndex = col.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(col, oldIndex, newIndex);
      const newItems = items.map((i) =>
        i.status === activeColumn ? reordered.shift() ?? i : i,
      );
      onChange(newItems);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 overflow-x-auto">
        {columns.map((col) => {
          const colItems = byColumn.get(col.id) ?? [];
          return (
            <Column
              key={col.id}
              column={col}
              items={colItems}
              renderCard={renderCard}
              onAdd={onAdd ? () => onAdd(col.id) : undefined}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="rounded-lg border border-primary/60 bg-card-elevated p-2.5 shadow-glow rotate-2 opacity-95">
            {renderCard(itemMap.get(activeId)!)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column<C extends string, I extends KanbanItem<C>>({
  column,
  items,
  renderCard,
  onAdd,
}: {
  column: KanbanColumn<C>;
  items: I[];
  renderCard: (item: I) => React.ReactNode;
  onAdd?: () => void;
}) {
  const { setNodeRef, isOver } = useSortable({ id: column.id, disabled: true });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border border-border/60 bg-card/40 min-w-[260px] transition",
        isOver && "border-primary/60 ring-2 ring-primary/20",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between rounded-t-xl px-3 py-2",
          column.tone ?? "bg-secondary/40",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            {column.label}
          </span>
          <Badge variant="outline" size="sm">
            {items.length}
          </Badge>
        </div>
        {onAdd && (
          <Button variant="ghost" size="icon-sm" onClick={onAdd}>
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-2 p-2 min-h-[120px]">
          {items.map((it) => (
            <SortableCard key={it.id} id={it.id}>
              {renderCard(it)}
            </SortableCard>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableCard({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  );
}

export { GripVertical };
