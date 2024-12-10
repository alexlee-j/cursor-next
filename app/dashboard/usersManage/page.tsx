import { Metadata } from "next";
import { checkAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { DashboardHeader } from "@/components/dashboard/header";
import { UserList } from "@/components/user/user-list";
import { PERMISSIONS } from "@/lib/constants/permissions";

export const metadata: Metadata = {
  title: "用户管理",
  description: "管理系统用户",
};

export default async function UsersManagePage() {
  const user = await checkAuth();

  if (!user || !user.roles.some(role => role.permissions.some(p => p.name === PERMISSIONS.USER.MANAGE))) {
    redirect("/");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="用户管理"
        text="管理系统用户，设置用户角色和状态"
      />
      <div className="grid gap-8">
        <UserList />
      </div>
    </DashboardShell>
  );
}
