import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { useMockData } from "@/lib/config";
import { parseMutationPayload } from "@/lib/validations/mutations";

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

    const action = body.action as string;
    let payload = body.payload;

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

    payload = parseMutationPayload(action, payload);

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

      case "updateContent": {
        const { id, input } = payload;
        const patch: Record<string, any> = { updated_at: new Date().toISOString() };
        if (input.title !== undefined) patch.title = input.title;
        if (input.hook !== undefined) patch.hook = input.hook;
        if (input.script !== undefined) patch.script = input.script;
        if (input.caption !== undefined) patch.caption = input.caption;
        if (input.pillar !== undefined) patch.pillar = input.pillar;
        if (input.channel !== undefined) patch.channel = input.channel;
        if (input.contentType !== undefined) patch.content_type = input.contentType;
        if (input.status !== undefined) patch.status = input.status;
        if (input.scheduledAt !== undefined) patch.scheduled_at = input.scheduledAt;
        if (input.publishedAt !== undefined) patch.published_at = input.publishedAt;
        if (input.mediaUrl !== undefined) patch.media_url = input.mediaUrl;
        if (input.metrics !== undefined) patch.metrics = input.metrics;
        const { data, error } = await supabase
          .from("content_items")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "deleteContent": {
        const { id } = payload;
        const { error } = await supabase
          .from("content_items")
          .delete()
          .eq("id", id);
        if (error) throw error;
        result = { id };
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
        let categoryId: string | null = null;
        if (payload.category) {
          const { data: catData } = await supabase
            .from("financial_categories")
            .select("id")
            .eq("workspace_id", payload.workspaceId)
            .ilike("name", payload.category)
            .limit(1);
          if (catData && catData.length > 0) {
            categoryId = catData[0].id;
          }
        }
        const { data, error } = await supabase
          .from("financial_transactions")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            type: payload.type || "revenue",
            amount: String(payload.amount || 0),
            description: payload.description,
            category_id: categoryId,
            status: payload.status || "pending",
            source: payload.source || "other",
            occurred_at: payload.occurredAt ? payload.occurredAt.split("T")[0] : new Date().toISOString().split("T")[0],
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
            author_id: user.id,
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
            title: payload.title || payload.name,
            file_type: payload.fileType || payload.type || "file",
            file_url: payload.fileUrl || payload.url || null,
            size_bytes: payload.sizeBytes || null,
            description: payload.description || null,
            tags: payload.tags || null,
            folder_id: payload.folderId || null,
            uploaded_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // ── FLOWS ─────────────────────────────────────────────────────────────
      case "createFlow": {
        const { data: flowData, error: flowError } = await supabase
          .from("flows")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name,
            description: payload.description || null,
            type: payload.type || "process",
            color: payload.color || null,
            icon: payload.icon || null,
          })
          .select()
          .single();
        if (flowError) throw flowError;
        // Save template nodes and edges if provided
        if (payload.nodes?.length > 0) {
          await supabase.from("flow_nodes").insert(
            payload.nodes.map((n: any) => ({
              id: n.id,
              flow_id: flowData.id,
              node_type: n.type || "step",
              title: n.data?.title || n.title || "",
              description: n.data?.description || n.description || "",
              position: n.position,
              data: n.data || null,
            }))
          );
        }
        if (payload.edges?.length > 0) {
          await supabase.from("flow_edges").insert(
            payload.edges.map((e: any) => ({
              id: e.id,
              flow_id: flowData.id,
              source: e.source,
              target: e.target,
              label: e.label || null,
              data: { style: e.style, animated: e.animated, type: e.type },
            }))
          );
        }
        result = flowData;
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
              metrics: n.metrics || n.data?.metrics || null,
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

      case "createFunnel": {
        const { data, error } = await supabase
          .from("sales_funnels")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name,
            description: payload.description || null,
            conversion_rate: "0.0",
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "deleteFunnel": {
        const { id } = payload;
        const { error } = await supabase.from("sales_funnels").delete().eq("id", id);
        if (error) throw error;
        result = { id };
        break;
      }

      case "updatePromptChain": {
        const { id, input } = payload;
        const patch: Record<string, any> = { updated_at: new Date().toISOString() };
        if (input.name !== undefined) patch.name = input.name;
        if (input.description !== undefined) patch.description = input.description;
        if (input.status !== undefined) patch.status = input.status;
        if (input.basePrompt !== undefined) patch.base_prompt = input.basePrompt;
        if (input.chain !== undefined) patch.chain = input.chain;
        if (input.tags !== undefined) patch.tags = input.tags;
        const { data, error } = await supabase
          .from("prompt_chains")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "createPromptIteration": {
        const { promptChainId, version, body } = payload;
        const { data, error } = await supabase
          .from("prompt_iterations")
          .insert({
            prompt_chain_id: promptChainId,
            version,
            body,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "deletePromptChain": {
        const { id } = payload;
        const { error } = await supabase.from("prompt_chains").delete().eq("id", id);
        if (error) throw error;
        result = { id };
        break;
      }

      case "deleteModelingProfile": {
        const { id } = payload;
        const { error } = await supabase.from("modeling_profiles").delete().eq("id", id);
        if (error) throw error;
        result = { id };
        break;
      }

      // ── TOOLS ─────────────────────────────────────────────────────────────
      case "createTool": {
        let categoryId: string | null = null;
        if (payload.category) {
          const { data: catData } = await supabase
            .from("tool_categories")
            .select("id")
            .eq("workspace_id", payload.workspaceId)
            .ilike("slug", payload.category)
            .limit(1);
          if (catData && catData.length > 0) {
            categoryId = catData[0].id;
          } else {
            const { data: catDataByName } = await supabase
              .from("tool_categories")
              .select("id")
              .eq("workspace_id", payload.workspaceId)
              .ilike("name", payload.category)
              .limit(1);
            if (catDataByName && catDataByName.length > 0) {
              categoryId = catDataByName[0].id;
            }
          }
        }
        const { data, error } = await supabase
          .from("tools")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name,
            description: payload.description || null,
            url: payload.url || "https://",
            category_id: categoryId,
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateTool": {
        const { id, input } = payload;
        const patch: Record<string, any> = {};
        if (input.name !== undefined) patch.name = input.name;
        if (input.description !== undefined) patch.description = input.description;
        if (input.url !== undefined) patch.url = input.url;
        if (input.iconUrl !== undefined) patch.icon_url = input.iconUrl;
        if (input.embedMode !== undefined) patch.embed_mode = input.embedMode;
        if (input.isFavorite !== undefined) patch.is_favorite = input.isFavorite;
        if (input.isPinned !== undefined) patch.is_pinned = input.isPinned;
        if (input.tags !== undefined) patch.tags = input.tags;
        // categoria por slug/nome igual createTool
        if (input.category !== undefined) {
          let categoryId: string | null = null;
          if (input.category) {
            const { data: catData } = await supabase
              .from("tool_categories")
              .select("id, workspace_id")
              .ilike("slug", input.category)
              .limit(1);
            if (catData && catData.length > 0) categoryId = catData[0].id;
            else {
              const { data: byName } = await supabase
                .from("tool_categories")
                .select("id")
                .ilike("name", input.category)
                .limit(1);
              if (byName && byName.length > 0) categoryId = byName[0].id;
            }
          }
          patch.category_id = categoryId;
        }
        const { data, error } = await supabase
          .from("tools")
          .update(patch)
          .eq("id", id)
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

      // ── DELETIONS ─────────────────────────────────────────────────────────
      case "deleteTask": {
        const { id } = payload;
        const { error } = await supabase.from("tasks").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "deleteProject": {
        const { id } = payload;
        const { error } = await supabase.from("projects").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "deleteLead": {
        const { id } = payload;
        const { error } = await supabase.from("leads").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "deleteFinancial": {
        const { id } = payload;
        const { error } = await supabase.from("financial_transactions").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "deletePersona": {
        const { id } = payload;
        const { error } = await supabase.from("personas").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "deleteDocument": {
        const { id } = payload;
        const { error } = await supabase.from("documents").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "deleteFlow": {
        const { id } = payload;
        const { error } = await supabase.from("flows").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "deleteTool": {
        const { id } = payload;
        const { error } = await supabase.from("tools").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "deleteMaterial": {
        const { id } = payload;
        const { error } = await supabase.from("materials").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "deleteCalendarEvent": {
        const { id } = payload;
        const { error } = await supabase.from("calendar_events").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      // ── ADDITIONAL TASK CRUD ──────────────────────────────────────────────
      case "createTaskComment": {
        const { taskId, body: commentBody } = payload;
        const { data, error } = await supabase
          .from("task_comments")
          .insert({
            task_id: taskId,
            author_id: user.id,
            body: commentBody,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "createSubtask": {
        const { parentTaskId, title, workspaceId, personaId } = payload;
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            workspace_id: workspaceId,
            persona_id: personaId || null,
            parent_task_id: parentTaskId,
            title,
            status: "todo",
            priority: "medium",
            creator_id: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // ── CALENDAR EVENTS CRUD ──────────────────────────────────────────────
      case "createCalendarEvent": {
        const { workspaceId, personaId, title, description, startAt, endAt, allDay, color, category } = payload;
        const { data, error } = await supabase
          .from("calendar_events")
          .insert({
            workspace_id: workspaceId,
            persona_id: personaId || null,
            title,
            description: description || null,
            start_at: startAt,
            end_at: endAt || null,
            all_day: allDay ?? false,
            color: color || null,
            category: category || null,
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateCalendarEvent": {
        const { id, title, description, startAt, endAt, allDay, color, category } = payload;
        const { data, error } = await supabase
          .from("calendar_events")
          .update({
            title,
            description: description !== undefined ? description : undefined,
            start_at: startAt,
            end_at: endAt,
            all_day: allDay,
            color,
            category,
          })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "createPromptChain": {
        const { data, error } = await supabase
          .from("prompt_chains")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name,
            description: payload.description || null,
            status: payload.status || "building",
            base_prompt: payload.basePrompt || null,
            tags: payload.tags || null,
            chain: payload.chain || [],
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "createModelingProfile": {
        const { data, error } = await supabase
          .from("modeling_profiles")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name,
            social_network: payload.socialNetwork || null,
            country: payload.country || null,
            link: payload.link || null,
            niche: payload.niche || null,
            category: payload.category || "emerging",
            notes: payload.notes || null,
            tags: payload.tags || null,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateModelingProfile": {
        const { id, input } = payload;
        const patch: Record<string, any> = {};
        if (input.name !== undefined) patch.name = input.name;
        if (input.socialNetwork !== undefined) patch.social_network = input.socialNetwork;
        if (input.country !== undefined) patch.country = input.country;
        if (input.link !== undefined) patch.link = input.link;
        if (input.niche !== undefined) patch.niche = input.niche;
        if (input.category !== undefined) patch.category = input.category;
        if (input.notes !== undefined) patch.notes = input.notes;
        if (input.tags !== undefined) patch.tags = input.tags;
        const { data, error } = await supabase
          .from("modeling_profiles")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "createFolder": {
        const insertPayload: Record<string, any> = {
          workspace_id: payload.workspaceId,
          persona_id: payload.personaId || null,
          name: payload.name,
          parent_id: payload.parentId || null,
          color: payload.color || null,
        };
        if (payload.driveUrl) insertPayload.drive_url = payload.driveUrl;
        if (payload.driveProvider) insertPayload.drive_provider = payload.driveProvider;
        const { data, error } = await supabase
          .from("folders")
          .insert(insertPayload)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateFolder": {
        const { id, input } = payload;
        const patch: Record<string, any> = {};
        if (input.name !== undefined) patch.name = input.name;
        if (input.color !== undefined) patch.color = input.color;
        if (input.driveUrl !== undefined) patch.drive_url = input.driveUrl || null;
        if (input.driveProvider !== undefined)
          patch.drive_provider = input.driveProvider || null;
        if (input.parentId !== undefined) patch.parent_id = input.parentId || null;
        const { data, error } = await supabase
          .from("folders")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "deleteFolder": {
        const { id } = payload;
        const { error } = await supabase.from("folders").delete().eq("id", id);
        if (error) throw error;
        result = { id };
        break;
      }

      case "createHook": {
        const { data, error } = await supabase
          .from("content_hooks")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            text: payload.text,
            category: payload.category || "custom",
            tag: payload.tag || null,
            notes: payload.notes || null,
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateHook": {
        const { id, input } = payload;
        const patch: Record<string, any> = { updated_at: new Date().toISOString() };
        if (input.text !== undefined) patch.text = input.text;
        if (input.category !== undefined) patch.category = input.category;
        if (input.tag !== undefined) patch.tag = input.tag;
        if (input.notes !== undefined) patch.notes = input.notes;
        if (input.performanceScore !== undefined)
          patch.performance_score = input.performanceScore;
        if (input.tested !== undefined) patch.tested = input.tested;
        const { data, error } = await supabase
          .from("content_hooks")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "deleteHook": {
        const { id } = payload;
        const { error } = await supabase
          .from("content_hooks")
          .delete()
          .eq("id", id);
        if (error) throw error;
        result = { id };
        break;
      }

      case "markNotificationRead": {
        const { id } = payload;
        const { data, error } = await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "markAllNotificationsRead": {
        const { data, error } = await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .is("read_at", null);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "archiveNotification": {
        const { id } = payload;
        const { data, error } = await supabase
          .from("notifications")
          .update({ archived_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "deleteNotification": {
        const { id } = payload;
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);
        if (error) throw error;
        result = { id };
        break;
      }

      case "clearReadNotifications": {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("user_id", user.id)
          .not("read_at", "is", null);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "updateMember": {
        // Atualiza o papel de um membro do workspace
        const { workspaceId, userId, role } = payload;
        const { data, error } = await supabase
          .from("workspace_members")
          .update({ role })
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "removeMember": {
        const { workspaceId, userId } = payload;
        // Bloqueia remover o ultimo owner
        const { data: owners } = await supabase
          .from("workspace_members")
          .select("user_id")
          .eq("workspace_id", workspaceId)
          .eq("role", "owner");
        if (
          owners &&
          owners.length === 1 &&
          owners[0].user_id === userId
        ) {
          throw new Error(
            "Não é possível remover o único owner. Transfira a propriedade antes.",
          );
        }
        const { error } = await supabase
          .from("workspace_members")
          .delete()
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId);
        if (error) throw error;
        result = { workspaceId, userId };
        break;
      }

      case "transferOwnership": {
        // Transfere ownership de owner para outro membro
        const { workspaceId, newOwnerId } = payload;
        // muda owner_id do workspace
        const { error: wsError } = await supabase
          .from("workspaces")
          .update({ owner_id: newOwnerId })
          .eq("id", workspaceId);
        if (wsError) throw wsError;
        // promove novo owner
        await supabase
          .from("workspace_members")
          .update({ role: "owner" })
          .eq("workspace_id", workspaceId)
          .eq("user_id", newOwnerId);
        // demove antigo owner para admin
        await supabase
          .from("workspace_members")
          .update({ role: "admin" })
          .eq("workspace_id", workspaceId)
          .eq("user_id", user.id);
        result = { workspaceId, newOwnerId };
        break;
      }

      case "inviteMember": {
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from("invitations")
          .insert({
            workspace_id: payload.workspaceId,
            email: payload.email,
            role: payload.role || "editor",
            token,
            invited_by: user.id,
            expires_at: expiresAt,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateFlow": {
        const { id, input } = payload;
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.type !== undefined) updateData.type = input.type;
        if (input.color !== undefined) updateData.color = input.color;
        const { data, error } = await supabase
          .from("flows")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
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
