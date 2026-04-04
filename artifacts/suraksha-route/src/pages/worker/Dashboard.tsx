import { useParams, Link } from "wouter";
import WorkerLayout from "@/components/worker-layout";
import { useGetWorkerDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, IndianRupee, FileText, ShieldAlert, HeartHandshake, ShieldCheck, MessageSquare, Bell, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const riskColors: Record<string, string> = {
  safe: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

export default function WorkerDashboard() {
  const { workerId } = useParams();
  const id = parseInt(workerId ?? "1");
  const { data, isLoading } = useGetWorkerDashboard(id);

  if (isLoading) {
    return (
      <WorkerLayout workerId={workerId ?? "1"}>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </WorkerLayout>
    );
  }

  const worker = data?.worker;
  const summary = data?.earningsSummary;
  const zoneStatus = data?.zoneStatus ?? "safe";

  return (
    <WorkerLayout workerId={workerId ?? "1"}>
      <div className="space-y-4">
        {/* Welcome */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Welcome, {worker?.name ?? "Worker"}</h1>
          <p className="text-muted-foreground text-sm">{worker?.vehicleType} · Zone: {worker?.zoneName ?? "N/A"}</p>
        </div>

        {/* Zone Risk Alert */}
        {(zoneStatus === "high" || zoneStatus === "critical") && (
          <div className={`p-4 rounded-xl border-l-4 ${zoneStatus === "critical" ? "bg-red-50 border-red-500" : "bg-orange-50 border-orange-500"}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${zoneStatus === "critical" ? "text-red-600" : "text-orange-600"}`} />
              <p className={`font-semibold text-sm ${zoneStatus === "critical" ? "text-red-800" : "text-orange-800"}`}>
                {zoneStatus === "critical" ? "CRITICAL ZONE - Stay Safe!" : "High Risk Zone - Exercise Caution"}
              </p>
            </div>
            <p className="text-xs mt-1 text-muted-foreground">{data?.activeEmergenciesInZone ?? 0} active emergencies in your zone</p>
          </div>
        )}

        {/* SOS Button */}
        <Link href={`/worker/${workerId}/safety-alert`}>
          <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white text-lg font-bold py-6 rounded-2xl shadow-lg flex items-center gap-3">
            <ShieldAlert className="h-7 w-7" />
            EMERGENCY SOS
          </Button>
        </Link>

        {/* Earnings Summary */}
        <Card className="border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              Earnings Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Today's Average</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{Math.round(summary?.averageDailyEarning ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">
                  ₹{Math.round(summary?.earningsThisMonth ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Deliveries</p>
                <p className="text-lg font-semibold">{(summary?.totalDeliveries ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Days Worked</p>
                <p className="text-lg font-semibold">{summary?.totalDaysWorked ?? 0}</p>
              </div>
            </div>
            <Link href={`/worker/${workerId}/earnings`}>
              <Button variant="outline" size="sm" className="mt-3 w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Full Earnings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/worker/${workerId}/compensation`}>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-sm font-medium">Compensation</p>
                {(data?.pendingCompensations ?? 0) > 0 && (
                  <Badge variant="secondary" className="text-xs">{data?.pendingCompensations} pending</Badge>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href={`/worker/${workerId}/accidents`}>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <HeartHandshake className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-sm font-medium">Report Accident</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/worker/${workerId}/insurance`}>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium">Insurance</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/worker/${workerId}/complaints`}>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium">Raise Complaint</p>
                {(data?.openComplaints ?? 0) > 0 && (
                  <Badge variant="secondary" className="text-xs">{data?.openComplaints} open</Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Notifications */}
        {(data?.recentNotifications?.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Recent Alerts
                </span>
                <Link href={`/worker/${workerId}/notifications`}>
                  <Button variant="ghost" size="sm" className="text-xs text-primary">View All</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data?.recentNotifications?.slice(0, 3).map((n) => (
                <div key={n.id} className={`text-sm p-2 rounded-lg ${n.read ? "bg-secondary" : "bg-orange-50 border border-orange-100"}`}>
                  <p className="font-medium text-xs">{n.title}</p>
                  <p className="text-muted-foreground text-xs line-clamp-1">{n.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </WorkerLayout>
  );
}
