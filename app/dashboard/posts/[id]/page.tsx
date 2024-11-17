import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { PostEditor } from "@/components/post/post-editor";
import { prisma } from "@/lib/db";

interface PostPageProps {
  params: {
    id: string;
  };
}

async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      status: true,
      authorId: true,
    },
  });

  return post;
}

export default async function PostPage({ params }: PostPageProps) {
  const user = await checkAuth();
  if (!user) {
    redirect("/login");
  }

  const id = await params.id;
  const post = await getPost(id);

  if (!post) {
    redirect("/dashboard/posts");
  }

  // 检查是否是文章作者
  if (post.authorId !== user.id) {
    redirect("/dashboard/posts");
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="编辑文章" text="修改您的文章内容。" />
      <div className="grid gap-10">
        <PostEditor post={post} />
      </div>
    </DashboardShell>
  );
}
