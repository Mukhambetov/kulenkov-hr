"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function SalaryChart({
  data,
}: {
  data: { title: string; median: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
          fontSize={12}
        />
        <YAxis
          type="category"
          dataKey="title"
          width={140}
          fontSize={12}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => [`${Number(v).toLocaleString()} тг`, "Медиана"]}
        />
        <Bar dataKey="median" fill="var(--primary)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
