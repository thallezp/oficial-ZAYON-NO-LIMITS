/**
 * Seed idempotente do STUDY → tabelas study_*. Upsert por sourceId (col source_id).
 * Origem: projeto THALLES STUDY (wxazhueckvkwerzzpyml), public.user_data.data (jsonb),
 * user_id 54cd93f9-3b20-4a78-9542-4518e52485d2.
 * Vias: (a) scripts/study-export.json colado pelo dono; (b) STUDY_SOURCE_DATABASE_URL (read-only).
 * Escopo: SEED_WORKSPACE_ID, SEED_PERSONA_ID?, SEED_USER_ID (envs).
 * Rodar: npx tsx scripts/seed-study.ts
 */
import postgres from "postgres";
import * as fs from "node:fs";

const PT2EN: Record<string, Record<string, string>> = {
  track: {
    "Ativo": "active",
    "Pausado": "paused",
    "Concluído": "completed",
    "Active": "active",
    "Paused": "paused",
    "Completed": "completed"
  },
  item: {
    "em andamento": "in_progress",
    "não iniciado": "not_started",
    "concluído": "completed",
    "in_progress": "in_progress",
    "not_started": "not_started",
    "completed": "completed"
  },
  resStatus: {
    "Na fila": "backlog",
    "Lendo": "reading",
    "Concluído": "completed",
    "Abandonado": "abandoned",
    "backlog": "backlog",
    "reading": "reading",
    "completed": "completed",
    "abandoned": "abandoned"
  },
  resType: {
    "Livro": "book",
    "Curso": "course",
    "Vídeo": "video",
    "Artigo": "article",
    "Outro": "other",
    "book": "book",
    "course": "course",
    "video": "video",
    "article": "article",
    "other": "other"
  },
};

async function loadSource(): Promise<any> {
  if (fs.existsSync("scripts/study-export.json")) {
    console.log("Loading data from scripts/study-export.json...");
    return JSON.parse(fs.readFileSync("scripts/study-export.json", "utf8"));
  }
  
  const sourceUrl = process.env.STUDY_SOURCE_DATABASE_URL;
  if (!sourceUrl) {
    throw new Error(
      "Source data not found. Please provide scripts/study-export.json or set STUDY_SOURCE_DATABASE_URL environment variable."
    );
  }
  
  console.log("Connecting to source database...");
  const src = postgres(sourceUrl, { prepare: false });
  try {
    const rows = await src`select data from user_data where user_id = '54cd93f9-3b20-4a78-9542-4518e52485d2'`;
    if (!rows.length) {
      throw new Error("No data found for user_id '54cd93f9-3b20-4a78-9542-4518e52485d2' in the source database.");
    }
    return rows[0].data;
  } finally {
    await src.end();
  }
}

