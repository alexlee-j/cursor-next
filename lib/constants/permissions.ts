export const ROLES = {
  SUPER_ADMIN: "super_admin", // 超级管理员
  ADMIN: "admin", // 管理员
  USER: "user", // 普通用户
} as const;

// 基础权限（游客权限）
const BASE_PERMISSIONS = {
  POST: {
    VIEW: "post:view", // 查看文章
    VIEW_LIST: "post:view_list", // 查看文章列表
  },
};

// 用户权限
const USER_PERMISSIONS = {
  POST: {
    ...BASE_PERMISSIONS.POST,
    COMMENT: "post:comment", // 评论
    LIKE: "post:like", // 点赞
    FAVORITE: "post:favorite", // 收藏
  },
  COMMENT: {
    CREATE: "comment:create", // 创建评论
    UPDATE_OWN: "comment:update_own", // 更新自己的评论
    DELETE_OWN: "comment:delete_own", // 删除自己的评论
  },
  PROFILE: {
    UPDATE_OWN: "profile:update_own", // 更新自己的资料
  },
};

// 管理员权限
const ADMIN_PERMISSIONS = {
  POST: {
    ...USER_PERMISSIONS.POST,
    MANAGE: "post:manage", // 管理所有文章
  },
  COMMENT: {
    ...USER_PERMISSIONS.COMMENT,
    APPROVE: "comment:approve", // 审核评论
    REJECT: "comment:reject", // 拒绝评论
    MANAGE: "comment:manage", // 管理评论
  },
  USER: {
    VIEW: "user:view", // 查看用户信息
    MANAGE: "user:manage", // 管理用户
  },
};

// 超级管理员权限
const SUPER_ADMIN_PERMISSIONS = {
  ...ADMIN_PERMISSIONS,
  SYSTEM: {
    MANAGE_ROLES: "system:manage_roles", // 管理角色
    MANAGE_PERMISSIONS: "system:manage_permissions", // 管理权限
    MANAGE_SETTINGS: "system:manage_settings", // 管理系统设置
  },
};

export const PERMISSIONS = {
  ...SUPER_ADMIN_PERMISSIONS,
};

// 角色权限映射
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(SUPER_ADMIN_PERMISSIONS).flatMap((group) =>
    Object.values(group)
  ),
  [ROLES.ADMIN]: Object.values(ADMIN_PERMISSIONS).flatMap((group) =>
    Object.values(group)
  ),
  [ROLES.USER]: Object.values(USER_PERMISSIONS).flatMap((group) =>
    Object.values(group)
  ),
} as const;
