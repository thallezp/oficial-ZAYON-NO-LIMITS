"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useStudyReviews,
  useReviewCard,
  useDeleteReview,
} from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpsertReviewDialog } from "@/components/study/upsert-review-dialog";
import { toast } from "sonner";
import {
  Brain,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit,
  GraduationCap,
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Eye,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function StudyReviewsPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  // Queries
  const { data: reviews = [], isLoading } = useStudyReviews(activeWorkspaceId);

  // Mutations
  const reviewCardMutation = useReviewCard();
  const deleteReviewMutation = useDeleteReview();

  // Local UI States
  const [search, setSearch] = React.useState("");
  const [kindFilter, setKindFilter] = React.useState<"all" | "flashcard" | "note" | "attack_note">("all");
  const [upsertOpen, setUpsertOpen] = React.useState(false);
  const [selectedReview, setSelectedReview] = React.useState<any | null>(null);

  // Active review session state
  const [inSession, setInSession] = React.useState(false);
  const [sessionCards, setSessionCards] = React.useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);

  // Filter due reviews (due_at <= now or no due_at)
  const dueReviews = React.useMemo(() => {
    const now = new Date();
    return reviews.filter(
      (r: any) => !r.dueAt || new Date(r.dueAt) <= now
    );
  }, [reviews]);

  // Start a new review session
  const handleStartSession = () => {
    if (dueReviews.length === 0) {
      toast.info("Não há itens pendentes para revisão no momento!");
      return;
    }
    // Copy due cards to freeze the list for the session duration
    setSessionCards([...dueReviews]);
    setCurrentIndex(0);
    setRevealed(false);
    setInSession(true);
    toast.success(`Sessão iniciada com ${dueReviews.length} cartões!`);
  };

  // Grade active card
  const handleGrade = async (grade: number) => {
    const activeCard = sessionCards[currentIndex];
    if (!activeCard) return;

    try {
      await reviewCardMutation.mutateAsync({
        id: activeCard.id,
        grade,
      });

      toast.success(
        grade >= 3
          ? "Lembrado! Próxima revisão agendada."
          : "Esboçado para reforço em breve."
      );

      // Advance or finish session
      if (currentIndex < sessionCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setRevealed(false);
      } else {
        setInSession(false);
        setSessionCards([]);
        toast.success("Parabéns! Você concluiu todas as revisões pendentes! 🧠🎉");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao computar revisão.");
    }
  };

  // Delete card
  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta nota de revisão permanentemente?")) {
      try {
        await deleteReviewMutation.mutateAsync({ id });
        toast.success("Item de revisão deletado com sucesso.");
      } catch (err: any) {
        toast.error(err.message || "Erro ao deletar.");
      }
    }
  };

  // Edit card
  const handleEdit = (rev: any) => {
    setSelectedReview(rev);
    setUpsertOpen(true);
  };

  // Filtered reviews list for management table/cards
  const filteredReviews = React.useMemo(() => {
    return reviews.filter((r: any) => {
      const matchesSearch =
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.content?.toLowerCase().includes(search.toLowerCase());
      const matchesKind = kindFilter === "all" || r.kind === kindFilter;
      return matchesSearch && matchesKind;
    });
  }, [reviews, search, kindFilter]);

  // Active card during session
  const activeCard = sessionCards[currentIndex];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revisões & Caderno"
        description="Fixe conceitos usando Repetição Espaçada (SM-2) e registre notas rápidas de brechas conceituais."
        actions={
          !inSession && (
            <Button variant="gradient" onClick={() => {
              setSelectedReview(null);
              setUpsertOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" /> Novo Card
            </Button>
          )
        }
      />

      {/* Stats Bento Box Row */}
      {!inSession && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/60 bg-card/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500">
                <Brain className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">A Revisar</p>
                <p className="text-xl font-bold font-mono">{dueReviews.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Em Aprendizado</p>
                <p className="text-xl font-bold font-mono">
                  {reviews.filter((r: any) => r.status === "learning").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Em Revisão</p>
                <p className="text-xl font-bold font-mono">
                  {reviews.filter((r: any) => r.status === "review").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Dominados</p>
                <p className="text-xl font-bold font-mono">
                  {reviews.filter((r: any) => r.status === "mastered").length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {inSession ? (
        // Active Session View
        <div className="max-w-xl mx-auto space-y-6">
          <Card className="border-primary/30 bg-card/60 shadow-[0_0_20px_rgba(var(--primary-rgb),0.05)]">
            <CardHeader className="border-b border-border/40 bg-muted/15 p-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary animate-pulse" />
                  Sessão de Revisão Ativa
                </CardTitle>
                <CardDescription className="text-xs">
                  Responda com honestidade para calibrar o algoritmo SM-2.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Deseja realmente cancelar a sessão de revisão atual?")) {
                    setInSession(false);
                    setSessionCards([]);
                  }
                }}
                className="text-destructive hover:bg-destructive/10"
              >
                Encerrar
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Progresso da Sessão</span>
                  <span className="font-mono">{currentIndex + 1} / {sessionCards.length}</span>
                </div>
                <Progress value={((currentIndex + 1) / sessionCards.length) * 100} className="h-1.5" />
              </div>

              {/* Card Surface */}
              <div className="min-h-56 p-6 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between items-center text-center relative overflow-hidden">
                <div className="absolute top-3 right-3 flex gap-1">
                  <Badge variant="default" className="capitalize text-[10px]">
                    {activeCard?.kind === "attack_note" ? "Nota de Ataque" : activeCard?.kind === "note" ? "Nota" : "Flashcard"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] capitalize",
                      activeCard?.status === "mastered" && "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
                      activeCard?.status === "review" && "text-purple-500 border-purple-500/20 bg-purple-500/5",
                      activeCard?.status === "learning" && "text-blue-500 border-blue-500/20 bg-blue-500/5"
                    )}
                  >
                    {activeCard?.status || "Novo"}
                  </Badge>
                </div>

                <div className="w-full flex-1 flex flex-col justify-center space-y-4 my-4">
                  {/* Front/Title */}
                  <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground px-4">
                    {activeCard?.title}
                  </h3>

                  {/* Back/Content (if revealed) */}
                  {revealed ? (
                    <div className="w-full text-sm text-left bg-card-elevated/40 border border-border/40 p-4 rounded-lg font-normal text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {activeCard?.content || <span className="italic text-muted-foreground/60">Sem resposta detalhada descrita.</span>}
                    </div>
                  ) : null}
                </div>

                {/* Flip control / Grade Selector */}
                <div className="w-full pt-4 border-t border-border/20 flex justify-center">
                  {!revealed ? (
                    <Button onClick={() => setRevealed(true)} size="lg" className="px-10">
                      <Eye className="h-4 w-4 mr-2" /> Mostrar Resposta
                    </Button>
                  ) : (
                    <div className="w-full space-y-3">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                        Qual foi sua facilidade em lembrar?
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleGrade(1)}
                          className="border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/10 text-rose-500 text-xs py-1"
                        >
                          Errei (1)
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleGrade(3)}
                          className="border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10 text-amber-500 text-xs py-1"
                        >
                          Difícil (3)
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleGrade(4)}
                          className="border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-500 text-xs py-1"
                        >
                          Bom (4)
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleGrade(5)}
                          className="border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/10 text-cyan-500 text-xs py-1"
                        >
                          Fácil (5)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Dashboard and Manager Tabs
        <Tabs defaultValue="panel" className="w-full space-y-4">
          <TabsList className="bg-muted/40 border border-border/40 rounded-lg">
            <TabsTrigger value="panel" className="text-xs font-semibold">Painel de Revisão</TabsTrigger>
            <TabsTrigger value="manager" className="text-xs font-semibold">Caderno & Coleção</TabsTrigger>
          </TabsList>

          <TabsContent value="panel" className="space-y-4">
            <Card className="border-border/60 bg-card/40">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-4 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <Brain className="h-8 w-8" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-lg font-bold">Revisão Pendente</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Você tem <strong className="text-foreground">{dueReviews.length}</strong> itens prontos para serem revisados hoje. Pratique regularmente para fortalecer a memória de longo prazo.
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={handleStartSession}
                  disabled={dueReviews.length === 0}
                  className="px-8 shadow-glow"
                  variant={dueReviews.length > 0 ? "gradient" : "outline"}
                >
                  {dueReviews.length > 0 ? (
                    <>Iniciar Sessão ({dueReviews.length}) <ArrowRight className="h-4 w-4 ml-2" /></>
                  ) : (
                    <>Nenhuma revisão pendente <CheckCircle2 className="h-4 w-4 ml-2 text-emerald-500" /></>
                  )}
                </Button>

                {dueReviews.length === 0 && (
                  <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Tudo revisado por hoje! Bom trabalho!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manager" className="space-y-4">
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg p-0.5 w-full md:w-auto">
                <button
                  onClick={() => setKindFilter("all")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-md transition",
                    kindFilter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Todos
                </button>
                <button
                  onClick={() => setKindFilter("flashcard")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-md transition",
                    kindFilter === "flashcard" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Flashcards
                </button>
                <button
                  onClick={() => setKindFilter("note")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-md transition",
                    kindFilter === "note" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Notas
                </button>
                <button
                  onClick={() => setKindFilter("attack_note")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-md transition",
                    kindFilter === "attack_note" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Ataques
                </button>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cards..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {/* Collection Grid */}
            {isLoading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">Carregando caderno...</div>
            ) : filteredReviews.length === 0 ? (
              <Card className="border-dashed border-border/60 bg-muted/5">
                <CardContent className="p-8 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-muted-foreground/45" />
                  Nenhum item de revisão cadastrado com estes filtros.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReviews.map((r: any) => {
                  const isDue = !r.dueAt || new Date(r.dueAt) <= new Date();
                  return (
                    <Card key={r.id} className="border-border/60 bg-card/40 hover:bg-card/60 transition-all flex flex-col justify-between overflow-hidden group">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <Badge variant={r.kind === "attack_note" ? "danger" : r.kind === "note" ? "outline" : "primary"} className="text-[9px] px-1.5 py-0">
                            {r.kind === "attack_note" ? "Ataque" : r.kind === "note" ? "Nota" : "Flashcard"}
                          </Badge>
                          <div className="flex gap-1">
                            {isDue && (
                              <Badge variant="outline" className="bg-orange-500/5 text-orange-500 border-orange-500/20 text-[9px] py-0">
                                A revisar
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] capitalize py-0",
                                r.status === "mastered" && "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
                                r.status === "review" && "text-purple-500 border-purple-500/20 bg-purple-500/5",
                                r.status === "learning" && "text-blue-500 border-blue-500/20 bg-blue-500/5"
                              )}
                            >
                              {r.status || "Novo"}
                            </Badge>
                          </div>
                        </div>
                        <h4 className="font-bold text-sm text-foreground leading-snug pt-2 line-clamp-2">{r.title}</h4>
                      </CardHeader>
                      <CardContent className="p-4 pt-1 space-y-4">
                        {r.content && (
                          <p className="text-xs text-muted-foreground/85 line-clamp-3 italic whitespace-pre-line border-l-2 border-border/40 pl-2">
                            "{r.content}"
                          </p>
                        )}
                        <div className="pt-2 border-t border-border/20 flex justify-between items-center text-[10px] text-muted-foreground">
                          <span className="font-mono">Reps: {r.reps || 0} | Fac: {Math.round(r.ease || 250)}%</span>
                          {r.dueAt && (
                            <span className="font-semibold text-foreground/80">
                              Rever: {new Date(r.dueAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>

                        {/* Hover controls */}
                        <div className="flex justify-end gap-1.5 pt-2 border-t border-border/10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(r)} className="h-7 w-7 p-0">
                            <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog for upserting reviews */}
      <UpsertReviewDialog
        open={upsertOpen}
        onOpenChange={setUpsertOpen}
        review={selectedReview}
      />
    </div>
  );
}
