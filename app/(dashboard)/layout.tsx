import { Sidebar } from "@/components/shared/sidebar";
import { MobileSidebar } from "@/components/shared/mobile-sidebar";
import { ThemeProvider } from "@/components/theme-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80]">
        <Sidebar />
      </div>
      <main className="md:pl-64 h-full">
        <div className="md:hidden print:hidden p-4 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center shadow-sm sticky top-0 z-50">
          <MobileSidebar />
          <span className="font-bold text-lg text-slate-800 dark:text-slate-100 ml-2">
            ICMS
          </span>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
