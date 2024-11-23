import { prisma } from "../lib/db";
import { ROLES } from "../lib/constants/permissions";

// 将用户升级为超级管理员
export async function promoteToSuperAdmin(userEmail: string) {
  try {
    const superAdminRole = await prisma.role.findUnique({
      where: { name: ROLES.SUPER_ADMIN },
    });

    if (!superAdminRole) {
      throw new Error("Super admin role not found");
    }

    // 使用事务确保操作的原子性
    await prisma.$transaction(async (tx) => {
      // 删除用户现有角色
      await tx.userRole.deleteMany({
        where: {
          user: {
            email: userEmail,
          },
        },
      });

      // 添加超级管理员角色
      await tx.userRole.create({
        data: {
          user: {
            connect: {
              email: userEmail,
            },
          },
          role: {
            connect: {
              id: superAdminRole.id,
            },
          },
        },
      });

      // 记录操作日志
      await tx.operationLog.create({
        data: {
          type: "ROLE_CHANGE",
          description: `User ${userEmail} promoted to super admin`,
          metadata: {
            oldRole: "user",
            newRole: "super_admin",
            changedAt: new Date().toISOString(),
          },
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error promoting user to super admin:", error);
    throw error;
  }
}

// 将用户设置为管理员
export async function promoteToAdmin(userEmail: string) {
  try {
    const adminRole = await prisma.role.findUnique({
      where: { name: ROLES.ADMIN },
    });

    if (!adminRole) {
      throw new Error("Admin role not found");
    }

    await prisma.$transaction(async (tx) => {
      // 删除用户现有角色
      await tx.userRole.deleteMany({
        where: {
          user: {
            email: userEmail,
          },
        },
      });

      // 添加管理员角色
      await tx.userRole.create({
        data: {
          user: {
            connect: {
              email: userEmail,
            },
          },
          role: {
            connect: {
              id: adminRole.id,
            },
          },
        },
      });

      // 记录操作日志
      await tx.operationLog.create({
        data: {
          type: "ROLE_CHANGE",
          description: `User ${userEmail} promoted to admin`,
          metadata: {
            oldRole: "user",
            newRole: "admin",
            changedAt: new Date().toISOString(),
          },
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    throw error;
  }
}

// 降级用户为普通用户
export async function demoteToUser(userEmail: string) {
  try {
    const userRole = await prisma.role.findUnique({
      where: { name: ROLES.USER },
    });

    if (!userRole) {
      throw new Error("User role not found");
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email: userEmail },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const oldRole = user.userRoles[0]?.role.name || "unknown";

      // 删除用户现有角色
      await tx.userRole.deleteMany({
        where: {
          userId: user.id,
        },
      });

      // 添加普通用户角色
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: userRole.id,
        },
      });

      // 记录操作日志
      await tx.operationLog.create({
        data: {
          type: "ROLE_CHANGE",
          description: `User ${userEmail} demoted to regular user`,
          metadata: {
            oldRole,
            newRole: "user",
            changedAt: new Date().toISOString(),
          },
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error demoting user:", error);
    throw error;
  }
}

// 获取用户当前角色
export async function getUserRole(userEmail: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user.userRoles[0]?.role.name || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    throw error;
  }
}

// 添加 CommonJS 导出
module.exports = {
  promoteToSuperAdmin,
  promoteToAdmin,
  demoteToUser,
  getUserRole,
};
