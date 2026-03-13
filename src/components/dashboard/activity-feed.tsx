"use client";

import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "update" | "evaluation" | "news" | "score";
}

interface ActivityFeedProps {
  items: ActivityItem[];
  className?: string;
}

export function ActivityFeed({ items, className }: ActivityFeedProps) {
  const typeColors = {
    update: "bg-blue-50 text-blue",
    evaluation: "bg-accent-50 text-accent",
    news: "bg-navy-50 text-navy",
    score: "bg-blue-50 text-blue-600",
  };

  return (
    <div className={cn("space-y-3", className)}>
      {items.length === 0 ? (
        <p className="text-sm text-navy-400">No recent activity</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-lg p-3 hover:bg-navy-50"
          >
            <div
              className={cn(
                "mt-0.5 h-2 w-2 rounded-full",
                typeColors[item.type]
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy">{item.title}</p>
              <p className="text-xs text-navy-400">{item.description}</p>
            </div>
            <span className="text-xs text-navy-300 whitespace-nowrap">
              {item.timestamp}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
