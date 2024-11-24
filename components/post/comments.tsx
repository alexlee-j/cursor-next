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
    name: string | null;
    email: string;
  };
  replyTo: {
    name: string | null;
    email: string;
  };
}

interface CommentType {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  replies: ReplyType[];
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

      if (!newComment.needsReview) {
        setComments((prev) => [newComment, ...prev]);
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
    if (!newReply.needsReview) {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, replies: [...comment.replies, newReply] }
            : comment
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      {isLoggedIn && (
        <div className="space-y-4">
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
        </div>
      )}

      <div className="space-y-6">
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
