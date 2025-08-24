import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { AppProviders } from "@/components/providers/AppProviders";
import { ClientRoot } from "@/components/ClientRoot";

export const metadata: Metadata = {
  title: "Document Analyzer",
  description: "Analyze your documents with advanced AI tools",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AppProviders>
          <ClientRoot>{children}</ClientRoot>
        </AppProviders>
      </body>
    </html>
  );
}
