"use client";

import Link from "next/link";
import { User } from "@prisma/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/dashboard/user-nav";

interface DashboardNavProps {
  user: Pick<User, "name" | "email">;
}

export function DashboardNav({ user }: DashboardNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold">Dashboard</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserNav user={user} />
        </div>
      </div>
    </header>
  );
}
