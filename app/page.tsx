import { prisma } from "@/lib/db";
import { PostList } from "@/components/home/post-list";
import { Sidebar } from "@/components/home/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkAuth } from "@/lib/auth";
import Link from "next/link";
import { EmptyState } from "@/components/home/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const POSTS_PER_PAGE = 10;

// 获取文章列表
async function getPosts(options: {
  page?: number;
  orderBy?: "latest" | "popular";
  tag?: string;
}) {
  try {
    const { page = 1, orderBy = "latest", tag } = options;
    const where = {
      status: "PUBLISHED" as const,
      ...(tag && {
        postTags: {
          some: {
            tag: {
              name: tag,
            },
          },
        },
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy:
          orderBy === "latest" ? { createdAt: "desc" } : { viewCount: "desc" },
        skip: (page - 1) * POSTS_PER_PAGE,
        take: POSTS_PER_PAGE,
        select: {
          id: true,
          title: true,
          excerpt: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          postTags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: {
                where: { status: "APPROVED" },
              },
              likes: true,
              favorites: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      createdAt: post.createdAt,
      author: post.author,
      tags: post.postTags.map((pt) => pt.tag),
      commentsCount: post._count.comments,
      likesCount: post._count.likes,
      favoritesCount: post._count.favorites,
    }));

    return {
      posts: formattedPosts,
      total,
      totalPages: Math.ceil(total / POSTS_PER_PAGE),
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return {
      posts: [],
      total: 0,
      totalPages: 0,
    };
  }
}

// 获取热门标签
async function getPopularTags() {
  try {
    const tags = await prisma.tag.findMany({
      where: {
        postTags: {
          some: {
            post: {
              status: "PUBLISHED",
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            postTags: {
              where: {
                post: {
                  status: "PUBLISHED",
                },
              },
            },
          },
        },
      },
      orderBy: {
        postTags: {
          _count: "desc",
        },
      },
      take: 10,
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag._count.postTags,
    }));
  } catch (error) {
    console.error("Error fetching popular tags:", error);
    return [];
  }
}

// 获取热门作者
async function getPopularAuthors() {
  try {
    const authors = await prisma.user.findMany({
      where: {
        posts: {
          some: {
            status: "PUBLISHED",
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            posts: {
              where: {
                status: "PUBLISHED",
              },
            },
          },
        },
      },
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
      take: 5,
    });

    return authors.map((author) => ({
      id: author.id,
      name: author.name,
      email: author.email,
      postsCount: author._count.posts,
    }));
  } catch (error) {
    console.error("Error fetching popular authors:", error);
    return [];
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { page?: string; orderBy?: "latest" | "popular"; tag?: string };
}) {
  // 先等待 searchParams
  const params = {
    page: 1,
    orderBy: "latest" as const,
    tag: undefined
  };

  if (searchParams) {
    const resolvedParams = await searchParams;
    params.page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
    params.orderBy = (resolvedParams.orderBy || "latest") as "latest" | "popular";
    params.tag = resolvedParams.tag;
  }

  // 等待用户认证
  const user = await checkAuth().catch(() => null);

  // 获取数据
  const [{ posts, total, totalPages }, popularTags, popularAuthors] =
    await Promise.all([
      getPosts(params),
      getPopularTags(),
      getPopularAuthors(),
    ]);

  return (
    <div className="container py-6">
      {/* Mobile Tags (Only visible on mobile) */}
      <div className="md:hidden mb-6">
        <Card>
          <CardHeader>
            <CardTitle>热门标签</CardTitle>
          </CardHeader>
          <CardContent>
            {popularTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Link key={tag.id} href={`/?tag=${tag.name}`}>
                    <Badge variant="secondary" className="hover:bg-secondary/80">
                      {tag.name}
                      <span className="ml-1 text-xs">({tag.count})</span>
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState type="tags" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr,300px] gap-6">
        <div className="space-y-6">
          <Tabs value={params.orderBy} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="latest" asChild>
                  <Link href={`/?orderBy=latest${params.tag ? `&tag=${params.tag}` : ""}`}>
                    最新发布
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="popular" asChild>
                  <Link href={`/?orderBy=popular${params.tag ? `&tag=${params.tag}` : ""}`}>
                    热门文章
                  </Link>
                </TabsTrigger>
              </TabsList>
              {params.tag && (
                <div className="text-sm text-muted-foreground">
                  标签：{params.tag}
                  <Link href="/" className="ml-2 hover:text-primary">
                    清除
                  </Link>
                </div>
              )}
            </div>
            <TabsContent value={params.orderBy} className="mt-6">
              {posts.length > 0 ? (
                <PostList
                  posts={posts}
                  currentPage={params.page}
                  totalPages={totalPages}
                  urlPrefix={`?orderBy=${params.orderBy}`}
                  tag={params.tag}
                />
              ) : (
                <EmptyState
                  type="posts"
                  message={params.tag ? `没有找到标签为"${params.tag}"的文章` : undefined}
                  showCreateButton={!!user}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Sidebar (Hidden on mobile) */}
        <div className="hidden md:block sticky top-6 space-y-6 self-start">
          <Card>
            <CardHeader>
              <CardTitle>热门标签</CardTitle>
            </CardHeader>
            <CardContent>
              {popularTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Link key={tag.id} href={`/?tag=${tag.name}`}>
                      <Badge variant="secondary" className="hover:bg-secondary/80">
                        {tag.name}
                        <span className="ml-1 text-xs">({tag.count})</span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState type="tags" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>活跃作者</CardTitle>
            </CardHeader>
            <CardContent>
              {popularAuthors.length > 0 ? (
                <div className="space-y-4">
                  {popularAuthors.map((author) => (
                    <div key={author.id} className="flex items-center justify-between">
                      <Link
                        href={`/users/${author.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {author.name || author.email}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        {author.postsCount} 篇文章
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState type="authors" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
