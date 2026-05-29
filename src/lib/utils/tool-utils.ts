export function getAutoPreview(name: string, url: string) {
  const cleanName = name.toLowerCase().trim();
  const cleanUrl = url.toLowerCase().trim();
  
  const mappings = [
    { keys: ["figma"], slug: "figma", color: "#f24e1e" },
    { keys: ["slack"], slug: "slack", color: "#4a154b" },
    { keys: ["notion"], slug: "notion", color: "#ffffff" },
    { keys: ["chatgpt", "openai"], slug: "openai", color: "#10a37f" },
    { keys: ["claude", "anthropic"], slug: "anthropic", color: "#cc785c" },
    { keys: ["gemini"], slug: "googlegemini", color: "#4796e3" },
    { keys: ["drive", "google drive"], slug: "googledrive", color: "#1fa463" },
    { keys: ["canva"], slug: "canva", color: "#00c4cc" },
    { keys: ["github"], slug: "github", color: "#ffffff" },
    { keys: ["discord"], slug: "discord", color: "#5865f2" },
    { keys: ["capcut"], slug: "capcut", color: "#000000" },
    { keys: ["premiere"], slug: "adobepremierepro", color: "#9999ff" },
    { keys: ["railway"], slug: "railway", color: "#0b0d0e" },
    { keys: ["vercel"], slug: "vercel", color: "#000000" },
    { keys: ["supabase"], slug: "supabase", color: "#3ecf8e" },
    { keys: ["elevenlabs"], slug: "elevenlabs", color: "#000000" },
    { keys: ["runway"], slug: "runway", color: "#000000" },
    { keys: ["midjourney"], slug: "midjourney", color: "#000000" },
    { keys: ["sheets", "google sheets"], slug: "googlesheets", color: "#34a853" },
    { keys: ["hotmart"], slug: "hotmart", color: "#ef4e23" },
    { keys: ["stripe"], slug: "stripe", color: "#635bff" },
    { keys: ["facebook", "meta"], slug: "meta", color: "#0668e1" },
    { keys: ["tiktok"], slug: "tiktok", color: "#ff0050" },
    { keys: ["trello"], slug: "trello", color: "#0079bf" },
    { keys: ["jira"], slug: "jira", color: "#0052cc" },
    { keys: ["asana"], slug: "asana", color: "#f06a6a" },
    { keys: ["linear"], slug: "linear", color: "#5e6ad2" },
    { keys: ["analytics", "google analytics"], slug: "googleanalytics", color: "#e37400" },
  ];

  for (const map of mappings) {
    if (map.keys.some(k => cleanName.includes(k) || cleanUrl.includes(k))) {
      return { iconSlug: map.slug, brandColor: map.color };
    }
  }

  try {
    const domain = new URL(url).hostname.replace("www.", "").split(".")[0];
    if (domain && domain.length > 2) {
      return { iconSlug: domain, brandColor: "#3b82f6" };
    }
  } catch {}

  return { iconSlug: "globe", brandColor: "#3b82f6" };
}
