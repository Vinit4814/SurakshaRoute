import { useParams } from "wouter";
import WorkerLayout from "@/components/worker-layout";
import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, AlertTriangle, IndianRupee, ShieldCheck, MessageSquare, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const typeIcons: Record<string, React.ElementType> = {
  emergency_alert: AlertTriangle,
  payment_update: IndianRupee,
  compensation_update: IndianRupee,
  complaint_update: MessageSquare,
  safety_warning: AlertTriangle,
  insurance_update: ShieldCheck,
  general: Info,
};

const typeColors: Record<string, string> = {
  emergency_alert: "text-red-600",
  payment_update: "text-green-600",
  compensation_update: "text-orange-600",
  complaint_update: "text-purple-600",
  safety_warning: "text-orange-600",
  insurance_update: "text-blue-600",
  general: "text-slate-600",
};

export default function WorkerNotifications() {
  const { workerId } = useParams();
  const id = parseInt(workerId ?? "1");
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useListNotifications({ workerId: id });
  const { mutate: markRead } = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListNotificationsQueryKey({ workerId: id }) });
      }
    }
  });

  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <WorkerLayout workerId={workerId ?? "1"}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unread > 0 && <Badge className="bg-primary text-primary-foreground">{unread} unread</Badge>}
        </div>

        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : notifications?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications?.map((n) => {
              const Icon = typeIcons[n.type] ?? Info;
              const colorClass = typeColors[n.type] ?? "text-slate-600";
              return (
                <Card key={n.id} className={n.read ? "" : "border-orange-200 bg-orange-50/30"}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-medium text-sm ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                          {!n.read && (
                            <Button variant="ghost" size="sm" className="text-xs shrink-0 text-primary h-6 px-2" onClick={() => markRead({ notificationId: n.id })}>
                              Mark read
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </WorkerLayout>
  );
}
