import { prisma } from "./db";
import { ROLES, PERMISSIONS } from "./constants/permissions";

let isInitialized = false;

export async function initializeRolePermissions() {
  if (isInitialized) {
    console.log("Role permissions already initialized in this session, skipping...");
    return;
  }

  try {
    // 检查是否已经初始化
    const existingPermissions = await prisma.rolePermission.count();
    
    if (existingPermissions > 0) {
      console.log("Role permissions already exist in database, skipping initialization...");
      isInitialized = true;
      return;
    }

    console.log("Starting role permissions initialization...");
    
    // 获取所有角色和权限
    const roles = await prisma.role.findMany();
    const permissions = await prisma.permission.findMany();
    
    console.log(`Found ${roles.length} roles and ${permissions.length} permissions`);
    
    // 为每个角色批量创建权限
    for (const role of roles) {
      let permissionsToAssign: string[] = [];
      
      switch (role.name) {
        case ROLES.SUPER_ADMIN:
          permissionsToAssign = permissions.map(p => p.id);
          console.log(`Assigning ${permissionsToAssign.length} permissions to SUPER_ADMIN`);
          break;
        case ROLES.ADMIN:
          permissionsToAssign = permissions
            .filter(p => !p.name.startsWith("USER_MANAGE"))
            .map(p => p.id);
          console.log(`Assigning ${permissionsToAssign.length} permissions to ADMIN`);
          break;
        case ROLES.USER:
          permissionsToAssign = permissions
            .filter(p => p.name.startsWith("POST_") || p.name.startsWith("COMMENT_"))
            .map(p => p.id);
          console.log(`Assigning ${permissionsToAssign.length} permissions to USER`);
          break;
        default:
          console.log(`Skipping unknown role: ${role.name}`);
          continue;
      }
      
      if (permissionsToAssign.length > 0) {
        // 先删除该角色的所有现有权限
        await prisma.rolePermission.deleteMany({
          where: { roleId: role.id }
        });

        // 批量创建新的权限关系
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
    
    console.log("Successfully initialized role permissions");
    isInitialized = true;
  } catch (error) {
    console.error("Error initializing role permissions:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
