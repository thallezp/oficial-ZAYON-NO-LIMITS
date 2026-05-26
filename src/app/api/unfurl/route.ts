import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "Parâmetro url é obrigatório" },
        { status: 400 },
      );
    }

    // Garante que a URL tem protocolo
    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      next: { revalidate: 86400 }, // Cache por 1 dia
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao acessar a URL" },
        { status: 500 },
      );
    }

    const html = await response.text();

    // Regex simples para capturar metadados do HTML
    const titleRegex = /<title[^>]*>([^<]+)<\/title>/i;
    const ogTitleRegex =
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i;
    const ogTitleRegexAlt =
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i;

    const descRegex =
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i;
    const ogDescRegex =
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i;
    const ogDescRegexAlt =
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i;

    const ogImageRegex =
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;
    const ogImageRegexAlt =
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i;

    const titleMatch =
      html.match(ogTitleRegex) ||
      html.match(ogTitleRegexAlt) ||
      html.match(titleRegex);
    const descMatch =
      html.match(ogDescRegex) ||
      html.match(ogDescRegexAlt) ||
      html.match(descRegex);
    const imageMatch = html.match(ogImageRegex) || html.match(ogImageRegexAlt);

    const parsedUrl = new URL(targetUrl);
    const favicon = `${parsedUrl.protocol}//${parsedUrl.host}/favicon.ico`;

    return NextResponse.json({
      title: titleMatch ? titleMatch[1].trim() : parsedUrl.host,
      description: descMatch ? descMatch[1].trim() : "",
      image: imageMatch ? imageMatch[1] : "",
      favicon,
      domain: parsedUrl.host,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro desconhecido" },
      { status: 500 },
    );
  }
}
