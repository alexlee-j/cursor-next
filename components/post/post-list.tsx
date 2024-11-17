"use client";

import { PostCard } from "./post-card";
import { Pagination } from "../ui/pagination";
import { Button } from "../ui/button";
import { PenLine } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface PostListProps {
  posts: {
    id: string;
    title: string;
    status: "DRAFT" | "PUBLISHED";
    createdAt: Date;
    updatedAt: Date;
    viewCount: number;
    likesCount?: number;
    commentsCount?: number;
    bookmarksCount?: number;
  }[];
  currentPage: number;
  totalPages: number;
}

export function PostList({ posts, currentPage, totalPages }: PostListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8 md:py-12">
        <PenLine className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />
        <h3 className="text-base md:text-lg font-medium">还没有文章</h3>
        <p className="text-sm text-muted-foreground">
          开始创作您的第一篇文章吧！
        </p>
        <Link href="/dashboard/posts/new">
          <Button size="sm" className="mt-2">
            写文章
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-3 md:space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 md:mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
