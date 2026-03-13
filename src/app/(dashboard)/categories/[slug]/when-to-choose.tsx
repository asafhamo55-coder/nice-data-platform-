"use client";

import { Lightbulb, ChevronRight, Star, Zap, DollarSign, Users, Shield, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryVendor, CategoryData } from "./category-detail";

interface WhenToChooseProps {
  vendors: CategoryVendor[];
  category: CategoryData;
  color: string;
}

// Decision attributes derived from vendor characteristics
function deriveRecommendation(vendor: CategoryVendor): {
  useCase: string;
  strengths: string[];
  bestFor: string;
  icon: typeof Star;
} {
  const caps = vendor.capabilities.map((c) => c.key).join(" ");
  const tier = vendor.tier;
  const score = vendor.overallScore;
  const isEnterprise = vendor.employeeRange === "5000-10000" || vendor.employeeRange === "10000+";
  const isStartup = vendor.employeeRange === "50-100" || vendor.employeeRange === "10-50";

  // Determine primary use case and strengths from capabilities and tier
  if (tier === "leader" && isEnterprise) {
    return {
      useCase: `Choose ${vendor.name} for enterprise-grade deployments requiring proven reliability and comprehensive support.`,
      strengths: ["Enterprise support", "Proven at scale", "Rich ecosystem"],
      bestFor: "Large enterprises, regulated industries",
      icon: Shield,
    };
  }

  if (tier === "leader" && !isEnterprise) {
    return {
      useCase: `Choose ${vendor.name} for best-in-class capabilities with strong community and innovation pace.`,
      strengths: ["Innovation leader", "Strong community", "Best-in-class features"],
      bestFor: "Tech-forward teams, data-intensive workloads",
      icon: Star,
    };
  }

  if (tier === "challenger") {
    const hasOss = caps.includes("open-source") || caps.includes("self-hosted") || caps.includes("community");
    if (hasOss) {
      return {
        useCase: `Choose ${vendor.name} for open-source flexibility with optional managed cloud services.`,
        strengths: ["Open source core", "Self-hosted option", "Cost-effective"],
        bestFor: "Teams wanting vendor independence, budget-conscious orgs",
        icon: Globe,
      };
    }
    return {
      useCase: `Choose ${vendor.name} for a strong balance of features and value, especially if growing fast.`,
      strengths: ["Competitive pricing", "Growing fast", "Modern architecture"],
      bestFor: "Mid-market companies, scaling startups",
      icon: Zap,
    };
  }

  if (tier === "emerging") {
    return {
      useCase: `Choose ${vendor.name} for cutting-edge innovation and willingness to adopt newer technology.`,
      strengths: ["Innovative approach", "Modern stack", "Agile development"],
      bestFor: "Early adopters, greenfield projects",
      icon: Lightbulb,
    };
  }

  // niche
  return {
    useCase: `Choose ${vendor.name} for specialized needs where its focused capabilities align with your specific requirements.`,
    strengths: ["Specialized focus", "Deep expertise", "Niche fit"],
    bestFor: "Specific use cases, complementary tooling",
    icon: Users,
  };
}

export function WhenToChoose({ vendors, category, color }: WhenToChooseProps) {
  // Show top vendors (leaders and challengers primarily)
  const topVendors = vendors
    .filter((v) => v.overallScore > 0)
    .slice(0, 6);

  if (topVendors.length === 0) return null;

  return (
    <div className="rounded-xl border border-navy-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-navy-100 px-6 py-4">
        <Lightbulb size={18} style={{ color }} />
        <h2 className="text-lg font-semibold text-navy">When to Choose</h2>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {topVendors.map((vendor) => {
          const rec = deriveRecommendation(vendor);
          const RecIcon = rec.icon;

          return (
            <div
              key={vendor.id}
              className="nav-transition group rounded-xl border border-navy-100 p-4 hover:border-navy-200 hover:shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <RecIcon size={16} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-navy">{vendor.name}</h3>
                    <span className="rounded bg-navy-50 px-1.5 py-px text-[10px] font-bold text-navy-400">
                      {vendor.overallScore}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-navy-400">{rec.useCase}</p>
                </div>
              </div>

              {/* Strengths */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {rec.strengths.map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: color }}
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Best for */}
              <div className="mt-3 rounded-lg bg-navy-50/60 px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-navy-300">Best for</p>
                <p className="text-xs font-medium text-navy-500">{rec.bestFor}</p>
              </div>

              {/* Link */}
              <a
                href={`/vendors/${vendor.slug}`}
                className="nav-transition mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue hover:text-blue-700"
              >
                View full profile
                <ChevronRight size={12} />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
