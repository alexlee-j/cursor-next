import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "邮箱不能为空" },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "该邮箱未注册" },
        { status: 400 }
      );
    }

    // 创建密码重置token
    const resetToken = await prisma.passwordReset.create({
      data: {
        token: uuidv4(),
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
      },
    });

    // 发送重置密码邮件
    await sendPasswordResetEmail(user.email, resetToken.token);

    return NextResponse.json({
      success: true,
      message: "重置密码邮件已发送，请查收",
    });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "发送重置密码邮件失败" },
      { status: 500 }
    );
  }
}
