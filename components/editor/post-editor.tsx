"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TagSelect } from "./tag-select";

interface PostEditorProps {
  initialData?: {
    id?: string;
    title: string;
    content: string;
    excerpt?: string;
    tags?: string[];
    type: "markdown" | "richtext";
  };
  mode?: "create" | "edit";
}

export function PostEditor({ initialData, mode = "create" }: PostEditorProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
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
      const url =
        mode === "edit" ? `/api/posts/${initialData?.id}` : "/api/posts";
      const method = mode === "edit" ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          tags,
          type: "markdown",
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("提交失败");
      }

      const data = await response.json();
      toast({
        title: status === "PUBLISHED" ? "发布成功" : "保存成功",
      });

      // 跳转到文章详情页
      router.push(`/posts/${data.id}`);
    } catch (error) {
      console.error("Error submitting post:", error);
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
        <TagSelect selectedTags={tags} onChange={setTags} />
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
