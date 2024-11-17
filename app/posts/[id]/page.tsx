import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PostPageProps {
  params: {
    id: string;
  };
}

async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  return post;
}

export default async function PostPage({ params }: PostPageProps) {
  const user = await checkAuth();
  if (!user) {
    redirect("/login");
  }

  const post = await getPost(params.id);
  if (!post) {
    redirect("/dashboard/posts");
  }

  return (
    <article className="container max-w-3xl py-6 lg:py-12">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h1 className="text-4xl font-bold">{post.title}</h1>
          <Badge
            variant={post.status === "PUBLISHED" ? "default" : "secondary"}
          >
            {post.status === "PUBLISHED" ? "已发布" : "草稿"}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div>作者：{post.author.name || post.author.email}</div>
          <div>发布于：{formatDate(post.createdAt)}</div>
          {post.updatedAt > post.createdAt && (
            <div>更新于：{formatDate(post.updatedAt)}</div>
          )}
          <div>评论：{post._count.comments}</div>
          <div>浏览：{post.viewCount}</div>
        </div>
      </div>
      <div className="prose dark:prose-invert mt-8 max-w-none">
        {post.type === "markdown" ? (
          <div
            dangerouslySetInnerHTML={{
              __html: post.content,
            }}
          />
        ) : (
          <div
            dangerouslySetInnerHTML={{
              __html: post.content,
            }}
          />
        )}
      </div>
    </article>
  );
}
