"use client";

import {
  Folder, Rocket, Target, Briefcase, Megaphone, Flame, Star, Zap,
  TrendingUp, CalendarRange, BookOpen, Palette, Code2, Globe, Lightbulb,
  Trophy, Heart, ShoppingBag, Camera, PenTool, type LucideIcon,
} from "lucide-react";

// Conjunto curado de ícones que o usuário pode escolher por projeto.
export const PROJECT_ICONS: Record<string, LucideIcon> = {
  Folder, Rocket, Target, Briefcase, Megaphone, Flame, Star, Zap,
  TrendingUp, CalendarRange, BookOpen, Palette, Code2, Globe, Lightbulb,
  Trophy, Heart, ShoppingBag, Camera, PenTool,
};

export const PROJECT_ICON_NAMES = Object.keys(PROJECT_ICONS);

export function getProjectIcon(name?: string | null): LucideIcon {
  return (name && PROJECT_ICONS[name]) || Folder;
}

// Paleta de cores pré-definidas (o usuário também pode escolher cor livre).
export const PROJECT_COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#eab308", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#64748b", "#f43f5e",
];

export type ProjectStatus = "active" | "paused" | "done";

export const PROJECT_STATUS: Record<
  ProjectStatus,
  { label: string; variant: "success" | "warning" | "info" | "outline"; dot: string }
> = {
  active: { label: "Ativo", variant: "success", dot: "bg-success" },
  paused: { label: "Pausado", variant: "warning", dot: "bg-warning" },
  done: { label: "Concluído", variant: "info", dot: "bg-info" },
};

export function getProjectStatus(status?: string | null) {
  return PROJECT_STATUS[(status as ProjectStatus) ?? "active"] ?? PROJECT_STATUS.active;
}
