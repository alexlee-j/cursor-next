"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Heart } from "lucide-react";
import { useState } from "react";
import { usePostActions } from "./post-actions-context";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: LikeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const { toast } = useToast();
  const { setLiked: setLikedContext, setLikesCount: setLikesCountContext } = usePostActions();

  const toggleLike = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (response.status === 401) {
        toast({
          title: "请先登录",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error("点赞失败");
      }

      const { liked: newLiked } = await response.json();
      setLiked(newLiked);
      setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));

      toast({
        title: newLiked ? "点赞成功" : "取消点赞成功",
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "操作失败",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLike}
      disabled={isLoading}
      aria-pressed={liked}
      data-testid="like-button"
      data-count={likesCount}
      className={`inline-flex items-center space-x-1 px-2 py-1 text-sm rounded-md transition-colors ${
        liked ? "text-red-500" : "text-muted-foreground hover:text-red-500/80"
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`}
        />
      )}
      <span>{likesCount}</span>
    </Button>
  );
}
