import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme-provider";
import { APP_NAME } from "@tulmek/config/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "AI-powered interview prep knowledge hub — fresh content from HackerNews, Reddit, dev.to & more, updated daily.";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Interview Prep Knowledge Hub`,
    template: `%s — ${APP_NAME}`,
  },
  description: siteDescription,
  keywords: [
    "interview prep",
    "software engineering",
    "system design",
    "leetcode",
    "DSA",
    "AI ML interview",
    "coding interview",
    "career",
    "tech interview",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: APP_NAME,
    title: `${APP_NAME} — Interview Prep Knowledge Hub`,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Interview Prep Knowledge Hub`,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://www.reddit.com" />
        <link rel="preconnect" href="https://news.ycombinator.com" />
        <link rel="preconnect" href="https://dev.to" />
        <link rel="dns-prefetch" href="https://medium.com" />
        <link rel="dns-prefetch" href="https://github.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://leetcode.com" />
        <link rel="dns-prefetch" href="https://www.google.com" />
      </head>
      <body className="min-h-dvh flex flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
        <SpeedInsights />
        {process.env.NODE_ENV === "production" && (
          <Script
            defer
            data-domain={
              process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "tulmek.vercel.app"
            }
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
