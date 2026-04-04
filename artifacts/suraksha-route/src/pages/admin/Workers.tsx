import AdminLayout from "@/components/admin-layout";
import { useListWorkers, useUpdateWorker, getListWorkersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, IndianRupee, Package } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-600",
  suspended: "bg-red-100 text-red-800",
};

export default function AdminWorkers() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const qc = useQueryClient();

  const { data: workers, isLoading } = useListWorkers(statusFilter ? { status: statusFilter as "active" | "inactive" | "suspended" } : {});
  const { mutate: updateWorker } = useUpdateWorker({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListWorkersQueryKey() });
      }
    }
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Workers</h1>
          <Select value={statusFilter ?? "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : workers?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No workers found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {workers?.map((w) => (
              <Card key={w.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.phone} · {w.vehicleType}</p>
                      <p className="text-xs text-muted-foreground">Zone: {w.zoneName ?? "Unassigned"}</p>
                    </div>
                    <Badge className={statusColors[w.status] ?? ""}>{w.status}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-secondary p-2 rounded">
                      <p className="text-muted-foreground">Daily Avg</p>
                      <p className="font-bold text-primary">₹{Math.round(w.averageDailyEarning ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-secondary p-2 rounded">
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-bold">₹{Math.round(w.totalEarnings ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-secondary p-2 rounded">
                      <p className="text-muted-foreground">Deliveries</p>
                      <p className="font-bold">{(w.totalDeliveries ?? 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {w.status !== "active" && (
                      <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => updateWorker({ workerId: w.id, body: { status: "active" } })}>
                        Activate
                      </Button>
                    )}
                    {w.status === "active" && (
                      <Button size="sm" variant="outline" className="flex-1 text-xs text-orange-600" onClick={() => updateWorker({ workerId: w.id, body: { status: "inactive" } })}>
                        Deactivate
                      </Button>
                    )}
                    {w.status !== "suspended" && (
                      <Button size="sm" variant="outline" className="flex-1 text-xs text-red-600" onClick={() => updateWorker({ workerId: w.id, body: { status: "suspended" } })}>
                        Suspend
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
