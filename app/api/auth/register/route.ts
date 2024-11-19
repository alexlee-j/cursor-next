import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "@/lib/db";
import { isValidEmail, isStrongPassword } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/email";
import { v4 as uuidv4 } from "uuid";
import { ensureDefaultFolder } from "@/middleware/favorite-folder";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    // 验证邮箱格式
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    // 验证密码强度
    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: "密码需要至少6个字符，包含字母和数字" },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
    }

    // 创建用户和验证token
    const hashedPassword = await hash(password, 10);
    const verifyToken = uuidv4();

    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || email.split("@")[0],
          emailVerified: false,
          isActive: true,
          verifyToken: {
            create: {
              token: verifyToken,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          },
        },
      });

      // 发送验证邮件，使用环境变量中的基础 URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      await sendVerificationEmail(email, verifyToken, baseUrl);

      // 确保默认收藏夹
      await ensureDefaultFolder(user.id);

      return NextResponse.json({
        message: "注册成功，请查收验证邮件",
      });
    } catch (dbError) {
      console.error("数据库操作失败:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
