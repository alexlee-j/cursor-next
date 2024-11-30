import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/utils/logger";
import { mailer } from "@/lib/utils/mailer";
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "邮箱已被注册" },
        { status: 400 }
      );
    }

    // 创建用户
    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split("@")[0],
        emailVerified: false,
      },
    });

    // 创建验证令牌
    const token = nanoid();
    const verifyToken = await prisma.verifyToken.create({
      data: {
        token,
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
      },
    });

    // 发送验证邮件
    try {
      await mailer.sendVerificationEmail(email, token);
      logger.info("验证邮件发送成功", { userId: user.id, email });
    } catch (error) {
      logger.error("验证邮件发送失败", {
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
        email,
      });
    }

    return NextResponse.json({
      message: "注册成功，请查收验证邮件",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logger.error("注册失败", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "注册失败" },
      { status: 500 }
    );
  }
}
