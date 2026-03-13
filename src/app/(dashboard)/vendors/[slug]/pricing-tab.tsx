"use client";

import { useState, useMemo } from "react";
import { DollarSign, Calculator, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorDetailData } from "./vendor-detail";

const WORKLOAD_PROFILES = [
  { key: "small", label: "Small Team", users: 10, dataGB: 50, queriesPerDay: 500 },
  { key: "medium", label: "Mid-Market", users: 50, dataGB: 500, queriesPerDay: 5000 },
  { key: "large", label: "Enterprise", users: 200, dataGB: 5000, queriesPerDay: 50000 },
  { key: "custom", label: "Custom", users: 0, dataGB: 0, queriesPerDay: 0 },
] as const;

type WorkloadKey = (typeof WORKLOAD_PROFILES)[number]["key"];

interface PricingTabProps {
  vendor: VendorDetailData;
}

export function PricingTab({ vendor }: PricingTabProps) {
  const [workload, setWorkload] = useState<WorkloadKey>("medium");
  const [customUsers, setCustomUsers] = useState(100);
  const [customDataGB, setCustomDataGB] = useState(1000);
  const [customQueries, setCustomQueries] = useState(10000);

  const selectedProfile = WORKLOAD_PROFILES.find((w) => w.key === workload)!;
  const users = workload === "custom" ? customUsers : selectedProfile.users;
  const dataGB = workload === "custom" ? customDataGB : selectedProfile.dataGB;
  const queries = workload === "custom" ? customQueries : selectedProfile.queriesPerDay;

  // Estimate pricing based on vendor type and tier
  const estimate = useMemo(() => {
    const basePricePerUser = vendor.tier === "leader" ? 45 : vendor.tier === "challenger" ? 30 : vendor.tier === "emerging" ? 18 : 12;
    const dataPrice = vendor.type === "open-source" ? 0.02 : vendor.type === "open-core" ? 0.05 : 0.08;
    const queryPrice = vendor.type === "open-source" ? 0 : 0.001;

    const userCost = users * basePricePerUser;
    const dataCost = dataGB * dataPrice;
    const queryCost = queries * 30 * queryPrice;
    const monthly = Math.round(userCost + dataCost + queryCost);
    const annual = monthly * 12;
    const annualDiscount = Math.round(annual * 0.8);

    return { userCost, dataCost, queryCost, monthly, annual, annualDiscount };
  }, [users, dataGB, queries, vendor.tier, vendor.type]);

  return (
    <div className="space-y-8">
      {/* Product Pricing Table */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-navy">Product Pricing</h3>
        {vendor.products.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-navy-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/60">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Product
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Tier
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Pricing Model
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Capabilities
                  </th>
                </tr>
              </thead>
              <tbody>
                {vendor.products.map((product) => (
                  <tr key={product.id} className="border-b border-navy-50">
                    <td className="px-4 py-3 font-medium text-navy">{product.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs capitalize text-navy-500">
                        {product.tier ?? "Standard"}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-navy-500">
                      {product.pricingModel?.replace("-", " ") ?? "Contact Sales"}
                    </td>
                    <td className="px-4 py-3 text-center text-navy-500">{product.capabilities.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-navy-300">No pricing information available.</p>
        )}
      </div>

      {/* Cost Estimator */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Calculator size={18} className="text-blue" />
          <h3 className="text-sm font-semibold text-navy">NICE Cost Estimator</h3>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">Beta</span>
        </div>

        {/* Workload profile selector */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium text-navy-400">Select Workload Profile</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {WORKLOAD_PROFILES.map((profile) => (
              <button
                key={profile.key}
                onClick={() => setWorkload(profile.key)}
                className={cn(
                  "nav-transition rounded-lg border px-3 py-2.5 text-left text-xs",
                  workload === profile.key
                    ? "border-blue bg-white font-semibold text-blue shadow-sm"
                    : "border-navy-100 bg-white text-navy-500 hover:border-blue-200"
                )}
              >
                <p className="font-medium">{profile.label}</p>
                {profile.key !== "custom" && (
                  <p className="mt-0.5 text-[10px] text-navy-300">
                    {profile.users} users · {profile.dataGB} GB
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom inputs */}
        {workload === "custom" && (
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-400">Users</label>
              <input
                type="number"
                value={customUsers}
                onChange={(e) => setCustomUsers(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-400">Data Volume (GB)</label>
              <input
                type="number"
                value={customDataGB}
                onChange={(e) => setCustomDataGB(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-400">Queries/Day</label>
              <input
                type="number"
                value={customQueries}
                onChange={(e) => setCustomQueries(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue/30"
              />
            </div>
          </div>
        )}

        {/* Cost breakdown */}
        <div className="rounded-lg border border-navy-100 bg-white p-5">
          <div className="mb-4 flex items-center gap-1.5 text-[10px] text-navy-300">
            <Info size={10} />
            Estimated costs based on typical {vendor.type.replace("-", " ")} vendor pricing
          </div>

          <div className="space-y-2.5 border-b border-navy-50 pb-4">
            <CostLine label={`User licenses (${users} users)`} value={estimate.userCost} />
            <CostLine label={`Data storage (${dataGB} GB)`} value={estimate.dataCost} />
            <CostLine label={`Query processing (${(queries * 30).toLocaleString()}/mo)`} value={estimate.queryCost} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-navy-50 p-4">
              <p className="text-xs text-navy-400">Monthly Estimate</p>
              <p className="mt-1 text-2xl font-bold text-navy">
                ${estimate.monthly.toLocaleString()}
              </p>
              <p className="text-[10px] text-navy-300">per month</p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-accent-50 p-4">
              <p className="text-xs text-navy-400">Annual (20% discount)</p>
              <p className="mt-1 text-2xl font-bold text-blue">
                ${estimate.annualDiscount.toLocaleString()}
              </p>
              <p className="text-[10px] text-navy-300">
                <span className="line-through">${estimate.annual.toLocaleString()}</span> per year
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CostLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-navy-400">{label}</span>
      <span className="text-sm font-medium text-navy">${Math.round(value).toLocaleString()}</span>
    </div>
  );
}
