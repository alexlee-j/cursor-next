import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Comments } from "@/components/post/comments";
import { LikeButton } from "@/components/post/like-button";
import { FavoriteDialog } from "@/components/post/favorite-dialog";
import { marked } from "marked";
import { Post, Prisma } from "@prisma/client";

type PostWithRelations = Post & {
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      name: string | null;
      email: string;
    };
  }[];
  _count: {
    likes: number;
    favorites: number;
  };
};

async function getPost(
  id: string,
  userId?: string
): Promise<{
  post:
    | (PostWithRelations & {
        likesCount: number;
        favoritesCount: number;
      })
    | null;
  liked: boolean;
  favoriteFolders: {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    isFavorited: boolean;
  }[];
}> {
  try {
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
          select: {
            id: true,
            content: true,
            createdAt: true,
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
      return { post: null, liked: false, favoriteFolders: [] };
    }

    // 获取用户的收藏夹及其收藏状态
    let liked = false;
    let favoriteFolders: {
      id: string;
      name: string;
      description: string | null;
      isDefault: boolean;
      isFavorited: boolean;
    }[] = [];

    if (userId) {
      const [likeStatus, userFavoriteFolders] = await Promise.all([
        prisma.like
          .findFirst({
            where: {
              AND: [{ postId: id }, { userId }],
            },
          })
          .then((like) => !!like),
        prisma.favoriteFolder.findMany({
          where: { userId },
          select: {
            id: true,
            name: true,
            description: true,
            isDefault: true,
            favorites: {
              where: { postId: id },
            },
          },
        }),
      ]);

      liked = likeStatus;
      favoriteFolders = userFavoriteFolders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        description: folder.description,
        isDefault: folder.isDefault,
        isFavorited: folder.favorites.length > 0,
      }));
    }

    // 处理 markdown 内容
    let content = post.content;
    if (post.type === "markdown" && typeof content === "string") {
      try {
        content = await marked(content);
      } catch (error) {
        console.error("Markdown parsing error:", error);
        content = "<p>内容解析错误</p>";
      }
    }

    // 构造返回对象，确保类型正确
    const postWithCounts = {
      ...post,
      content,
      likesCount: post._count?.likes ?? 0,
      favoritesCount: post._count?.favorites ?? 0,
    };

    return {
      post: postWithCounts,
      liked,
      favoriteFolders,
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return {
      post: null,
      liked: false,
      favoriteFolders: [],
    };
  }
}

export default async function PostPage({ params }: { params: { id: string } }) {
  try {
    // 尝试获取用户信息，但不强制要求登录
    const user = await checkAuth().catch(() => null);
    const postId = params.id;

    const { post, liked, favoriteFolders } = await getPost(postId, user?.id);

    // 如果文章不存在或无权访问，重定向到首页
    if (!post) {
      redirect("/");
    }

    // 检查是否是草稿状态
    const isDraft = post.status !== "PUBLISHED";
    // 检查当前用户是否是作者
    const isAuthor = user?.id === post.authorId;

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
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
            <h1 className="text-4xl font-bold">{post.title}</h1>
            {isDraft && <Badge variant="secondary">草稿</Badge>}
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-sm text-muted-foreground">
            <div>作者：{post.author.name || post.author.email}</div>
            <div>发布于：{formatDate(post.createdAt)}</div>
            {post.updatedAt > post.createdAt && (
              <div>更新于：{formatDate(post.updatedAt)}</div>
            )}
            <div className="flex items-center justify-between space-x-4">
              <span>
                浏览：
                {isDraft ? post.viewCount : post.viewCount + 1}
              </span>
              <span>
                {!isDraft && (
                  <>
                    <LikeButton
                      postId={post.id}
                      initialLiked={liked}
                      initialCount={post.likesCount}
                    />
                    <FavoriteDialog
                      postId={post.id}
                      initialFolders={favoriteFolders}
                      initialCount={post._count.favorites}
                    />
                  </>
                )}
              </span>
            </div>
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
  } catch (error) {
    console.error("Error rendering post page:", error);
    redirect("/");
  }
}
