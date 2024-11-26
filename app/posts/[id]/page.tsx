import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Comments } from "@/components/post/comments";
import { LikeButton } from "@/components/post/like-button";
import { FavoriteDialog } from "@/components/post/favorite-dialog";
import { marked } from "marked";
import { Post } from "@prisma/client";
import { MessageSquare } from "lucide-react";
import { QuickActions } from "@/components/post/quick-actions";
import { FollowButton } from "@/components/user/follow-button";
import { PostActionsProvider } from "@/components/post/post-actions-context";

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
      id: string;
      name: string | null;
      email: string;
      isAuthor?: boolean;
    };
    replies: {
      id: string;
      content: string;
      createdAt: Date;
      user: {
        id: string;
        name: string | null;
        email: string;
        isAuthor?: boolean;
      };
      replyTo: {
        name: string | null;
        email: string;
      };
    }[];
  }[];
  _count: {
    likes: number;
    favorites: number;
  };
  postTags: {
    tag: {
      id: string;
      name: string;
    };
  }[];
  excerpt?: string;
  tags?: {
    id: string;
    name: string;
  }[];
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
  isFollowing: boolean;
  followersCount: number;
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
            AND: [{ status: "APPROVED" }, { parentId: null }],
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            replies: {
              where: {
                status: "APPROVED",
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                replyTo: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        postTags: {
          include: {
            tag: true,
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
      return {
        post: null,
        liked: false,
        favoriteFolders: [],
        isFollowing: false,
        followersCount: 0,
      };
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

    let isFollowing = false;
    let followersCount = 0;

    if (userId) {
      const [followStatus, followers] = await Promise.all([
        prisma.follow.findFirst({
          where: {
            AND: [{ followerId: userId }, { followingId: post.authorId }],
          },
        }),
        prisma.follow.count({
          where: { followingId: post.authorId },
        }),
      ]);

      isFollowing = !!followStatus;
      followersCount = followers;
    }

    // 处理评论数据，添加作者标识
    const commentsWithAuthorFlag = post.comments.map((comment) => ({
      ...comment,
      user: {
        ...comment.user,
        isAuthor: comment.user.id === post.authorId,
      },
      replies: comment.replies.map((reply) => ({
        ...reply,
        user: {
          ...reply.user,
          isAuthor: reply.user.id === post.authorId,
        },
      })),
    }));

    return {
      post: {
        ...postWithCounts,
        tags: post.postTags.map((pt) => ({
          id: pt.tag.id,
          name: pt.tag.name,
        })),
        comments: commentsWithAuthorFlag,
      },
      liked,
      favoriteFolders,
      isFollowing,
      followersCount,
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return {
      post: null,
      liked: false,
      favoriteFolders: [],
      isFollowing: false,
      followersCount: 0,
    };
  }
}

export default async function PostPage({ params }: { params: { id: string } }) {
  try {
    // 尝试获取用户信息，但不强制要求登录
    const user = await checkAuth().catch(() => null);
    
    // 等待并解构 params
    const { id } = await params;
    
    // 确保 id 存在
    if (!id) {
      redirect("/");
    }

    const { post, liked, favoriteFolders, isFollowing, followersCount } =
      await getPost(id, user?.id);

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
      <PostActionsProvider
        initialLiked={liked}
        initialLikesCount={post.likesCount}
        initialIsFavorited={favoriteFolders.some(
          (folder) => folder.isFavorited
        )}
        initialFavoritesCount={post._count.favorites}
      >
        <div className="container relative max-w-3xl py-6 lg:py-12">
          <div className="hidden lg:flex fixed right-[max(0px,calc(50%-45rem))] top-1/2 -translate-y-1/2 flex-col gap-4 pr-4">
            <QuickActions
              postId={post.id}
              liked={liked}
              likesCount={post.likesCount}
              favoriteFolders={favoriteFolders}
              favoritesCount={post._count.favorites}
              commentsCount={post.comments.length}
            />
          </div>

          <article>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                <h1 className="text-4xl font-bold">{post.title}</h1>
                {isDraft && <Badge variant="secondary">草稿</Badge>}
              </div>
              {post.excerpt && (
                <p className="text-lg text-muted-foreground">{post.excerpt}</p>
              )}
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>作者：{post.author.name || post.author.email}</span>
                  {!isAuthor && (
                    <FollowButton
                      authorId={post.authorId}
                      initialIsFollowing={isFollowing}
                      initialCount={followersCount}
                    />
                  )}
                </div>
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
                          isFavorited={favoriteFolders.some(
                            (folder) => folder.isFavorited
                          )}
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
                  post.type === "markdown"
                    ? "markdown-content"
                    : "wysiwyg-content"
                }
                dangerouslySetInnerHTML={{
                  __html: post.content,
                }}
              />
            </div>

            {!isDraft && (
              <div className="mt-12" id="comments-section">
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
        </div>
      </PostActionsProvider>
    );
  } catch (error) {
    console.error("Error rendering post page:", error);
    redirect("/");
  }
}
