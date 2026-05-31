"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadToStorage } from "@/lib/upload";
import { toast } from "sonner";

/**
 * Botão de upload de imagem reutilizável (Supabase Storage).
 * Abre o seletor de arquivos, envia ao bucket `uploads` e devolve a URL pública
 * via onUploaded. Mostra "Enviando..." durante o upload.
 */
export function ImageUpload({
  folder,
  label = "Upar foto",
  maxMB = 8,
  onUploaded,
}: {
  folder: string;
  label?: string;
  maxMB?: number;
  onUploaded: (url: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Imagem muito grande (máx. ${maxMB}MB).`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToStorage(file, folder);
      onUploaded(url);
      toast.success("Imagem enviada!");
    } catch (e: any) {
      toast.error(`Erro no upload: ${e?.message ?? "tente novamente"}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="gradient"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Enviando..." : label}
      </Button>
    </>
  );
}
