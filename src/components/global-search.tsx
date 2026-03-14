"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Package,
  Newspaper,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

// ─── Types ──────────────────────────────────────────────────────

interface SearchResults {
  vendors: { id: string; name: string; slug: string; tier: string; score: number | null; category: string | null }[];
  products: { id: string; name: string; vendorName: string; vendorSlug: string; pricingModel: string | null }[];
  news: { id: string; title: string; source: string | null; category: string }[];
  categories: { id: string; name: string; slug: string; vendorCount: number }[];
}

// ─── Component ──────────────────────────────────────────────────

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      router.push(path);
    },
    [router]
  );

  const hasResults = results && (
    results.vendors.length > 0 ||
    results.products.length > 0 ||
    results.news.length > 0 ||
    results.categories.length > 0
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search vendors, products, news, categories..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {query.length >= 2 && !loading && !hasResults && (
          <CommandEmpty>No results found for &ldquo;{query}&rdquo;</CommandEmpty>
        )}

        {loading && query.length >= 2 && (
          <div className="py-6 text-center text-sm text-navy-400">Searching...</div>
        )}

        {/* Vendors */}
        {results && results.vendors.length > 0 && (
          <CommandGroup heading="Vendors">
            {results.vendors.map((v) => (
              <CommandItem
                key={v.id}
                value={`vendor-${v.name}`}
                onSelect={() => navigate(`/vendors`)}
                className="flex items-center gap-3 py-2.5"
              >
                <Building2 size={16} className="flex-shrink-0 text-blue" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy">{v.name}</p>
                  <p className="text-[11px] text-navy-400">
                    {v.tier} {v.category && `· ${v.category}`}
                    {v.score != null && ` · Score: ${Math.round(v.score)}`}
                  </p>
                </div>
                <ArrowRight size={12} className="flex-shrink-0 text-navy-200" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results && results.vendors.length > 0 && results.products.length > 0 && (
          <CommandSeparator />
        )}

        {/* Products */}
        {results && results.products.length > 0 && (
          <CommandGroup heading="Products">
            {results.products.map((p) => (
              <CommandItem
                key={p.id}
                value={`product-${p.name}`}
                onSelect={() => navigate(`/vendors`)}
                className="flex items-center gap-3 py-2.5"
              >
                <Package size={16} className="flex-shrink-0 text-violet-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy">{p.name}</p>
                  <p className="text-[11px] text-navy-400">
                    by {p.vendorName}
                    {p.pricingModel && ` · ${p.pricingModel}`}
                  </p>
                </div>
                <ArrowRight size={12} className="flex-shrink-0 text-navy-200" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results && (results.vendors.length > 0 || results.products.length > 0) && results.categories.length > 0 && (
          <CommandSeparator />
        )}

        {/* Categories */}
        {results && results.categories.length > 0 && (
          <CommandGroup heading="Categories">
            {results.categories.map((c) => (
              <CommandItem
                key={c.id}
                value={`category-${c.name}`}
                onSelect={() => navigate(`/categories/${c.slug}`)}
                className="flex items-center gap-3 py-2.5"
              >
                <Layers size={16} className="flex-shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy">{c.name}</p>
                  <p className="text-[11px] text-navy-400">{c.vendorCount} vendors</p>
                </div>
                <ArrowRight size={12} className="flex-shrink-0 text-navy-200" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results && (results.vendors.length > 0 || results.categories.length > 0) && results.news.length > 0 && (
          <CommandSeparator />
        )}

        {/* News */}
        {results && results.news.length > 0 && (
          <CommandGroup heading="News">
            {results.news.map((n) => (
              <CommandItem
                key={n.id}
                value={`news-${n.title}`}
                onSelect={() => navigate(`/news`)}
                className="flex items-center gap-3 py-2.5"
              >
                <Newspaper size={16} className="flex-shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-navy">{n.title}</p>
                  <p className="text-[11px] text-navy-400">
                    {n.source ?? "Unknown"} · {n.category.replace(/_/g, " ")}
                  </p>
                </div>
                <ArrowRight size={12} className="flex-shrink-0 text-navy-200" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
