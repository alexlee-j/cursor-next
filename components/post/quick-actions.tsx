"use client";

import { LikeButton } from "./like-button";
import { FavoriteDialog } from "./favorite-dialog";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export function QuickActions({
  postId,
  liked,
  likesCount,
  favoriteFolders,
  favoritesCount,
  commentsCount,
  className,
}: QuickActionsProps) {
  const scrollToComments = () => {
    const commentsSection = document.getElementById("comments-section");
    commentsSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-background p-4",
        "lg:flex-col",
        className
      )}
    >
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
      <button
        onClick={scrollToComments}
        className="inline-flex items-center space-x-1 px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-muted-foreground"
      >
        <MessageSquare className="h-4 w-4" />
        <span>{commentsCount}</span>
      </button>
    </div>
  );
}
