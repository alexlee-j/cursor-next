"use client";

import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MoreHorizontal, Star } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { FolderEditDialog } from "./folder-edit-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface FolderListProps {
  initialFolders: {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    favoritesCount: number;
    recentFavorites: {
      id: string;
      postId: string;
      createdAt: Date;
      post: {
        title: string;
        author: {
          name: string | null;
          email: string;
        };
        createdAt: Date;
      };
    }[];
  }[];
}

export function FolderList({ initialFolders }: FolderListProps) {
  const [folders, setFolders] = useState(initialFolders);
  const [editingFolder, setEditingFolder] = useState<
    (typeof folders)[0] | null
  >(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async (folderId: string) => {
    if (!confirm("确定要删除这个收藏夹吗？其中的收藏也会被删除。")) {
      return;
    }

    try {
      const response = await fetch(`/api/favorite-folders/${folderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除失败");
      }

      setFolders(folders.filter((f) => f.id !== folderId));
      toast({
        title: "删除成功",
      });
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast({
        title: "删除失败",
        variant: "destructive",
      });
    }
  };

  const addFolder = (newFolder: (typeof folders)[0]) => {
    setFolders((prev) => [newFolder, ...prev]);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <Card key={folder.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>{folder.name}</span>
                  {folder.isDefault && (
                    <span className="text-xs text-muted-foreground">
                      (默认)
                    </span>
                  )}
                </div>
              </CardTitle>
              {!folder.isDefault && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">打开菜单</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingFolder(folder)}>
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(folder.id)}
                    >
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>
            <CardContent>
              {folder.description && (
                <CardDescription className="mt-2">
                  {folder.description}
                </CardDescription>
              )}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>收藏文章</span>
                  <span>{folder.favoritesCount} 篇</span>
                </div>
                <div className="mt-4 space-y-2">
                  {folder.recentFavorites.map((favorite) => (
                    <div key={favorite.id} className="text-sm">
                      <Link
                        href={`/posts/${favorite.postId}`}
                        className="hover:underline line-clamp-1"
                      >
                        {favorite.post.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          by{" "}
                          {favorite.post.author.name ||
                            favorite.post.author.email}
                        </span>
                        <span>·</span>
                        <span>收藏于 {formatDate(favorite.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {folder.favoritesCount > 5 && (
                  <Button
                    variant="link"
                    className="mt-2 h-auto p-0 text-sm"
                    onClick={() =>
                      router.push(`/dashboard/favorites/${folder.id}`)
                    }
                  >
                    查看全部 {folder.favoritesCount} 篇文章
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingFolder && (
        <FolderEditDialog
          folder={editingFolder}
          open={true}
          onOpenChange={(open) => !open && setEditingFolder(null)}
          onSuccess={(updatedFolder) => {
            setFolders(
              folders.map((f) =>
                f.id === updatedFolder.id ? { ...f, ...updatedFolder } : f
              )
            );
            setEditingFolder(null);
          }}
        />
      )}
    </>
  );
}
