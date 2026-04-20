import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteNavbar } from "@/components/layout/SiteNavbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fiscal Guardian — IAgentics",
  description:
    "Agente autônomo de contas a pagar e validação fiscal para grandes operações no Brasil.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={cn(inter.variable)}>
      <body className="min-h-screen bg-neutral-bg font-sans text-neutral-ink antialiased">
        <TooltipProvider delayDuration={200}>
          <SiteNavbar />
          <main className="mx-auto w-full max-w-[1400px] px-6 pb-16 pt-6">
            {children}
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
