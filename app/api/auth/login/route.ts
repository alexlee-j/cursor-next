import { NextResponse } from "next/server";
import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 400 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: "请先验证邮箱" }, { status: 400 });
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: "密码错误" }, { status: 400 });
    }

    // 创建 JWT token
    const token = sign(
      {
        id: user.id,
        email: user.email,
        isVerified: user.emailVerified,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // 修改 cookie 设置方式
    const response = NextResponse.json({
      message: "登录成功",
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.emailVerified,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 天
    });

    return response;
  } catch (error) {
    console.error("登录错误:", error);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
