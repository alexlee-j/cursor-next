import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  shouldAutoApprove,
  updateUserTrustLevel,
} from "@/lib/comment-moderation";

// 获取评论列表
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        postId: params.id,
        status: "APPROVED",
        parentId: null, // 只获取顶层评论
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        replies: {
          where: {
            status: "APPROVED",
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            replyTo: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "获取评论失败" }, { status: 500 });
  }
}

// 发表评论
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { content, parentId, replyToId } = await request.json();
    const postId = params.id;

    // 自动审核
    const autoApproved = await shouldAutoApprove(content, user.id);
    const status = autoApproved ? "APPROVED" : "PENDING";

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: user.id,
        parentId,
        replyToId,
        status,
        autoApproved,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        replyTo: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // 更新用户评论统计
    await prisma.user.update({
      where: { id: user.id },
      data: {
        commentCount: { increment: 1 },
        lastCommentAt: new Date(),
        ...(status === "APPROVED" ? { approvedCount: { increment: 1 } } : {}),
      },
    });

    // 更新用户信任等级
    await updateUserTrustLevel(user.id);

    return NextResponse.json({
      ...comment,
      needsReview: !autoApproved,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "评论失败，请稍后重试" },
      { status: 500 }
    );
  }
}
