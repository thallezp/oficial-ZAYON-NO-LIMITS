"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandMenu } from "@/components/command/command-menu";
import { AIPanel } from "@/components/ai/ai-panel";
import { QuickCreateDialog } from "./quick-create-dialog";
import { EnvironmentBanner } from "./environment-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <EnvironmentBanner />
        <Topbar />
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-8 sm:py-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
      <CommandMenu />
      <AIPanel />
      <QuickCreateDialog />
    </div>
  );
}
