const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 创建基础角色
  const adminRole = await prisma.role.create({
    data: {
      name: "admin",
      description: "管理员",
    },
  });

  const userRole = await prisma.role.create({
    data: {
      name: "user",
      description: "普通用户",
    },
  });

  // 创建基础权限
  const permissions = await Promise.all([
    prisma.permission.create({
      data: {
        name: "post:create",
        description: "创建文章",
      },
    }),
    prisma.permission.create({
      data: {
        name: "post:edit",
        description: "编辑文章",
      },
    }),
    prisma.permission.create({
      data: {
        name: "post:delete",
        description: "删除文章",
      },
    }),
    prisma.permission.create({
      data: {
        name: "comment:create",
        description: "发表评论",
      },
    }),
  ]);

  // 为管理员角色添加所有权限
  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // 为普通用户添加基本权限
  await prisma.rolePermission.create({
    data: {
      roleId: userRole.id,
      permissionId: permissions[0].id, // post:create
    },
  });

  // 创建管理员用户
  await prisma.user.create({
    data: {
      email: "2661646649@qq.com",
      password: "$2b$10$s5oaJOTO2A8SY1przsSXC.jrCBHZcvMPuC3suay8cCcTz3KBPsoqW", // 密码：1213141516zmA@
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
