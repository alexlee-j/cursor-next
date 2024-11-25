"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PostEditorProps {
  initialData?: {
    id?: string;
    title: string;
    content: string;
    excerpt?: string;
    type: "markdown" | "richtext";
  };
  mode?: "create" | "edit";
}

export function PostEditor({ initialData, mode = "create" }: PostEditorProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "请填写标题和内容",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 构建基本数据
      const postData = {
        title,
        content,
        excerpt,
        type: "markdown" as const,
        status,
      };

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      toast({
        title: status === "PUBLISHED" ? "发布成功" : "保存成功",
      });

      router.push(`/posts/${data.id}`);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "提交失败",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="文章标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="文章简介（可选）"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="开始写作..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => handleSubmit("DRAFT")}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "保存草稿"
          )}
        </Button>
        <Button
          onClick={() => handleSubmit("PUBLISHED")}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "发布文章"
          )}
        </Button>
      </div>
    </div>
  );
}
