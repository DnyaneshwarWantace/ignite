"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, Bot, FileText, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";
import { Typography } from "@/components/ui/typography";

const navItems = [
  { name: "DNAs", href: "/ai-writer/dnas", icon: Database, title: "Campaign DNAs", subtitle: "Your business profiles that power all AI agents" },
  { name: "Agents", href: "/ai-writer/agents", icon: Bot, title: "All Agents", subtitle: "AI agents for copy and content" },
  { name: "docOS", href: "/ai-writer/docos", icon: FileText, title: "docOS", subtitle: "docOS coming soon" },
  { name: "History", href: "/ai-writer/history", icon: History, title: "History", subtitle: "Your generation history" },
];

function getPageTitle(pathname: string | null) {
  if (!pathname) return { title: "AI Writer", subtitle: "" };
  if (pathname === "/ai-writer/dnas/new") return { title: "New Campaign DNA", subtitle: "" };
  if (pathname?.startsWith("/ai-writer/dnas/")) return { title: "Campaign DNA", subtitle: "" };
  const item = navItems.find(
    (n) => pathname === n.href || (n.href !== "/ai-writer" && pathname?.startsWith(n.href))
  );
  return item ? { title: item.title, subtitle: item.subtitle } : { title: "AI Writer", subtitle: "" };
}

export default function AIWriterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { title, subtitle } = getPageTitle(pathname);

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
      <Topbar
        bb
        content={
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex-1 flex flex-col items-start min-w-0">
              <Typography variant="title">{title}</Typography>
              {subtitle ? <Typography variant="subtitle">{subtitle}</Typography> : null}
            </div>
            <nav className="flex items-center gap-1 shrink-0">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/ai-writer" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        }
      />
      <main className="flex-1 overflow-auto bg-background min-w-0 w-full p-4">{children}</main>
    </div>
  );
}
