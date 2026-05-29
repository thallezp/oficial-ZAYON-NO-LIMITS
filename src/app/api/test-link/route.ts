import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ ok: false, status: "Sem URL", error: "URL inválida ou vazia" });
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: controller.signal,
      });
      clearTimeout(id);
      return NextResponse.json({ ok: res.ok, status: res.status });
    } catch (fetchErr: any) {
      clearTimeout(id);
      // Fallback: try with HEAD
      const controllerHead = new AbortController();
      const idHead = setTimeout(() => controllerHead.abort(), 3000);
      try {
        const resHead = await fetch(url, {
          method: "HEAD",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          signal: controllerHead.signal,
        });
        clearTimeout(idHead);
        return NextResponse.json({ ok: resHead.ok, status: resHead.status });
      } catch {
        clearTimeout(idHead);
        return NextResponse.json({ ok: false, status: "Offline", error: fetchErr.message });
      }
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, status: "Erro", error: err.message });
  }
}
