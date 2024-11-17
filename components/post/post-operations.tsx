"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Post } from ".prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface PostOperationsProps {
  post: Post;
}

export function PostOperations({ post }: PostOperationsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  async function deletePost() {
    try {
      setIsDeleteLoading(true);
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除失败");
      }

      toast({
        description: "文章已删除",
      });

      router.refresh();
    } catch (err) {
      const error = err as Error;
      toast({
        variant: "destructive",
        description: error.message || "删除文章时出错",
      });
    } finally {
      setIsDeleteLoading(false);
      setShowDeleteAlert(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <Icons.more className="h-4 w-4" />
            <span className="sr-only">打开菜单</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/posts/${post.id}`)}
          >
            编辑
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/posts/${post.id}`)}>
            查看
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setShowDeleteAlert(true)}
          >
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
        title="确定要删除这篇文章吗？"
        description="此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={deletePost}
        loading={isDeleteLoading}
      />
    </>
  );
}
