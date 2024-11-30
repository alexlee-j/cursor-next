import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "./logger";
import { mailer } from "./mailer";

class TwoFactorAuth {
  private readonly CODE_LENGTH = 6;
  private readonly CODE_TTL = 5 * 60 * 1000; // 5分钟

  private generateCode(): string {
    return randomBytes(3)
      .readUIntBE(0, 3)
      .toString()
      .padStart(6, "0")
      .slice(0, 6);
  }

  async generateAndSendCode(userId: string, email: string): Promise<void> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.CODE_TTL);

    // 保存验证码
    await prisma.twoFactorCode.create({
      data: {
        userId,
        code,
        expiresAt,
      },
    });

    // 发送验证码邮件
    await mailer.sendTwoFactorCode(email, code);

    logger.info("双因素认证码已发送", {
      userId,
      email,
      expiresAt,
    });
  }

  async verifyCode(userId: string, code: string): Promise<boolean> {
    try {
      // 查找未过期的验证码
      const twoFactorCode = await prisma.twoFactorCode.findFirst({
        where: {
          userId,
          code,
          expiresAt: {
            gt: new Date(),
          },
          used: false,
        },
      });

      if (!twoFactorCode) {
        logger.warn("双因素认证验证失败", {
          userId,
          reason: "验证码无效或已过期",
        });
        return false;
      }

      // 标记验证码为已使用
      await prisma.twoFactorCode.update({
        where: { id: twoFactorCode.id },
        data: { used: true },
      });

      logger.info("双因素认证验证成功", { userId });
      return true;
    } catch (error) {
      logger.error("双因素认证验证过程出错", {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return false;
    }
  }

  async isEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    return user?.twoFactorEnabled ?? false;
  }

  async enable(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    logger.info("双因素认证已启用", { userId });
  }

  async disable(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false },
    });

    logger.info("双因素认证已禁用", { userId });
  }
}

export const twoFactorAuth = new TwoFactorAuth();
