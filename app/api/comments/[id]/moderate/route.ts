import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    const { action } = await request.json();

    // 检查权限
    const requiredPermission =
      action === "approve"
        ? PERMISSIONS.COMMENT.APPROVE
        : PERMISSIONS.COMMENT.REJECT;

    if (!hasPermission(user, requiredPermission)) {
      return NextResponse.json(
        { error: "没有权限执行此操作" },
        { status: 403 }
      );
    }

    const commentId = params.id;
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }

    // 更新评论状态
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
      },
    });

    // 如果通过，更新用户统计
    if (action === "approve") {
      await prisma.user.update({
        where: { id: comment.userId },
        data: {
          approvedCount: { increment: 1 },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error moderating comment:", error);
    return NextResponse.json(
      { error: "操作失败，请稍后重试" },
      { status: 500 }
    );
  }
}
