import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PostEditor } from "@/components/post/post-editor";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function NewPostPage() {
  const user = await checkAuth();
  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="创建文章" text="写一篇新的文章。" />
      <div className="grid gap-10">
        <PostEditor
          post={{
            id: "",
            title: "",
            content: "",
            excerpt: "",
            type: "markdown",
            status: "DRAFT",
            tags: [],
          }}
        />
      </div>
    </DashboardShell>
  );
}
