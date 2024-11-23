import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/constants/permissions";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    // 验证邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "邮箱已被注册" }, { status: 400 });
    }

    // 创建用户
    const hashedPassword = await hash(password, 12);

    // 获取默认用户角色
    const userRole = await prisma.role.findUnique({
      where: { name: ROLES.USER },
    });

    if (!userRole) {
      return NextResponse.json(
        { error: "系统错误：未找到默认角色" },
        { status: 500 }
      );
    }

    // 使用事务确保用户和角色关联的原子性
    const user = await prisma.$transaction(async (tx) => {
      // 创建用户
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          // 设置初始信任等级和评论统计
          trustLevel: "new",
          commentCount: 0,
          approvedCount: 0,
        },
      });

      // 关联用户角色
      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: userRole.id,
        },
      });

      // 创建默认收藏夹
      await tx.favoriteFolder.create({
        data: {
          name: "默认收藏夹",
          description: "系统自动创建的默认收藏夹",
          isDefault: true,
          userId: newUser.id,
        },
      });

      return newUser;
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error in register:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
