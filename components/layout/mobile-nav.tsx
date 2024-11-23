"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { menuItems } from "@/lib/config/menus";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { permissions, isLoading } = useUserPermissions();
  const pathname = usePathname();

  if (isLoading) {
    return null;
  }

  // 过滤菜单项
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.permissions.length) return true;
    return item.permissions.some((permission) =>
      permissions.includes(permission)
    );
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        <SheetHeader>
          <SheetTitle>导航菜单</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-4">
          {visibleMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 px-2 py-1 text-sm rounded-md transition-colors",
                pathname === item.href ? "bg-accent" : "hover:bg-accent/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          ))}
          <Separator className="my-2" />
          <div className="px-2 flex items-center justify-between">
            <span className="text-sm">主题设置</span>
            <ThemeToggle />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
