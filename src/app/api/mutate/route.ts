import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { parseMutationPayload } from "@/lib/validations/mutations";

async function resolveLeadSourceId(
  supabase: ReturnType<typeof supabaseServer>,
  workspaceId: string,
  personaId?: string | null,
  source?: string | null,
) {
  const normalized = source?.trim();
  if (!normalized) return null;

  const { data: existing, error: lookupError } = await supabase
    .from("lead_sources")
    .select("id")
    .eq("workspace_id", workspaceId)
    .ilike("name", normalized)
    .limit(1);

  if (lookupError) throw lookupError;
  if (existing && existing.length > 0) return existing[0].id as string;

  const { data: created, error: createError } = await supabase
    .from("lead_sources")
    .insert({
      workspace_id: workspaceId,
      persona_id: personaId || null,
      name: normalized,
      type: "manual",
      metadata: { createdBy: "mutation-route" },
    })
    .select("id")
    .single();

  if (createError) throw createError;
  return created.id as string;
}

async function appendLeadStatusHistory(
  supabase: ReturnType<typeof supabaseServer>,
  leadId: string,
  toStatus: string,
  changedBy: string,
  fromStatus?: string | null,
) {
  const { error } = await supabase.from("lead_status_history").insert({
    lead_id: leadId,
    from_status: fromStatus || null,
    to_status: toStatus,
    changed_by: changedBy,
  });
  if (error) throw error;
}

