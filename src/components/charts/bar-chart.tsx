"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BarChartProps {
  data: { name: string; value: number; [key: string]: unknown }[];
  dataKey?: string;
  color?: string;
  height?: number;
}

export function BarChart({
  data,
  dataKey = "value",
  color = "#2E75B6",
  height = 300,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d9e0ed" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#8da2c9" />
        <YAxis tick={{ fontSize: 12 }} stroke="#8da2c9" />
        <Tooltip />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
