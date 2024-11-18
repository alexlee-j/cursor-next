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

    // 创建收藏记录并更新收藏数
    await prisma.$transaction([
      prisma.favorite.create({
        data: {
          postId,
          userId: user.id,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: {
          favoritesCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[FAVORITE_POST]", error);
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

    // 检查收藏记录是否存在
    const favorite = await prisma.favorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    if (!favorite) {
      return new NextResponse(null, { status: 404 });
    }

    // 删除收藏记录并更新收藏数
    await prisma.$transaction([
      prisma.favorite.delete({
        where: {
          postId_userId: {
            postId,
            userId: user.id,
          },
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: {
          favoritesCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[UNFAVORITE_POST]", error);
    return new NextResponse(null, { status: 500 });
  }
}
