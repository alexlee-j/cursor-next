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
      return new NextResponse(null, { status: 401 });
    }

    const postId = params.id;

    // 检查文章是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return new NextResponse(null, { status: 404 });
    }

    // 创建点赞记录并更新点赞数
    await prisma.$transaction([
      prisma.like.create({
        data: {
          postId,
          userId: user.id,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[LIKE_POST]", error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return new NextResponse(null, { status: 401 });
    }

    const postId = params.id;

    // 检查点赞记录是否存在
    const like = await prisma.like.findFirst({
      where: {
        postId,
        userId: user.id,
      },
    });

    if (!like) {
      return new NextResponse(null, { status: 404 });
    }

    // 删除点赞记录并更新点赞数
    await prisma.$transaction([
      prisma.like.delete({
        where: {
          id: like.id,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[UNLIKE_POST]", error);
    return new NextResponse(null, { status: 500 });
  }
}
