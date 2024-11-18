"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  postId: string;
  initialFavorited: boolean;
  initialCount: number;
}

export function FavoriteButton({
  postId,
  initialFavorited,
  initialCount,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFavorite = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/posts/${postId}/favorite`, {
        method: favorited ? "DELETE" : "POST",
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            description: "请先登录后再收藏",
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

      setFavorited(!favorited);
      setCount(count + (favorited ? -1 : 1));
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
      onClick={handleFavorite}
      disabled={isLoading}
    >
      <Bookmark
        className={cn(
          "h-4 w-4 mr-1",
          favorited ? "fill-current text-yellow-500" : ""
        )}
      />
      {count}
    </Button>
  );
}
