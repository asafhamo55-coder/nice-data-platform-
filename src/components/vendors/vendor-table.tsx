"use client";

import { cn } from "@/lib/utils";

interface Vendor {
  id: string;
  name: string;
  category: string;
  score: number;
  rank: number;
}

interface VendorTableProps {
  vendors: Vendor[];
  className?: string;
}

export function VendorTable({ vendors, className }: VendorTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm",
        className
      )}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-navy-100 bg-navy-50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-navy-400">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-navy-400">
              Vendor
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-navy-400">
              Category
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-navy-400">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {vendors.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-sm text-navy-400"
              >
                No vendors to display
              </td>
            </tr>
          ) : (
            vendors.map((vendor) => (
              <tr
                key={vendor.id}
                className="border-b border-navy-50 hover:bg-navy-50/50"
              >
                <td className="px-4 py-3 text-sm font-medium text-navy">
                  #{vendor.rank}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-navy">
                  {vendor.name}
                </td>
                <td className="px-4 py-3 text-sm text-navy-400">
                  {vendor.category}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-blue">
                  {vendor.score}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
