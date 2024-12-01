"use client";

import { PostCard } from "./post-card";
import { Pagination } from "../ui/pagination";
import { PenLine } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface Post {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  likesCount?: number;
  commentsCount?: number;
  bookmarksCount?: number;
}

interface PostListProps {
  initialPosts: Post[];
  currentPage: number;
  totalPages: number;
  userId: string;
}

export function PostList({ initialPosts, currentPage: initialPage, totalPages: initialTotalPages, userId }: PostListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async (page: number) => {
    try {
      setLoading(true);
      // 确保 page 是有效的数字
      const validPage = Number.isNaN(page) ? 1 : Math.max(1, page);
      const response = await fetch(`/api/posts?page=${validPage}&userId=${userId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '获取文章列表失败');
      }
      setPosts(data.posts);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const page = searchParams.get("page");
    if (page) {
      fetchPosts(parseInt(page, 10));
    }
  }, [searchParams, fetchPosts]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
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
          写文章
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6" data-testid="post-list">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} data-testid="post-item" />
          ))}
        </div>
      )}
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
