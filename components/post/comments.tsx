"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle } from "lucide-react";

const commentSchema = z.object({
  content: z.string().min(1, { message: "评论内容不能为空" }),
});

interface CommentsProps {
  postId: string;
  initialComments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    user: {
      name: string | null;
      email: string;
    };
  }>;
  isLoggedIn: boolean;
}

export function Comments({
  postId,
  initialComments,
  isLoggedIn,
}: CommentsProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState(initialComments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  async function onSubmit(values: z.infer<typeof commentSchema>) {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("发表评论失败");
      }

      const newComment = await response.json();
      setComments([newComment, ...comments]);
      form.reset();

      toast({
        description: "评论发表成功",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "发表评论失败，请稍后重试",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReply = (commentId: string) => {
    if (!isLoggedIn) {
      toast({
        description: "请先登录后再回复评论",
        action: (
          <a href="/login">
            <Button variant="outline" size="sm">
              去登录
            </Button>
          </a>
        ),
      });
      return;
    }
    setReplyingTo(commentId);
    setReply("");
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReply(null);
  };

  // 获取用户名首字母的辅助函数
  const getInitials = (name: string | null, email: string) => {
    if (name) return name.charAt(0).toUpperCase();
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {isLoggedIn ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="写下你的评论..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "发表中..." : "发表评论"}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-muted-foreground">登录后可以发表评论</p>
          <a href="/login">
            <Button variant="outline" className="mt-2">
              去登录
            </Button>
          </a>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg border p-4">
            <div className="flex items-start space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(comment.user.name, comment.user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {comment.user.name || comment.user.email}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </div>
                </div>
                <p className="text-sm">{comment.content}</p>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleReply(comment.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    回复
                  </Button>
                </div>
                {replyingTo === comment.id && (
                  <div className="mt-2">
                    <Textarea
                      value={reply || ""}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="输入回复..."
                      className="min-h-[80px]"
                    />
                    <div className="mt-2 flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelReply}
                      >
                        取消
                      </Button>
                      <Button size="sm">发送回复</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
