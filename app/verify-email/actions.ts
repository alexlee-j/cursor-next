"use server";

import { prisma } from "@/lib/db";

export async function verifyEmail(token: string) {
  try {
    // 查找并验证token
    const verifyToken = await prisma.verifyToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verifyToken) {
      return {
        success: false,
        error: "验证链接无效",
      };
    }

    if (verifyToken.expiresAt < new Date()) {
      return {
        success: false,
        error: "验证链接已过期",
      };
    }

    // 更新用户验证状态
    await prisma.user.update({
      where: { id: verifyToken.userId },
      data: { emailVerified: true },
    });

    // 删除验证token
    await prisma.verifyToken.delete({
      where: { id: verifyToken.id },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("验证失败:", error);
    return {
      success: false,
      error: "验证失败，请稍后重试",
    };
  }
}
