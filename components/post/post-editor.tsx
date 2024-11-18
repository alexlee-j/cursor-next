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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const postFormSchema = z.object({
  title: z.string().min(1, { message: "标题不能为空" }),
  content: z.string().min(1, { message: "内容不能为空" }),
});

type PostFormValues = z.infer<typeof postFormSchema>;

interface PostEditorProps {
  post?: {
    id: string;
    title: string;
    content: string;
    type: string;
    status: string;
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

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
    },
  });

  async function handleSubmit(
    data: PostFormValues,
    status: "DRAFT" | "PUBLISHED"
  ) {
    try {
      setIsSubmitting(true);
      const url = post ? `/api/posts/${post.id}` : "/api/posts";
      const method = post ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          type: editorType,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(post ? "更新失败" : "发布失败");
      }

      toast({
        title: post ? "更新成功" : "发布成功",
        description: status === "PUBLISHED" ? "文章已发布" : "文章已保存为草稿",
      });

      router.push("/dashboard/posts");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: post ? "更新失败" : "发布失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const content = form.watch("content");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => handleSubmit(data, "DRAFT"))}
        className="space-y-8"
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

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "editor" | "preview")}
        >
          <TabsList>
            <TabsTrigger value="editor">编辑</TabsTrigger>
            <TabsTrigger value="preview">预览</TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className="space-y-4">
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
            </div>
          </TabsContent>
          <TabsContent value="preview">
            <Preview content={content} type={editorType} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              form.handleSubmit((data) => handleSubmit(data, "DRAFT"))()
            }
            disabled={isSubmitting}
          >
            保存草稿
          </Button>
          <Button
            type="button"
            onClick={() =>
              form.handleSubmit((data) => handleSubmit(data, "PUBLISHED"))()
            }
            disabled={isSubmitting}
          >
            {isSubmitting ? "发布中..." : "发布文章"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
