import { prisma } from "@/lib/db";
import { ROLE_PERMISSIONS } from "./constants/permissions";
import { AuthUser } from "@/types/user";

export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();

  userRoles.forEach((userRole) => {
    userRole.role.rolePermissions.forEach((rp) => {
      permissions.add(rp.permission.name);
    });
  });

  return Array.from(permissions);
}

export async function hasPermission(
  user: AuthUser | null,
  permission: string
): Promise<boolean> {
  if (!user) return false;

  const userPermissions = await getUserPermissions(user.id);
  return userPermissions.includes(permission);
}

export async function hasAnyPermission(
  user: AuthUser | null,
  permissions: string[]
): Promise<boolean> {
  if (!user) return false;

  const userPermissions = await getUserPermissions(user.id);
  return permissions.some((permission) => userPermissions.includes(permission));
}

export async function hasAllPermissions(
  user: AuthUser | null,
  permissions: string[]
): Promise<boolean> {
  if (!user) return false;

  const userPermissions = await getUserPermissions(user.id);
  return permissions.every((permission) =>
    userPermissions.includes(permission)
  );
}
