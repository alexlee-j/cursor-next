import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await checkAuth();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 hidden h-screen w-[200px] flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="text-lg font-semibold">博客系统</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <DashboardNav />
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-[200px]">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="md:hidden">
              <DashboardNav />
            </div>
            <div className="ml-auto flex items-center gap-4">
              <UserNav user={user} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="container py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
