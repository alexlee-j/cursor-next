import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Token和密码不能为空" },
        { status: 400 }
      );
    }

    // 查找重置token
    const resetToken = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, message: "无效的重置链接" },
        { status: 400 }
      );
    }

    // 检查token是否过期
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { success: false, message: "重置链接已过期" },
        { status: 400 }
      );
    }

    // 更新密码
    const hashedPassword = await hash(password, 12);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // 删除已使用的token
    await prisma.passwordReset.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({
      success: true,
      message: "密码重置成功",
    });
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "重置密码失败" },
      { status: 500 }
    );
  }
}
