import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { PostEditor } from "@/components/post/post-editor";

export default async function NewPostPage() {
  const user = await checkAuth();
  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="新建文章" text="创建一篇新的博客文章。" />
      <div className="grid gap-10">
        <PostEditor />
      </div>
    </DashboardShell>
  );
}
