import { prisma } from "../lib/db";
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS } from "../lib/constants/permissions";

async function main() {
  try {
    // 1. 创建所有权限
    const permissions = Object.values(PERMISSIONS).flatMap((group) =>
      Object.values(group)
    );

    console.log("Creating permissions...");
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
    console.log("Creating roles...");
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
    console.log("Assigning permissions to roles...");
    await prisma.$transaction(async (tx) => {
      for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
        const role = await tx.role.findUnique({
          where: { name: roleName },
        });

        if (!role) {
          console.warn(`Role ${roleName} not found, skipping...`);
          continue;
        }

        // 获取所有权限记录
        const permissionRecords = await tx.permission.findMany({
          where: {
            name: {
              in: permissionNames as string[],
            },
          },
        });

        if (permissionRecords.length === 0) {
          console.warn(`No permissions found for role ${roleName}, skipping...`);
          continue;
        }

        // 先清除现有权限
        await tx.rolePermission.deleteMany({
          where: { roleId: role.id },
        });

        // 使用 createMany 批量创建权限关系
        await tx.rolePermission.createMany({
          data: permissionRecords.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true, // 跳过重复记录
        });

        console.log(
          `Assigned ${permissionRecords.length} permissions to role ${roleName}`
        );
      }
    });

    console.log("Roles and permissions initialized successfully");
  } catch (error) {
    console.error("Error initializing roles and permissions:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
