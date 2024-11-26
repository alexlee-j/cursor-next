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
  console.log("Received POST request");
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Received request body:", body);

    const result = postSchema.safeParse(body);
    if (!result.success) {
      console.log("Validation failed:", result.error.errors);
      return NextResponse.json(
        {
          error: "数据验证失败",
          details: result.error.errors,
        },
        { status: 400 }
      );
    }

    const { tags, ...postData } = result.data;

    try {
      const post = await prisma.post.create({
        data: {
          ...postData,
          authorId: user.id,
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

      const formattedPost = {
        ...post,
        tags: post.postTags.map((pt) => pt.tag),
        postTags: undefined,
      };

      return NextResponse.json(formattedPost);
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "数据库操作失败", details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "创建文章失败", details: error.message },
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

    if (!userId) {
      return NextResponse.json(
        { error: "缺少用户ID参数" },
        { status: 400 }
      );
    }

    const where = { authorId: userId };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        take: limit,
        skip,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
          postTags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              favorites: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const formattedPosts = posts.map((post) => ({
      ...post,
      tags: post.postTags.map((pt) => pt.tag),
      commentsCount: post._count.comments,
      likesCount: post._count.likes,
      favoritesCount: post._count.favorites,
      postTags: undefined,
      _count: undefined,
    }));

    return NextResponse.json({
      posts: formattedPosts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("获取文章列表失败:", error);
    return NextResponse.json(
      { error: "获取文章列表失败，请稍后重试" },
      { status: 500 }
    );
  }
}
