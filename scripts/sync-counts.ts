import { prisma } from "@/lib/db";

async function syncCounts() {
  try {
    // 获取所有文章
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        _count: {
          select: {
            likes: true,
            favorites: true,
          },
        },
      },
    });

    // 更新每篇文章的计数
    for (const post of posts) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          likesCount: post._count.likes,
          favoritesCount: post._count.favorites,
        },
      });
      console.log(`Updated counts for post ${post.id}`);
    }

    console.log("All counts have been synchronized successfully!");
  } catch (error) {
    console.error("Error syncing counts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行同步
syncCounts();
