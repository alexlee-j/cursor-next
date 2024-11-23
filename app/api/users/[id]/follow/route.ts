import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const followingId = params.id;

    // 不能关注自己
    if (user.id === followingId) {
      return NextResponse.json({ error: "不能关注自己" }, { status: 400 });
    }

    // 检查要关注的用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "要关注的用户不存在" },
        { status: 404 }
      );
    }

    const existingFollow = await prisma.follow.findFirst({
      where: {
        AND: [{ followerId: user.id }, { followingId }],
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return NextResponse.json({ isFollowing: false });
    }

    await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId,
      },
    });

    return NextResponse.json({ isFollowing: true });
  } catch (error) {
    console.error("Error handling follow:", error);
    return NextResponse.json(
      { error: "操作失败，请稍后重试" },
      { status: 500 }
    );
  }
}
