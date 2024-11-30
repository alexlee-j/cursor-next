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
  context: { params: { id: string } }
) {
  try {
    const { id: postId } = await Promise.resolve(context.params);

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        status: "APPROVED",
        parentId: null, // 只获取顶层评论
      },
      include: {
        user: {
          select: {
            id: true,
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
                id: true,
                name: true,
                email: true,
              },
            },
            replyTo: {
              select: {
                id: true,
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
  context: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { content, parentId, replyToId } = await request.json();
    const { id: postId } = await Promise.resolve(context.params);

    // 验证文章是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true }
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    if (post.status !== "PUBLISHED") {
      return NextResponse.json({ error: "不能评论未发布的文章" }, { status: 403 });
    }

    // 如果是回复，验证父评论是否存在且已通过审核
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, status: true }
      });

      if (!parentComment) {
        return NextResponse.json({ error: "父评论不存在" }, { status: 404 });
      }

      if (parentComment.status !== "APPROVED") {
        return NextResponse.json({ error: "不能回复未审核的评论" }, { status: 403 });
      }
    }

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
            id: true,
            name: true,
            email: true,
          },
        },
        replyTo: parentId ? {
          select: {
            id: true,
            name: true,
            email: true,
          },
        } : undefined,
        replies: {
          where: {
            status: "APPROVED",
          },
          include: {
            user: {
              select: {
                id: true,
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
