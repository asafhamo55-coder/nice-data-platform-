"use client";

import * as React from "react";
import { Tooltip as RechartsTooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color?: string;
    icon?: React.ComponentType;
  }
>;

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactNode;
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  const cssVars = Object.entries(config).reduce(
    (acc, [key, value]) => {
      if (value.color) {
        acc[`--color-${key}`] = value.color;
      }
      return acc;
    },
    {} as Record<string, string>
  );

  return (
    <div
      className={cn("w-full", className)}
      style={cssVars as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}

export const ChartTooltip = RechartsTooltip;
export const ChartLegend = Legend;

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  config?: ChartConfig;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  config,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-navy-100 bg-white p-3 shadow-md">
      {label && <p className="mb-1 text-xs font-medium text-navy">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-navy-400">
            {config?.[entry.name]?.label ?? entry.name}:
          </span>
          <span className="font-medium text-navy">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

interface ChartLegendContentProps {
  payload?: { value: string; color: string }[];
  config?: ChartConfig;
}

export function ChartLegendContent({
  payload,
  config,
}: ChartLegendContentProps) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-navy-400">
            {config?.[entry.value]?.label ?? entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
