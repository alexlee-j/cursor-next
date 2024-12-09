import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/theme-transition.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { initializeRolesAndPermissions } from "@/lib/init-permissions";

const inter = Inter({ subsets: ["latin"] });

// 确保角色和权限已初始化
initializeRolesAndPermissions().catch(console.error);

export const metadata: Metadata = {
  title: "博客系统",
  description: "博客系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="blog-theme"
          forcedTheme={undefined}
          themes={["light", "dark", "system"]}
        >
          <div 
            className="relative min-h-screen bg-background font-sans antialiased"
            id="root-content"
          >
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
