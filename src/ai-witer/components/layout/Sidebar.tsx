"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  Bot,
  FileText,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "DNAs", href: "/dnas", icon: Database },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "docOS", href: "/docos", icon: FileText },
  { name: "History", href: "/history", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ghostwriter OS</h1>
            <p className="text-xs text-gray-500">Resolutive agents</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

