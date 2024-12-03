"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Heart, Bookmark } from "lucide-react";

interface PostListProps {
  posts: {
    id: string;
    title: string;
    excerpt: string | null;
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      email: string;
    };
    tags: {
      id: string;
      name: string;
    }[];
    commentsCount: number;
    likesCount: number;
    favoritesCount: number;
  }[];
  currentPage: number;
  totalPages: number;
  urlPrefix: string;
  tag?: string;
}

export function PostList({
  posts,
  currentPage,
  totalPages,
  urlPrefix,
  tag,
}: PostListProps) {
  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                <Link
                  href={`/posts/${post.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {post.title}
                </Link>
              </CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/users/${post.author.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {post.author.name || post.author.email}
                  </Link>
                  <span>·</span>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {post.excerpt && (
              <p className="text-muted-foreground mb-4">{post.excerpt}</p>
            )}
            <div className="flex flex-col space-y-4">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link key={tag.id} href={`/?tag=${tag.name}`}>
                    <Badge
                      variant="secondary"
                      className="hover:bg-secondary/80 whitespace-normal break-words"
                    >
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground justify-end">
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
            </div>
          </CardContent>
        </Card>
      ))}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`${urlPrefix}&page=${page}${tag ? `&tag=${tag}` : ""}`}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {page}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
