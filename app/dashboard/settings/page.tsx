"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { DashboardShell } from "@/components/dashboard/shell";
import { DashboardHeader } from "@/components/dashboard/header";

interface UserProfile {
  name: string | null;
  email: string;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  socialLinks: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  } | null;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    website: "",
    location: "",
    socialLinks: {
      twitter: "",
      github: "",
      linkedin: "",
    },
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { toast } = useToast();

  // 获取用户资料
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        setProfile(data);
        setFormData((prev) => ({
          ...prev,
          name: data.name || "",
          email: data.email || "",
          bio: data.bio || "",
          website: data.website || "",
          location: data.location || "",
          socialLinks: {
            twitter: data.socialLinks?.twitter || "",
            github: data.socialLinks?.github || "",
            linkedin: data.socialLinks?.linkedin || "",
          },
        }));
      } catch (error) {
        toast({
          title: "获取资料失败",
          description: "无法加载用户资料，请稍后重试",
          variant: "destructive",
        });
      }
    };
    fetchProfile();
  }, []);

  // 处理输入变化
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    if (id.startsWith("social-")) {
      const network = id.replace("social-", "");
      setFormData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [network]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  // 处理头像上传
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "文件太大",
        description: "请上传小于2MB的文件",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setProfile((prev) => (prev ? { ...prev, avatar: data.avatar } : null));

      toast({
        title: "头像已更新",
        description: "您的头像已成功更新",
      });
    } catch (error) {
      toast({
        title: "上传失败",
        description:
          error instanceof Error
            ? error.message
            : "上传头像时出现错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 保存个人资料
  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          bio: formData.bio,
          website: formData.website,
          location: formData.location,
          socialLinks: formData.socialLinks,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      toast({
        title: "设置已保存",
        description: "您的个人资料已成功更新",
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description:
          error instanceof Error
            ? error.message
            : "保存设置时出现错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 更新密码
  const handlePasswordUpdate = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "新密码和确认密码不一致",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast({
        title: "密码已更新",
        description: "您的密码已成功更新",
      });

      // 清空密码字段
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      toast({
        title: "更新失败",
        description:
          error instanceof Error
            ? error.message
            : "更新密码时出现错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="个人中心"
        text="管理您的账户设置和偏好"
      />
      <div className="grid gap-6">
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">个人资料</TabsTrigger>
            <TabsTrigger value="account">账户安全</TabsTrigger>
            <TabsTrigger value="notifications">通知设置</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>个人资料</CardTitle>
                <CardDescription>更新您的个人信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 头像上传 */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar || ""} />
                    <AvatarFallback>
                      {profile?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Icons.upload className="h-4 w-4" />
                        上传新头像
                      </div>
                    </Label>
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      支持 JPG、PNG 格式，文件大小不超过 2MB
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">用户名</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="输入用户名"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    placeholder="输入邮箱"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">个人简介</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="介绍一下自己"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">个人网站</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">所在地</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="城市，国家"
                  />
                </div>

                <div className="space-y-4">
                  <Label>社交媒体</Label>
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                      <Icons.twitter className="h-4 w-4" />
                      <Input
                        id="social-twitter"
                        value={formData.socialLinks.twitter}
                        onChange={handleInputChange}
                        placeholder="Twitter 链接"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Icons.github className="h-4 w-4" />
                      <Input
                        id="social-github"
                        value={formData.socialLinks.github}
                        onChange={handleInputChange}
                        placeholder="GitHub 链接"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Icons.linkedin className="h-4 w-4" />
                      <Input
                        id="social-linkedin"
                        value={formData.socialLinks.linkedin}
                        onChange={handleInputChange}
                        placeholder="LinkedIn 链接"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleProfileSave} disabled={loading}>
                  {loading ? "保存中..." : "保存更改"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>账户安全</CardTitle>
                <CardDescription>管理您的密码和账户安全设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">当前密码</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密码</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认新密码</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>
                <Button onClick={handlePasswordUpdate} disabled={loading}>
                  {loading ? "更新中..." : "更新密码"}
                </Button>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>双因素认证</Label>
                      <p className="text-sm text-muted-foreground">
                        启用双因素认证以提高账户安全性
                      </p>
                    </div>
                    <Switch checked={profile?.twoFactorEnabled} disabled={true} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>通知设置</CardTitle>
                <CardDescription>自定义您想要接收的通知</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  通知设置功能即将上线...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
