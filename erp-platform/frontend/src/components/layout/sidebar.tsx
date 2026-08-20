"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  ScrollText,
  DollarSign,
  Bell,
  Settings,
  School,
  ChevronLeft,
  Library,
  Building,
  Bus,
  Target,
  BarChart3,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin", "Principal", "Faculty", "Student", "HOD"],
  },
{
    title: "Institutions",
    href: "/institutions",
    icon: <Building2 className="h-4 w-4" />,
    roles: ["SuperAdmin"],
  },
  {
    title: "My Institution",
    href: "/institution/my",
    icon: <Building2 className="h-4 w-4" />,
    roles: ["CollegeAdmin"],
  },
  {
    title: "Analytics",
    href: "/superadmin/analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    roles: ["SuperAdmin"],
  },
  {
    title: "College Credentials",
    href: "/superadmin/colleges",
    icon: <KeyRound className="h-4 w-4" />,
    roles: ["SuperAdmin"],
  },
  {
    title: "Academic",
    href: "/academic",
    icon: <BookOpen className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin", "Principal", "HOD"],
  },
  {
    title: "Students",
    href: "/students",
    icon: <GraduationCap className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin", "Principal", "Faculty", "HOD"],
  },
  {
    title: "Staff",
    href: "/staff",
    icon: <Users className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin", "Principal", "HOD"],
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: <ClipboardCheck className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin", "Principal", "Faculty", "HOD"],
  },
  {
    title: "Results",
    href: "/results",
    icon: <ScrollText className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin", "Principal", "Faculty", "Student"],
  },
  {
    title: "Fees",
    href: "/fees",
    icon: <DollarSign className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin", "Accountant"],
  },
  {
    title: "Library",
    href: "/library",
    icon: <Library className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin", "Principal", "Librarian"],
  },
  {
    title: "Hostel",
    href: "/hostel",
    icon: <Building className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin", "HostelWarden"],
  },
  {
    title: "Transport",
    href: "/transport",
    icon: <Bus className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin", "TransportManager"],
  },
  {
    title: "Placement",
    href: "/placement",
    icon: <Target className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin", "PlacementOfficer"],
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: <Bell className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin", "Principal", "Faculty", "Student"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
    roles: ["SuperAdmin", "CollegeAdmin"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div
      className={cn(
        "relative flex flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2">
            <School className="h-6 w-6 text-primary" />
            <span className="font-bold">ERP Platform</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <School className="h-6 w-6 text-primary mx-auto" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-8 w-8", collapsed && "mx-auto")}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.title : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {!collapsed && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-semibold text-primary">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="grid gap-0.5 text-sm">
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

