"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLike = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: liked ? "DELETE" : "POST",
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            description: "请先登录后再点赞",
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
        throw new Error("操作失败");
      }

      setLiked(!liked);
      setCount(count + (liked ? -1 : 1));
    } catch (error) {
      toast({
        variant: "destructive",
        description: "操作失败，请稍后重试",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2"
      onClick={handleLike}
      disabled={isLoading}
    >
      <Heart
        className={cn("h-4 w-4 mr-1", liked ? "fill-current text-red-500" : "")}
      />
      {count}
    </Button>
  );
}
