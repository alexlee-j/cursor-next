import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/utils/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "用户ID不能为空" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "邮箱已经验证过了" },
        { status: 200 }
      );
    }

    // 更新用户验证状态
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    logger.info("邮箱验证成功", { userId, email: user.email });

    // 重定向到登录页面
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?verified=true`
    );
  } catch (error) {
    logger.error("邮箱验证失败", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "邮箱验证失败" },
      { status: 500 }
    );
  }
}
