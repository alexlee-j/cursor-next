import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { title, content, type, status = "DRAFT" } = await req.json();

    // 验证必填字段
    if (!title || !content) {
      return NextResponse.json(
        { error: "标题和内容不能为空" },
        { status: 400 }
      );
    }

    // 生成摘要
    const excerpt = content
      .replace(/<[^>]+>/g, "") // 移除 HTML 标签
      .slice(0, 200) // 取前200个字符
      .trim();

    // 创建文章
    const post = await prisma.post.create({
      data: {
        title,
        content,
        type: type || "markdown",
        status,
        excerpt,
        authorId: user.id,
        viewCount: 0,
        likesCount: 0,
      },
    });

    return NextResponse.json({
      message: "文章创建成功",
      post,
    });
  } catch (error) {
    console.error("创建文章失败:", error);
    return NextResponse.json(
      { error: "创建文章失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// 获取文章列表
export async function GET(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where = {
      authorId: user.id,
      ...(status ? { status } : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: {
          updatedAt: "desc",
        },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取文章列表失败:", error);
    return NextResponse.json(
      { error: "获取文章列表失败，请稍后重试" },
      { status: 500 }
    );
  }
}
