"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-navy-100 bg-white p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-blue" />
        {trend && (
          <span className="text-xs font-medium text-accent">{trend}</span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-navy">{value}</p>
      <p className="text-sm text-navy-400">{label}</p>
    </div>
  );
}
