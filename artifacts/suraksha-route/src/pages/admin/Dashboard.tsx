import AdminLayout from "@/components/admin-layout";
import { useGetDashboardSummary, useGetRecentActivity, useGetZoneRiskOverview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, AlertTriangle, Map, FileText, HeartHandshake, ShieldCheck, MessageSquare, Bell, Shield, TrendingUp } from "lucide-react";

const severityColors: Record<string, string> = {
  info: "bg-blue-100 text-blue-800 border-blue-200",
  warning: "bg-orange-100 text-orange-800 border-orange-200",
  danger: "bg-red-100 text-red-800 border-red-200",
  success: "bg-green-100 text-green-800 border-green-200",
};

const riskColors: Record<string, string> = {
  safe: "text-green-700 bg-green-100",
  moderate: "text-yellow-700 bg-yellow-100",
  high: "text-orange-700 bg-orange-100",
  critical: "text-red-700 bg-red-100",
};

export default function AdminDashboard() {
  const { data: summary, isLoading: sl } = useGetDashboardSummary();
  const { data: activity, isLoading: al } = useGetRecentActivity();
  const { data: zones, isLoading: zl } = useGetZoneRiskOverview();

  const stats = [
    { label: "Total Workers", value: summary?.totalWorkers ?? 0, sub: `${summary?.activeWorkers ?? 0} active`, icon: Users, color: "text-blue-600 bg-blue-100" },
    { label: "Active Emergencies", value: summary?.activeEmergencies ?? 0, sub: `${summary?.criticalZones ?? 0} critical zones`, icon: AlertTriangle, color: "text-red-600 bg-red-100" },
    { label: "Blocked Zones", value: summary?.blockedZones ?? 0, sub: "Routes restricted", icon: Map, color: "text-orange-600 bg-orange-100" },
    { label: "Pending Compensation", value: summary?.pendingCompensations ?? 0, sub: "Awaiting review", icon: FileText, color: "text-purple-600 bg-purple-100" },
    { label: "Open Accidents", value: summary?.openAccidents ?? 0, sub: "Needs attention", icon: HeartHandshake, color: "text-rose-600 bg-rose-100" },
    { label: "Pending Insurance", value: summary?.pendingInsuranceClaims ?? 0, sub: "Under review", icon: ShieldCheck, color: "text-indigo-600 bg-indigo-100" },
    { label: "Open Complaints", value: summary?.pendingComplaints ?? 0, sub: "To resolve", icon: MessageSquare, color: "text-amber-600 bg-amber-100" },
    { label: "Recent Safety Alerts", value: summary?.recentSafetyAlerts ?? 0, sub: "Last 24 hours", icon: Bell, color: "text-green-600 bg-green-100" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Suraksha Route Operations Overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sl ? (
            Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : (
            stats.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${s.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs font-medium text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Zone Risk Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Map className="h-4 w-4 text-primary" />
                Zone Risk Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {zl ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : zones?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No zones configured</p>
              ) : (
                zones?.map((z) => (
                  <div key={z.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                    <div>
                      <p className="font-medium text-sm">{z.name}</p>
                      <p className="text-xs text-muted-foreground">{z.workerCount} workers · {z.activeEmergencies} emergencies</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {z.isBlocked && <Badge className="bg-red-100 text-red-800 text-xs">Blocked</Badge>}
                      <Badge className={`text-xs ${riskColors[z.riskLevel] ?? ""}`}>{z.riskLevel}</Badge>
                      <span className="text-sm font-bold text-muted-foreground">{z.riskScore}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {al ? (
                [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : activity?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                activity?.slice(0, 8).map((item) => (
                  <div key={item.id} className={`flex items-start gap-2 p-2 rounded-lg border ${severityColors[item.severity] ?? ""}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs">{item.title}</p>
                      <p className="text-xs opacity-80 line-clamp-1">{item.description}</p>
                    </div>
                    <p className="text-xs opacity-60 shrink-0">{new Date(item.timestamp).toLocaleDateString("en-IN")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
