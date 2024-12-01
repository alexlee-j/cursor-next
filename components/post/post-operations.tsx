"use client";

import { useState, useCallback } from "react";
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
  post: Post & {
    authorId: string;
    author: {
      id: string;
      name?: string;
      email?: string;
    };
  };
}

export function PostOperations({ post }: PostOperationsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleEdit = useCallback((event: Event) => {
    event.preventDefault();
    setIsOpen(false);
    router.push(`/dashboard/posts/${post.id}`);
  }, [post.id, router]);

  const handleView = useCallback((event: Event) => {
    event.preventDefault();
    setIsOpen(false);
    router.push(`/posts/${post.id}`);
  }, [post.id, router]);

  const handleDelete = useCallback((event: Event) => {
    event.preventDefault();
    setIsOpen(false);
    setShowDeleteAlert(true);
  }, []);

  async function deletePost() {
    try {
      setIsDeleteLoading(true);
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "删除失败");
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
      setIsOpen(false);
    }
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative h-8 w-8 p-0 hover:bg-muted/50 data-[state=open]:bg-muted focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="打开操作菜单"
          >
            <Icons.more className="h-4 w-4" />
            <span className="sr-only">打开菜单</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[200px] bg-popover"
          style={{ 
            pointerEvents: 'auto',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            msUserSelect: 'none'
          }}
          sideOffset={5}
          forceMount
        >
          <DropdownMenuItem
            className="cursor-pointer select-none focus:bg-accent focus:text-accent-foreground"
            onSelect={handleEdit}
          >
            编辑
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer select-none focus:bg-accent focus:text-accent-foreground"
            onSelect={handleView}
          >
            查看
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer select-none text-red-600 focus:bg-red-50 focus:text-red-600"
            onSelect={handleDelete}
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
