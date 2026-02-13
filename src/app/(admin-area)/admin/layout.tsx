"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Activity, Shield, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ADMIN_LOGIN, ROOT } from "@/lib/routes";

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "API Usage", href: "/admin/usage", icon: Activity },
  { name: "API & Scraping", href: "/admin/analytics", icon: BarChart2 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;
  const isLoginPage = pathname === ADMIN_LOGIN;

  useEffect(() => {
    if (isLoginPage) return;
    if (status === "loading") return;
    if (!session?.user) {
      router.replace(ADMIN_LOGIN);
      return;
    }
    if (!isAdmin) {
      router.replace(ROOT);
      return;
    }
  }, [session, status, isAdmin, router, isLoginPage]);

  if (isLoginPage) return <>{children}</>;

  if (status === "loading" || !session?.user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Checking access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background shrink-0">
        <div className="h-16 flex items-center justify-between px-6 gap-4">
          <div className="flex flex-col items-start">
            <Typography variant="title">{session.user?.name || session.user?.email || "Admin"}</Typography>
            <Typography variant="subtitle">Manage users and view usage</Typography>
          </div>
          <nav className="flex items-center gap-1">
            {adminNav.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    pathname === item.href && "bg-muted font-medium"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
