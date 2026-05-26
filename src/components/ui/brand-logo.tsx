"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * BrandLogo · renderiza um logo SVG oficial do simpleicons.org via CDN.
 *
 * Não importa `simple-icons` no bundle. Faz fetch lazy do SVG raw e
 * renderiza inline para herdar `currentColor` (monocromático) ou usar
 * a `brandColor` fornecida.
 *
 * Cache em memória evita re-fetch.
 */

const SVG_CACHE = new Map<string, string | null>();
const PENDING = new Map<string, Promise<string | null>>();

async function fetchIcon(slug: string): Promise<string | null> {
  if (SVG_CACHE.has(slug)) return SVG_CACHE.get(slug) ?? null;
  if (PENDING.has(slug)) return PENDING.get(slug)!;

  const url = `https://cdn.simpleicons.org/${slug}/_/_`;
  const promise = fetch(url)
    .then((r) => (r.ok ? r.text() : null))
    .then((svg) => {
      // extrai o conteúdo <path> do SVG (cdn devolve <svg ...><path d=".."/></svg>)
      if (!svg) {
        SVG_CACHE.set(slug, null);
        return null;
      }
      const match = svg.match(/<path[^>]+d="([^"]+)"/);
      const path = match?.[1] ?? null;
      SVG_CACHE.set(slug, path);
      return path;
    })
    .catch(() => {
      SVG_CACHE.set(slug, null);
      return null;
    });

  PENDING.set(slug, promise);
  return promise;
}

export interface BrandLogoProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
  slug?: string;
  fallback?: string;
  size?: number;
  monochrome?: boolean;
  brandColor?: string;
}

export function BrandLogo({
  slug,
  fallback = "?",
  size = 18,
  monochrome = false,
  brandColor,
  className,
  ...props
}: BrandLogoProps) {
  const [path, setPath] = React.useState<string | null>(
    slug ? SVG_CACHE.get(slug) ?? null : null,
  );

  React.useEffect(() => {
    if (!slug) {
      setPath(null);
      return;
    }
    if (SVG_CACHE.has(slug)) {
      setPath(SVG_CACHE.get(slug) ?? null);
      return;
    }
    let mounted = true;
    fetchIcon(slug).then((res) => {
      if (mounted) setPath(res);
    });
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (!path) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center font-bold text-white select-none",
          className,
        )}
        style={{
          width: size,
          height: size,
          background: "transparent",
          fontSize: size * 0.55,
        }}
        {...props}
      >
        {fallback.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={monochrome ? "currentColor" : brandColor ?? "currentColor"}
      className={cn("inline-block shrink-0", className)}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
