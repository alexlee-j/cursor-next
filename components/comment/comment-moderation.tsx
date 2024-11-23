"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check, X, MessageSquare, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface CommentModerationProps {
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      name: string | null;
      email: string;
      trustLevel: string;
    };
    post: {
      id: string;
      title: string;
    };
  }[];
}

export function CommentModeration({
  comments: initialComments,
}: CommentModerationProps) {
  const [comments, setComments] = useState(initialComments);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleModeration = async (
    commentId: string,
    action: "approve" | "reject"
  ) => {
    try {
      setIsLoading(commentId);
      const response = await fetch(`/api/comments/${commentId}/moderate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("操作失败");
      }

      // 从列表中移除已处理的评论
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));

      toast({
        title: action === "approve" ? "评论已通过" : "评论已拒绝",
      });
    } catch (error) {
      toast({
        title: "操作失败",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageSquare className="mx-auto h-12 w-12 mb-4" />
        <p>暂无待审核评论</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">
                {comment.user.name || comment.user.email}
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                {formatDate(comment.createdAt)}
              </span>
              <span className="ml-2 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                {comment.user.trustLevel}
              </span>
            </div>
            <Link
              href={`/posts/${comment.post.id}`}
              target="_blank"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <span>查看文章</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          <div className="text-sm">{comment.content}</div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleModeration(comment.id, "reject")}
              disabled={!!isLoading}
            >
              {isLoading === comment.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  拒绝
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => handleModeration(comment.id, "approve")}
              disabled={!!isLoading}
            >
              {isLoading === comment.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  通过
                </>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
