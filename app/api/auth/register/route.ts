import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "该邮箱已被注册" }, { status: 400 });
    }

    // 创建新用户
    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        verifications: {
          create: {
            token: uuidv4(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
      },
      include: {
        verifications: true,
      },
    });

    // 发送验证邮件
    await sendVerificationEmail(user.email, user.verifications[0].token);

    return NextResponse.json(
      { message: "注册成功，请查收验证邮件" },
      { status: 201 }
    );
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { message: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
