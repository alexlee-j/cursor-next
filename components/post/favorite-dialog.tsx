"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePostActions } from "./post-actions-context";

interface FavoriteDialogProps {
  postId: string;
  initialFolders: {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    isFavorited: boolean;
  }[];
}

export function FavoriteDialog({
  postId,
  initialFolders,
}: FavoriteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [folders, setFolders] = useState(initialFolders || []);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolder, setNewFolder] = useState({ name: "", description: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { setIsFavorited, setFavoritesCount, isFavorited: globalIsFavorited, favoritesCount } = usePostActions();

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (folder.description && folder.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 对收藏夹进行排序：默认收藏夹置顶，其他按名称排序
  const sortedFolders = [...filteredFolders].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name);
  });

  const toggleFavorite = async (folderId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/posts/${postId}/favorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderId }),
      });

      if (response.status === 401) {
        toast({
          title: "请先登录",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error("收藏失败");
      }

      const { isFavorited } = await response.json();

      // 更新收藏夹状态
      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === folderId ? { ...folder, isFavorited } : folder
        )
      );

      // 更新全局状态
      const hasAnyFavorited = folders.some((folder) =>
        folder.id === folderId ? isFavorited : folder.isFavorited
      );
      setIsFavorited(hasAnyFavorited);
      setFavoritesCount((prev) => (isFavorited ? prev + 1 : prev - 1));

      toast({
        title: isFavorited ? "收藏成功" : "取消收藏成功",
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "操作失败",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 创建收藏夹
  const createFolder = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/favorite-folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newFolder),
      });

      if (response.status === 401) {
        toast({
          title: "请先登录",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error("创建失败");
      }

      const folder = await response.json();
      setFolders((prev) => [...prev, { ...folder, isFavorited: false }]);
      setNewFolder({ name: "", description: "" });
      setShowCreateForm(false);
      toast({
        title: "创建成功",
      });
    } catch (error: unknown) {
      console.error("Error creating folder:", error);
      toast({
        title: "创建失败",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!folders || folders.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加到收藏夹</DialogTitle>
            <DialogDescription>
              暂无收藏夹，您可以创建一个新的收藏夹来保存文章。
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">暂无收藏夹，请先创建收藏夹</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`inline-flex items-center space-x-1 px-2 py-1 text-sm rounded-md transition-colors ${
            globalIsFavorited
              ? "text-yellow-500"
              : "text-muted-foreground hover:text-yellow-500/80"
          }`}
        >
          <Bookmark
            className={`h-4 w-4 ${
              globalIsFavorited
                ? "fill-yellow-500 text-yellow-500"
                : "hover:text-yellow-500/80"
            }`}
          />
          <span>{favoritesCount}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加到收藏夹</DialogTitle>
          <DialogDescription>
            选择一个收藏夹来保存这篇文章，或创建一个新的收藏夹。
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {showCreateForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">收藏夹名称</Label>
                <Input
                  id="name"
                  value={newFolder.name}
                  onChange={(e) =>
                    setNewFolder((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="输入收藏夹名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={newFolder.description}
                  onChange={(e) =>
                    setNewFolder((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="输入收藏夹描述（可选）"
                  className="resize-none"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewFolder({ name: "", description: "" });
                  }}
                  disabled={isLoading}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={createFolder}
                  disabled={!newFolder.name || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  创建收藏夹
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="搜索收藏夹..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              <div 
                className="grid gap-2 overflow-y-auto pr-2" 
                style={{ 
                  maxHeight: 'min(60vh, 400px)',
                  scrollbarGutter: 'stable',
                }}
              >
                {sortedFolders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "没有找到匹配的收藏夹" : "暂无收藏夹"}
                  </div>
                ) : (
                  sortedFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center space-x-2 p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{folder.name}</h3>
                          {folder.isDefault && (
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 whitespace-nowrap">
                              默认
                            </span>
                          )}
                        </div>
                        {folder.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {folder.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant={folder.isFavorited ? "default" : "outline"}
                        size="sm"
                        disabled={isLoading}
                        onClick={() => toggleFavorite(folder.id)}
                        className="shrink-0"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : folder.isFavorited ? (
                          "已收藏"
                        ) : (
                          "收藏"
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {!searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  创建新收藏夹
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
