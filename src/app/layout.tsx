import type { Metadata } from "next";
import { AppShell } from "@/components/LanguageProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrantForge - EU/BG Startup Funding Navigator",
  description: "Funding discovery, eligibility checks, and application packs for EU and Bulgarian tech startups."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
