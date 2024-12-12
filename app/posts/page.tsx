import { prisma } from "@/lib/db";
import { checkAuth } from "@/lib/auth";
import { EmptyState } from "@/components/home/empty-state";
import { PostList } from "@/components/home/post-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { redirect } from "next/navigation";

const POSTS_PER_PAGE = 10;

export default async function PostsPage(
  props: {
    searchParams: Promise<{ page?: string; orderBy?: "latest" | "popular" }>;
  }
) {
  const searchParams = await props.searchParams;
  try {
    const user = await checkAuth();

    const page = searchParams?.page ? parseInt(searchParams.page, 10) : 1;
    const orderBy = (searchParams?.orderBy || "latest") as "latest" | "popular";

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: user?.id },
        orderBy: orderBy === "latest" ? { createdAt: "desc" } : { viewCount: "desc" },
        skip: (page - 1) * POSTS_PER_PAGE,
        take: POSTS_PER_PAGE,
        select: {
          id: true,
          title: true,
          excerpt: true,
          createdAt: true,
          status: true,
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
      prisma.post.count({
        where: { authorId: user?.id },
      }),
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

    const totalPages = Math.ceil(total / POSTS_PER_PAGE);

    return (
      <div className="container py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">我的文章</h1>
            <Link
              href="/posts/create"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              写文章
            </Link>
          </div>

          <Tabs defaultValue={orderBy} className="w-full">
            <TabsList>
              <TabsTrigger value="latest" asChild>
                <Link href="/posts?orderBy=latest">最新发布</Link>
              </TabsTrigger>
              <TabsTrigger value="popular" asChild>
                <Link href="/posts?orderBy=popular">最受欢迎</Link>
              </TabsTrigger>
            </TabsList>
            <TabsContent value={orderBy} className="mt-6">
              {formattedPosts.length > 0 ? (
                <PostList
                  posts={formattedPosts}
                  currentPage={page}
                  totalPages={totalPages}
                  urlPrefix={`/posts?orderBy=${orderBy}`}
                />
              ) : (
                <EmptyState
                  type="posts"
                  message="你还没有发布任何文章"
                  showCreateButton
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login");
    }
    throw error;
  }
}
