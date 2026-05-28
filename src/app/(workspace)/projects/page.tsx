"use client";

import { motion } from "framer-motion";
import { Folder, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MOCK_PROJECTS, MOCK_PERSONAS } from "@/data";
import { initials } from "@/lib/utils/format";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useProjects, usePersonas } from "@/hooks/use-queries";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";

export default function ProjectsPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const openQuickCreate = useQuickCreate((s) => s.setOpen);
  const openWith = useQuickCreate((s) => s.openWith);
  useNewEntityShortcut("project");

  const { data: dbProjects = [] } = useProjects(activeWorkspaceId);
  const { data: dbPersonas = [] } = usePersonas(activeWorkspaceId);

  const projects = isMockModeClient && dbProjects.length === 0 ? MOCK_PROJECTS : dbProjects;
  const personas =
    isMockModeClient && dbPersonas.length === 0 ? MOCK_PERSONAS : dbPersonas;

  const handleCreateProject = () => {
    openWith("project");
    openQuickCreate(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos"
        description="Iniciativas de longo prazo · podem ser globais ou vinculadas a uma persona."
        actions={
          <Button variant="gradient" size="sm" onClick={handleCreateProject}>
            <Plus className="h-4 w-4" /> Novo Projeto
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p: any, i: number) => {
          const persona = personas.find((x: any) => x.id === p.personaId);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card variant="elevated" className="group hover:border-primary/40 transition relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                  style={{
                    background: `radial-gradient(at top right, ${p.color}25, transparent 60%)`,
                  }}
                />
                <CardContent className="relative p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: `${p.color}30`, color: p.color }}
                    >
                      <Folder className="h-4 w-4" />
                    </div>
                    {persona && (
                      <Badge
                        size="sm"
                        variant="outline"
                        className="border-primary/30"
                      >
                        {persona.name}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg leading-tight">
                      {p.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium num">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {p.members?.slice(0, 4).map((m: any) => (
                        <Avatar key={m.id} size="xs" className="ring-2 ring-card">
                          <AvatarFallback>
                            {initials(m.fullName)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <Badge size="sm" variant="outline">
                      {p.taskCount?.done}/{p.taskCount?.total} tarefas
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        <button
          onClick={handleCreateProject}
          className="rounded-xl border-2 border-dashed border-border/60 bg-card/20 flex flex-col items-center justify-center gap-2 py-10 transition hover:border-primary/40 hover:bg-card/40"
        >
          <Plus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Criar novo projeto</span>
          <Badge variant="ghost" size="sm">
            <Sparkles className="h-3 w-3" /> IA pode sugerir
          </Badge>
        </button>
      </div>
    </div>
  );
}
