import { Link, useLocation } from "wouter";
import { Shield, Home, IndianRupee, AlertTriangle, FileText, HeartHandshake, ShieldCheck, MessageSquare, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkerLayoutProps {
  children: React.ReactNode;
  workerId: string;
}

export default function WorkerLayout({ children, workerId }: WorkerLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: `/worker/${workerId}/dashboard`, label: "Home", icon: Home },
    { href: `/worker/${workerId}/earnings`, label: "Earnings", icon: IndianRupee },
    { href: `/worker/${workerId}/compensation`, label: "Comp.", icon: FileText },
    { href: `/worker/${workerId}/accidents`, label: "Accidents", icon: HeartHandshake },
    { href: `/worker/${workerId}/insurance`, label: "Insurance", icon: ShieldCheck },
    { href: `/worker/${workerId}/complaints`, label: "Complaints", icon: MessageSquare },
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-border/50">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <Link href={`/worker/${workerId}/dashboard`} className="flex items-center gap-2 font-bold text-lg">
          <Shield className="h-6 w-6" />
          <span>Suraksha</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href={`/worker/${workerId}/notifications`} className="relative">
            <Bell className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-primary">
              2
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {children}
      </main>

      <nav className="bg-card border-t border-border fixed bottom-0 w-full max-w-md mx-auto z-50 px-2 py-2">
        <div className="flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center p-2 text-xs font-medium rounded-lg transition-colors min-w-[3.5rem]", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary")}>
                <Icon className="h-5 w-5 mb-1" />
                <span className="truncate max-w-[4rem] text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}