"use client";

import * as React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  allDay?: boolean;
  color?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  extendedProps?: Record<string, unknown>;
}

interface Props {
  events: CalendarEvent[];
  initialView?: "dayGridMonth" | "timeGridWeek" | "timeGridDay";
  height?: number | string;
  onEventClick?: (id: string) => void;
  onDateClick?: (date: Date) => void;
  /** Drag para selecionar um range -> abre criar evento com data/hora */
  onRangeSelect?: (start: Date, end: Date, allDay: boolean) => void;
  /** Drag de um evento existente para mover */
  onEventMove?: (id: string, newStart: Date, newEnd: Date | null) => void;
  /** Resize de um evento (mudar duracao) */
  onEventResize?: (id: string, newStart: Date, newEnd: Date | null) => void;
  editable?: boolean;
}

export function FullCalendarView({
  events,
  initialView = "dayGridMonth",
  height = 680,
  onEventClick,
  onDateClick,
  onRangeSelect,
  onEventMove,
  onEventResize,
  editable = true,
}: Props) {
  return (
    <div className="zayon-fullcalendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        height={height}
        nowIndicator
        dayMaxEvents={3}
        selectable={editable}
        editable={editable}
        eventResizableFromStart={editable}
        select={(info) => {
          onRangeSelect?.(info.start, info.end, info.allDay);
        }}
        eventClick={(info) => onEventClick?.(info.event.id)}
        dateClick={(info) => onDateClick?.(info.date)}
        eventDrop={(info) => {
          onEventMove?.(info.event.id, info.event.start!, info.event.end ?? null);
        }}
        eventResize={(info) => {
          onEventResize?.(info.event.id, info.event.start!, info.event.end ?? null);
        }}
        eventDisplay="block"
        locale="pt-br"
        firstDay={1}
        buttonText={{
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
        }}
      />
    </div>
  );
}
