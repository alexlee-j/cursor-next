import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as z from "zod";

const updatePostSchema = z.object({
  title: z.string().min(1, { message: "标题不能为空" }),
  content: z.string().min(1, { message: "内容不能为空" }),
  excerpt: z.string().optional(),
  tags: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    )
    .optional(),
  type: z.enum(["markdown", "richtext"]),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

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
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 使用 schema 验证输入数据
    const result = updatePostSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.errors },
        { status: 400 }
      );
    }

    const { title, content, excerpt, type, status, tags } = result.data;

    // 检查文章是否存在且属于当前用户
    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.authorId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this post" },
        { status: 403 }
      );
    }

    // 首先删除现有的标签关联
    await prisma.postTag.deleteMany({
      where: {
        postId: params.id,
      },
    });

    // 更新文章和创建新的标签关联
    const post = await prisma.post.update({
      where: {
        id: params.id,
        authorId: user.id,
      },
      data: {
        title,
        content,
        excerpt,
        type,
        status,
        postTags: {
          create: tags?.map((tag) => ({
            tag: {
              connect: {
                id: tag.id,
              },
            },
          })),
        },
      },
      include: {
        postTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("更新文章失败:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}
