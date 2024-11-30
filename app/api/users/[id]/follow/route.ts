import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // 1. 获取并验证动态参数
    const { id: followingId } = await Promise.resolve(context.params);
    
    if (!followingId) {
      return NextResponse.json(
        { error: "缺少必要的参数" },
        { status: 400 }
      );
    }

    // 2. 验证用户登录状态
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 3. 检查是否试图关注自己
    if (user.id === followingId) {
      return NextResponse.json({ error: "不能关注自己" }, { status: 400 });
    }

    // 4. 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "要关注的用户不存在" },
        { status: 404 }
      );
    }

    // 5. 检查是否已经关注
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: user.id,
        followingId,
      },
    });

    // 6. 处理关注/取消关注逻辑
    if (existingFollow) {
      // 如果已经关注，则取消关注
      await prisma.follow.delete({
        where: {
          id: existingFollow.id,
        },
      });

      return NextResponse.json({ isFollowing: false });
    }

    // 创建新的关注关系
    await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId,
      },
    });

    return NextResponse.json({ isFollowing: true });
  } catch (error) {
    console.error("关注操作失败:", error);
    return NextResponse.json(
      { error: "关注操作失败，请稍后重试" },
      { status: 500 }
    );
  }
}
