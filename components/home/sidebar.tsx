import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/user/follow-button";

interface SidebarProps {
  popularTags: {
    id: string;
    name: string;
    count: number;
  }[];
  popularAuthors: {
    id: string;
    name: string;
    postsCount: number;
    followersCount: number;
  }[];
  currentUser: {
    id: string;
  } | null;
}

export function Sidebar({
  popularTags,
  popularAuthors,
  currentUser,
}: SidebarProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>热门标签</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Link key={tag.id} href={`/?tag=${tag.name}`}>
                <Badge variant="secondary" className="hover:bg-secondary/80">
                  {tag.name} ({tag.count})
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>推荐作者</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {popularAuthors.map((author) => (
              <div
                key={author.id}
                className="flex items-center justify-between"
              >
                <div>
                  <Link
                    href={`/users/${author.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {author.name}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {author.postsCount} 篇文章
                  </div>
                </div>
                {currentUser && currentUser.id !== author.id && (
                  <FollowButton
                    authorId={author.id}
                    initialIsFollowing={false}
                    initialCount={author.followersCount}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
