import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthUser } from "@/types/user"
import { UserNav } from "./user-nav"

interface SiteHeaderProps {
  user: AuthUser | null
}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            博客系统
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <UserNav user={user} />
          ) : (
            <Link 
              href="/login" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              登录
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
