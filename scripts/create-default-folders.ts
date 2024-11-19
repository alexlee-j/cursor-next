import { PrismaClient } from "@prisma/client";

// 创建一个新的 Prisma 实例
const prisma = new PrismaClient();

async function ensureDefaultFolder(userId: string) {
  try {
    // 先检查是否已经有默认收藏夹
    const defaultFolder = await prisma.favoriteFolder.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (!defaultFolder) {
      // 如果没有默认收藏夹，创建一个
      await prisma.favoriteFolder.create({
        data: {
          name: "默认收藏夹",
          description: "自动创建的默认收藏夹",
          isDefault: true,
          userId,
        },
      });
      console.log(`Created default folder for user ${userId}`);
    } else {
      console.log(`Default folder already exists for user ${userId}`);
    }
  } catch (error) {
    console.error(`Error ensuring default folder for user ${userId}:`, error);
  }
}

async function createDefaultFolders() {
  try {
    // 获取所有用户
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);

    // 为每个用户创建默认收藏夹
    for (const user of users) {
      await ensureDefaultFolder(user.id);
    }

    console.log("Finished creating default folders");
  } catch (error) {
    console.error("Error creating default folders:", error);
  } finally {
    // 确保关闭数据库连接
    await prisma.$disconnect();
  }
}

// 运行主函数
createDefaultFolders().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
