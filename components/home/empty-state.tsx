import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenLine } from "lucide-react";

interface EmptyStateProps {
  type: "posts" | "tags" | "authors";
  message?: string;
  showCreateButton?: boolean;
}

export function EmptyState({ type, message, showCreateButton = false }: EmptyStateProps) {
  const messages = {
    posts: "暂时还没有任何文章",
    tags: "暂时还没有任何标签",
    authors: "暂时还没有任何作者",
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-muted-foreground">
          {message || messages[type]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          {showCreateButton && (
            <Button asChild>
              <Link href="/posts/create">创建第一篇文章</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
