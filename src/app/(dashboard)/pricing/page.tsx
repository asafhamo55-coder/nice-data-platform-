import { Calculator, DollarSign } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy">Pricing Calculator</h1>
        <p className="mt-1 text-navy-400">
          Compare vendor pricing and estimate costs
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
            <Calculator size={20} />
            Cost Estimator
          </h2>
          <p className="mt-2 text-sm text-navy-400">
            Configure your usage parameters to estimate costs across vendors.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-navy">
                Data Volume (TB/month)
              </label>
              <input
                type="number"
                placeholder="10"
                className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">
                Concurrent Users
              </label>
              <input
                type="number"
                placeholder="100"
                className="mt-1 w-full rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-blue focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
            <DollarSign size={20} />
            Price Comparison
          </h2>
          <p className="mt-2 text-sm text-navy-400">
            Pricing comparison results will appear here after configuration.
          </p>
        </div>
      </div>
    </div>
  );
}
