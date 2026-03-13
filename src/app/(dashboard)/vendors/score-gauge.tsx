"use client";

import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number; // 0-100
  size?: number; // px
  strokeWidth?: number;
}

export function ScoreGauge({
  score,
  size = 56,
  strokeWidth = 4,
}: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const remaining = circumference - progress;

  // Color based on score
  const color =
    score >= 75
      ? "text-emerald-500"
      : score >= 50
        ? "text-blue"
        : score >= 25
          ? "text-amber-500"
          : "text-red-400";

  const strokeColor =
    score >= 75
      ? "#10b981"
      : score >= 50
        ? "#2E75B6"
        : score >= 25
          ? "#f59e0b"
          : "#f87171";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e8edf5"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${remaining}`}
          strokeLinecap="round"
          className="nav-transition"
        />
      </svg>
      <span
        className={cn(
          "absolute text-center font-bold leading-none",
          color,
          size <= 48 ? "text-xs" : "text-sm"
        )}
      >
        {score}
      </span>
    </div>
  );
}
