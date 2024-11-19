"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bookmark, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface FavoriteFolder {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
}

interface FavoriteDialogProps {
  postId: string;
  initialFavorited: boolean;
  initialCount: number;
}

export function FavoriteDialog({
  postId,
  initialFavorited,
  initialCount,
}: FavoriteDialogProps) {
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const { toast } = useToast();

  // 获取用户的收藏夹列表
  const fetchFolders = async () => {
    try {
      setIsFetching(true);
      const response = await fetch("/api/favorite-folders");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "获取收藏夹失败");
      }
      const data = await response.json();
      setFolders(data);

      // 默认选中默认收藏夹
      const defaultFolder = data.find((f: FavoriteFolder) => f.isDefault);
      if (defaultFolder) {
        setSelectedFolderId(defaultFolder.id);
      }

      // 检查当前文章是否已被收藏
      const favoritesResponse = await fetch(`/api/posts/${postId}/favorite`);
      if (favoritesResponse.ok) {
        const favorites = await favoritesResponse.json();
        const favoriteIds = favorites.map((fav: any) => fav.folderId);
        setFavorited(favoriteIds.includes(selectedFolderId));
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
      toast({
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "获取收藏夹失败，请稍后重试",
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // 创建新收藏夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      setIsCreatingFolder(true);
      const response = await fetch("/api/favorite-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "创建收藏夹失败");
      }

      const newFolder = await response.json();
      setFolders([...folders, newFolder]);
      setNewFolderName("");
      setSelectedFolderId(newFolder.id);
      toast({ description: "收藏夹创建成功" });
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "创建收藏夹失败",
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // 收藏文章
  const handleFavorite = async () => {
    if (!selectedFolderId) {
      toast({
        description: "请选择收藏夹",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/posts/${postId}/favorite?folderId=${selectedFolderId}`,
        {
          method: favorited ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: selectedFolderId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 401) {
          toast({
            description: "请先登录后再收藏",
            action: (
              <a href="/login">
                <Button variant="outline" size="sm">
                  去登录
                </Button>
              </a>
            ),
          });
          return;
        }
        throw new Error(error.error || "操作失败");
      }

      // 更新收藏状态
      if (favorited) {
        setFavorited(false);
        setCount(count - 1);
      } else {
        setFavorited(true);
        setCount(count + 1);
      }

      toast({
        description: favorited ? "取消收藏成功" : "收藏成功",
      });
    } catch (error) {
      console.error("Error favoriting post:", error);
      toast({
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "操作失败，请稍后重试",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          disabled={isLoading}
        >
          <Bookmark
            className={cn(
              "h-4 w-4 mr-1",
              favorited ? "fill-current text-yellow-500" : ""
            )}
          />
          {count}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>选择收藏夹</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {isFetching ? (
            <div className="text-center text-muted-foreground">加载中...</div>
          ) : (
            <div className="space-y-2">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer hover:bg-accent",
                    selectedFolderId === folder.id && "bg-accent",
                    favorited && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (!favorited) {
                      setSelectedFolderId(folder.id);
                    }
                  }}
                >
                  <div className="font-medium">
                    {folder.name}
                    {folder.isDefault && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        (默认)
                      </span>
                    )}
                    {favorited && (
                      <span className="ml-2 text-sm text-green-500">
                        (已收藏)
                      </span>
                    )}
                  </div>
                  {folder.description && (
                    <div className="text-sm text-muted-foreground">
                      {folder.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>新建收藏夹</Label>
            <div className="flex space-x-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="收藏夹名称"
                maxLength={50}
              />
              <Button
                size="icon"
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={handleFavorite}
              disabled={!selectedFolderId || isLoading}
            >
              {favorited ? "取消收藏" : "确认收藏"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
