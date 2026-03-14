import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { GlobalSearch } from "@/components/global-search";
import "./globals.css";

export const metadata: Metadata = {
  title: "NICE DP-CoE",
  description:
    "NICE Data Platform Center of Excellence — Vendor Intelligence & Analytics Hub",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inter + Plus Jakarta Sans from Google Fonts CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <GlobalSearch />
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
