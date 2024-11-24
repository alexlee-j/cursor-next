"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface FolderEditDialogProps {
  folder: {
    id: string;
    name: string;
    description: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (folder: {
    id: string;
    name: string;
    description: string | null;
  }) => void;
}

export function FolderEditDialog({
  folder,
  open,
  onOpenChange,
  onSuccess,
}: FolderEditDialogProps) {
  const [name, setName] = useState(folder.name);
  const [description, setDescription] = useState(folder.description || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/favorite-folders/${folder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        throw new Error("更新失败");
      }

      const updatedFolder = await response.json();
      onSuccess(updatedFolder);
      toast({
        title: "更新成功",
      });
    } catch (error) {
      console.error("Error updating folder:", error);
      toast({
        title: "更新失败",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑收藏夹</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入收藏夹名称"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入收藏夹描述（可选）"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              保存
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
