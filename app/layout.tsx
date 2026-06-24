import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@/components/Analytics";
import { meta } from "@/lib/data/loaders";

export const metadata: Metadata = {
  title: {
    default: "Jason Chen — Full-Stack Engineer",
    template: "%s — Jason Chen",
  },
  description: meta.profile.summary,
  openGraph: {
    type: "profile",
    firstName: "Jason",
    lastName: "Chen",
    siteName: "Jason Chen",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, background: "var(--joy-palette-background-body)", color: "var(--joy-palette-text-primary)" }}>
        <Providers>
          <Analytics />
          <Header />
          <main style={{ paddingTop: "57px" }}>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
