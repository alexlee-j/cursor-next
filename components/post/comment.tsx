"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import {
  Loader2,
  Reply as ReplyIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

interface CommentProps {
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
  onReply: (content: string, commentId: string, replyToUserId: string) => Promise<void>;
  isLoggedIn: boolean;
  parentId?: string;
  depth?: number;
}

const AuthorBadge = () => (
  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-primary text-primary-foreground">
    作者
  </span>
);

function ReplyItem({
  reply,
  onReply,
  isLoggedIn,
}: {
  reply: ReplyType;
  onReply: (content: string, replyToUserId: string) => Promise<void>;
  isLoggedIn: boolean;
}) {
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
      await onReply(replyContent, reply.user.id);
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
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {reply.user.name?.[0] || reply.user.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {reply.user.name || reply.user.email}
            </span>
            {reply.user.isAuthor && <AuthorBadge />}
            {reply.replyTo && (
              <>
                <span className="text-muted-foreground">回复</span>
                <span className="font-medium text-primary">
                  @{reply.replyTo.name || reply.replyTo.email}
                </span>
              </>
            )}
            <span className="text-sm text-muted-foreground">
              {formatDate(reply.createdAt)}
            </span>
          </div>
          <p className="text-sm">{reply.content}</p>
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsReplying(!isReplying)}
            >
              <ReplyIcon className="mr-1 h-4 w-4" />
              回复
            </Button>
          )}
        </div>
      </div>

      {isReplying && (
        <div className="ml-12 space-y-4">
          <Textarea
            placeholder={`回复 @${reply.user.name || reply.user.email}`}
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
    </div>
  );
}

export function Comment({
  id,
  content,
  createdAt,
  user,
  replies,
  onReply,
  isLoggedIn,
  parentId,
  depth,
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
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

  const handleReplyToReply = async (content: string, replyToUserId: string) => {
    await onReply(content, id, replyToUserId);
  };

  return (
    <div className="space-y-4">
      {/* 主评论 */}
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {user.name?.[0] || user.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name || user.email}</span>
            {user.isAuthor && <AuthorBadge />}
            <span className="text-sm text-muted-foreground">
              {formatDate(createdAt)}
            </span>
          </div>
          <p className="text-sm">{content}</p>
          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setIsReplying(!isReplying)}
              >
                <ReplyIcon className="mr-1 h-4 w-4" />
                回复
              </Button>
            )}
            {replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? (
                  <ChevronUp className="mr-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="mr-1 h-4 w-4" />
                )}
                {replies.length}条回复
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 回复列表 */}
      {showReplies && replies.length > 0 && (
        <div className="ml-14 space-y-4 border-l-2 pl-4">
          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              onReply={handleReplyToReply}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}

      {/* 回复框 */}
      {isReplying && (
        <div className="ml-14 space-y-4">
          <Textarea
            placeholder={`回复 @${user.name || user.email}`}
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
    </div>
  );
}
