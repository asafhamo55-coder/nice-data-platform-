import { Trophy, ArrowUpDown } from "lucide-react";

export default function RankingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy">Global Rankings</h1>
        <p className="mt-1 text-navy-400">
          Comprehensive vendor rankings across all categories
        </p>
      </div>

      <div className="flex items-center gap-4">
        <select className="rounded-lg border border-navy-100 bg-white px-4 py-2 text-sm text-navy focus:border-blue focus:outline-none">
          <option>All Categories</option>
          <option>Data Warehouses</option>
          <option>BI &amp; Analytics</option>
          <option>AI/ML Platforms</option>
        </select>
        <button className="flex items-center gap-2 rounded-lg border border-navy-100 bg-white px-4 py-2 text-sm text-navy-400 hover:bg-navy-50">
          <ArrowUpDown size={16} />
          Sort By
        </button>
      </div>

      <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-navy-400">
          <Trophy size={20} />
          <span className="text-sm">
            Rankings will be computed from vendor scores. Connect your database
            to get started.
          </span>
        </div>
      </div>
    </div>
  );
}
