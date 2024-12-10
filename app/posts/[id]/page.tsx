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

type Comment = {
  id: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  autoApproved: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    isAuthor?: boolean;
  };
  replies: {
    id: string;
    content: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    autoApproved: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
      isAuthor?: boolean;
    };
    replyTo: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  }[];
};

type PostWithRelations = Post & {
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  comments: {
    id: string;
    content: string;
    status: string;
    createdAt: Date;
    autoApproved: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
      isAuthor?: boolean;
    };
    replies: {
      id: string;
      content: string;
      status: string;
      createdAt: Date;
      autoApproved: boolean;
      user: {
        id: string;
        name: string | null;
        email: string;
        isAuthor?: boolean;
      };
      replyTo: {
        id: string;
        name: string | null;
        email: string;
      } | null;
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
            AND: [
              { status: "APPROVED" },
              { parentId: null }, // 只获取顶层评论
            ],
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
                AND: [
                  { status: "APPROVED" },
                  { parentId: { not: null } }, // 确保是二级评论
                ],
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
                    id: true,
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
    const commentsWithAuthorFlag = post.comments.map((comment) => {
      const processedComment = {
        id: comment.id,
        content: comment.content,
        status: comment.status,
        createdAt: comment.createdAt,
        autoApproved: comment.autoApproved,
        user: {
          ...comment.user,
          isAuthor: comment.user.id === post.authorId,
        },
        replies: comment.replies.map((reply) => ({
          id: reply.id,
          content: reply.content,
          status: reply.status,
          createdAt: reply.createdAt,
          autoApproved: reply.autoApproved,
          user: {
            ...reply.user,
            isAuthor: reply.user.id === post.authorId,
          },
          replyTo: reply.replyTo,
        })),
      };

      return processedComment;
    });

    return {
      post: {
        ...postWithCounts,
        tags: post.postTags.map((pt) => ({
          id: pt.tag.id,
          name: pt.tag.name,
        })),
        comments: commentsWithAuthorFlag,
        excerpt: post.excerpt || "", // 确保类型为 string
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

export default async function PostPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    // 1. 先处理动态参数
    const { id } = await Promise.resolve(params);
    
    if (!id) {
      redirect("/");
    }

    // 2. 获取用户信息（可能为 null）
    const user = await checkAuth();

    // 3. 使用 getPost 函数获取文章数据
    const { post, liked, favoriteFolders, isFollowing, followersCount } = await getPost(id, user?.id);

    if (!post) {
      redirect("/");
    }

    // 4. 检查文章状态和访问权限
    const isDraft = post.status !== "PUBLISHED";
    const isAuthor = user?.id === post.authorId;
    if (isDraft && !isAuthor) {
      redirect("/");
    }

    // 5. 渲染页面
    return (
      <PostActionsProvider
        initialLiked={liked}
        initialLikesCount={post.likesCount}
        initialIsFavorited={favoriteFolders.some(
          (folder) => folder.isFavorited
        )}
        initialFavoritesCount={post.favoritesCount}
      >
        <div className="container relative max-w-3xl py-6 lg:py-12">
          <article className="prose prose-quoteless prose-neutral dark:prose-invert mx-auto">
            {/* 文章标题 */}
            <div className="not-prose mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
                {isDraft && <Badge variant="secondary">草稿</Badge>}
              </div>
              {post.excerpt && (
                <p className="text-lg text-muted-foreground mt-2">{post.excerpt}</p>
              )}
              {post.postTags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {post.postTags.map((tag) => (
                    <Badge key={tag.tag.id} variant="secondary">
                      {tag.tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-col space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    作者：{post.author.name || post.author.email}
                  </span>
                  {!isAuthor && (
                    <FollowButton
                      userId={post.authorId}
                      isFollowing={isFollowing}
                      followersCount={followersCount}
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <time dateTime={post.createdAt.toISOString()}>
                    发布于：{formatDate(post.createdAt)}
                  </time>
                  {post.updatedAt > post.createdAt && (
                    <time dateTime={post.updatedAt.toISOString()}>
                      更新于：{formatDate(post.updatedAt)}
                    </time>
                  )}
                  <div>
                    浏览：{isDraft ? post.viewCount : post.viewCount + 1}
                  </div>
                  {!isDraft && (
                    <div className="flex items-center gap-4">
                      <LikeButton
                        postId={post.id}
                        initialLiked={liked}
                        initialCount={post.likesCount}
                      />
                      <FavoriteDialog
                        postId={post.id}
                        initialFolders={favoriteFolders}
                        initialCount={post.favoritesCount}
                        isFavorited={favoriteFolders.some(
                          (folder) => folder.isFavorited
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 文章内容 */}
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

            {/* 评论区 */}
            <div id="comments-section" className="not-prose mt-8">
              {!isDraft && (
                <Comments
                  postId={post.id}
                  initialComments={post.comments}
                  isLoggedIn={!!user}
                />
              )}
              {isDraft && !isAuthor && (
                <div className="mt-12 text-center text-muted-foreground">
                  <p>草稿状态下不支持评论、点赞和收藏功能</p>
                </div>
              )}
            </div>
          </article>

          {/* 快捷操作栏 */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)] lg:shadow-none lg:bottom-auto lg:left-auto lg:right-[max(0px,calc(50%-45rem))] lg:top-1/2 lg:-translate-y-1/2 lg:bg-transparent">
            <QuickActions
              postId={post.id}
              liked={liked}
              likesCount={post.likesCount}
              favoriteFolders={favoriteFolders}
              favoritesCount={post.favoritesCount}
              commentsCount={post.comments.length}
              className="mx-auto max-w-3xl lg:mx-0"
              author={post.author}
              isFollowing={isFollowing}
              followersCount={followersCount}
            />
          </div>
        </div>
      </PostActionsProvider>
    );
  } catch (error) {
    console.error("Error rendering post page:", error);
    redirect("/");
  } finally {
    console.log('=== END: PostPage ===');
  }
}
