import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // 验证密码格式
    if (!newPassword || newPassword.length < 6) {
      return new NextResponse("Password must be at least 6 characters", {
        status: 400,
      });
    }

    // 获取用户当前密码哈希
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 验证当前密码
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      dbUser.password
    );
    if (!isPasswordValid) {
      return new NextResponse("Current password is incorrect", { status: 400 });
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return new NextResponse("Password updated successfully", { status: 200 });
  } catch (error) {
    console.error("[PASSWORD_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
