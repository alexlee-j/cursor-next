import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { PostCreateButton } from "@/components/post/post-create-button";
import { PostList } from "@/components/post/post-list";
import { prisma } from "@/lib/db";

const POSTS_PER_PAGE = 10;

export default async function PostsPage() {
  try {
    const user = await checkAuth();
    if (!user) {
      redirect("/login");
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: user.id },
        take: POSTS_PER_PAGE,
        orderBy: { updatedAt: "desc" },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
          postTags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              favorites: true,
            },
          },
        },
      }),
      prisma.post.count({
        where: { authorId: user.id },
      }),
    ]);

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: post.author,
      tags: post.postTags.map((pt) => pt.tag),
      commentsCount: post._count.comments,
      likesCount: post._count.likes,
      favoritesCount: post._count.favorites,
    }));

    const totalPages = Math.ceil(total / POSTS_PER_PAGE);

    return (
      <DashboardShell>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <DashboardHeader heading="文章管理" text="创建和管理您的博客文章。" />
          <div className="flex items-center space-x-2">
            <PostCreateButton className="hidden md:inline-flex" />
            <PostCreateButton variant="ghost" size="icon" className="md:hidden" />
          </div>
        </div>
        <div className="mt-4 md:mt-8">
          <PostList
            initialPosts={formattedPosts}
            currentPage={1}
            totalPages={totalPages}
            userId={user.id}
          />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login");
    }
    throw error;
  }
}
