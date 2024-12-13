import { prisma } from "../lib/db";
import { PERMISSIONS, ROLES } from "../lib/constants/permissions";

async function initializeApp() {
  try {
    console.log("Starting application initialization...");

    // 1. 创建所有权限
    console.log("Creating permissions...");
    const permissions = Object.values(PERMISSIONS).flatMap((group) =>
      Object.values(group)
    );

    await prisma.permission.createMany({
      data: permissions.map((name) => ({
        name,
        description: `Permission for ${name}`,
      })),
      skipDuplicates: true,
    });

    // 2. 创建所有角色
    console.log("Creating roles...");
    await prisma.role.createMany({
      data: Object.values(ROLES).map((name) => ({
        name,
        description: `Role of ${name}`,
      })),
      skipDuplicates: true,
    });

    // 3. 初始化角色权限
    console.log("Initializing role permissions...");
    const allPermissions = await prisma.permission.findMany();
    const roles = await prisma.role.findMany();

    for (const role of roles) {
      let permissionsToAssign: string[] = [];
      
      switch (role.name) {
        case ROLES.SUPER_ADMIN:
          permissionsToAssign = allPermissions.map(p => p.id);
          break;
        case ROLES.ADMIN:
          permissionsToAssign = allPermissions
            .filter(p => !p.name.startsWith("USER_MANAGE"))
            .map(p => p.id);
          break;
        case ROLES.USER:
          permissionsToAssign = allPermissions
            .filter(p => p.name.startsWith("POST_") || p.name.startsWith("COMMENT_"))
            .map(p => p.id);
          break;
      }

      if (permissionsToAssign.length > 0) {
        // 先删除现有权限
        await prisma.rolePermission.deleteMany({
          where: { roleId: role.id }
        });

        // 批量创建新权限
        await prisma.rolePermission.createMany({
          data: permissionsToAssign.map(permissionId => ({
            roleId: role.id,
            permissionId
          })),
          skipDuplicates: true
        });

        console.log(`Created permissions for role ${role.name}`);
      }
    }

    console.log("Application initialization completed successfully");
  } catch (error) {
    console.error("Error during application initialization:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initializeApp().catch(console.error);
