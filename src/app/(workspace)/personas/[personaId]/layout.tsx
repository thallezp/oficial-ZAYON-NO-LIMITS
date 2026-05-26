"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePersonaStore } from "@/stores/persona-store";

export default function PersonaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ personaId: string }>();
  const setActivePersona = usePersonaStore((s) => s.setActivePersona);

  React.useEffect(() => {
    if (params?.personaId) {
      setActivePersona(params.personaId);
    }
  }, [params?.personaId, setActivePersona]);

  return <>{children}</>;
}
