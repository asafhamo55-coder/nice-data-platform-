import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CategoryDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryDetailPage({
  params,
}: CategoryDetailPageProps) {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/categories"
          className="rounded-lg p-2 text-navy-400 hover:bg-navy-50"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-navy">{title}</h1>
          <p className="mt-1 text-navy-400">
            Category detail view for {title}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy">Vendor Rankings</h2>
            <p className="mt-2 text-sm text-navy-400">
              Vendor rankings for this category will be displayed here.
            </p>
          </div>
          <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy">
              Comparison Chart
            </h2>
            <p className="mt-2 text-sm text-navy-400">
              Radar chart comparison will be rendered here.
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy">
              Category Criteria
            </h2>
            <p className="mt-2 text-sm text-navy-400">
              Evaluation criteria and weights for this category.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
