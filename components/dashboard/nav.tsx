"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { menuItems } from "@/lib/config/menus";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

export function DashboardNav() {
  const pathname = usePathname();
  const { permissions, isLoading } = useUserPermissions();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // 监听窗口大小变化
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初始检查
    checkMobile();

    // 添加监听器
    window.addEventListener("resize", checkMobile);

    // 清理监听器
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-20 bg-muted rounded-md" />
        ))}
      </div>
    );
  }

  // 过滤菜单项
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.permissions.length) return true;
    return item.permissions.some((permission) =>
      permissions.includes(permission)
    );
  });

  const NavLinks = () => (
    <div className="space-y-1">
      {visibleMenuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setIsOpen(false)}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "w-full justify-start"
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.title}
        </Link>
      ))}
    </div>
  );

  // 移动端显示
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button className="p-2">
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[280px]">
          <SheetHeader>
            <SheetTitle>导航菜单</SheetTitle>
          </SheetHeader>
          <nav className="mt-4">
            <NavLinks />
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  // 桌面端显示
  return (
    <nav className="space-y-1 px-2">
      <NavLinks />
    </nav>
  );
}
