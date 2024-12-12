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
    type: string;
    content: string;
    excerpt: string | null;
    status: "DRAFT" | "PUBLISHED";
    createdAt: Date;
    updatedAt: Date;
    viewCount: number;
    likesCount: number;
    favoritesCount: number;
    authorId: string;
    author: {
      id: string;
      name?: string;
      email?: string;
    };
    commentsCount?: number;
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
            创建于 {formatDate(post.createdAt)} · {post.viewCount} 次浏览 ·{" "}
            {post.likesCount || 0} 次点赞 · {post.commentsCount || 0} 条评论 ·{" "}
            {post.favoritesCount || 0} 次收藏
          </p>
        </div>
        <PostOperations post={post} />
      </div>
    </div>
  );
}
