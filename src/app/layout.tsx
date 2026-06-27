import type { Metadata } from "next";
import { Adamina } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const adamina = Adamina({
  variable: "--font-adamina",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "aamém",
  description: "Criador de minisites para igrejas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${adamina.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
