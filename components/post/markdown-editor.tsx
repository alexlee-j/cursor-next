"use client";

import { Editor } from "@monaco-editor/react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div className="relative min-h-[500px] w-full rounded-md border">
      <Editor
        height="500px"
        defaultLanguage="markdown"
        value={value}
        onChange={(value) => onChange(value || "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          lineNumbers: "on",
          wordWrap: "on",
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          fontSize: 14,
          renderLineHighlight: "none",
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
