import { Link, useLocation } from "wouter";
import { Shield, LayoutDashboard, Users, Map, AlertTriangle, FileText, HeartHandshake, ShieldCheck, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: `/admin/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/admin/workers`, label: "Workers", icon: Users },
    { href: `/admin/zones`, label: "Zones", icon: Map },
    { href: `/admin/emergencies`, label: "Emergencies", icon: AlertTriangle },
    { href: `/admin/compensation`, label: "Compensation", icon: FileText },
    { href: `/admin/accidents`, label: "Accidents", icon: HeartHandshake },
    { href: `/admin/insurance`, label: "Insurance", icon: ShieldCheck },
    { href: `/admin/complaints`, label: "Complaints", icon: MessageSquare },
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-[100dvh] sticky top-0">
        <div className="p-6 border-b border-sidebar-border/50">
          <Link href="/admin/dashboard" className="flex items-center gap-3 font-bold text-xl text-sidebar-primary">
            <Shield className="h-8 w-8 text-primary" />
            <span>Suraksha Admin</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors", 
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-sidebar text-sidebar-foreground p-4 sticky top-0 z-50 flex items-center justify-between border-b border-sidebar-border">
          <Link href={`/admin/dashboard`} className="flex items-center gap-2 font-bold text-lg">
            <Shield className="h-6 w-6 text-primary" />
            <span>Suraksha Admin</span>
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>

        {/* Mobile Nav */}
        <nav className="md:hidden bg-card border-t border-border fixed bottom-0 w-full z-50 px-2 py-2 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max pb-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap", isActive ? "text-primary bg-primary/10 border border-primary/20" : "text-muted-foreground bg-secondary")}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}