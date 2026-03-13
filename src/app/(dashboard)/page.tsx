import { Building2, Grid3X3, Trophy, TrendingUp } from "lucide-react";

const stats = [
  { label: "Vendors Tracked", value: "150+", icon: Building2, trend: "+12" },
  { label: "Categories", value: "12", icon: Grid3X3, trend: "+2" },
  { label: "Rankings Updated", value: "Weekly", icon: Trophy, trend: "" },
  { label: "Data Points", value: "10K+", icon: TrendingUp, trend: "+500" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy">Dashboard</h1>
        <p className="mt-1 text-navy-400">
          NICE Data Platform Center of Excellence
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="h-5 w-5 text-blue" />
              {stat.trend && (
                <span className="text-xs font-medium text-accent">
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="mt-4 text-2xl font-bold text-navy">{stat.value}</p>
            <p className="text-sm text-navy-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-navy">Recent Activity</h2>
          <p className="mt-2 text-sm text-navy-400">
            Latest vendor updates and evaluations will appear here.
          </p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-navy">Quick Actions</h2>
          <p className="mt-2 text-sm text-navy-400">
            Start an evaluation, compare vendors, or explore categories.
          </p>
        </div>
      </div>
    </div>
  );
}