function mergeMetadata(
  current: Record<string, any> | null | undefined,
  next: Record<string, any> | null | undefined,
) {
  return { ...(current || {}), ...(next || {}) };
}

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
            related_entity: payload.relatedEntity || null,
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
            related_entity: input.relatedEntity,
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
            visual_brief: payload.visualBrief || null,
            audio_reference: payload.audioReference || null,
            reference_links: payload.referenceLinks || null,
            pillar: payload.pillar || null,
            scheduled_at: payload.scheduledAt || null,
            owner_id: payload.ownerId || null,
            metadata: payload.metadata || null,
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
        if (input.visualBrief !== undefined) patch.visual_brief = input.visualBrief;
        if (input.audioReference !== undefined) patch.audio_reference = input.audioReference;
        if (input.referenceLinks !== undefined) patch.reference_links = input.referenceLinks;
        if (input.pillar !== undefined) patch.pillar = input.pillar;
        if (input.channel !== undefined) patch.channel = input.channel;
        if (input.contentType !== undefined) patch.content_type = input.contentType;
        if (input.status !== undefined) patch.status = input.status;
        if (input.scheduledAt !== undefined) patch.scheduled_at = input.scheduledAt;
        if (input.publishedAt !== undefined) patch.published_at = input.publishedAt;
        if (input.mediaUrl !== undefined) patch.media_url = input.mediaUrl;
        if (input.ownerId !== undefined) patch.owner_id = input.ownerId;
        if (input.metadata !== undefined) patch.metadata = input.metadata;

        if (input.metrics !== undefined && input.metrics !== null) {
          const { data: existingMetrics } = await supabase
            .from("content_metrics")
            .select("id")
            .eq("content_item_id", id)
            .limit(1);

          const metricsPayload = {
            content_item_id: id,
            views: input.metrics.views !== undefined ? Number(input.metrics.views) : 0,
            likes: input.metrics.likes !== undefined ? Number(input.metrics.likes) : 0,
            comments: input.metrics.comments !== undefined ? Number(input.metrics.comments) : 0,
            shares: input.metrics.shares !== undefined ? Number(input.metrics.shares) : 0,
            saves: input.metrics.saves !== undefined ? Number(input.metrics.saves) : 0,
            reach: input.metrics.reach !== undefined ? Number(input.metrics.reach) : 0,
            engagement_rate: input.metrics.engagementRate !== undefined ? Number(input.metrics.engagementRate) : 0,
            retention: input.metrics.retention !== undefined ? Number(input.metrics.retention) : 0,
          };

          if (existingMetrics && existingMetrics.length > 0) {
            await supabase
              .from("content_metrics")
              .update(metricsPayload)
              .eq("id", existingMetrics[0].id);
          } else {
            await supabase
              .from("content_metrics")
              .insert(metricsPayload);
          }
        }

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
        const sourceId = await resolveLeadSourceId(
          supabase,
          payload.workspaceId,
          payload.personaId,
          payload.source,
        );
        const { data, error } = await supabase
          .from("leads")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            source_id: sourceId,
            name: payload.name || null,
            email: payload.email || null,
            phone: payload.phone || null,
            instagram: payload.instagram || null,
            status: payload.status || "open",
            score: payload.score || 50,
            qualified: payload.qualified || 0,
            responsible_id: payload.responsibleId || null,
            notes: payload.notes || null,
            campaign: payload.campaign || null,
            metadata: payload.metadata
              ? mergeMetadata(payload.metadata, { source: payload.source || null })
              : payload.source
                ? { source: payload.source }
                : null,
          })
          .select()
          .single();
        if (error) throw error;
        await appendLeadStatusHistory(supabase, data.id, data.status, user.id, null);
        result = data;
        break;
      }

      case "updateLead": {
        const { id, input } = payload;
        const { data: currentLead, error: currentLeadError } = await supabase
          .from("leads")
          .select("status, metadata, workspace_id, persona_id")
          .eq("id", id)
          .single();
        if (currentLeadError) throw currentLeadError;

        const patch: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (input.name !== undefined) patch.name = input.name || null;
        if (input.email !== undefined) patch.email = input.email || null;
        if (input.phone !== undefined) patch.phone = input.phone || null;
        if (input.instagram !== undefined) patch.instagram = input.instagram || null;
        if (input.campaign !== undefined) patch.campaign = input.campaign || null;
        if (input.status !== undefined) patch.status = input.status;
        if (input.score !== undefined) patch.score = input.score;
        if (input.qualified !== undefined) patch.qualified = input.qualified;
        if (input.responsibleId !== undefined) patch.responsible_id = input.responsibleId || null;
        if (input.notes !== undefined) patch.notes = input.notes || null;
        if (input.convertedValue !== undefined) patch.converted_value = input.convertedValue || null;
        if (input.metadata !== undefined) {
          patch.metadata = mergeMetadata(currentLead.metadata as any, input.metadata);
        }
        if (input.source !== undefined) {
          patch.source_id = await resolveLeadSourceId(
            supabase,
            currentLead.workspace_id as string,
            (input.personaId || currentLead.persona_id) as string | null,
            input.source,
          );
          patch.metadata = mergeMetadata(currentLead.metadata as any, {
            ...(patch.metadata || {}),
            source: input.source || null,
          });
        }

        const { data, error } = await supabase
          .from("leads")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        if (input.status && input.status !== currentLead.status) {
          await appendLeadStatusHistory(
            supabase,
            id,
            input.status,
            user.id,
            currentLead.status as string | null,
          );
        }
        result = data;
        break;
      }

      case "archiveLead": {
        const { id } = payload;
        const { data: existingLead, error: existingLeadError } = await supabase
          .from("leads")
          .select("metadata")
          .eq("id", id)
          .single();
        if (existingLeadError) throw existingLeadError;

        const { data, error } = await supabase
          .from("leads")
          .update({
            metadata: mergeMetadata(existingLead.metadata as any, {
              archivedAt: new Date().toISOString(),
            }),
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "createLeadComment": {
        const { leadId, workspaceId, content } = payload;
        const { data, error } = await supabase
          .from("comments")
          .insert({
            workspace_id: workspaceId,
            entity_type: "lead",
            entity_id: leadId,
            user_id: user.id,
            content,
          })
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

      case "updateFinancialStatus": {
        const { id, status } = payload;
        const { data, error } = await supabase
          .from("financial_transactions")
          .update({
            status,
            paid_at: status === "paid" ? new Date().toISOString() : null,
          })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateFinancialReceipt": {
        const { id, receiptUrl } = payload;
        const { data, error } = await supabase
          .from("financial_transactions")
          .update({
            receipt_url: receiptUrl,
          })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "createBill": {
        const { data, error } = await supabase
          .from("bills")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name,
            amount: String(payload.amount),
            due_at: payload.dueAt ? payload.dueAt.split("T")[0] : new Date().toISOString().split("T")[0],
            recurrence: payload.recurrence || null,
            status: payload.status || "pending",
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateBillStatus": {
        const { id, status } = payload;
        const { data: bill, error: fetchErr } = await supabase
          .from("bills")
          .select("*")
          .eq("id", id)
          .single();
        if (fetchErr) throw fetchErr;

        const { data, error } = await supabase
          .from("bills")
          .update({ status })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;

        if (status === "paid") {
          await supabase.from("financial_transactions").insert({
            workspace_id: bill.workspace_id,
            persona_id: bill.persona_id || null,
            type: "expense",
            status: "paid",
            amount: bill.amount,
            description: `Pagamento: ${bill.name}`,
            occurred_at: new Date().toISOString().split("T")[0],
            paid_at: new Date().toISOString(),
          });
        }
        result = data;
        break;
      }

      case "deleteBill": {
        const { id } = payload;
        const { error } = await supabase.from("bills").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "createPayrollMember": {
        const { data, error } = await supabase
          .from("payroll_members")
          .insert({
            workspace_id: payload.workspaceId,
            name: payload.name,
            role: payload.role || null,
            base_salary: String(payload.baseSalary || 0),
            commission: String(payload.commission || 0),
            pix_key: payload.pixKey || null,
            pay_day: payload.payDay || null,
            status: payload.status || "active",
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updatePayrollMember": {
        const { id, name, role, baseSalary, commission, pixKey, payDay, status } = payload;
        const { data, error } = await supabase
          .from("payroll_members")
          .update({
            name,
            role,
            base_salary: baseSalary !== undefined ? String(baseSalary) : undefined,
            commission: commission !== undefined ? String(commission) : undefined,
            pix_key: pixKey,
            pay_day: payDay,
            status,
          })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "deletePayrollMember": {
        const { id } = payload;
        const { error } = await supabase.from("payroll_members").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "payPayrollMember": {
        const { id } = payload;
        const { data: member, error: fetchErr } = await supabase
          .from("payroll_members")
          .select("*")
          .eq("id", id)
          .single();
        if (fetchErr) throw fetchErr;

        const metadata = member.metadata || {};
        metadata.lastPaidAt = new Date().toISOString();
        metadata.lastPaidMonth = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        
        const { data, error } = await supabase
          .from("payroll_members")
          .update({ metadata })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;

        const totalPayout = Number(member.base_salary || 0) + Number(member.commission || 0);
        await supabase.from("financial_transactions").insert({
          workspace_id: member.workspace_id,
          type: "expense",
          status: "paid",
          amount: String(totalPayout),
          description: `Folha de Pagamento: ${member.name} (${metadata.lastPaidMonth})`,
          occurred_at: new Date().toISOString().split("T")[0],
          paid_at: new Date().toISOString(),
        });

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
        if (payload.codename !== undefined) upsertData.codename = payload.codename || null;
        if (payload.niche !== undefined) upsertData.niche = payload.niche || null;
        if (payload.bigIdea !== undefined) upsertData.big_idea = payload.bigIdea || null;
        if (payload.bioShort !== undefined) upsertData.bio_short = payload.bioShort || null;
        if (payload.voiceTone !== undefined) upsertData.voice_tone = payload.voiceTone || null;
        if (payload.archetype !== undefined) upsertData.archetype = payload.archetype || null;
        if (payload.visualStyle !== undefined) upsertData.visual_style = payload.visualStyle || null;
        if (payload.dressStyle !== undefined) upsertData.dress_style = payload.dressStyle || null;
        if (payload.avatarUrl !== undefined) upsertData.avatar_url = payload.avatarUrl || null;
        if (payload.coverUrl !== undefined) upsertData.cover_url = payload.coverUrl || null;
        if (payload.objective !== undefined) upsertData.objective = payload.objective || null;
        if (payload.guidelines !== undefined) upsertData.guidelines = payload.guidelines || null;
        if (Array.isArray(payload.personality))
          upsertData.personality = payload.personality;
        if (Array.isArray(payload.preferredWords))
          upsertData.preferred_words = payload.preferredWords;
        if (Array.isArray(payload.forbiddenWords))
          upsertData.forbidden_words = payload.forbiddenWords;
        if (Array.isArray(payload.referenceLinks))
          upsertData.reference_links = payload.referenceLinks;

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

      case "upsertPersonaChannel": {
        const channelData: any = {
          workspace_id: payload.workspaceId,
          persona_id: payload.personaId,
          channel: payload.channel,
        };
        if (payload.handle !== undefined) channelData.handle = payload.handle || null;
        if (payload.url !== undefined) channelData.url = payload.url || null;
        if (payload.followers !== undefined)
          channelData.followers = Number(payload.followers) || 0;
        let data, error;
        if (payload.id) {
          ({ data, error } = await supabase
            .from("persona_channels")
            .update(channelData)
            .eq("id", payload.id)
            .select()
            .single());
        } else {
          ({ data, error } = await supabase
            .from("persona_channels")
            .insert(channelData)
            .select()
            .single());
        }
        if (error) throw error;
        result = data;
        break;
      }

      case "deletePersonaChannel": {
        const { error } = await supabase
          .from("persona_channels")
          .delete()
          .eq("id", payload.id);
        if (error) throw error;
        result = { id: payload.id };
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

      case "updateDocumentMeta": {
        // Atualiza metadados organizacionais (pasta, projeto, tarefa, tags, persona, etc.)
        const { id, input } = payload;
        const patch: Record<string, any> = { updated_at: new Date().toISOString() };
        if (input.title !== undefined) patch.title = input.title;
        if (input.summary !== undefined) patch.summary = input.summary;
        if (input.emoji !== undefined) patch.emoji = input.emoji;
        if (input.tags !== undefined) patch.tags = input.tags;
        if (input.type !== undefined) patch.type = input.type;
        if (input.folderId !== undefined) patch.folder_id = input.folderId || null;
        if (input.personaId !== undefined) patch.persona_id = input.personaId || null;
        if (input.projectId !== undefined) patch.project_id = input.projectId || null;
        if (input.taskId !== undefined) patch.task_id = input.taskId || null;
        const { data, error } = await supabase
          .from("documents")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "toggleDocumentStar": {
        const { id } = payload;
        const { data: current } = await supabase
          .from("documents")
          .select("is_starred")
          .eq("id", id)
          .single();
        const { data, error } = await supabase
          .from("documents")
          .update({ is_starred: !(current?.is_starred ?? false) })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "archiveDocument": {
        const { id } = payload;
        const { data, error } = await supabase
          .from("documents")
          .update({ archived_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "unarchiveDocument": {
        const { id } = payload;
        const { data, error } = await supabase
          .from("documents")
          .update({ archived_at: null })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "moveDocumentToFolder": {
        // Move um ou varios documentos para uma pasta (folderId=null = raiz)
        const { ids, folderId } = payload;
        const idList: string[] = Array.isArray(ids) ? ids : [ids];
        const { data, error } = await supabase
          .from("documents")
          .update({
            folder_id: folderId || null,
            updated_at: new Date().toISOString(),
          })
          .in("id", idList)
          .select();
        if (error) throw error;
        result = data;
        break;
      }

      case "bulkArchiveDocuments": {
        const { ids, archive } = payload;
        const idList: string[] = Array.isArray(ids) ? ids : [ids];
        const { error } = await supabase
          .from("documents")
          .update({
            archived_at: archive ? new Date().toISOString() : null,
          })
          .in("id", idList);
        if (error) throw error;
        result = { ok: true, count: idList.length };
        break;
      }

      case "bulkTagDocuments": {
        // Aplica tags a múltiplos documentos preservando existentes
        const { ids, tags } = payload;
        const idList: string[] = Array.isArray(ids) ? ids : [ids];
        const newTags: string[] = Array.isArray(tags) ? tags : [];
        const { data: existing } = await supabase
          .from("documents")
          .select("id, tags")
          .in("id", idList);
        for (const doc of existing ?? []) {
          const merged = Array.from(
            new Set([...(doc.tags ?? []), ...newTags]),
          );
          await supabase
            .from("documents")
            .update({ tags: merged })
            .eq("id", doc.id);
        }
        result = { ok: true, count: idList.length };
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

      case "createLaunchCampaign": {
        const { data, error } = await supabase
          .from("launch_campaigns")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name,
            description: payload.description || null,
            starts_at: payload.startsAt || null,
            ends_at: payload.endsAt || null,
            status: payload.status || "planning",
            goal: payload.goal || null,
            metadata: payload.metadata || null,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateLaunchCampaign": {
        const { id, input } = payload;
        const patch: Record<string, any> = {};
        if (input.name !== undefined) patch.name = input.name;
        if (input.description !== undefined) patch.description = input.description || null;
        if (input.startsAt !== undefined) patch.starts_at = input.startsAt || null;
        if (input.endsAt !== undefined) patch.ends_at = input.endsAt || null;
        if (input.status !== undefined) patch.status = input.status;
        if (input.goal !== undefined) patch.goal = input.goal || null;
        if (input.metadata !== undefined) patch.metadata = input.metadata || null;
        const { data, error } = await supabase
          .from("launch_campaigns")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "archiveLaunchCampaign": {
        const { id } = payload;
        const { data, error } = await supabase
          .from("launch_campaigns")
          .update({ status: "archived" })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "deleteLaunchCampaign": {
        const { id } = payload;
        const { error } = await supabase.from("launch_campaigns").delete().eq("id", id);
        if (error) throw error;
        result = { id };
        break;
      }

      case "createLaunchEvent": {
        const { data, error } = await supabase
          .from("launch_events")
          .insert({
            campaign_id: payload.campaignId,
            title: payload.title,
            description: payload.description || null,
            start_at: payload.startAt,
            end_at: payload.endAt || null,
            type: payload.type || null,
            metadata: payload.metadata || null,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateLaunchEvent": {
        const { id, input } = payload;
        const patch: Record<string, any> = {};
        if (input.title !== undefined) patch.title = input.title;
        if (input.description !== undefined) patch.description = input.description || null;
        if (input.startAt !== undefined) patch.start_at = input.startAt;
        if (input.endAt !== undefined) patch.end_at = input.endAt || null;
        if (input.type !== undefined) patch.type = input.type || null;
        if (input.metadata !== undefined) patch.metadata = input.metadata || null;
        const { data, error } = await supabase
          .from("launch_events")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "deleteLaunchEvent": {
        const { id } = payload;
        const { error } = await supabase.from("launch_events").delete().eq("id", id);
        if (error) throw error;
        result = { id };
        break;
      }

      case "createIcpPain": {
        const { data, error } = await supabase
          .from("icp_pains")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            category: payload.category,
            body: payload.body,
            tags: payload.tags || null,
            intensity: payload.intensity || null,
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateIcpPain": {
        const { id, input } = payload;
        const patch: Record<string, any> = {};
        if (input.category !== undefined) patch.category = input.category;
        if (input.body !== undefined) patch.body = input.body;
        if (input.tags !== undefined) patch.tags = input.tags || null;
        if (input.intensity !== undefined) patch.intensity = input.intensity || null;
        const { data, error } = await supabase
          .from("icp_pains")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "deleteIcpPain": {
        const { id } = payload;
        const { error } = await supabase.from("icp_pains").delete().eq("id", id);
        if (error) throw error;
        result = { id };
        break;
      }

      case "createSalesCopy": {
        const { data, error } = await supabase
          .from("sales_copies")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            campaign_id: payload.campaignId || null,
            type: payload.type,
            title: payload.title,
            body: payload.body,
            status: payload.status || "draft",
            metadata: payload.metadata || null,
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "updateSalesCopy": {
        const { id, input } = payload;
        const patch: Record<string, any> = { updated_at: new Date().toISOString() };
        if (input.type !== undefined) patch.type = input.type;
        if (input.title !== undefined) patch.title = input.title;
        if (input.body !== undefined) patch.body = input.body;
        if (input.status !== undefined) patch.status = input.status;
        if (input.campaignId !== undefined) patch.campaign_id = input.campaignId || null;
        if (input.metadata !== undefined) patch.metadata = input.metadata || null;
        const { data, error } = await supabase
          .from("sales_copies")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "deleteSalesCopy": {
        const { id } = payload;
        const { error } = await supabase.from("sales_copies").delete().eq("id", id);
        if (error) throw error;
        result = { id };
        break;
      }

      // ── TOOLS ─────────────────────────────────────────────────────────────
      // ── TOOLS ─────────────────────────────────────────────────────────────
      case "createTool": {
        let categoryId: string | null = null;
        if (payload.category) {
          const { data: catData } = await supabase
            .from("tool_categories")
            .select("id")
            .eq("workspace_id", payload.workspaceId)
            .ilike("name", payload.category)
            .limit(1);
          if (catData && catData.length > 0) {
            categoryId = catData[0].id;
          } else {
            const slug = payload.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const { data: newCat, error: catError } = await supabase
              .from("tool_categories")
              .insert({
                workspace_id: payload.workspaceId,
                name: payload.category,
                slug: slug,
              })
              .select("id")
              .single();
            if (!catError && newCat) {
              categoryId = newCat.id;
            }
          }
        }

        const metadata = {
          embedMode: payload.embedMode || "new_tab",
          brandColor: payload.brandColor || null,
          projectId: payload.projectId || null,
          documentId: payload.documentId || null,
        };

        const { data, error } = await supabase
          .from("tools")
          .insert({
            workspace_id: payload.workspaceId,
            persona_id: payload.personaId || null,
            name: payload.name,
            description: payload.description || null,
            url: payload.url || "https://",
            category_id: categoryId,
            icon_slug: payload.iconSlug || null,
            tags: payload.tags || [],
            metadata: metadata,
            is_favorite: payload.isFavorite || false,
            is_pinned: payload.isPinned || false,
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
        if (input.iconUrl !== undefined) patch.logo_url = input.iconUrl;
        if (input.iconSlug !== undefined) patch.icon_slug = input.iconSlug;
        if (input.isFavorite !== undefined) patch.is_favorite = input.isFavorite;
        if (input.isPinned !== undefined) patch.is_pinned = input.isPinned;
        if (input.tags !== undefined) patch.tags = input.tags;
        if (input.personaId !== undefined) patch.persona_id = input.personaId || null;

        // Fetch existing metadata to merge
        const { data: existingTool } = await supabase
          .from("tools")
          .select("metadata, workspace_id")
          .eq("id", id)
          .single();
        const existingMeta = (existingTool?.metadata as Record<string, any>) || {};
        const workspaceId = existingTool?.workspace_id;

        const nextMeta = {
          ...existingMeta,
        };
        if (input.embedMode !== undefined) nextMeta.embedMode = input.embedMode;
        if (input.brandColor !== undefined) nextMeta.brandColor = input.brandColor;
        if (input.projectId !== undefined) nextMeta.projectId = input.projectId;
        if (input.documentId !== undefined) nextMeta.documentId = input.documentId;
        if (input.urlCheckedAt !== undefined) nextMeta.urlCheckedAt = input.urlCheckedAt;
        if (input.urlStatus !== undefined) nextMeta.urlStatus = input.urlStatus;

        patch.metadata = nextMeta;

        if (input.category !== undefined) {
          let categoryId: string | null = null;
          if (input.category) {
            const { data: catData } = await supabase
              .from("tool_categories")
              .select("id")
              .eq("workspace_id", workspaceId)
              .ilike("name", input.category)
              .limit(1);
            if (catData && catData.length > 0) {
              categoryId = catData[0].id;
            } else {
              const slug = input.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              const { data: newCat, error: catError } = await supabase
                .from("tool_categories")
                .insert({
                  workspace_id: workspaceId,
                  name: input.category,
                  slug: slug,
                })
                .select("id")
                .single();
              if (!catError && newCat) {
                categoryId = newCat.id;
              }
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

      case "updateMaterial": {
        const { id, input } = payload;
        const patch: Record<string, any> = {};
        if (input.title !== undefined) patch.title = input.title;
        if (input.description !== undefined) patch.description = input.description;
        if (input.fileType !== undefined) patch.file_type = input.fileType;
        if (input.fileUrl !== undefined) patch.file_url = input.fileUrl;
        if (input.sizeBytes !== undefined) patch.size_bytes = input.sizeBytes;
        if (input.folderId !== undefined) patch.folder_id = input.folderId;
        if (input.tags !== undefined) patch.tags = input.tags;
        if (input.isStarred !== undefined) patch.is_starred = input.isStarred;
        if (input.relatedEntity !== undefined) patch.related_entity = input.relatedEntity;
        if (input.personaId !== undefined) patch.persona_id = input.personaId;
        const { data, error } = await supabase
          .from("materials")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
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
        if (input.refs !== undefined) patch.refs = input.refs;
        if (input.photoUrl !== undefined) patch.photo_url = input.photoUrl;
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

      case "upsertModelingContentExample": {
        const row: Record<string, any> = {
          profile_id: payload.profileId,
          title: payload.title,
          url: payload.url,
        };
        if (payload.channel !== undefined) row.channel = payload.channel || null;
        if (payload.analysis !== undefined) row.analysis = payload.analysis || null;
        if (payload.metrics !== undefined) row.metrics = payload.metrics || null;
        let data, error;
        if (payload.id) {
          ({ data, error } = await supabase
            .from("modeling_content_examples")
            .update(row)
            .eq("id", payload.id)
            .select()
            .single());
        } else {
          ({ data, error } = await supabase
            .from("modeling_content_examples")
            .insert(row)
            .select()
            .single());
        }
        if (error) throw error;
        result = data;
        break;
      }

      case "deleteModelingContentExample": {
        const { error } = await supabase
          .from("modeling_content_examples")
          .delete()
          .eq("id", payload.id);
        if (error) throw error;
        result = { id: payload.id };
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

      case "createFollowerSnapshot": {
        // Upsert: se já existe snapshot do mesmo persona+canal+dia, atualiza
        const { data, error } = await supabase
          .from("persona_follower_snapshots")
          .upsert(
            {
              workspace_id: payload.workspaceId,
              persona_id: payload.personaId,
              channel: payload.channel,
              snapshot_date:
                payload.snapshotDate ?? new Date().toISOString().slice(0, 10),
              followers: Number(payload.followers) || 0,
            },
            { onConflict: "persona_id,channel,snapshot_date" },
          )
          .select()
          .single();
        if (error) throw error;
        result = data;
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
          .is("deleted_at", null)
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
        const { data, error } = await supabase
          .from("notifications")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "clearReadNotifications": {
        const { data, error } = await supabase
          .from("notifications")
          .update({ deleted_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .not("read_at", "is", null);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "clearAllNotifications": {
        const { data, error } = await supabase
          .from("notifications")
          .update({ deleted_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .is("deleted_at", null);
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

      case "resendInvitation": {
        const token = crypto.randomUUID();
        const expiresAt = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const { data, error } = await supabase
          .from("invitations")
          .update({
            token,
            expires_at: expiresAt,
            invited_by: user.id,
            accepted: false,
          })
          .eq("id", payload.invitationId)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "cancelInvitation": {
        const { error } = await supabase
          .from("invitations")
          .delete()
          .eq("id", payload.invitationId);
        if (error) throw error;
        result = { id: payload.invitationId };
        break;
      }

      case "updateMemberPermissions": {
        // Persiste em users.metadata.workspacePermissions[workspaceId].
        // Sem mudança de schema. RLS de Supabase já é o gatekeeper real.
        const { data: targetUser, error: fetchError } = await supabase
          .from("users")
          .select("metadata")
          .eq("id", payload.userId)
          .single();
        if (fetchError) throw fetchError;
        const existing =
          (targetUser?.metadata as Record<string, any> | null) ?? {};
        const wsPerms = (existing.workspacePermissions ?? {}) as Record<
          string,
          unknown
        >;
        const nextMetadata = {
          ...existing,
          workspacePermissions: {
            ...wsPerms,
            [payload.workspaceId]: payload.permissions,
          },
        };
        const { data, error } = await supabase
          .from("users")
          .update({ metadata: nextMetadata })
          .eq("id", payload.userId)
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
