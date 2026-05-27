import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { useMockData } from "@/lib/config";

/**
 * API Route universal para mutations via Supabase SDK.
 * Não depende de DATABASE_URL (Drizzle) — usa o cliente Supabase diretamente.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.action) {
      return NextResponse.json({ error: "action é obrigatório" }, { status: 400 });
    }

    const { action, payload } = body;

    // Modo mock: retorna sucesso sem tocar no banco
    if (useMockData) {
      return NextResponse.json({ ok: true, data: payload, mock: true });
    }

    const supabase = supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let result: any;

    switch (action) {
      // ── TASKS ─────────────────────────────────────────────────────────────
      case "createTask": {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            project_id: payload.projectId || null,
            title: payload.title,
            description: payload.description || null,
            status: payload.status || "todo",
            priority: payload.priority || "medium",
            creator_id: user.id,
            assignee_id: payload.assigneeId || null,
            due_at: payload.dueAt || null,
            labels: payload.labels || null,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateTask": {
        const { id, input } = payload;
        const { data, error } = await supabase
          .from("tasks")
          .update({
            title: input.title,
            description: input.description,
            status: input.status,
            priority: input.priority,
            due_at: input.dueAt,
            labels: input.labels,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateTaskStatusAndPosition": {
        const { id, status, position } = payload;
        const { data, error } = await supabase
          .from("tasks")
          .update({ status, position, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // ── CONTENT ───────────────────────────────────────────────────────────
      case "createContent": {
        const { data, error } = await supabase
          .from("content_items")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            title: payload.title,
            channel: payload.channel || "instagram",
            content_type: payload.contentType || "reel",
            status: payload.status || "idea",
            hook: payload.hook || null,
            script: payload.script || null,
            caption: payload.caption || null,
            pillar: payload.pillar || null,
            scheduled_at: payload.scheduledAt || null,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // ── LEADS ─────────────────────────────────────────────────────────────
      case "createLead": {
        const { data, error } = await supabase
          .from("leads")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name || null,
            email: payload.email || null,
            phone: payload.phone || null,
            instagram: payload.instagram || null,
            source: payload.source || "manual",
            status: payload.status || "open",
            score: payload.score || 50,
            notes: payload.notes || null,
            campaign: payload.campaign || null,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateLead": {
        const { id, input } = payload;
        const { data, error } = await supabase
          .from("leads")
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // ── FINANCIAL ─────────────────────────────────────────────────────────
      case "createFinancial": {
        const { data, error } = await supabase
          .from("financial_transactions")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            type: payload.type || "revenue",
            amount: String(payload.amount || 0),
            description: payload.description,
            category: payload.category || "Geral",
            status: payload.status || "pending",
            source: payload.source || "other",
            occurred_at: payload.occurredAt || new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // ── PERSONAS ──────────────────────────────────────────────────────────
      case "upsertPersona": {
        const upsertData: any = {
          workspace_id: payload.workspaceId,
          name: payload.name,
          status: payload.status || "building",
        };
        if (payload.codename) upsertData.codename = payload.codename;
        if (payload.niche) upsertData.niche = payload.niche;
        if (payload.bigIdea) upsertData.big_idea = payload.bigIdea;

        let data, error;
        if (payload.id) {
          ({ data, error } = await supabase
            .from("personas")
            .update({ ...upsertData, updated_at: new Date().toISOString() })
            .eq("id", payload.id)
            .select()
            .single());
        } else {
          ({ data, error } = await supabase
            .from("personas")
            .insert(upsertData)
            .select()
            .single());
        }
        if (error) throw error;
        result = data;
        break;
      }

      // ── DOCUMENTS ─────────────────────────────────────────────────────────
      case "createDocument": {
        const { data, error } = await supabase
          .from("documents")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            title: payload.title,
            content: payload.content || "",
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateDocumentContent": {
        const { id, content, title } = payload;
        const updateObj: any = { content, updated_at: new Date().toISOString() };
        if (title) updateObj.title = title;
        const { data, error } = await supabase
          .from("documents")
          .update(updateObj)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // ── MATERIALS ─────────────────────────────────────────────────────────
      case "createMaterial": {
        const { data, error } = await supabase
          .from("materials")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name || payload.title,
            type: payload.type || "file",
            url: payload.url || null,
            description: payload.description || null,
            tags: payload.tags || null,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // ── FLOWS ─────────────────────────────────────────────────────────────
      case "createFlow": {
        const { data, error } = await supabase
          .from("flows")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name,
            description: payload.description || null,
            type: payload.type || "process",
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "saveFlowData": {
        const { id, nodes, edges } = payload;
        await supabase.from("flow_nodes").delete().eq("flow_id", id);
        await supabase.from("flow_edges").delete().eq("flow_id", id);
        if (nodes?.length > 0) {
          await supabase.from("flow_nodes").insert(
            nodes.map((n: any) => ({
              id: n.id,
              flow_id: id,
              node_type: n.type || "custom",
              title: n.data?.title || n.title || "",
              description: n.data?.description || n.description || "",
              position: n.position,
              data: n.data || null,
            }))
          );
        }
        if (edges?.length > 0) {
          await supabase.from("flow_edges").insert(
            edges.map((e: any) => ({
              id: e.id,
              flow_id: id,
              source: e.source,
              target: e.target,
              label: e.label || null,
              data: e.data || null,
            }))
          );
        }
        result = { ok: true };
        break;
      }

      // ── FUNNELS ───────────────────────────────────────────────────────────
      case "saveFunnelData": {
        const { id, nodes, edges, conversionRate } = payload;
        await supabase.from("funnel_nodes").delete().eq("funnel_id", id);
        await supabase.from("funnel_edges").delete().eq("funnel_id", id);
        if (nodes?.length > 0) {
          await supabase.from("funnel_nodes").insert(
            nodes.map((n: any) => ({
              id: n.id,
              funnel_id: id,
              node_type: n.type || "custom",
              title: n.data?.title || n.title || "",
              description: n.data?.description || n.description || "",
              position: n.position,
              data: n.data || null,
            }))
          );
        }
        if (edges?.length > 0) {
          await supabase.from("funnel_edges").insert(
            edges.map((e: any) => ({
              id: e.id,
              funnel_id: id,
              source: e.source,
              target: e.target,
              label: e.label || null,
              data: e.data || null,
            }))
          );
        }
        if (conversionRate !== undefined) {
          await supabase
            .from("sales_funnels")
            .update({ conversion_rate: String(conversionRate) })
            .eq("id", id);
        }
        result = { ok: true };
        break;
      }

      // ── TOOLS ─────────────────────────────────────────────────────────────
      case "createTool": {
        const { data, error } = await supabase
          .from("tools")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name,
            description: payload.description || null,
            url: payload.url || "https://",
            category: payload.category || "IA",
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "toggleToolFavorite": {
        const { toolId } = payload;
        const { data: existing } = await supabase
          .from("tools")
          .select("is_favorite")
          .eq("id", toolId)
          .single();
        const { data, error } = await supabase
          .from("tools")
          .update({ is_favorite: !(existing?.is_favorite ?? false) })
          .eq("id", toolId)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // ── PROJECTS ──────────────────────────────────────────────────────────
      case "createProject": {
        const { data, error } = await supabase
          .from("projects")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name,
            description: payload.description || null,
            status: payload.status || "active",
            color: payload.color || "#3b82f6",
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // ── USER METADATA ─────────────────────────────────────────────────────
      case "updateUserMetadata": {
        const { data: existingUser } = await supabase
          .from("users")
          .select("metadata")
          .eq("id", user.id)
          .single();

        const merged = { ...(existingUser?.metadata as any || {}), ...payload };
        const { error } = await supabase
          .from("users")
          .update({ metadata: merged })
          .eq("id", user.id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      // ── SANITIZE ──────────────────────────────────────────────────────────
      case "sanitizeDatabaseEncoding": {
        // No-op via Supabase SDK — encoding is handled by the DB
        result = { ok: true };
        break;
      }

      default:
        return NextResponse.json({ error: `Ação desconhecida: ${action}` }, { status: 400 });
    }

    // Registra log de atividade (best-effort)
    try {
      await supabase.from("activity_logs").insert({
        workspace_id: payload?.workspaceId || null,
        actor_id: user.id,
        actor_type: "user",
        action,
        entity_type: action.replace(/^(create|update|upsert|toggle|save)/, "").toLowerCase(),
        entity_id: result?.id || null,
        payload: result || null,
      });
    } catch (_) {
      // Log de atividade é best-effort
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (err: any) {
    console.error("[/api/mutate] Erro:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro interno ao executar mutation" },
      { status: 500 },
    );
  }
}
