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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

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
    label: "Attendance",
    icon: CalendarCheck,
    href: "/attendance",
    color: "text-pink-700",
  },
  {
    label: "Departments",
    icon: Building,
    href: "/departments",
    color: "text-indigo-500",
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
  // Mount state to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // The auth controller sends "roles", not "roleIds"
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
    if (route.label === "Users") {
      // Hide users route if role is Employee
      return role !== "Employee";
    }
    if (route.label === "Departments") {
      // Only Admin can see departments
      return role === "Admin";
    }
    return true;
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white transition-colors duration-200">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <h1 className="text-2xl font-bold">ICMS</h1>
        </Link>
        <div className="space-y-1">
          {filteredRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-lg transition-colors duration-200",
                "hover:text-gray-900 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-white/10",
                pathname === route.href
                  ? "text-gray-900 bg-gray-200 dark:text-white dark:bg-white/10"
                  : "text-gray-500 dark:text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2 space-y-2">
        <Button
          onClick={toggleTheme}
          variant="ghost"
          className="w-full justify-start text-gray-500 dark:text-zinc-400 hover:text-gray-900 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-white/10"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 mr-3" />
          ) : (
            <Moon className="h-5 w-5 mr-3" />
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>

        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-500 dark:text-zinc-400 hover:text-gray-900 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-white/10"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
