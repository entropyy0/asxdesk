import "./globals.css";
import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteMetadata } from "@/lib/seo";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap"
});

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.url),
  title: {
    default: siteMetadata.name,
    template: `%s | ${siteMetadata.name}`
  },
  description: siteMetadata.description,
  alternates: {
    canonical: siteMetadata.url
  },
    verification: { google: "ADD_YOUR_GOOGLE_VERIFICATION_CODE_HERE" },
  openGraph: {
    title: siteMetadata.name,
    description: siteMetadata.description,
    url: siteMetadata.url,
    siteName: siteMetadata.name,
    locale: "en_AU",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetadata.name,
    description: siteMetadata.description
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plex.variable} ${space.variable}`}>
      <body className="min-h-screen bg-ink-900 text-slate-100">
        <div className="grid-glow min-h-screen">
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
