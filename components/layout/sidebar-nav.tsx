"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { menuItems } from "@/lib/config/menus";
import { useUserPermissions } from "@/hooks/use-user-permissions";

interface SidebarNavProps {
  userId: string;
}

export function SidebarNav({ userId }: SidebarNavProps) {
  const pathname = usePathname();
  const { permissions = [], isLoading } = useUserPermissions();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 bg-muted rounded-md" />
        ))}
      </div>
    );
  }

  // 过滤菜单项
  const visibleMenuItems = menuItems.filter((item) => {
    // 如果没有权限要求，则显示
    if (!item.permissions?.length) return true;
    // 检查用户是否有任何所需权限
    return item.permissions.some((permission) =>
      permissions.includes(permission)
    );
  });

  return (
    <nav className="flex flex-col gap-2">
      {visibleMenuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start"
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
