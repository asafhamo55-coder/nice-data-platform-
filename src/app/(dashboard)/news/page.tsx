import { Newspaper, ExternalLink } from "lucide-react";

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy">News Feed</h1>
        <p className="mt-1 text-navy-400">
          Latest data platform industry news and vendor updates
        </p>
      </div>

      <div className="flex items-center gap-4">
        <select className="rounded-lg border border-navy-100 bg-white px-4 py-2 text-sm text-navy focus:border-blue focus:outline-none">
          <option>All Sources</option>
          <option>Vendor Announcements</option>
          <option>Industry Analysis</option>
          <option>Product Updates</option>
        </select>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <Newspaper className="mt-1 h-5 w-5 text-blue" />
            <div className="flex-1">
              <p className="text-sm text-navy-400">
                News items will be populated from the news feed agent. Connect
                your database and configure the news scraping agent to get
                started.
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-navy-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