async function main() {
  const data = await loadSource();
  const db = postgres(process.env.DATABASE_URL!, { prepare: false });
  
  // Scope settings: use environment variables, or fall back to Thalles' default values
  const WS = process.env.SEED_WORKSPACE_ID || '21b6c267-9f54-44f4-b42e-0466d8f94a49';
  const USER = process.env.SEED_USER_ID || '21b6c267-9f54-44f4-b42e-0466d8f94a49';
  const PERSONA = process.env.SEED_PERSONA_ID || '0a9bf42e-a67a-4ee7-8b25-f1f3288cb357';
  
  console.log(`Starting seed with scope WS=${WS}, USER=${USER}, PERSONA=${PERSONA}...`);
  
  const counts = { objectives: 0, tracks: 0, modules: 0, items: 0, resources: 0 };

  // Helper function to upsert rows into target database by source_id
  const upsert = async (table: string, sourceId: string, row: Record<string, any>) => {
    const existing = await db`select id from ${db(table)} where source_id = ${sourceId} and workspace_id = ${WS} limit 1`;
    if (existing.length) {
      await db`update ${db(table)} set ${db(row)} where id = ${existing[0].id}`;
      return existing[0].id;
    }
    const ins = await db`insert into ${db(table)} ${db({ ...row, source_id: sourceId, workspace_id: WS })} returning id`;
    return ins[0].id;
  };

  try {
    // 1) Objetivos
    console.log("Seeding objectives...");
    const objMap: Record<string, string> = {};
    for (const o of (data.objetivos ?? [])) {
      objMap[o.id] = await upsert("study_objectives", o.id, {
        persona_id: PERSONA,
        name: o.nome,
        emoji: o.emoji || null,
        category: o.categoria || null,
        status: "active",
        milestones: JSON.stringify(o.marcos ?? []),
        created_by: USER,
        updated_at: new Date()
      });
      counts.objectives++;
    }

    // 2) Recursos (antes de items p/ vincular)
    console.log("Seeding study resources...");
    const resMap: Record<string, string> = {};
    for (const r of (data.recursos ?? [])) {
      resMap[r.id] = await upsert("study_resources", r.id, {
        persona_id: PERSONA,
        objective_id: r.objetivoId ? objMap[r.objetivoId] : null,
        title: r.titulo,
        subtitle: r.subtitulo || null,
        authors: r.autores || null,
        area: r.area || null,
        type: PT2EN.resType[r.tipo] || "other",
        status: PT2EN.resStatus[r.status] || "backlog",
        language: r.idioma || null,
        year: r.ano || null,
        publisher: r.publisher || r.editora || null,
        pages: r.paginas || null,
        current_page: r.paginaAtual || 0,
        hours_done: r.horasConcluidas || 0,
        link: r.link || null,
        isbn: r.isbn || null,
        edition: r.edicao || null,
        rating: r.rating || null,
        review: r.resenha || null,
        recommend: r.recomendaria ?? null,
        tags: JSON.stringify(r.tags ?? []),
        cover_url: r.capaPath || null,
        file_url: r.pdfPath || null,
        created_by: USER,
        updated_at: new Date()
      });
      counts.resources++;
    }

    // 3) Trilhas → Módulos → Submódulos
    console.log("Seeding tracks, modules, and submodules...");
    for (const t of (data.trilhas ?? [])) {
      const trackId = await upsert("study_tracks", t.id, {
        persona_id: PERSONA,
        objective_id: t.objetivoId ? objMap[t.objectiveId] : null,
        name: t.nome,
        area: t.area || null,
        status: PT2EN.track[t.status] || "active",
        mode: t.modo || null,
        hours_target: t.horasMeta || null,
        created_by: USER,
        updated_at: new Date()
      });
      counts.tracks++;
      
      for (const [mi, m] of (t.modulos ?? []).entries()) {
        const moduleId = await upsert("study_modules", m.id, {
          track_id: trackId,
          name: m.nome,
          status: PT2EN.item[m.status] || "not_started",
          hours_target: m.horas || null,
          position: mi,
          expanded: !!m._expanded,
          updated_at: new Date()
        });
        counts.modules++;
        
        for (const [si, sm] of (m.submodulos ?? []).entries()) {
          const existingItem = await db`select id from study_module_items where source_id = ${sm.id} limit 1`;
          const itemRow = {
            module_id: moduleId,
            name: sm.nome,
            status: PT2EN.item[sm.status] || "not_started",
            hours: sm.horas || 1,
            position: si,
            resource_id: sm.recursoId ? (resMap[sm.recursoId] || null) : null,
            link: sm.link || null,
            source_id: sm.id,
            updated_at: new Date()
          };
          
          if (existingItem.length) {
            await db`update study_module_items set ${db(itemRow)} where id = ${existingItem[0].id}`;
          } else {
            await db`insert into study_module_items ${db(itemRow)}`;
          }
          counts.items++;
        }
      }
    }

    // 4) Integridade: nenhum item com resource_id órfão
    console.log("Checking integrity for orphaned resources...");
    const orphans = await db`
      select count(*)::int as n from study_module_items i
      where i.resource_id is not null and not exists (
        select 1 from study_resources r where r.id = i.resource_id
      )
    `;
    
    console.log("SEED OK!");
    console.log("Summary:", counts);
    console.log("Orphaned library relations in items:", orphans[0].n);
    
    if (orphans[0].n > 0) {
      console.warn(`WARNING: Found ${orphans[0].n} study items referencing orphaned resources.`);
    }

  } catch (error) {
    console.error("Seed execution failed:", error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
