"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PreviewProps {
  content: string;
  type: "markdown" | "richtext";
}

export function Preview({ content, type }: PreviewProps) {
  if (type === "markdown") {
    return (
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
