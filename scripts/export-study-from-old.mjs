/**
 * Exporta TODO o dado do STUDY antigo (projeto Supabase THALLES STUDY,
 * wxazhueckvkwerzzpyml → tabela public.user_data, coluna `data` jsonb) para
 * scripts/study-export.json. Esse arquivo é a entrada do seed (Fase 6) e também
 * serve de backup completo.
 *
 * Roda LOCALMENTE (o dado não passa por nenhuma IA). Usa a service_role key do
 * projeto antigo (bypassa RLS). Rodar a partir da RAIZ do repo NO LIMITS, pois
 * usa o @supabase/supabase-js já instalado aqui.
 *
 * USO (PowerShell):
 *   $env:STUDY_SERVICE_KEY="<service_role do projeto THALLES STUDY>"; node scripts/export-study-from-old.mjs
 *
 * Onde achar a key: Supabase Dashboard → projeto "THALLES STUDY" →
 *   Project Settings → API → Project API keys → `service_role` (secret).
 * É um segredo: rode localmente; se quiser, rotacione depois.
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const URL = process.env.STUDY_SOURCE_URL || "https://wxazhueckvkwerzzpyml.supabase.co";
const KEY = process.env.STUDY_SERVICE_KEY;
const USER_ID = process.env.STUDY_SOURCE_USER_ID || "54cd93f9-3b20-4a78-9542-4518e52485d2";

if (!KEY) {
  console.error("[erro] Defina STUDY_SERVICE_KEY (service_role do projeto THALLES STUDY).");
  process.exit(1);
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const { data, error } = await sb
  .from("user_data")
  .select("data")
  .eq("user_id", USER_ID)
  .single();

if (error) {
  console.error("[erro] Falha ao ler user_data:", error.message);
  process.exit(1);
}

const d = data?.data ?? {};
writeFileSync("scripts/study-export.json", JSON.stringify(d, null, 2), "utf8");

const n = (k) => (Array.isArray(d?.[k]) ? d[k].length : 0);
console.log("[ok] Gravado scripts/study-export.json");
console.table({
  trilhas: n("trilhas"),
  recursos: n("recursos"),
  objetivos: n("objetivos"),
  sessoes: n("sessoes"),
  trabalhoSessoes: n("trabalhoSessoes"),
  revisoes: n("revisoes"),
  metas: n("metas"),
  conquistas_desbloqueadas: n("conquistas_desbloqueadas"),
});
