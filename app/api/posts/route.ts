import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as z from "zod";

const postSchema = z.object({
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

export async function POST(req: NextRequest) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const body = await req.json();
    const result = postSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "数据验证失败", details: result.error.errors },
        { status: 400 }
      );
    }

    const { tags, ...postData } = result.data;

    const post = await prisma.post.create({
      data: {
        ...postData,
        authorId: user.id,
        postTags: tags?.length
          ? {
              create: tags.map((tag) => ({
                tag: {
                  connect: {
                    id: tag.id,
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        postTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...post,
      tags: post.postTags.map((pt) => pt.tag),
      postTags: undefined,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建文章失败" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const userId = searchParams.get("userId");
    const skip = (page - 1) * limit;

    const where = userId ? { authorId: userId } : {};

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          postTags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const formattedPosts = posts.map((post) => ({
      ...post,
      tags: post.postTags.map((pt) => pt.tag),
      postTags: undefined,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      posts: formattedPosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取文章列表失败" },
      { status: 500 }
    );
  }
}
