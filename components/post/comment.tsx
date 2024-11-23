"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Loader2, Reply } from "lucide-react";

interface CommentProps {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  replyTo?: {
    name: string | null;
    email: string;
  };
  replies?: CommentProps[];
  onReply: (
    content: string,
    parentId: string,
    replyToId?: string
  ) => Promise<void>;
  isLoggedIn: boolean;
}

export function Comment({
  id,
  content,
  createdAt,
  user,
  replyTo,
  replies = [],
  onReply,
  isLoggedIn,
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      toast({
        title: "请输入回复内容",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onReply(replyContent, id, user.id);
      setReplyContent("");
      setIsReplying(false);
      toast({
        title: "回复成功",
      });
    } catch (error) {
      toast({
        title: "回复失败",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {user.name?.[0] || user.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name || user.email}</span>
            {replyTo && (
              <>
                <span className="text-muted-foreground">回复</span>
                <span className="font-medium">
                  {replyTo.name || replyTo.email}
                </span>
              </>
            )}
            <span className="text-sm text-muted-foreground">
              {formatDate(createdAt)}
            </span>
          </div>
          <p className="text-sm">{content}</p>
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsReplying(!isReplying)}
            >
              <Reply className="mr-1 h-4 w-4" />
              回复
            </Button>
          )}
        </div>
      </div>

      {isReplying && (
        <div className="ml-14 space-y-4">
          <Textarea
            placeholder="写下你的回复..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReplying(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitReply}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "回复"
              )}
            </Button>
          </div>
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-14 space-y-4 border-l-2 pl-4">
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              {...reply}
              onReply={onReply}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
