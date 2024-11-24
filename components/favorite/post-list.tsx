"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, Heart, Bookmark } from "lucide-react";

interface PostListProps {
  posts: {
    id: string;
    title: string;
    excerpt: string | null;
    createdAt: Date;
    author: {
      name: string | null;
      email: string;
    };
    commentsCount: number;
    likesCount: number;
    favoritesCount: number;
  }[];
  currentPage: number;
  totalPages: number;
}

export function PostList({ posts, currentPage, totalPages }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <Link href={`/posts/${post.id}`}>
              <CardTitle className="text-xl hover:underline">
                {post.title}
              </CardTitle>
            </Link>
            <CardDescription>
              <div className="flex items-center gap-2 text-sm">
                <span>by {post.author.name || post.author.email}</span>
                <span>·</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {post.excerpt && (
              <p className="text-muted-foreground mb-4">{post.excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{post.commentsCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{post.likesCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bookmark className="h-4 w-4" />
                <span>{post.favoritesCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`?page=${page}`}
              className={`${
                currentPage === page
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              } px-3 py-1 rounded-md`}
            >
              {page}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
