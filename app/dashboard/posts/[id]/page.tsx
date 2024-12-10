import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { PostEditor } from "@/components/post/post-editor";
import { prisma } from "@/lib/db";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      postTags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!post) return null;

  return {
    ...post,
    tags: post.postTags.map((pt) => ({
      id: pt.tag.id,
      name: pt.tag.name,
    })),
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const user = await checkAuth();
  if (!user) {
    redirect("/login");
  }

  // 等待并解构 params
  const { id } = await params;

  // 确保 id 存在
  if (!id) {
    redirect("/dashboard/posts");
  }

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
