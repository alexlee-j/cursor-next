"use server";

import { prisma } from "@/lib/db";
import { logger } from "@/lib/utils/logger";

export async function verifyEmail(token: string) {
  logger.info("开始验证邮箱", { token });
  
  try {
    // 查找验证令牌
    const verifyToken = await prisma.verifyToken.findUnique({
      where: { token },
      include: { user: true },
    });

    logger.info("查询验证令牌结果", { 
      found: !!verifyToken,
      token,
      tokenDetails: verifyToken ? {
        id: verifyToken.id,
        type: verifyToken.type,
        expiresAt: verifyToken.expiresAt,
        userId: verifyToken.userId,
      } : null
    });

    if (!verifyToken) {
      logger.warn("验证失败：令牌无效", { token });
      return {
        success: false,
        error: "验证链接无效",
      };
    }

    if (verifyToken.expiresAt < new Date()) {
      logger.warn("验证失败：令牌过期", { token, expiresAt: verifyToken.expiresAt });
      return {
        success: false,
        error: "验证链接已过期",
      };
    }

    if (verifyToken.type !== 'EMAIL_VERIFICATION') {
      logger.warn("验证失败：令牌类型错误", { token, type: verifyToken.type });
      return {
        success: false,
        error: "验证链接无效",
      };
    }

    if (!verifyToken.user) {
      logger.error("验证失败：找不到关联用户", { token, userId: verifyToken.userId });
      return {
        success: false,
        error: "验证失败，用户不存在",
      };
    }

    if (verifyToken.user.emailVerified) {
      logger.info("邮箱已验证", { userId: verifyToken.userId, email: verifyToken.user.email });
      return {
        success: true,
        message: "邮箱已经验证过了",
      };
    }

    // 更新用户验证状态
    try {
      await prisma.$transaction([
        // 更新用户状态
        prisma.user.update({
          where: { id: verifyToken.userId },
          data: { emailVerified: true },
        }),
        // 删除验证令牌
        prisma.verifyToken.delete({
          where: { id: verifyToken.id },
        }),
      ]);

      logger.info("邮箱验证成功", { 
        userId: verifyToken.userId,
        email: verifyToken.user.email 
      });

      return {
        success: true,
        message: "邮箱验证成功",
      };
    } catch (txError) {
      logger.error("数据库事务失败", {
        error: txError instanceof Error ? txError.message : String(txError),
        userId: verifyToken.userId,
      });
      throw txError;
    }
  } catch (error) {
    logger.error("验证失败", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: "验证失败，请稍后重试",
    };
  }
}
