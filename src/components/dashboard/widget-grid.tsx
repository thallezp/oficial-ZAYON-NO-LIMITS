"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface Widget {
  id: string;
  span?: "1" | "2" | "3" | "full";
  render: () => React.ReactNode;
}

interface Props {
  widgets: Widget[];
  storageKey?: string;
  className?: string;
}

const SPAN_CLASS = {
  "1": "lg:col-span-1",
  "2": "lg:col-span-2",
  "3": "lg:col-span-3",
  full: "lg:col-span-3",
} as const;

export function WidgetGrid({ widgets, storageKey, className }: Props) {
  const [order, setOrder] = React.useState<string[]>(() => {
    if (typeof window === "undefined" || !storageKey)
      return widgets.map((w) => w.id);
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]") as string[];
      if (!Array.isArray(stored) || stored.length === 0) return widgets.map((w) => w.id);
      // garantir que IDs novos entrem no fim e antigos saiam
      const validStored = stored.filter((id) => widgets.find((w) => w.id === id));
      const missing = widgets
        .map((w) => w.id)
        .filter((id) => !validStored.includes(id));
      return [...validStored, ...missing];
    } catch {
      return widgets.map((w) => w.id);
    }
  });

  React.useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(order));
      } catch {
        /* ignored */
      }
    }
  }, [order, storageKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setOrder((current) => {
      const oldIndex = current.indexOf(String(active.id));
      const newIndex = current.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const widgetMap = React.useMemo(() => {
    const m = new Map<string, Widget>();
    widgets.forEach((w) => m.set(w.id, w));
    return m;
  }, [widgets]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-3 gap-6",
            className,
          )}
        >
          {order.map((id) => {
            const w = widgetMap.get(id);
            if (!w) return null;
            return <SortableWidget key={id} widget={w} />;
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableWidget({ widget }: { widget: Widget }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : "auto",
      }}
      className={cn(
        "group relative",
        SPAN_CLASS[widget.span ?? "1"],
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-card/80 text-muted-foreground opacity-0 transition group-hover:opacity-100 cursor-grab active:cursor-grabbing"
        aria-label="Reordenar widget"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      {widget.render()}
    </div>
  );
}
