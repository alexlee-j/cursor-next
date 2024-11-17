"use client";

import { Suspense, lazy } from "react";

// 使用 lazy 和 Suspense 来延迟加载编辑器
const TipTapEditor = lazy(() =>
  import("./tiptap-editor").then((mod) => ({
    default: mod.TipTapEditor,
  }))
);

// 加载占位符组件
function EditorSkeleton() {
  return (
    <div className="relative min-h-[500px] w-full rounded-md border">
      <div className="border-b bg-background p-2 flex gap-1 flex-wrap">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-8 h-8 rounded bg-muted/20 animate-pulse" />
        ))}
      </div>
      <div className="min-h-[400px] p-4 bg-muted/10 animate-pulse" />
    </div>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor(props: RichTextEditorProps) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <TipTapEditor {...props} />
    </Suspense>
  );
}
