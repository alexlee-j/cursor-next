import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Comments } from "@/components/post/comments";
import { LikeButton } from "@/components/post/like-button";
import { FavoriteButton } from "@/components/post/favorite-button";
import { marked } from "marked";

async function getPost(id: string, userId?: string) {
  // 配置 marked
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  // 获取文章信息，包括点赞和收藏的计数
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      comments: {
        where: {
          status: "APPROVED",
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          likes: true,
          favorites: true,
        },
      },
    },
  });

  // 如果没有找到文章或者文章未发布且访问者不是作者，返回 null
  if (
    !post ||
    (post.status !== "PUBLISHED" && (!userId || userId !== post.authorId))
  ) {
    return { post: null, liked: false, favorited: false };
  }

  // 获取当前用户的点赞和收藏状态
  const [liked, favorited] =
    post.status === "PUBLISHED" && userId
      ? await Promise.all([
          prisma.like.findFirst({
            where: {
              AND: [{ postId: id }, { userId }],
            },
          }),
          prisma.favorite.findUnique({
            where: {
              postId_userId: {
                postId: id,
                userId,
              },
            },
          }),
        ])
      : [null, null];

  // 处理 markdown 内容
  if (post.type === "markdown" && typeof post.content === "string") {
    try {
      post.content = marked.parse(post.content);
    } catch (error) {
      console.error("Markdown parsing error:", error);
      post.content = "<p>内容解析错误</p>";
    }
  }

  return {
    post: {
      ...post,
      likesCount: post._count.likes,
      favoritesCount: post._count.favorites,
    },
    liked: !!liked,
    favorited: !!favorited,
  };
}

export default async function PostPage({ params }: { params: { id: string } }) {
  // 尝试获取用户信息，但不强制要求登录
  const user = await checkAuth().catch(() => null);

  const { post, liked, favorited } = await getPost(params.id, user?.id);

  // 如果文章不存在或无权访问，重定向到首页
  if (!post) {
    redirect("/");
  }

  // 检查是否是草稿状态
  const isDraft = post.status !== "PUBLISHED";
  // 检查当前用户是否是作者
  const isAuthor = user?.id === post.author.id;

  // 只有在非草稿状态下才更新浏览量
  if (!isDraft) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  return (
    <article className="container max-w-3xl py-6 lg:py-12">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h1 className="text-4xl font-bold">{post.title}</h1>
          {isDraft && <Badge variant="secondary">草稿</Badge>}
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div>作者：{post.author.name || post.author.email}</div>
          <div>发布于：{formatDate(post.createdAt)}</div>
          {post.updatedAt > post.createdAt && (
            <div>更新于：{formatDate(post.updatedAt)}</div>
          )}
          <div>浏览：{isDraft ? post.viewCount : post.viewCount + 1}</div>
          {!isDraft && (
            <>
              <LikeButton
                postId={post.id}
                initialLiked={liked}
                initialCount={post.likesCount}
              />
              <FavoriteButton
                postId={post.id}
                initialFavorited={favorited}
                initialCount={post.favoritesCount}
              />
            </>
          )}
        </div>
      </div>

      <div className="prose dark:prose-invert mt-8 max-w-none">
        <div
          className={
            post.type === "markdown" ? "markdown-content" : "wysiwyg-content"
          }
          dangerouslySetInnerHTML={{
            __html: post.content,
          }}
        />
      </div>

      {!isDraft && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">评论</h2>
          <Comments
            postId={post.id}
            initialComments={post.comments}
            isLoggedIn={!!user}
          />
        </div>
      )}

      {isDraft && !isAuthor && (
        <div className="mt-12 text-center text-muted-foreground">
          <p>草稿状态下不支持评论、点赞和收藏功能</p>
        </div>
      )}
    </article>
  );
}
