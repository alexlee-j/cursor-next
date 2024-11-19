import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as z from "zod";

const favoriteSchema = z.object({
  folderId: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const postId = params.id;
    const json = await req.json();
    const { folderId } = favoriteSchema.parse(json);

    // 检查文章是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 检查收藏夹是否存在且属于当前用户
    const folder = await prisma.favoriteFolder.findFirst({
      where: {
        id: folderId,
        userId: user.id,
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "收藏夹不存在" }, { status: 404 });
    }

    // 创建收藏记录
    await prisma.favorite.create({
      data: {
        postId,
        userId: user.id,
        folderId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FAVORITE_POST]", error);
    return NextResponse.json(
      { error: "收藏失败，请稍后重试" },
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

    const postId = params.id;
    const searchParams = req.nextUrl.searchParams;
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      return NextResponse.json({ error: "需要指定收藏夹" }, { status: 400 });
    }

    // 删除收藏记录
    const favorite = await prisma.favorite.findFirst({
      where: {
        postId,
        userId: user.id,
        folderId,
      },
    });

    if (!favorite) {
      return NextResponse.json({ error: "收藏记录不存在" }, { status: 404 });
    }

    await prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[UNFAVORITE_POST]", error);
    return NextResponse.json(
      { error: "取消收藏失败，请稍后重试" },
      { status: 500 }
    );
  }
}
