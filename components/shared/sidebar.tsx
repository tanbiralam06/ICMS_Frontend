"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Briefcase,
  ClipboardList,
  LogOut,
  Settings,
  Building,
  Moon,
  Sun,
  Building2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Users",
    icon: Users,
    href: "/users",
    color: "text-violet-500",
  },
  {
    label: "Departments",
    icon: Building,
    href: "/departments",
    color: "text-indigo-500",
  },
  {
    label: "Attendance",
    icon: CalendarCheck,
    href: "/attendance",
    color: "text-pink-700",
  },
  {
    label: "Leaves",
    icon: Briefcase,
    href: "/leaves",
    color: "text-orange-700",
  },
  {
    label: "Tasks",
    icon: ClipboardList,
    href: "/tasks",
    color: "text-emerald-500",
  },
  {
    label: "Invoices",
    icon: FileText,
    href: "/invoices",
    color: "text-green-600",
  },
  {
    label: "Company Profile",
    icon: Building2, // Using slightly different icon if available, or stay with Building
    href: "/company",
    color: "text-blue-600",
  },
  {
    label: "My Profile",
    icon: Settings,
    href: "/profile",
    color: "text-gray-500",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userRoles = user.roles || [];
        setRole(userRoles[0]);
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const filteredRoutes = routes.filter((route) => {
    if (route.label === "Users") return role !== "Employee";
    if (route.label === "Departments") return role === "Admin";
    if (route.label === "Company Profile") return role === "Admin";
    if (route.label === "Invoices")
      return role === "Admin" || role === "Manager";
    return true;
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-200">
      {/* Brand Header */}
      <div className="px-6 h-16 flex items-center mb-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            I
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            ICMS
          </h1>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-none">
        {filteredRoutes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                isActive
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              )}
            >
              <route.icon
                className={cn(
                  "h-4 w-4 mr-3 transition-colors",
                  isActive
                    ? route.color
                    : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                )}
              />
              {route.label}
              {isActive && (
                <div className="ml-auto w-1 h-3 rounded-full bg-blue-500" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer / Settings */}
      <div className="p-3 mt-auto space-y-2">
        <Separator className="bg-slate-200 dark:bg-slate-800 mb-2" />

        <Button
          onClick={toggleTheme}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 h-9 px-3"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 mr-3" />
          ) : (
            <Moon className="h-4 w-4 mr-3" />
          )}
          <span className="text-xs font-medium">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </Button>

        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 h-9 px-3"
        >
          <LogOut className="h-4 w-4 mr-3" />
          <span className="text-xs font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
}
