import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as z from "zod";

const createFolderSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const json = await req.json();
    const body = createFolderSchema.parse(json);

    // 检查用户的收藏夹数量是否达到上限
    const folderCount = await prisma.favoriteFolder.count({
      where: { userId: user.id },
    });

    if (folderCount >= 20) {
      return NextResponse.json(
        { error: "收藏夹数量已达到上限" },
        { status: 400 }
      );
    }

    // 创建收藏夹
    const folder = await prisma.favoriteFolder.create({
      data: {
        name: body.name,
        description: body.description,
        userId: user.id,
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("[CREATE_FAVORITE_FOLDER]", error);
    return NextResponse.json({ error: "创建收藏夹失败" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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
