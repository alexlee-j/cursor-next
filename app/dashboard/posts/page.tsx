import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { PostCreateButton } from "@/components/post/post-create-button";
import { PostList } from "@/components/post/post-list";
import { prisma } from "@/lib/db";

const POSTS_PER_PAGE = 10;

async function getPosts(page: number = 1) {
  const skip = (page - 1) * POSTS_PER_PAGE;

  const [posts, totalPosts] = await Promise.all([
    prisma.post.findMany({
      take: POSTS_PER_PAGE,
      skip,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        _count: {
          select: {
            comments: true,
          },
        },
      },
    }),
    prisma.post.count(),
  ]);

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  return {
    posts: posts.map((post) => ({
      ...post,
      commentsCount: post._count.comments,
      likesCount: 0,
      bookmarksCount: 0,
    })),
    currentPage: page,
    totalPages,
  };
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const user = await checkAuth();
  if (!user) {
    redirect("/login");
  }

  const page = searchParams?.page
    ? parseInt(await Promise.resolve(searchParams.page), 10)
    : 1;
  const { posts, currentPage, totalPages } = await getPosts(page);

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
          posts={posts}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </DashboardShell>
  );
}
