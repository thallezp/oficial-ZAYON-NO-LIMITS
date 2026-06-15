"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useUpsertStudyResource } from "@/hooks/use-queries";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, FileText, ImageIcon, Loader2 } from "lucide-react";

interface UpsertResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: any | null; // Pass a resource object to edit
}

export function UpsertResourceDialog({
  open,
  onOpenChange,
  resource,
}: UpsertResourceDialogProps) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const upsertResourceMutation = useUpsertStudyResource();

  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [authors, setAuthors] = React.useState("");
  const [type, setType] = React.useState("book");
  const [status, setStatus] = React.useState("backlog");
  const [area, setArea] = React.useState("");
  const [language, setLanguage] = React.useState("");
  const [year, setYear] = React.useState("");
  const [publisher, setPublisher] = React.useState("");
  const [pages, setPages] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState("");
  const [hoursDone, setHoursDone] = React.useState("");
  const [link, setLink] = React.useState("");
  const [isbn, setIsbn] = React.useState("");
  const [edition, setEdition] = React.useState("");
  const [rating, setRating] = React.useState(0);
  const [review, setReview] = React.useState("");
  const [recommend, setRecommend] = React.useState(false);
  const [tagsStr, setTagsStr] = React.useState("");
  const [coverUrl, setCoverUrl] = React.useState("");
  const [fileUrl, setFileUrl] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const [uploadingCover, setUploadingCover] = React.useState(false);
  const [uploadingFile, setUploadingFile] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (resource) {
        setTitle(resource.title || "");
        setSubtitle(resource.subtitle || "");
        setAuthors(resource.authors || "");
        setType(resource.type || "book");
        setStatus(resource.status || "backlog");
        setArea(resource.area || "");
        setLanguage(resource.language || "");
        setYear(resource.year ? String(resource.year) : "");
        setPublisher(resource.publisher || "");
        setPages(resource.pages ? String(resource.pages) : "");
        setCurrentPage(resource.currentPage ? String(resource.currentPage) : "0");
        setHoursDone(resource.hoursDone ? String(resource.hoursDone) : "0");
        setLink(resource.link || "");
        setIsbn(resource.isbn || "");
        setEdition(resource.edition || "");
        setRating(resource.rating || 0);
        setReview(resource.review || "");
        setRecommend(resource.recommend || false);
        setTagsStr(resource.tags ? (Array.isArray(resource.tags) ? resource.tags.join(", ") : "") : "");
        setCoverUrl(resource.coverUrl || "");
        setFileUrl(resource.fileUrl || "");
      } else {
        setTitle("");
        setSubtitle("");
        setAuthors("");
        setType("book");
        setStatus("backlog");
        setArea("");
        setLanguage("");
        setYear("");
        setPublisher("");
        setPages("");
        setCurrentPage("0");
        setHoursDone("0");
        setLink("");
        setIsbn("");
        setEdition("");
        setRating(0);
        setReview("");
        setRecommend(false);
        setTagsStr("");
        setCoverUrl("");
        setFileUrl("");
      }
    }
  }, [open, resource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) {
      toast.error("Nenhum workspace ativo.");
      return;
    }
    if (!title.trim()) {
      toast.error("Título é obrigatório.");
      return;
    }

    setSubmitting(true);
    try {
      const tags = tagsStr
        ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      await upsertResourceMutation.mutateAsync({
        id: resource?.id,
        workspaceId: activeWorkspaceId,
        title,
        subtitle: subtitle || null,
        authors: authors || null,
        type,
        status,
        area: area || null,
        language: language || null,
        year: year ? parseInt(year, 10) : null,
        publisher: publisher || null,
        pages: pages ? parseInt(pages, 10) : null,
        currentPage: currentPage ? parseInt(currentPage, 10) : 0,
        hoursDone: hoursDone ? parseInt(hoursDone, 10) : 0,
        link: link || null,
        isbn: isbn || null,
        edition: edition || null,
        rating: rating || null,
        review: review || null,
        recommend,
        tags,
        coverUrl: coverUrl || null,
        fileUrl: fileUrl || null,
      });

      toast.success(resource ? "Recurso atualizado!" : "Recurso criado com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar recurso.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resource ? "Editar Recurso" : "Novo Recurso (Biblioteca)"}</DialogTitle>
          <DialogDescription>
            Adicione ou edite livros, cursos, vídeos, artigos ou outros materiais na sua biblioteca de estudos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="title">Título do Recurso *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Designing Data-Intensive Applications"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex: The Big Ideas Behind Reliable, Scalable System"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="authors">Autores / Instrutores</Label>
                <Input
                  id="authors"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="Ex: Martin Kleppmann"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="book">Livro</SelectItem>
                      <SelectItem value="course">Curso</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="article">Artigo</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="doc">Documento</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Na Fila</SelectItem>
                      <SelectItem value="reading">Consumindo</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="abandoned">Abandonado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="area">Área / Assunto</Label>
                  <Input
                    id="area"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ex: Banco de Dados"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="language">Idioma</Label>
                  <Input
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="Ex: Inglês"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="pages">Total Págs</Label>
                  <Input
                    id="pages"
                    type="number"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    placeholder="612"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="currentPage">Pág Atual</Label>
                  <Input
                    id="currentPage"
                    type="number"
                    value={currentPage}
                    onChange={(e) => setCurrentPage(e.target.value)}
                    placeholder="120"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="hoursDone">Horas Dedic.</Label>
                  <Input
                    id="hoursDone"
                    type="number"
                    value={hoursDone}
                    onChange={(e) => setHoursDone(e.target.value)}
                    placeholder="25"
                    min={0}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2017"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edition">Edição</Label>
                  <Input
                    id="edition"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    placeholder="1ª Edição"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="publisher">Editora</Label>
                  <Input
                    id="publisher"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="O'Reilly"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="isbn">ISBN / ID</Label>
                  <Input
                    id="isbn"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-1449373320"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="link">Link de Acesso</Label>
                <Input
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="Ex: backend, arquitetura, infra"
                />
              </div>

              {/* Upload cover e arquivo PDF */}
              <div className="border border-dashed rounded-lg p-3 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5" /> Capa (Imagem)
                  </div>
                  {coverUrl && (
                    <span className="text-[10px] text-success font-semibold">Carregada ✔</span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="URL da Imagem de Capa"
                    className="h-8 text-xs flex-1"
                  />
                  <UploadButton
                    endpoint="materials"
                    onUploadBegin={() => setUploadingCover(true)}
                    onClientUploadComplete={(res) => {
                      setUploadingCover(false);
                      if (res?.[0]?.url) {
                        setCoverUrl(res[0].url);
                        toast.success("Capa enviada com sucesso!");
                      }
                    }}
                    onUploadError={(err) => {
                      setUploadingCover(false);
                      toast.error(`Erro ao carregar imagem: ${err.message}`);
                    }}
                    appearance={{
                      button: "h-8 px-3 text-xs bg-secondary hover:bg-secondary/80 text-foreground shadow-none",
                      allowedContent: "hidden",
                    }}
                    content={{
                      button: uploadingCover ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Upload"
                      ),
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> PDF / Arquivo
                  </div>
                  {fileUrl && (
                    <span className="text-[10px] text-success font-semibold">Carregado ✔</span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="URL do Arquivo PDF"
                    className="h-8 text-xs flex-1"
                  />
                  <UploadButton
                    endpoint="materials"
                    onUploadBegin={() => setUploadingFile(true)}
                    onClientUploadComplete={(res) => {
                      setUploadingFile(false);
                      if (res?.[0]?.url) {
                        setFileUrl(res[0].url);
                        toast.success("Arquivo enviado com sucesso!");
                      }
                    }}
                    onUploadError={(err) => {
                      setUploadingFile(false);
                      toast.error(`Erro ao carregar arquivo: ${err.message}`);
                    }}
                    appearance={{
                      button: "h-8 px-3 text-xs bg-secondary hover:bg-secondary/80 text-foreground shadow-none",
                      allowedContent: "hidden",
                    }}
                    content={{
                      button: uploadingFile ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Upload"
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-3">
            <div className="space-y-1">
              <Label>Avaliação</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-amber-400 hover:scale-110 transition"
                  >
                    <Star
                      className="h-5 w-5"
                      fill={rating >= star ? "currentColor" : "none"}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setRating(0)}
                    className="text-xs text-muted-foreground ml-2 hover:underline"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="recommend"
                checked={recommend}
                onCheckedChange={(v) => setRecommend(!!v)}
              />
              <Label
                htmlFor="recommend"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Recomendaria este recurso para outros?
              </Label>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="review">Resenha / Anotação Geral</Label>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="O que achou deste material? Quais as principais lições aprendidas?"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? "Salvando..." : resource ? "Atualizar" : "Salvar Recurso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
