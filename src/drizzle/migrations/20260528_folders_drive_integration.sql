-- ============================================================================
-- Migration: Folders Drive integration
-- Adiciona colunas para armazenar URL de pasta externa (Google Drive, Dropbox)
-- ============================================================================

ALTER TABLE public.folders
  ADD COLUMN IF NOT EXISTS drive_url text,
  ADD COLUMN IF NOT EXISTS drive_provider text;

-- Index para filtrar pastas conectadas ao Drive
CREATE INDEX IF NOT EXISTS folders_drive_url_idx ON public.folders (drive_url)
  WHERE drive_url IS NOT NULL;

COMMENT ON COLUMN public.folders.drive_url IS
  'URL completa de uma pasta externa (ex: https://drive.google.com/drive/folders/<id>). Quando preenchida, o sistema renderiza a pasta via iframe embed.';

COMMENT ON COLUMN public.folders.drive_provider IS
  'Provedor da pasta externa: google, dropbox, onedrive. Default null = pasta local apenas.';
