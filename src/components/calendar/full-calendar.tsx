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
}

export function FullCalendarView({
  events,
  initialView = "dayGridMonth",
  height = 680,
  onEventClick,
  onDateClick,
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
        eventClick={(info) => onEventClick?.(info.event.id)}
        dateClick={(info) => onDateClick?.(info.date)}
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
      <style jsx global>{`
        .zayon-fullcalendar .fc {
          font-family: inherit;
          --fc-border-color: hsl(var(--border) / 0.6);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: transparent;
          --fc-today-bg-color: hsl(var(--primary) / 0.08);
          --fc-event-text-color: hsl(var(--foreground));
        }
        .zayon-fullcalendar .fc-toolbar-title {
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          text-transform: capitalize;
        }
        .zayon-fullcalendar .fc .fc-button {
          background: hsl(var(--card) / 0.6);
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border) / 0.6);
          border-radius: 0.5rem;
          font-size: 0.75rem;
          padding: 0.25rem 0.6rem;
          text-transform: capitalize;
          box-shadow: none;
        }
        .zayon-fullcalendar .fc .fc-button:hover {
          background: hsl(var(--accent));
        }
        .zayon-fullcalendar .fc .fc-button-primary:not(:disabled).fc-button-active,
        .zayon-fullcalendar .fc .fc-button-primary:not(:disabled):active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }
        .zayon-fullcalendar .fc-col-header-cell {
          background: hsl(var(--surface-1) / 0.5);
          text-transform: uppercase;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          color: hsl(var(--muted-foreground));
          font-weight: 600;
          padding: 0.5rem 0;
        }
        .zayon-fullcalendar .fc-daygrid-day-number,
        .zayon-fullcalendar .fc-timegrid-axis-cushion,
        .zayon-fullcalendar .fc-timegrid-slot-label-cushion {
          color: hsl(var(--muted-foreground));
          font-size: 0.7rem;
        }
        .zayon-fullcalendar .fc-day-today .fc-daygrid-day-number {
          color: hsl(var(--primary));
          font-weight: 600;
        }
        .zayon-fullcalendar .fc-event {
          border: none;
          border-radius: 0.4rem;
          padding: 0.15rem 0.4rem;
          font-size: 0.7rem;
          backdrop-filter: blur(8px);
        }
        .zayon-fullcalendar .fc-daygrid-event-dot {
          display: none;
        }
        .zayon-fullcalendar .fc-scrollgrid {
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .zayon-fullcalendar .fc-timegrid-now-indicator-line {
          border-color: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}
