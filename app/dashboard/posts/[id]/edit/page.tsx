import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PostEditor } from "@/components/post/post-editor";
import type { PostStatus } from "@/components/post/post-editor";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";

interface PostTag {
  tag: {
    id: string;
    name: string;
  }
}

export default async function EditPostPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
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

  const tags = post.postTags.map((pt: PostTag) => ({
    id: pt.tag.id,
    name: pt.tag.name,
  }));

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
            status: post.status as PostStatus,
            tags: tags,
          }}
        />
      </div>
    </DashboardShell>
  );
}
