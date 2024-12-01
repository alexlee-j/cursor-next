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
    const followersCount = await prisma.follow.count({
      where: { followingId: post.authorId },
    });

    if (userId) {
      const followStatus = await prisma.follow.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId: post.authorId }],
        },
      });

      isFollowing = !!followStatus;
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
    // 1. 先处理动态参数
    const { id } = await Promise.resolve(params);
    
    if (!id) {
      redirect("/");
    }

    // 2. 获取文章信息（不依赖用户登录状态）
    const postData = await prisma.post.findUnique({
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            replies: {
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

    if (!postData) {
      redirect("/");
    }

    // 3. 检查文章状态
    const isDraft = postData.status !== "PUBLISHED";

    // 4. 获取用户信息（可能为 null）
    const user = await checkAuth();

    // 5. 检查访问权限
    const isAuthor = user?.id === postData.authorId;
    if (isDraft && !isAuthor) {
      redirect("/");
    }

    // 6. 获取用户相关的交互状态
    let liked = false;
    let favoriteFolders: any[] = [];
    let isFollowing = false;

    // 获取关注者数量（不依赖用户登录状态）
    const followersCount = await prisma.follow.count({
      where: { followingId: postData.authorId },
    });

    if (user) {
      // 只在用户登录时获取这些信息
      const [likeData, folderData, followData] = await Promise.all([
        prisma.like.findFirst({
          where: {
            postId: id,
            userId: user.id,
          },
        }),
        prisma.favoriteFolder.findMany({
          where: {
            userId: user.id,
          },
          include: {
            favorites: {
              where: {
                postId: id,
              },
            },
          },
        }),
        prisma.follow.findFirst({
          where: {
            followerId: user.id,
            followingId: postData.authorId,
          },
        }),
      ]);

      liked = !!likeData;
      favoriteFolders = folderData.map(folder => ({
        ...folder,
        isFavorited: folder.favorites.length > 0,
      }));
      isFollowing = !!followData;
    }

    // 7. 更新浏览量（不阻塞页面渲染）
    if (!isDraft) {
      prisma.post.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      }).catch(error => {
        console.error("Failed to update view count:", error);
      });
    }

    // 8. 返回页面内容
    return (
      <PostActionsProvider
        initialLiked={liked}
        initialLikesCount={postData._count.likes}
        initialIsFavorited={favoriteFolders.some(
          (folder) => folder.isFavorited
        )}
        initialFavoritesCount={postData._count.favorites}
      >
        <div className="container relative max-w-3xl py-6 lg:py-12">
          <div className="hidden lg:flex fixed right-[max(0px,calc(50%-45rem))] top-1/2 -translate-y-1/2 flex-col gap-4 pr-4">
            <QuickActions
              postId={postData.id}
              liked={liked}
              likesCount={postData._count.likes}
              favoriteFolders={favoriteFolders}
              favoritesCount={postData._count.favorites}
              commentsCount={postData.comments.length}
            />
          </div>

          <article>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                <h1 className="text-4xl font-bold">{postData.title}</h1>
                {isDraft && <Badge variant="secondary">草稿</Badge>}
              </div>
              {postData.excerpt && (
                <p className="text-lg text-muted-foreground">{postData.excerpt}</p>
              )}
              {postData.postTags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {postData.postTags.map((tag) => (
                    <Badge key={tag.tag.id} variant="secondary">
                      {tag.tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    作者：{postData.author.name || postData.author.email}
                  </span>
                  {!isAuthor && (
                    <FollowButton
                      authorId={postData.authorId}
                      initialIsFollowing={isFollowing}
                      initialCount={followersCount}
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div>发布于：{formatDate(postData.createdAt)}</div>
                  {postData.updatedAt > postData.createdAt && (
                    <div>更新于：{formatDate(postData.updatedAt)}</div>
                  )}
                  <div>
                    浏览：
                    {isDraft ? postData.viewCount : postData.viewCount + 1}
                  </div>
                  {!isDraft && (
                    <div className="flex items-center gap-4">
                      <LikeButton
                        postId={postData.id}
                        initialLiked={liked}
                        initialCount={postData._count.likes}
                      />
                      <FavoriteDialog
                        postId={postData.id}
                        initialFolders={favoriteFolders}
                        initialCount={postData._count.favorites}
                        isFavorited={favoriteFolders.some(
                          (folder) => folder.isFavorited
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="prose dark:prose-invert mt-8 max-w-none">
              <div
                className={
                  postData.type === "markdown"
                    ? "markdown-content"
                    : "wysiwyg-content"
                }
                dangerouslySetInnerHTML={{
                  __html: postData.content,
                }}
              />
            </div>

            {!isDraft && (
              <div className="mt-12" id="comments-section">
                <h2 className="text-2xl font-bold mb-6">评论</h2>
                <Comments
                  postId={postData.id}
                  initialComments={postData.comments}
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
