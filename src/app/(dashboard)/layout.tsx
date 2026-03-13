"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Grid3X3,
  Trophy,
  Calculator,
  Newspaper,
  ClipboardCheck,
  MessageSquare,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendors", label: "Vendor Hub", icon: Building2 },
  { href: "/categories", label: "Categories", icon: Grid3X3 },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/pricing", label: "Pricing", icon: Calculator },
  { href: "/news", label: "News Feed", icon: Newspaper },
  { href: "/evaluations", label: "Evaluations", icon: ClipboardCheck },
  { href: "/assistant", label: "AI Assistant", icon: MessageSquare },
  { href: "/standards", label: "Standards", icon: BookOpen },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-light">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-navy-100 bg-white transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-navy-100 px-4">
          {!collapsed && (
            <span className="text-lg font-bold text-navy">NICE DP CoE</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-md p-1.5 text-navy-400 hover:bg-navy-50"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue"
                    : "text-navy-400 hover:bg-navy-50 hover:text-navy"
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
