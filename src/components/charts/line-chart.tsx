"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LineChartProps {
  data: { name: string; [key: string]: unknown }[];
  lines: { dataKey: string; color: string }[];
  height?: number;
}

export function LineChart({ data, lines, height = 300 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d9e0ed" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#8da2c9" />
        <YAxis tick={{ fontSize: 12 }} stroke="#8da2c9" />
        <Tooltip />
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
