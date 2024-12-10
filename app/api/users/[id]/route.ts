import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { RouteHandlerContext } from "next/dist/server/web/types";

export async function GET(
  request: Request,
  context: RouteHandlerContext<{ id: string }> // 使用 context 来获取动态路由的参数
) {
  const { params } = context;
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        bio: true,
        website: true,
        location: true,
        commentCount: true,
        trustLevel: true,
        isActive: true,
        posts: {
          where: {
            status: 'PUBLISHED',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            status: true,
            viewCount: true,
            _count: {
              select: {
                likes: true,
                comments: true,
                favorites: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Convert avatar bytes to base64 string if it exists
    const userData = {
      ...user,
      avatar: user.avatar ? `data:image/jpeg;base64,${Buffer.from(user.avatar).toString('base64')}` : null,
      posts: user.posts.map(post => ({
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        favoritesCount: post._count.favorites,
      })),
    };

    return NextResponse.json(userData);
  } catch (error: any) {
    console.error("Error fetching user:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}