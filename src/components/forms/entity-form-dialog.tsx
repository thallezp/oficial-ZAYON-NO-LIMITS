"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
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
import { toast } from "sonner";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "date"
  | "datetime";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
  colSpan?: 1 | 2;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FormField[];
  values?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
  submitLabel?: string;
  enableAI?: boolean;
}

export function EntityFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  values: initialValues,
  onSubmit,
  submitLabel = "Salvar",
  enableAI = false,
}: Props) {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      fields.forEach((f) => {
        initial[f.name] = initialValues?.[f.name] ?? f.defaultValue ?? "";
      });
      setValues(initial);
    }
  }, [open, fields, initialValues]);

  const update = (name: string, value: string) =>
    setValues((v) => ({ ...v, [name]: value }));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !values[f.name]?.trim()) {
        toast.error(`${f.label} é obrigatório`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form className="space-y-3" onSubmit={handle}>
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div
                key={f.name}
                className={f.colSpan === 2 ? "col-span-2 space-y-1" : "space-y-1"}
              >
                <Label htmlFor={f.name}>
                  {f.label}
                  {f.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {f.type === "textarea" && (
                  <Textarea
                    id={f.name}
                    value={values[f.name] ?? ""}
                    onChange={(e) => update(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                  />
                )}
                {(f.type === "text" || f.type === "number") && (
                  <Input
                    id={f.name}
                    type={f.type}
                    value={values[f.name] ?? ""}
                    onChange={(e) => update(f.name, e.target.value)}
                    placeholder={f.placeholder}
                  />
                )}
                {(f.type === "date" || f.type === "datetime") && (
                  <Input
                    id={f.name}
                    type={f.type === "date" ? "date" : "datetime-local"}
                    value={values[f.name] ?? ""}
                    onChange={(e) => update(f.name, e.target.value)}
                  />
                )}
                {f.type === "select" && (
                  <Select
                    value={values[f.name] ?? ""}
                    onValueChange={(v) => update(f.name, v)}
                  >
                    <SelectTrigger id={f.name}>
                      <SelectValue placeholder={f.placeholder ?? "Selecione…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 pt-2">
            {enableAI && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  toast.success("IA gerou rascunho", {
                    description: "Confira os campos preenchidos.",
                  })
                }
              >
                <Sparkles className="h-3.5 w-3.5" /> Sugerir com IA
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? "Salvando…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
