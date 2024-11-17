import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json();

    // 查找验证码记录
    const verificationRecord = await prisma.verificationCode.findUnique({
      where: {
        userId: userId,
      },
      include: {
        user: true,
      },
    });

    if (!verificationRecord) {
      return NextResponse.json({ error: "验证码不存在" }, { status: 400 });
    }

    // 检查验证码是否过期
    if (verificationRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "验证码已过期" }, { status: 400 });
    }

    // 验证码是否匹配
    if (verificationRecord.code !== code) {
      return NextResponse.json({ error: "验证码不正确" }, { status: 400 });
    }

    // 更新用户验证状态
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        emailVerified: true,
      },
    });

    // 删除验证码记录
    await prisma.verificationCode.delete({
      where: {
        id: verificationRecord.id,
      },
    });

    return NextResponse.json({
      message: "邮箱验证成功",
    });
  } catch (error) {
    console.error("验证失败:", error);
    return NextResponse.json(
      { error: "验证失败，请稍后重试" },
      { status: 500 }
    );
  }
}
