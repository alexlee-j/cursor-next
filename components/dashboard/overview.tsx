"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Overview as OverviewChart } from "@/components/dashboard/overview-chart";

interface OverviewProps {
  data: {
    totalPosts: number;
    draftPosts: number;
    totalComments: number;
    totalViews: number;
    recentViews: {
      date: string;
      views: number;
    }[];
  };
}

export function Overview({ data }: OverviewProps) {
  return (
    <>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>已发布文章</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalPosts}</div>
        </CardContent>
      </Card>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>草稿箱</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.draftPosts}</div>
        </CardContent>
      </Card>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>评论数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalComments}</div>
        </CardContent>
      </Card>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>总浏览量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalViews}</div>
        </CardContent>
      </Card>
      {data.recentViews.length > 0 && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>访问趋势</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart data={data.recentViews} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
