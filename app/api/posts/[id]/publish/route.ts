import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAllPermissions } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id: postId } = await Promise.resolve((await context.params));

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    if (post.status === "PUBLISHED") {
      return NextResponse.json({ error: "文章已经发布" }, { status: 400 });
    }

    const hasManagePermission = await hasAllPermissions(user, [PERMISSIONS.POST.MANAGE]);
    if (!hasManagePermission && post.authorId !== user.id) {
      return NextResponse.json({ error: "无权发布此文章" }, { status: 403 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED",
      },
    });

    return NextResponse.json({
      message: "文章已发布",
      post: updatedPost,
    });
  } catch (error) {
    console.error("发布文章失败:", error);
    return NextResponse.json(
      { error: "发布文章失败，请稍后重试" },
      { status: 500 }
    );
  }
}
