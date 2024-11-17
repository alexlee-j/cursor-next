import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return NextResponse.json({ error: "无权删除此文章" }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "文章删除成功",
    });
  } catch (error) {
    console.error("删除文章失败:", error);
    return NextResponse.json(
      { error: "删除文章失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// 更新文章
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { title, content, status } = await req.json();

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return NextResponse.json({ error: "无权修改此文章" }, { status: 403 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        title,
        content,
        status,
      },
    });

    return NextResponse.json({
      message: "文章更新成功",
      post: updatedPost,
    });
  } catch (error) {
    console.error("更新文章失败:", error);
    return NextResponse.json(
      { error: "更新文章失败，请稍后重试" },
      { status: 500 }
    );
  }
}
