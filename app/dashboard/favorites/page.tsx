import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { FolderList } from "@/components/favorite/folder-list";
import { FolderCreateButton } from "@/components/favorite/folder-create-button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "收藏夹",
  description: "管理您的收藏夹和收藏",
};

export const dynamic = 'force-dynamic';

async function getFolders(userId: string) {
  const folders = await prisma.favoriteFolder.findMany({
    where: { userId },
    include: {
      _count: {
        select: {
          favorites: true,
        },
      },
      favorites: {
        include: {
          post: {
            select: {
              title: true,
              createdAt: true,
              author: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5, // 每个文件夹只显示最近5条收藏
      },
    },
    orderBy: [
      {
        isDefault: "desc", // 默认文件夹排在最前
      },
      {
        updatedAt: "desc", // 其他按更新时间排序
      },
    ],
  });

  return folders.map((folder) => ({
    ...folder,
    favoritesCount: folder._count.favorites,
    recentFavorites: folder.favorites.map((fav) => ({
      id: fav.id,
      postId: fav.postId, // 确保包含 postId
      createdAt: fav.createdAt,
      post: {
        title: fav.post.title,
        author: fav.post.author,
        createdAt: fav.post.createdAt,
      },
    })),
  }));
}

export default async function FavoritesPage() {
  const user = await checkAuth();
  if (!user) {
    redirect("/login");
  }

  const folders = await getFolders(user.id);

  return (
    <DashboardShell>
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <DashboardHeader heading="收藏夹" text="管理您收藏的文章。" />
        <div className="flex items-center space-x-2">
          <FolderCreateButton />
        </div>
      </div>
      <div className="mt-8">
        <FolderList initialFolders={folders} />
      </div>
    </DashboardShell>
  );
}
