import { Search, Filter, Plus } from "lucide-react";

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">Vendor Hub</h1>
          <p className="mt-1 text-navy-400">
            Browse and manage all tracked vendors
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
          <Plus size={16} />
          Add Vendor
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
          <input
            type="text"
            placeholder="Search vendors..."
            className="w-full rounded-lg border border-navy-100 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
          />
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-navy-100 bg-white px-4 py-2 text-sm text-navy-400 hover:bg-navy-50">
          <Filter size={16} />
          Filters
        </button>
      </div>

      <div className="rounded-xl border border-navy-100 bg-white p-8 text-center shadow-sm">
        <p className="text-navy-400">
          Vendor data will be displayed here. Connect your database to get
          started.
        </p>
      </div>
    </div>
  );
}
