import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// 更新收藏夹
export async function PATCH(req: NextRequest, props: RouteContext): Promise<NextResponse> {
  const params = await props.params;
  try {
    const user = await checkAuth();
    const { id } = params;
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { name, description } = await req.json();

    // 验证名称
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "收藏夹名称不能为空" },
        { status: 400 }
      );
    }

    // 检查收藏夹是否存在且属于当前用户
    const folder = await prisma.favoriteFolder.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "收藏夹不存在或无权访问" },
        { status: 404 }
      );
    }

    // 检查是否为默认收藏夹
    if (folder.isDefault) {
      return NextResponse.json(
        { error: "默认收藏夹不能修改" },
        { status: 400 }
      );
    }

    // 检查新名称是否与其他收藏夹重复
    if (name.trim() !== folder.name) {
      const existingFolder = await prisma.favoriteFolder.findFirst({
        where: {
          userId: user.id,
          name: name.trim(),
          id: { not: id },
        },
      });

      if (existingFolder) {
        return NextResponse.json(
          { error: "已存在同名收藏夹" },
          { status: 400 }
        );
      }
    }

    const updatedFolder = await prisma.favoriteFolder.update({
      where: { id: id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error("Error updating favorite folder:", error);
    return NextResponse.json({ error: "更新收藏夹失败" }, { status: 500 });
  }
}

// 删除收藏夹
export async function DELETE(req: NextRequest, props: RouteContext): Promise<NextResponse> {
  const params = await props.params;
  try {
    const user = await checkAuth();
    const { id } = params;
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 检查收藏夹是否存在且属于当前用户
    const folder = await prisma.favoriteFolder.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "收藏夹不存在或无权访问" },
        { status: 404 }
      );
    }

    // 检查是否为默认收藏夹
    if (folder.isDefault) {
      return NextResponse.json(
        { error: "默认收藏夹不能删除" },
        { status: 400 }
      );
    }

    // 删除收藏夹（关联的收藏会自动删除）
    await prisma.favoriteFolder.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting favorite folder:", error);
    return NextResponse.json({ error: "删除收藏夹失败" }, { status: 500 });
  }
}
