"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface OverviewProps {
  data: {
    date: string;
    views: number;
  }[];
}

export function Overview({ data }: OverviewProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="views"
          stroke="#8884d8"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
