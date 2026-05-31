import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Faz upload de um arquivo para o bucket público `uploads` do Supabase Storage
 * e retorna a URL pública. Substitui o UploadThing (sem dependência externa /
 * sem token). Usa a sessão do usuário (RLS: insert liberado p/ authenticated).
 */
export async function uploadToStorage(
  file: File,
  folder = "misc",
): Promise<string> {
  const supabase = supabaseBrowser();
  const safeExt = (file.name.split(".").pop() || "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${crypto.randomUUID()}.${safeExt}`;

  const { error } = await supabase.storage.from("uploads").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("uploads").getPublicUrl(path);
  return data.publicUrl;
}
