import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import "@/styles/globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ZAYON No Limits",
    template: "%s · ZAYON",
  },
  description:
    "Sistema operacional interno premium. Workspace + Persona Ops em um único lugar.",
  applicationName: "ZAYON No Limits",
};

export const viewport: Viewport = {
  themeColor: "#0a0d1a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} dark`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
