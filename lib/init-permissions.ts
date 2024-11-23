import { prisma } from "@/lib/db";
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS } from "./constants/permissions";

export async function initializeRolesAndPermissions() {
  try {
    // 1. 创建所有权限
    const permissions = Object.values(PERMISSIONS).flatMap((group) =>
      Object.values(group)
    );

    for (const permissionName of permissions) {
      await prisma.permission.upsert({
        where: { name: permissionName },
        update: {},
        create: {
          name: permissionName,
          description: `Permission for ${permissionName}`,
        },
      });
    }

    // 2. 创建所有角色
    for (const roleName of Object.values(ROLES)) {
      await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: {
          name: roleName,
          description: `Role of ${roleName}`,
        },
      });
    }

    // 3. 为角色分配权限
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await prisma.role.findUnique({
        where: { name: roleName },
      });

      if (role) {
        // 先清除现有权限
        await prisma.rolePermission.deleteMany({
          where: { roleId: role.id },
        });

        // 添加新权限
        for (const permissionName of permissions) {
          const permission = await prisma.permission.findUnique({
            where: { name: permissionName },
          });

          if (permission) {
            await prisma.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: permission.id,
              },
            });
          }
        }
      }
    }

    console.log("Roles and permissions initialized successfully");
  } catch (error) {
    console.error("Error initializing roles and permissions:", error);
    throw error;
  }
}
