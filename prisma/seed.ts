const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // 创建基础角色
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "管理员",
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: "user" },
    update: {},
    create: {
      name: "user",
      description: "普通用户",
    },
  });

  // 创建基础权限
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { name: "post:create" },
      update: {},
      create: {
        name: "post:create",
        description: "创建文章",
      },
    }),
    prisma.permission.upsert({
      where: { name: "post:edit" },
      update: {},
      create: {
        name: "post:edit",
        description: "编辑文章",
      },
    }),
    prisma.permission.upsert({
      where: { name: "post:delete" },
      update: {},
      create: {
        name: "post:delete",
        description: "删除文章",
      },
    }),
    prisma.permission.upsert({
      where: { name: "comment:create" },
      update: {},
      create: {
        name: "comment:create",
        description: "发表评论",
      },
    }),
  ]);

  // 为管理员角色添加所有权限
  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // 为普通用户添加基本权限
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: userRole.id,
        permissionId: permissions[0].id,
      },
    },
    update: {},
    create: {
      roleId: userRole.id,
      permissionId: permissions[0].id, // post:create
    },
  });

  // 创建管理员用户
  const adminPassword = "123456A.";
  const hashedPassword = await hash(adminPassword, 12);
  
  await prisma.user.upsert({
    where: { email: "example@example.com" },
    update: {
      password: hashedPassword,
      name: "Admin",
      emailVerified: true,
    },
    create: {
      email: "example@example.com",
      password: hashedPassword,
      name: "Admin",
      emailVerified: true,
      userRoles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
