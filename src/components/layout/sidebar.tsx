"use client";
import Link from "next/link";
import { Search, Settings, ChevronDown, LogOut, Folder, Plus } from "lucide-react";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { InputWithIcon } from "../ui/input-with-icon";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { signOut, useSession } from "next-auth/react";
import { Button } from "../ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { useFetchAllFoldersQuery } from "@/store/slices/xray";
import { Folder as FolderType } from "@prisma/client";
import { Typography } from "../ui/typography";
import { useContext } from "react";
import { FolderContext } from "@/contexts/FolderContext";
import { IconButton } from "@radix-ui/themes";
import { Skeleton } from "../ui/skeleton";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  // { href: "/dashboard", label: "Dashboard", icon: "/images/icons/dashboard.svg" },
  { href: "/discover", label: "Discover", icon: "/images/icons/discover.svg" },
  // { href: "/saved-ads", label: "Saved Ads", icon: "/images/icons/saved.svg" },
  { href: "/x-ray", label: "X-Ray", icon: "/images/icons/dashboard.svg" },
  { href: "/writer", label: "Writer", icon: "/images/icons/writer.svg" },
  // { href: "/designer", label: "Designer", icon: "/images/icons/design.svg" },
  // { href: "/performance", label: "Performance", icon: "/images/icons/performance.svg" },
];

function FolderSkeleton() {
  return (
    <div className="flex items-center justify-between space-x-2">
      <Skeleton className="h-6 w-full" />
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const { handleOpenModal } = useContext(FolderContext);

  const { data: folders, isFetching, isLoading } = useFetchAllFoldersQuery();
  return (
    <div className="w-64 h-screen flex flex-col border-r bg-background">
      <div className="p-4">
        <Link href="/" className="flex items-center space-x-2 mb-4">
          <img src="/logo.svg" alt="Ignite Logo" />
          <span className="text-lg font-semibold">Ignite</span>
        </Link>
        <nav className="space-y-2 ">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-2 text-sm rounded-md px-3 py-2 transition-colors",
                pathname === item.href ? "bg-[#F9FAFB] text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Image src={item.icon} alt={item.label} width={16} height={16} className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <Separator className="my-4" />
        <InputWithIcon
          type="text"
          placeholder="Search"
          className="mb-4 "
          icon={<Search className="w-6 h-6 text-muted-foreground" />}
          iconPosition="left"
        />
        <div className="flex justify-between items-center mb-4">
          <Typography variant="title" className="text-xs font-medium">
            Folders
          </Typography>
          <IconButton variant="ghost" onClick={handleOpenModal}>
            <Plus className="w-4 h-4 text-muted-foreground" />
          </IconButton>
        </div>

        {isLoading && (
          <div className="w-full max-w-sm space-y-4">
            <FolderSkeleton />
            <FolderSkeleton />
            <FolderSkeleton />
          </div>
        )}
        <Accordion type="single" collapsible>
          {!isLoading &&
            folders?.map((folder: FolderType, k: number) => {
              return (
                <AccordionItem key={k} value={folder.id} className="border-0">
                  <AccordionTrigger className="hover:no-underline p-2">
                    <div className="flex space-x-2 items-center">
                      <Folder className="h-4 w-4" />
                      <span className="text-sm font-medium">{folder.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>{/* ui pending from client */}</AccordionContent>
                </AccordionItem>
              );
            })}
        </Accordion>
      </div>
      <div className="p-4 mt-auto">
        <Link href="/settings" className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
      <div className="p-4 border-t flex items-center space-x-2">
        <Avatar className="w-8 h-8 rounded-full">
          <AvatarImage src={session?.user?.image!} />
          <AvatarFallback>{session?.user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <p className="text-sm font-medium">{session?.user?.name}</p>
          <p className="text-[10px] text-muted-foreground">{session?.user?.email}</p>
        </div>
        <Button
          size={"icon"}
          variant={"ghost"}
          onClick={() => {
            signOut();
          }}
        >
          <LogOut />
        </Button>
      </div>
    </div>
  );
}
