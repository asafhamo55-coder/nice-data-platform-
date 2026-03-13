"use client";

import { cn } from "@/lib/utils";
import { Building2, ExternalLink } from "lucide-react";

interface VendorCardProps {
  name: string;
  description?: string;
  category?: string;
  score?: number;
  website?: string;
  logoUrl?: string;
  className?: string;
}

export function VendorCard({
  name,
  description,
  category,
  score,
  website,
  className,
}: VendorCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-navy-100 bg-white p-6 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2">
            <Building2 className="h-5 w-5 text-blue" />
          </div>
          <div>
            <h3 className="font-semibold text-navy">{name}</h3>
            {category && (
              <span className="text-xs text-navy-400">{category}</span>
            )}
          </div>
        </div>
        {score !== undefined && (
          <span className="rounded-full bg-accent-50 px-2.5 py-0.5 text-sm font-semibold text-accent">
            {score}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-3 text-sm text-navy-400 line-clamp-2">
          {description}
        </p>
      )}
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-blue hover:underline"
        >
          Visit website <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}
