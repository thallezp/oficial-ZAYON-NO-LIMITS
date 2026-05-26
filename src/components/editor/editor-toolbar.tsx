"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  editor: Editor | null;
}

interface ToolItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: () => boolean;
  command: () => void;
}

export function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  const groups: ToolItem[][] = [
    [
      {
        icon: Undo2,
        label: "Desfazer",
        isActive: () => false,
        command: () => editor.chain().focus().undo().run(),
      },
      {
        icon: Redo2,
        label: "Refazer",
        isActive: () => false,
        command: () => editor.chain().focus().redo().run(),
      },
    ],
    [
      {
        icon: Heading1,
        label: "H1",
        isActive: () => editor.isActive("heading", { level: 1 }),
        command: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        icon: Heading2,
        label: "H2",
        isActive: () => editor.isActive("heading", { level: 2 }),
        command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        icon: Heading3,
        label: "H3",
        isActive: () => editor.isActive("heading", { level: 3 }),
        command: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
    ],
    [
      {
        icon: Bold,
        label: "Negrito",
        isActive: () => editor.isActive("bold"),
        command: () => editor.chain().focus().toggleBold().run(),
      },
      {
        icon: Italic,
        label: "Itálico",
        isActive: () => editor.isActive("italic"),
        command: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        icon: Strikethrough,
        label: "Tachado",
        isActive: () => editor.isActive("strike"),
        command: () => editor.chain().focus().toggleStrike().run(),
      },
      {
        icon: Code,
        label: "Código inline",
        isActive: () => editor.isActive("code"),
        command: () => editor.chain().focus().toggleCode().run(),
      },
    ],
    [
      {
        icon: List,
        label: "Lista",
        isActive: () => editor.isActive("bulletList"),
        command: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        icon: ListOrdered,
        label: "Lista ordenada",
        isActive: () => editor.isActive("orderedList"),
        command: () => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        icon: CheckSquare,
        label: "Checklist",
        isActive: () => editor.isActive("taskList"),
        command: () => editor.chain().focus().toggleTaskList().run(),
      },
      {
        icon: Quote,
        label: "Citação",
        isActive: () => editor.isActive("blockquote"),
        command: () => editor.chain().focus().toggleBlockquote().run(),
      },
    ],
    [
      {
        icon: LinkIcon,
        label: "Link",
        isActive: () => editor.isActive("link"),
        command: () => {
          const url = window.prompt("URL");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        },
      },
    ],
  ];

  return (
    <div className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 rounded-xl border border-border/60 bg-card/90 backdrop-blur-xl p-1 shadow-soft">
      {groups.map((g, i) => (
        <React.Fragment key={i}>
          {g.map((item) => (
            <button
              key={item.label}
              type="button"
              title={item.label}
              onClick={item.command}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground",
                item.isActive() && "bg-primary/15 text-primary",
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
            </button>
          ))}
          {i < groups.length - 1 && (
            <span className="mx-1 h-5 w-px bg-border" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
