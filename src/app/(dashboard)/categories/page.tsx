import Link from "next/link";
import {
  Database,
  Cloud,
  BarChart3,
  Shield,
  Workflow,
  Brain,
  Server,
  Globe,
  Lock,
  Layers,
  Cpu,
  Zap,
} from "lucide-react";

const categories = [
  { slug: "data-warehouses", name: "Data Warehouses", icon: Database, count: 15 },
  { slug: "cloud-platforms", name: "Cloud Platforms", icon: Cloud, count: 8 },
  { slug: "bi-analytics", name: "BI & Analytics", icon: BarChart3, count: 22 },
  { slug: "data-governance", name: "Data Governance", icon: Shield, count: 12 },
  { slug: "etl-integration", name: "ETL & Integration", icon: Workflow, count: 18 },
  { slug: "ai-ml-platforms", name: "AI/ML Platforms", icon: Brain, count: 20 },
  { slug: "data-lakes", name: "Data Lakes", icon: Server, count: 10 },
  { slug: "api-management", name: "API Management", icon: Globe, count: 14 },
  { slug: "data-security", name: "Data Security", icon: Lock, count: 11 },
  { slug: "data-catalogs", name: "Data Catalogs", icon: Layers, count: 9 },
  { slug: "stream-processing", name: "Stream Processing", icon: Cpu, count: 13 },
  { slug: "data-quality", name: "Data Quality", icon: Zap, count: 7 },
];

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy">Categories</h1>
        <p className="mt-1 text-navy-400">
          Explore 12 data platform technology categories
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="group rounded-xl border border-navy-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
          >
            <cat.icon className="h-8 w-8 text-blue group-hover:text-accent" />
            <h3 className="mt-4 font-semibold text-navy">{cat.name}</h3>
            <p className="mt-1 text-sm text-navy-400">
              {cat.count} vendors tracked
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
