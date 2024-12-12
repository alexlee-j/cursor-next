import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FollowButton } from "@/components/user/follow-button";
import { format } from "date-fns";
import { Icons } from "@/components/icons";
import Link from "next/link";
import Image from 'next/image';
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { checkAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Buffer } from 'buffer';

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  viewCount: number;
  likesCount: number;
  commentsCount: number;
  favoritesCount: number;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  bio: string | null;
  website: string | null;
  location: string | null;
  commentCount: number;
  trustLevel: string;
  isActive: boolean;
  posts: Post[];
  followersCount: number;
  isFollowing: boolean;
}

export const metadata: Metadata = {
  title: "Profile",
  description: "View user profile and posts",
};

async function getUserData(userId: string, currentUserId?: string) {
  try {
    // 获取用户信息和帖子
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        website: true,
        location: true,
        createdAt: true,
        updatedAt: true,
        trustLevel: true,
        isActive: true,
        posts: {
          where: {
            status: "PUBLISHED",
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            status: true,
            viewCount: true,
            _count: {
              select: {
                likes: true,
                comments: true,
                favorites: true,
              },
            },
          },
        },
        _count: {
          select: {
            followers: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // 检查当前用户是否关注了该用户
    let isFollowing = false;
    if (currentUserId) {
      const followerRecord = await prisma.follow.findFirst({
        where: {
          followerId: currentUserId,
          followingId: userId,
        },
      });
      isFollowing = !!followerRecord;
    }

    // 转换数据格式
    return {
      ...user,
      posts: user.posts.map(post => ({
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        favoritesCount: post._count.favorites,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      })),
      followersCount: user._count.followers,
      commentCount: user._count.comments,
      isFollowing,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params;
  const currentUser = await checkAuth();
  
  const user = await getUserData(userId, currentUser?.id);

  if (!user) {
    return notFound();
  }

  // 将 Uint8Array 转换为 base64 字符串
  const avatarBase64 = user.avatar ? `data:image/jpeg;base64,${Buffer.from(user.avatar).toString('base64')}` : null;

  return (
    <>
      <SiteHeader user={currentUser} />
      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Card className="bg-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {avatarBase64 ? (
                <Image
                  src={avatarBase64}
                  alt={user.name || "User avatar"}
                  width={100}
                  height={100}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-[100px] h-[100px] rounded-full bg-muted flex items-center justify-center">
                  <Icons.userIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-2xl mb-2">{user.name}</CardTitle>
                  {currentUser && currentUser.id !== user.id && (
                    <FollowButton
                      authorId={user.id}
                      isFollowing={user.isFollowing}
                      followersCount={user.followersCount}
                    />
                  )}
                </div>
                {user.bio && <p className="text-muted-foreground mb-4">{user.bio}</p>}
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {user.location && (
                    <span className="flex items-center">
                      <Icons.location className="w-4 h-4 mr-1" />
                      {user.location}
                    </span>
                  )}
                  {user.website && (
                    <Link
                      href={user.website}
                      className="flex items-center hover:text-primary"
                      target="_blank"
                    >
                      <Icons.link className="w-4 h-4 mr-1" />
                      我的网站
                    </Link>
                  )}
                  <span className="flex items-center">
                    <Icons.calendar className="w-4 h-4 mr-1" />
                    加入于 {format(new Date(user.createdAt), "yyyy-MM-dd")}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-semibold">{user.posts?.length || 0}</div>
                <div className="text-sm text-muted-foreground">篇文章</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-semibold">{user.commentCount || 0}</div>
                <div className="text-sm text-muted-foreground">评论</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-semibold">{user.followersCount || 0}</div>
                <div className="text-sm text-muted-foreground">粉丝</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-semibold">{user.trustLevel || 0}</div>
                <div className="text-sm text-muted-foreground">Trust Level</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">文章</h3>
            </div>
            {user.posts && user.posts.length > 0 ? (
              <div className="space-y-4">
                {user.posts.map((post: Post) => (
                  <div key={post.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <Link href={`/posts/${post.id}`}>
                      <h3 className="text-lg font-semibold mb-2 hover:text-primary">{post.title}</h3>
                    </Link>
                    <p className="text-muted-foreground text-sm mb-3">
                      {post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icons.eye className="w-4 h-4" /> {post.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icons.like className="w-4 h-4" /> {post.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icons.comment className="w-4 h-4" /> {post.commentsCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icons.bookmark className="w-4 h-4" /> {post.favoritesCount}
                      </span>
                      <span className="ml-auto">{format(new Date(post.createdAt), "yyyy-MM-dd")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                暂无文章
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
