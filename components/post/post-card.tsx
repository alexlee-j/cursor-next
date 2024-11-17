"use client";

import { formatDate } from "@/lib/utils";
import { PostOperations } from "./post-operations";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { MessageSquare, ThumbsUp, Eye, Bookmark } from "lucide-react";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    status: "DRAFT" | "PUBLISHED";
    createdAt: Date;
    updatedAt: Date;
    viewCount: number;
    likesCount?: number;
    commentsCount?: number;
    bookmarksCount?: number;
  };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className="flex flex-col space-y-4 rounded-lg border p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/posts/${post.id}`}
              className="text-xl font-semibold hover:underline"
            >
              {post.title}
            </Link>
            <Badge
              variant={post.status === "PUBLISHED" ? "default" : "secondary"}
            >
              {post.status === "PUBLISHED" ? "已发布" : "草稿"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            创建于 {formatDate(post.createdAt)}
            {post.updatedAt > post.createdAt &&
              ` · 更新于 ${formatDate(post.updatedAt)}`}
          </p>
        </div>
        <PostOperations post={post} />
      </div>
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>{post.viewCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThumbsUp className="h-4 w-4" />
          <span>{post.likesCount || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          <span>{post.commentsCount || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <Bookmark className="h-4 w-4" />
          <span>{post.bookmarksCount || 0}</span>
        </div>
      </div>
    </div>
  );
}
