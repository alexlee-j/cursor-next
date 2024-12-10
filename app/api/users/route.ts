import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";

// 获取用户列表
export async function GET(request: Request) {
  try {
    const user = await checkAuth();
    if (!user || !user.roles.some(role => role.permissions.some(p => p.name === PERMISSIONS.USER.MANAGE))) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const where = {
      AND: [
        {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        },
        status === "active" ? { isActive: true } :
        status === "inactive" ? { isActive: false } : {},
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          createdAt: true,
          emailVerified: true,
          trustLevel: true,
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
          userRoles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map(user => ({
        ...user,
        roles: user.userRoles.map(ur => ur.role.name),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// 更新用户状态
export async function PATCH(request: Request) {
  try {
    const user = await checkAuth();
    if (!user || !user.roles.some(role => role.permissions.some(p => p.name === PERMISSIONS.USER.MANAGE))) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { userId, isActive, roles } = body;

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    const updates: any = {};
    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 更新用户状态
      const user = await tx.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
        },
      });

      // 如果提供了角色，更新用户角色
      if (roles && Array.isArray(roles)) {
        // 删除现有角色
        await tx.userRole.deleteMany({
          where: { userId },
        });

        // 添加新角色
        if (roles.length > 0) {
          await tx.userRole.createMany({
            data: roles.map(roleName => ({
              userId,
              roleId: roleName,
            })),
          });
        }
      }

      return user;
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
