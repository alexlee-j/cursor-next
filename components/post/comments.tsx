"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Comment } from "./comment";

interface ReplyType {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    isAuthor?: boolean;
  };
  replyTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface CommentType {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    isAuthor?: boolean;
  };
  replies: ReplyType[];
  parentId?: string;
  depth?: number;
  status: string;
}

interface CommentsProps {
  postId: string;
  initialComments: CommentType[];
  isLoggedIn: boolean;
}

export function Comments({
  postId,
  initialComments,
  isLoggedIn,
}: CommentsProps) {
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "请输入评论内容",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("评论失败");
      }

      const newComment = await response.json();
      

      // 只有评论状态为 APPROVED 时才添加到列表中
      if (newComment.status === "APPROVED") {
        setComments((prev) => [{
          ...newComment,
          replies: [], // 新评论没有回复
        }, ...prev]);
        toast({
          title: "评论成功",
        });
      } else {
        toast({
          title: "评论成功",
          description: "评论正在审核中，通过后将自动显示",
        });
      }
      setContent("");
    } catch (error) {
      toast({
        title: "评论失败",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (
    content: string,
    commentId: string,
    replyToId: string
  ) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          parentId: commentId,
          replyToId,
        }),
      });

      if (!response.ok) {
        throw new Error("回复失败");
      }

      const newReply = await response.json();
      
      // 只有回复状态为 APPROVED 时才添加到列表中
      if (newReply.status === "APPROVED") {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === commentId) {
              // 找到要回复的评论
              const replyToUser = comment.replies.find(r => r.user.id === replyToId)?.user || comment.user;
              return {
                ...comment,
                replies: [...comment.replies, {
                  ...newReply,
                  replyTo: {
                    id: replyToId,
                    name: replyToUser.name,
                    email: replyToUser.email,
                  },
                }],
              };
            }
            return comment;
          })
        );
        toast({
          title: "回复成功",
        });
      } else {
        toast({
          title: "回复成功",
          description: "回复正在审核中，通过后将自动显示",
        });
      }
    } catch (error) {
      toast({
        title: "回复失败",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="pb-[72px] lg:pb-0 space-y-6">
      {isLoggedIn ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
          data-testid="comment-form"
        >
          <Textarea
            placeholder="写下你的评论..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "发表评论"
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">登录后参与评论讨论</p>
          <Button asChild>
            <a href="/login">去登录</a>
          </Button>
        </div>
      )}

      <div className="space-y-6" data-testid="comment-list">
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            {...comment}
            onReply={handleReply}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>
    </div>
  );
}
