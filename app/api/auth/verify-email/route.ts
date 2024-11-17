import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Missing token" },
        { status: 400 }
      );
    }

    // 查找验证token
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 400 }
      );
    }

    // 检查token是否过期
    if (new Date() > verification.expiresAt) {
      return NextResponse.json(
        { success: false, message: "Token has expired" },
        { status: 400 }
      );
    }

    // 更新用户的验证状态
    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        emailVerified: new Date(),
        isVerified: true,
      },
    });

    // 删除已使用的token
    await prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("VERIFICATION_ERROR", error);
    return NextResponse.json(
      { success: false, message: "Verification failed" },
      { status: 500 }
    );
  }
}
