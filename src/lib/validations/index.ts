import { z } from "zod";

export const personaSchema = z.object({
  name: z.string().min(2).max(120),
  codename: z.string().optional(),
  niche: z.string().optional(),
  bigIdea: z.string().optional(),
  bioShort: z.string().optional(),
  voiceTone: z.string().optional(),
  archetype: z.string().optional(),
  status: z.enum(["active", "building", "paused", "archived"]).default("building"),
});

export const taskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  status: z
    .enum(["backlog", "todo", "doing", "review", "done"])
    .default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  personaId: z.string().optional(),
  projectId: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  labels: z.array(z.string()).optional(),
});

export const contentSchema = z.object({
  title: z.string().min(2),
  channel: z.enum(["instagram", "tiktok", "youtube", "whatsapp", "email", "telegram"]),
  contentType: z.enum([
    "reel",
    "feed",
    "carousel",
    "story",
    "short",
    "video",
    "post",
    "email",
    "live",
    "ad",
  ]),
  status: z
    .enum([
      "idea",
      "pending",
      "scripted",
      "recorded",
      "editing",
      "scheduled",
      "posted",
      "analyzed",
      "archived",
    ])
    .default("idea"),
  pillar: z
    .enum([
      "attraction",
      "educational",
      "tips",
      "opinion",
      "neutral",
      "offer",
      "authority",
      "behind",
    ])
    .optional(),
  hook: z.string().optional(),
  script: z.string().optional(),
  caption: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const leadSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  campaign: z.string().optional(),
  source: z.string().optional(),
  personaId: z.string().optional(),
});

export const financialSchema = z.object({
  type: z.enum(["revenue", "expense"]),
  amount: z.number().positive(),
  description: z.string(),
  status: z.enum(["pending", "paid", "overdue", "canceled"]).default("pending"),
  source: z
    .enum(["gateway", "hotmart", "pix", "stripe", "boleto", "transfer", "other"])
    .default("other"),
  occurredAt: z.string(),
  personaId: z.string().optional(),
});
