"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Award,
  Warehouse,
  ShoppingCart,
  Truck,
  Plus,
  Users,
  Percent,
  FileText,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const adminNavSections: {
  label: string;
  items: { label: string; href: string; icon: LucideIcon }[];
}[] = [
  {
    label: "Main",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Sales Metrics", href: "/admin/metrics", icon: BarChart3 },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Categories", href: "/admin/categories", icon: Layers },
      { label: "Brands", href: "/admin/brands", icon: Award },
      { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
       { label: "Deliveries", href: "/admin/deliveries", icon: Truck },
      { label: "Customers", href: "/admin/customers", icon: Users },
    ],
  },
  {
    label: "Marketing",
    items: [{ label: "Discounts", href: "/admin/discounts", icon: Percent }],
  },
  {
    label: "Analytics & Site",
    items: [
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Content", href: "/admin/content", icon: FileText },
    ],
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Sidebar collapsible="icon" variant="inset" className="admin-sidebar">
      <SidebarHeader>
        <span className="text-sm font-semibold tracking-tight">
          Juicify Admin
        </span>
        <Link href="/admin/register-sale" className="mt-3 block w-full">
          <Button variant="default" size="sm" className="w-full justify-start gap-2 text-left">
            <Plus className="size-4 shrink-0" />
            <span>Register a sale</span>
          </Button>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {adminNavSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = mounted && pathname ? isActivePath(pathname, item.href) : false;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

