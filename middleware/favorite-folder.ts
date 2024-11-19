import { prisma } from "@/lib/db";

export async function ensureDefaultFolder(userId: string) {
  try {
    const defaultFolder = await prisma.favoriteFolder.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (!defaultFolder) {
      await prisma.favoriteFolder.create({
        data: {
          name: "默认收藏夹",
          description: "自动创建的默认收藏夹",
          isDefault: true,
          userId,
        },
      });
    }
  } catch (error) {
    console.error("Error ensuring default folder:", error);
  }
}
