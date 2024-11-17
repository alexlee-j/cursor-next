import { NextResponse } from "next/server";
import { compare } from "bcrypt";
import * as jose from "jose";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 400 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "账户已被禁用" }, { status: 400 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: "请先验证邮箱" }, { status: 400 });
    }

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "密码错误" }, { status: 400 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "secret");
    const token = await new jose.SignJWT({
      id: user.id,
      email: user.email,
      isVerified: user.emailVerified,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({
      message: "登录成功",
      user: {
        id: user.id,
        email: user.email,
      },
    });

    console.log("Setting auth cookie...");
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    console.log("Auth cookie set successfully");

    return response;
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
