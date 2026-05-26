"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { EditorToolbar } from "./editor-toolbar";
import { cn } from "@/lib/utils/cn";

interface RichEditorProps {
  initialContent?: string;
  placeholder?: string;
  className?: string;
  onChange?: (html: string) => void;
}

export function RichEditor({
  initialContent,
  placeholder = "Comece a escrever ou digite '/' para comandos…",
  className,
  onChange,
}: RichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          "prose-editor focus:outline-none",
          "min-h-[60vh] w-full max-w-3xl",
        ),
      },
    },
  });

  return (
    <div className={cn("space-y-3", className)}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <style jsx global>{`
        .prose-editor {
          color: hsl(var(--foreground));
          line-height: 1.7;
        }
        .prose-editor h1 {
          font-size: 2rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin: 1.5rem 0 0.75rem;
        }
        .prose-editor h2 {
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: -0.015em;
          margin: 1.25rem 0 0.5rem;
        }
        .prose-editor h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 1rem 0 0.4rem;
        }
        .prose-editor p {
          margin: 0.5rem 0;
        }
        .prose-editor ul,
        .prose-editor ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .prose-editor ul li {
          list-style: disc;
        }
        .prose-editor ol li {
          list-style: decimal;
        }
        .prose-editor ul[data-type="taskList"] {
          padding-left: 0;
          list-style: none;
        }
        .prose-editor ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          list-style: none;
        }
        .prose-editor ul[data-type="taskList"] li > label {
          margin-top: 0.25rem;
        }
        .prose-editor ul[data-type="taskList"] li > div {
          flex: 1;
        }
        .prose-editor ul[data-type="taskList"] li[data-checked="true"] > div {
          color: hsl(var(--muted-foreground));
          text-decoration: line-through;
        }
        .prose-editor blockquote {
          border-left: 3px solid hsl(var(--primary));
          padding-left: 1rem;
          color: hsl(var(--muted-foreground));
          font-style: italic;
          margin: 1rem 0;
        }
        .prose-editor code {
          background: hsl(var(--secondary));
          padding: 0.1rem 0.35rem;
          border-radius: 0.25rem;
          font-family: var(--font-geist-mono), monospace;
          font-size: 0.85em;
        }
        .prose-editor pre {
          background: hsl(var(--surface-2));
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          margin: 1rem 0;
          font-family: var(--font-geist-mono), monospace;
          font-size: 0.85em;
          overflow-x: auto;
        }
        .prose-editor hr {
          border: 0;
          border-top: 1px solid hsl(var(--border));
          margin: 1.5rem 0;
        }
        .prose-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground) / 0.6);
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>
    </div>
  );
}
