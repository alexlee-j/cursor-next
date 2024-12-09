import { PERMISSIONS } from "../constants/permissions";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  MessageSquare,
  FolderHeart,
  Home,
} from "lucide-react";

export const menuItems = [
  {
    title: "首页",
    href: "/",
    icon: Home,
    permissions: [], // 所有登录用户可见
  },
  {
    title: "概览",
    href: "/dashboard",
    icon: LayoutDashboard,
    permissions: [], // 所有登录用户可见
  },
  {
    title: "我的文章",
    href: "/dashboard/posts",
    icon: FileText,
    permissions: [], // 所有登录用户可见，因为用户可以管理自己的文章
  },
  {
    title: "评论管理",
    href: "/dashboard/comments",
    icon: MessageSquare,
    permissions: [PERMISSIONS.COMMENT.MANAGE, PERMISSIONS.COMMENT.APPROVE],
  },
  {
    title: "用户管理",
    href: "/dashboard/usersManage",
    icon: Users,
    permissions: [PERMISSIONS.USER.MANAGE],
  },
  {
    title: "收藏夹",
    href: "/dashboard/favorites",
    icon: FolderHeart,
    permissions: [], // 所有登录用户可见
  },
  {
    title: "个人中心",
    href: "/dashboard/settings",
    icon: Settings,
    permissions: [],
  },
];
