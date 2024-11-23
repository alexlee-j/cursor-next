"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  initialCount: number;
  isFavorited: boolean;
}

export function FavoriteDialog({
  postId,
  initialFolders,
  initialCount,
  isFavorited,
}: FavoriteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [folders, setFolders] = useState(initialFolders || []);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolder, setNewFolder] = useState({ name: "", description: "" });
  const { toast } = useToast();
  const { setIsFavorited, setFavoritesCount } = usePostActions();

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
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">暂无收藏夹，请先创建收藏夹</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { isFavorited: globalIsFavorited, favoritesCount } = usePostActions();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={`inline-flex items-center space-x-1 px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors ${
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
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加到收藏夹</DialogTitle>
        </DialogHeader>

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
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button
                onClick={createFolder}
                disabled={!newFolder.name || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "创建"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              创建新收藏夹
            </Button>

            <div className="space-y-4">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">
                      {folder.name}
                      {folder.isDefault && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          默认收藏夹
                        </span>
                      )}
                    </h3>
                    {folder.description && (
                      <p className="text-sm text-muted-foreground">
                        {folder.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant={folder.isFavorited ? "default" : "outline"}
                    disabled={isLoading}
                    onClick={() => toggleFavorite(folder.id)}
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
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
