import ProviderWrapper from "@/components/wrappers/provider-wrapper";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@radix-ui/themes/styles.css";

export const metadata: Metadata = {
  title: "Ignite",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <main className="min-h-screen bg-background flex flex-col overflow-hidden">
          <ProviderWrapper>
            <div className="flex ">{children}</div>
          </ProviderWrapper>
        </main>
      </body>
    </html>
  );
}
