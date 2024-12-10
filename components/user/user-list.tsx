"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  emailVerified: boolean;
  trustLevel: string;
  roles: string[];
  _count: {
    posts: number;
    comments: number;
  };
}

export function UserList() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout>();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: async () => {},
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(status && status !== "all" && { status }),
      });

      const response = await fetch(`/api/users?${searchParams.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "错误",
        description: "获取用户列表失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    setSearchDebounce(
      setTimeout(() => {
        setPage(1);
        fetchUsers();
      }, 500)
    );
  }, [search, status]);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    setConfirmDialog({
      isOpen: true,
      title: `确认${isActive ? "激活" : "禁用"}用户`,
      description: `你确定要${isActive ? "激活" : "禁用"}这个用户吗？此操作可能会影响用户的访问权限。`,
      action: async () => {
        try {
          const response = await fetch("/api/users", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
            body: JSON.stringify({ userId, isActive }),
          });

          if (!response.ok) throw new Error("Failed to update user status");

          toast({
            title: "成功",
            description: `用户状态已更新为${isActive ? "激活" : "禁用"}`,
          });

          fetchUsers();
        } catch (error) {
          console.error("Error updating user status:", error);
          toast({
            title: "错误",
            description: "更新用户状态失败",
            variant: "destructive",
          });
        }
      },
    });
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "确认更改用户角色",
      description: `你确定要将用户角色更改为${
        newRole === "super_admin" ? "超级管理员" :
        newRole === "admin" ? "管理员" : "普通用户"
      }吗？此操作将影响用户的权限。`,
      action: async () => {
        try {
          const response = await fetch("/api/users", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
            body: JSON.stringify({ userId, roles: [newRole] }),
          });

          if (!response.ok) throw new Error("Failed to update user roles");

          toast({
            title: "成功",
            description: "用户角色已更新",
          });

          fetchUsers();
        } catch (error) {
          console.error("Error updating user roles:", error);
          toast({
            title: "错误",
            description: "更新用户角色失败",
            variant: "destructive",
          });
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="搜索用户名或邮箱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="用户状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="active">已激活</SelectItem>
            <SelectItem value="inactive">已禁用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>信任等级</TableHead>
              <TableHead>统计</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Icons.spinner className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  没有找到用户
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name || "未设置昵称"}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive ? "default" : "secondary"}
                      className={cn(
                        "capitalize",
                        user.isActive ? "bg-green-500" : "bg-gray-500"
                      )}
                    >
                      {user.isActive ? "已激活" : "已禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.roles[0] || "user"}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">普通用户</SelectItem>
                        <SelectItem value="admin">管理员</SelectItem>
                        <SelectItem value="super_admin">超级管理员</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.trustLevel}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>文章: {user._count.posts}</div>
                      <div>评论: {user._count.comments}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(user.id, !user.isActive)}
                    >
                      {user.isActive ? "禁用" : "激活"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            下一页
          </Button>
        </div>
      )}

      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(isOpen) =>
          setConfirmDialog((prev) => ({ ...prev, isOpen }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await confirmDialog.action();
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
              }}
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
