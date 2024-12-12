"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserPlus, UserCheck } from "lucide-react";

interface FollowButtonProps {
  authorId: string;
  isFollowing: boolean;
  followersCount: number;
}

export function FollowButton({
  authorId,
  isFollowing: initialIsFollowing,
  followersCount: initialCount,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  const toggleFollow = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${authorId}/follow`, {
        method: "POST",
      });

      if (response.status === 401) {
        toast({
          title: "请先登录",
          description: "登录后即可关注作者",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "操作失败");
      }

      const { isFollowing: newIsFollowing } = await response.json();
      setIsFollowing(newIsFollowing);
      setCount((prev) => (newIsFollowing ? prev + 1 : prev - 1));

      toast({
        title: newIsFollowing ? "关注成功" : "取消关注成功",
      });
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: error instanceof Error ? error.message : "操作失败",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
      size="sm"
      onClick={toggleFollow}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`gap-1.5 min-w-[88px] transition-all duration-200 ${
        isFollowing
          ? "hover:bg-destructive hover:text-destructive-foreground"
          : "hover:bg-primary/90"
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          {isHovered ? (
            <>
              <UserPlus className="h-4 w-4" />
              <span>取消关注</span>
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4" />
              <span>已关注</span>
            </>
          )}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          <span>关注</span>
        </>
      )}
      <span className="text-xs opacity-80">({count})</span>
    </Button>
  );
}
