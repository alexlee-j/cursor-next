import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { PostList } from "@/components/favorite/post-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "收藏夹",
  description: "查看收藏夹内容",
};

const POSTS_PER_PAGE = 10;

async function getFolderPosts(
  folderId: string,
  userId: string,
  page: number = 1
) {
  const folder = await prisma.favoriteFolder.findFirst({
    where: {
      id: folderId,
      userId,
    },
    include: {
      favorites: {
        skip: (page - 1) * POSTS_PER_PAGE,
        take: POSTS_PER_PAGE,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          post: {
            include: {
              author: {
                select: {
                  name: true,
                  email: true,
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
          },
        },
      },
      _count: {
        select: {
          favorites: true,
        },
      },
    },
  });

  if (!folder) {
    return null;
  }

  return {
    folder: {
      id: folder.id,
      name: folder.name,
      description: folder.description,
    },
    posts: folder.favorites.map((fav) => ({
      ...fav.post,
      commentsCount: fav.post._count.comments,
      likesCount: fav.post._count.likes,
      favoritesCount: fav.post._count.favorites,
    })),
    totalPosts: folder._count.favorites,
    currentPage: page,
    totalPages: Math.ceil(folder._count.favorites / POSTS_PER_PAGE),
  };
}

export default async function FolderPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const user = await checkAuth();
  if (!user) {
    redirect("/login");
  }

  const pageParam = searchParams?.page;
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const data = await getFolderPosts(params.id, user.id, page);

  if (!data) {
    redirect("/dashboard/favorites");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={data.folder.name}
        text={data.folder.description || "收藏夹中的文章"}
      />
      <div className="mt-8">
        <PostList
          posts={data.posts}
          currentPage={data.currentPage}
          totalPages={data.totalPages}
        />
      </div>
    </DashboardShell>
  );
}
