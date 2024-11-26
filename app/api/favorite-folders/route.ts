import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAuth } from "@/lib/auth";
import { z } from "zod";

const createFolderSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(50, "名称不能超过50个字符"),
  description: z.string().max(200, "描述不能超过200个字符").optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await checkAuth();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createFolderSchema.parse(body);

    // 检查同名收藏夹
    const existingFolder = await prisma.favoriteFolder.findFirst({
      where: {
        userId: user.id,
        name: validatedData.name,
      },
    });

    if (existingFolder) {
      return Response.json({ error: "已存在同名收藏夹" }, { status: 400 });
    }

    // 创建收藏夹
    const folder = await prisma.favoriteFolder.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    });

    return Response.json(folder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error creating favorite folder:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await checkAuth().catch(() => null);
    if (!user) {
      // 游客访问时返回空数组而不是错误
      return NextResponse.json([]);
    }

    // 获取用户的所有收藏夹
    const folders = await prisma.favoriteFolder.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("[GET_FAVORITE_FOLDERS]", error);
    return NextResponse.json({ error: "获取收藏夹失败" }, { status: 500 });
  }
}
