"use client";

import { useEffect, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Code,
  Undo,
  Redo,
} from "lucide-react";

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TipTapEditor({ value, onChange }: TipTapEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [localContent, setLocalContent] = useState(value);

  // 使用 useCallback 来记忆更新函数
  const handleUpdate = useCallback(
    (newContent: string) => {
      setLocalContent(newContent);
      onChange(newContent);
    },
    [onChange]
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: localContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      handleUpdate(html);
    },
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none p-4 min-h-[400px] focus:outline-none",
      },
    },
    onCreate: ({ editor }) => {
      if (localContent && editor.isEmpty) {
        editor.commands.setContent(localContent);
      }
    },
    immediatelyRender: false
  });

  // 同步外部 value 变化
  useEffect(() => {
    if (editor && value !== localContent) {
      editor.commands.setContent(value);
      setLocalContent(value);
    }
  }, [editor, value, localContent]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !editor) {
    return null;
  }

  const onBold = () => editor.chain().focus().toggleBold().run();
  const onItalic = () => editor.chain().focus().toggleItalic().run();
  const onOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const onBulletList = () => editor.chain().focus().toggleBulletList().run();
  const onQuote = () => editor.chain().focus().toggleBlockquote().run();
  const onHeading = () => editor.chain().focus().toggleHeading({ level: 2 }).run();
  const onCode = () => editor.chain().focus().toggleCodeBlock().run();
  const onUndo = () => editor.chain().focus().undo().run();
  const onRedo = () => editor.chain().focus().redo().run();

  return (
    <div className="relative min-h-[500px] w-full rounded-md border">
      <div className="border-b bg-background p-2 flex gap-1 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBold}
          className={editor.isActive("bold") ? "bg-muted" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onItalic}
          className={editor.isActive("italic") ? "bg-muted" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOrderedList}
          className={editor.isActive("orderedList") ? "bg-muted" : ""}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBulletList}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onQuote}
          className={editor.isActive("blockquote") ? "bg-muted" : ""}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onHeading}
          className={editor.isActive("heading") ? "bg-muted" : ""}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCode}
          className={editor.isActive("codeBlock") ? "bg-muted" : ""}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onUndo}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRedo}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
