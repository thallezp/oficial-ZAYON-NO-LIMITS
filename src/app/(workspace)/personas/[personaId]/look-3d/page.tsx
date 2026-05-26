"use client";

import { Sparkles, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";

export default function LookPage() {
  const persona = usePersonaFromRoute();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Look 3D · Identidade"
        description="Tudo o que define a persona como uma entidade única."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Upload className="h-3.5 w-3.5" /> Upload assets
            </Button>
            <Button variant="gradient" size="sm">
              <Sparkles className="h-4 w-4" /> Refinar com IA
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="identidade" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Posicionamento</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome" value={persona.name} />
            <Field label="Codinome" value={persona.codename} />
            <Field label="Status" value={persona.status} />
            <Field label="Nicho" value={persona.niche} />
            <Field label="Objetivo de negócio" value={persona.objective} colSpan={2} />
            <FieldArea label="Big idea" value={persona.bigIdea} colSpan={2} />
            <FieldArea label="Bio curta" value={persona.bioShort} colSpan={2} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voz e personalidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Tom de voz" value={persona.voiceTone} />
            <Field label="Arquétipo" value={persona.archetype} />
            <div>
              <Label>Traços</Label>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {persona.personality?.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <FieldArea label="Diretrizes" value={persona.guidelines} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estética</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Estilo visual" value={persona.visualStyle} />
            <Field label="Estilo de vestimenta" value={persona.dressStyle} />
            <Field
              label="Cor accent"
              value={persona.accent}
              suffix={
                <span
                  className="h-4 w-4 rounded-full ring-2 ring-card"
                  style={{ background: persona.accent }}
                />
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Palavras preferidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1">
            {persona.preferredWords?.map((w) => (
              <Badge key={w} variant="success">
                {w}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Palavras proibidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1">
            {persona.forbiddenWords?.map((w) => (
              <Badge key={w} variant="danger">
                {w}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  colSpan,
  suffix,
}: {
  label: string;
  value?: string;
  colSpan?: number;
  suffix?: React.ReactNode;
}) {
  return (
    <div className={colSpan === 2 ? "sm:col-span-2 space-y-1" : "space-y-1"}>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input defaultValue={value} className="flex-1" />
        {suffix}
      </div>
    </div>
  );
}

function FieldArea({
  label,
  value,
  colSpan,
}: {
  label: string;
  value?: string;
  colSpan?: number;
}) {
  return (
    <div className={colSpan === 2 ? "sm:col-span-2 space-y-1" : "space-y-1"}>
      <Label>{label}</Label>
      <Textarea defaultValue={value} rows={3} />
    </div>
  );
}
