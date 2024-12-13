import { prisma } from "../lib/db";
import { ROLES, PERMISSIONS } from "../lib/constants/permissions";

async function main() {
  try {
    // 检查是否已经初始化
    const existingPermissions = await prisma.rolePermission.count();
    if (existingPermissions > 0) {
      console.log("Role permissions already initialized, skipping...");
      await prisma.$disconnect();
      return;
    }

    // 如果没有初始化，则执行初始化
    await prisma.$transaction(async (tx) => {
      console.log("Starting role permissions initialization...");
      
      // 先删除所有现有的角色权限关系
      const deleteResult = await tx.rolePermission.deleteMany({});
      console.log(`Deleted ${deleteResult.count} existing role permissions`);
      
      // 重新创建角色权限关系
      const roles = await tx.role.findMany();
      const permissions = await tx.permission.findMany();
      
      console.log(`Found ${roles.length} roles and ${permissions.length} permissions`);
      
      for (const role of roles) {
        // 根据角色类型分配权限
        let permissionsToAssign: string[] = [];
        
        switch (role.name) {
          case ROLES.SUPER_ADMIN:
            // 超级管理员拥有所有权限
            permissionsToAssign = permissions.map(p => p.id);
            console.log(`Assigning ${permissionsToAssign.length} permissions to SUPER_ADMIN`);
            break;
          case ROLES.ADMIN:
            // 管理员拥有除了用户管理之外的所有权限
            permissionsToAssign = permissions
              .filter(p => !p.name.startsWith("USER_MANAGE"))
              .map(p => p.id);
            console.log(`Assigning ${permissionsToAssign.length} permissions to ADMIN`);
            break;
          case ROLES.USER:
            // 普通用户只有基本权限
            permissionsToAssign = permissions
              .filter(p => p.name.startsWith("POST_") || p.name.startsWith("COMMENT_"))
              .map(p => p.id);
            console.log(`Assigning ${permissionsToAssign.length} permissions to USER`);
            break;
          default:
            console.log(`Skipping unknown role: ${role.name}`);
            continue;
        }

        // 批量创建角色权限关系
        if (permissionsToAssign.length > 0) {
          const rolePermissions = permissionsToAssign.map(permissionId => ({
            roleId: role.id,
            permissionId
          }));

          await tx.rolePermission.createMany({
            data: rolePermissions,
            skipDuplicates: true
          });
        }
      }

      console.log("Role permissions initialization completed successfully!");
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error during role permissions initialization:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
