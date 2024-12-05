"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { MarkdownEditor } from "./markdown-editor";
import { RichTextEditor } from "./rich-text-editor";
import { Preview } from "./preview";
import { TagSelect } from "../tag-select";

interface Tag {
  id: string;
  name: string;
}

const postFormSchema = z.object({
  title: z.string().min(1, { message: "标题不能为空" }),
  content: z.string().min(1, { message: "内容不能为空" }),
  excerpt: z.string().optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

type PostStatus = "DRAFT" | "PUBLISHED";

interface PostEditorProps {
  post?: {
    id: string;
    title: string;
    content: string;
    excerpt?: string;
    type: string;
    status: PostStatus;
    tags: Tag[];
  };
}

export function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editorType, setEditorType] = useState<"markdown" | "richtext">(
    (post?.type as "markdown" | "richtext") || "markdown"
  );
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(post?.tags || []);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
      excerpt: post?.excerpt || "",
    },
  });

  const onSubmit = async (
    data: PostFormValues,
    status: "DRAFT" | "PUBLISHED"
  ) => {
    try {
      setIsSubmitting(true);

      // 确保内容不为空且为有效的 HTML 字符串
      if (!data.content || data.content === "<p></p>") {
        toast({
          title: "错误",
          description: "内容不能为空",
          variant: "destructive",
        });
        return;
      }

      // 清理和验证 HTML 内容
      const cleanContent = data.content.trim();

      const formData = {
        ...data,
        content: cleanContent,
        type: editorType,
        status,
        tags: selectedTags,
      };

      const response = await fetch(
        post?.id ? `/api/posts/${post.id}` : "/api/posts",
        {
          method: post?.id ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "操作失败，请稍后重试");
      }

      toast({
        title: post?.id ? "更新成功" : "发布成功",
        description: status === "PUBLISHED" ? "文章已发布" : "文章已保存为草稿",
      });

      router.push("/dashboard/posts");
    } catch (error) {
      console.error("Error submitting post:", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "操作失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = form.watch("content");

  return (
    <Form {...form}>
      <form
        className="space-y-8"
        onSubmit={form.handleSubmit(onSubmit)}
        data-testid="post-editor-form"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>标题</FormLabel>
              <FormControl>
                <Input placeholder="输入文章标题" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>摘要</FormLabel>
              <FormControl>
                <Input placeholder="输入文章摘要（可选）" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant={editorType === "markdown" ? "default" : "outline"}
              onClick={() => setEditorType("markdown")}
            >
              Markdown
            </Button>
            <Button
              type="button"
              variant={editorType === "richtext" ? "default" : "outline"}
              onClick={() => setEditorType("richtext")}
            >
              富文本
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "editor" | "preview")}>
            <TabsList>
              <TabsTrigger value="editor">编辑</TabsTrigger>
              <TabsTrigger value="preview">预览</TabsTrigger>
            </TabsList>
            <TabsContent value="editor">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      {editorType === "markdown" ? (
                        <MarkdownEditor {...field} />
                      ) : (
                        <RichTextEditor {...field} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="preview">
              <Preview content={content} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-2">
          <FormLabel>标签</FormLabel>
          <TagSelect
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>

        <div className="flex items-center space-x-4">
          <Button
            type="button"
            onClick={() => {
              form.handleSubmit((data) => onSubmit(data, "DRAFT"))();
            }}
            disabled={isSubmitting}
          >
            保存草稿
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => {
              form.handleSubmit((data) => onSubmit(data, "PUBLISHED"))();
            }}
            disabled={isSubmitting}
          >
            发布
          </Button>
        </div>
      </form>
    </Form>
  );
}
