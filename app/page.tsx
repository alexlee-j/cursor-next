import { prisma } from "@/lib/db";
import { PostList } from "@/components/home/post-list";
import { Sidebar } from "@/components/home/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkAuth } from "@/lib/auth";
import Link from "next/link";

const POSTS_PER_PAGE = 10;

// 获取文章列表
async function getPosts(options: {
  page?: number;
  orderBy?: "latest" | "popular";
  tag?: string;
}) {
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
}

// 获取热门标签
async function getPopularTags() {
  const tags = await prisma.tag.findMany({
    include: {
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
    where: {
      postTags: {
        some: {
          post: {
            status: "PUBLISHED",
          },
        },
      },
    },
    take: 10,
  });

  return tags.map((tag) => ({
    ...tag,
    count: tag._count.postTags,
  }));
}

// 获取热门作者
async function getPopularAuthors() {
  const authors = await prisma.user.findMany({
    where: {
      posts: {
        some: {
          status: "PUBLISHED",
        },
      },
      isActive: true,
    },
    include: {
      _count: {
        select: {
          posts: {
            where: {
              status: "PUBLISHED",
            },
          },
          followers: true,
        },
      },
    },
    orderBy: [
      {
        posts: {
          _count: "desc",
        },
      },
      {
        followers: {
          _count: "desc",
        },
      },
    ],
    take: 5,
  });

  return authors.map((author) => ({
    id: author.id,
    name: author.name || author.email,
    postsCount: author._count.posts,
    followersCount: author._count.followers,
  }));
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { page?: string; orderBy?: "latest" | "popular"; tag?: string };
}) {
  const user = await checkAuth().catch(() => null);
  const page = searchParams?.page ? parseInt(searchParams.page, 10) : 1;
  const orderBy = searchParams?.orderBy || "latest";
  const tag = searchParams?.tag;

  const [{ posts, total, totalPages }, popularTags, popularAuthors] =
    await Promise.all([
      getPosts({ page, orderBy, tag }),
      getPopularTags(),
      getPopularAuthors(),
    ]);

  return (
    <div className="container py-6 grid grid-cols-1 md:grid-cols-[1fr,300px] gap-6">
      <div className="space-y-6">
        <Tabs value={orderBy} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="latest" asChild>
                <Link href={`/?orderBy=latest${tag ? `&tag=${tag}` : ""}`}>
                  最新发布
                </Link>
              </TabsTrigger>
              <TabsTrigger value="popular" asChild>
                <Link href={`/?orderBy=popular${tag ? `&tag=${tag}` : ""}`}>
                  热门文章
                </Link>
              </TabsTrigger>
            </TabsList>
            {tag && (
              <div className="text-sm text-muted-foreground">
                标签：{tag}
                <Link href="/" className="ml-2 hover:text-primary">
                  清除
                </Link>
              </div>
            )}
          </div>
          <TabsContent value={orderBy} className="mt-6">
            <PostList
              posts={posts}
              currentPage={page}
              totalPages={totalPages}
              urlPrefix={`?orderBy=${orderBy}`}
              tag={tag}
            />
          </TabsContent>
        </Tabs>
      </div>

      <Sidebar
        popularTags={popularTags}
        popularAuthors={popularAuthors}
        currentUser={user}
      />
    </div>
  );
}
