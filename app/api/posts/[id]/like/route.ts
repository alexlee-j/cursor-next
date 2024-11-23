import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const postId = await params.id;

    // 检查文章是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 检查是否已经点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return NextResponse.json({ liked: false });
    }

    // 创建点赞记录
    await prisma.like.create({
      data: {
        postId,
        userId: user.id,
      },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("[LIKE_POST]", error);
    return NextResponse.json(
      { error: "点赞失败，请稍后重试" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const postId = await params.id;

    // 检查点赞记录是否存在
    const like = await prisma.like.findFirst({
      where: {
        postId,
        userId: user.id,
      },
    });

    if (!like) {
      return NextResponse.json({ error: "点赞记录不存在" }, { status: 404 });
    }

    // 删除点赞记录
    await prisma.like.delete({
      where: {
        id: like.id,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[UNLIKE_POST]", error);
    return NextResponse.json(
      { error: "取消点赞失败，请稍后重试" },
      { status: 500 }
    );
  }
}
