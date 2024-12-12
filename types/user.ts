import { JsonValue } from "@prisma/client/runtime/library";

export interface Permission {
  id: string;
  name: string;
  description: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
}

export interface UserRole {
  userId: string;
  roleId: string;
  role: Role;
}

export interface AuthUser {
  id: string;
  email: string;
  password: string;
  name: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  commentCount: number;
  approvedCount: number;
  lastCommentAt: Date | null;
  trustLevel: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  socialLinks: JsonValue | null;
  userRoles: UserRole[];
}
