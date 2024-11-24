import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PostEditor } from "@/components/post/post-editor";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await checkAuth();
  if (!user) {
    redirect("/login");
  }

  const post = await prisma.post.findFirst({
    where: {
      id: params.id,
      authorId: user.id,
    },
    include: {
      postTags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!post) {
    redirect("/dashboard/posts");
  }

  console.log("Raw post data:", JSON.stringify(post, null, 2));
  console.log("Post tags:", post.postTags);

  const tags = post.postTags.map((pt) => ({
    id: pt.tag.id,
    name: pt.tag.name,
  }));

  console.log("Processed tags:", tags);

  return (
    <DashboardShell>
      <DashboardHeader heading="编辑文章" text="修改你的文章内容。" />
      <div className="grid gap-10">
        <PostEditor
          post={{
            id: post.id,
            title: post.title,
            content: post.content,
            excerpt: post.excerpt || "",
            type: post.type,
            status: post.status,
            tags: tags,
          }}
        />
      </div>
    </DashboardShell>
  );
}
