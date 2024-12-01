"use client";

import { LikeButton } from "./like-button";
import { FavoriteDialog } from "./favorite-dialog";
import { MessageSquare, UserCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface QuickActionsProps {
  postId: string;
  liked: boolean;
  likesCount: number;
  favoriteFolders: {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    isFavorited: boolean;
  }[];
  favoritesCount: number;
  commentsCount: number;
  className?: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
  isFollowing: boolean;
  followersCount: number;
}

export function QuickActions({
  postId,
  liked,
  likesCount,
  favoriteFolders,
  favoritesCount,
  commentsCount,
  className,
  author,
  isFollowing: initialIsFollowing,
  followersCount: initialFollowersCount,
}: QuickActionsProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const scrollToComments = () => {
    const commentsSection = document.getElementById("comments-section");
    commentsSection?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleFollow = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${author.id}/follow`, {
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

      toast({
        title: newIsFollowing ? "关注成功" : "取消关注成功",
      });
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 bg-background p-3",
        "lg:rounded-lg lg:border lg:flex-col lg:items-center lg:p-4",
        className
      )}
    >
      {/* 作者信息和关注按钮 */}
      <div className="flex items-center justify-between flex-1 lg:flex-col lg:items-center lg:gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 lg:h-12 lg:w-12">
            <AvatarImage src={author.image || undefined} alt={author.name || author.email} />
            <AvatarFallback>{author.name?.[0] || author.email[0]}</AvatarFallback>
          </Avatar>
          {/* 移动端显示作者名和关注按钮 */}
          <div className="flex items-center gap-2 lg:hidden">
            <span className="text-sm font-medium truncate max-w-[120px]">
              {author.name || author.email}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleFollow}
              disabled={isLoading}
              className="h-7 text-xs whitespace-nowrap"
            >
              {isFollowing ? "已关注" : "关注"} ({initialFollowersCount})
            </Button>
          </div>
        </div>
        {/* PC端只显示关注图标 */}
        <button
          onClick={toggleFollow}
          disabled={isLoading}
          className="hidden lg:inline-flex text-muted-foreground hover:text-foreground"
        >
          {isFollowing ? (
            <UserCheck className="h-5 w-5" />
          ) : (
            <UserPlus className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* PC端分割线 */}
      <div className="hidden lg:block w-full">
        <Separator className="my-4" />
      </div>

      {/* 交互按钮组 */}
      <div className="flex items-center gap-6 lg:flex-col lg:gap-4">
        <LikeButton
          postId={postId}
          initialLiked={liked}
          initialCount={likesCount}
        />
        <FavoriteDialog
          postId={postId}
          initialFolders={favoriteFolders}
          initialCount={favoritesCount}
          isFavorited={favoriteFolders.some((folder) => folder.isFavorited)}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollToComments}
          className="inline-flex items-center space-x-1 px-2 py-1 text-sm rounded-md transition-colors text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{commentsCount}</span>
        </Button>
      </div>
    </div>
  );
}
