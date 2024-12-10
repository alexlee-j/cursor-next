import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { checkAuth } from "@/lib/auth";
import type { RouteHandlerContext } from "next/server";

export async function POST(
  request: NextRequest,
  context: RouteHandlerContext<{ id: string }>
) {
  try {
    const user = await checkAuth();
    const {id} = await Promise.resolve((await context.params));

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderId } = await request.json();
    const postId = id;

    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        postId,
        userId: user.id,
        folderId,
      },
    });

    let isFavorited: boolean;

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });
      isFavorited = false;
    } else {
      await prisma.favorite.create({
        data: {
          postId,
          userId: user.id,
          folderId,
        },
      });
      isFavorited = true;
    }

    return Response.json({ isFavorited });
  } catch (error: unknown) {
    console.error("Error handling favorite:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
