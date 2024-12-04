"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserNavProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    image?: string | null;
  };
}

export function UserNav({ user }: UserNavProps) {
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("退出登录失败");
      }

      // 刷新页面以清除客户端状态并重定向到首页
      window.location.href = "/";
    } catch (error) {
      console.error("退出登录失败", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image || ''} alt={user.name || user.email} />
          <AvatarFallback>{(user.name || user.email).charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          className="text-red-600 focus:text-red-600 cursor-pointer" 
          onClick={handleLogout}
        >
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
