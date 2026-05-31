/**
 * Categorias canônicas de ferramentas do Tools Hub (config real, não mock).
 */
export const TOOL_CATEGORIES = [
  "IA",
  "Design",
  "Vídeo",
  "Desenvolvimento",
  "Banco de Dados",
  "Comunicação",
  "Automação",
  "Marketing",
  "Analytics",
  "Financeiro",
  "Conteúdo",
  "Ads",
  "Storage",
] as const;

/**
 * Subcategorias sugeridas por categoria (sub-abas). O usuário pode usar estas
 * ou digitar uma própria no formulário da ferramenta — qualquer subcategoria
 * usada por alguma ferramenta também aparece como sub-aba automaticamente.
 */
export const TOOL_SUBCATEGORIES: Record<string, string[]> = {
  IA: [
    "IA de Texto",
    "IA de Imagem",
    "IA de Vídeo",
    "IA de Voz / Áudio",
    "IA de Música",
    "IA de Código",
    "IA de Apresentações",
    "IA de Pesquisa",
    "IA de Avatares",
    "Agentes de IA",
  ],
  Vídeo: ["Edição", "Captura / Gravação", "Legendas", "Hospedagem"],
  Design: ["UI/UX", "Gráfico", "Mockups", "Banco de imagens"],
  Marketing: ["SEO", "Social Media", "Email", "CRM"],
};

