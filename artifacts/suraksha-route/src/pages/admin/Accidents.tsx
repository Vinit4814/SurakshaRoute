import AdminLayout from "@/components/admin-layout";
import { useListAccidents, useUpdateAccident, getListAccidentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartHandshake, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const severityColors: Record<string, string> = {
  minor: "bg-yellow-100 text-yellow-800",
  moderate: "bg-orange-100 text-orange-800",
  severe: "bg-red-100 text-red-800",
  critical: "bg-red-200 text-red-900",
};

const statusColors: Record<string, string> = {
  reported: "bg-blue-100 text-blue-800",
  investigating: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

export default function AdminAccidents() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: accidents, isLoading } = useListAccidents(statusFilter !== "all" ? { status: statusFilter as "reported" | "investigating" | "resolved" | "closed" } : {});
  const { mutate: updateAccident } = useUpdateAccident({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListAccidentsQueryKey() }) }
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Accident Reports</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="reported">Reported</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : accidents?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HeartHandshake className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No accident reports</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {accidents?.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{a.workerName ?? "Worker #" + a.workerId}</p>
                        <Badge className={`text-xs ${severityColors[a.severity] ?? ""}`}>{a.severity}</Badge>
                        <Badge className={`text-xs ${statusColors[a.status] ?? ""}`}>{a.status}</Badge>
                      </div>
                      <p className="text-xs text-foreground mt-1 line-clamp-2">{a.description}</p>
                      {a.location && <p className="text-xs text-muted-foreground mt-0.5">Location: {a.location}</p>}
                      <p className="text-xs text-muted-foreground">{new Date(a.reportedAt).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>

                  {a.nextStep && (
                    <div className="bg-orange-50 border border-orange-100 rounded p-2 mt-2">
                      <p className="text-xs text-orange-800">{a.nextStep}</p>
                    </div>
                  )}

                  {a.status !== "closed" && (
                    <div className="flex gap-2 mt-3">
                      {a.status === "reported" && (
                        <Button size="sm" variant="outline" className="text-xs text-yellow-700" onClick={() => updateAccident({ accidentId: a.id, body: { status: "investigating" } })}>
                          Start Investigation
                        </Button>
                      )}
                      {a.status === "investigating" && (
                        <Button size="sm" variant="outline" className="text-xs text-green-700" onClick={() => updateAccident({ accidentId: a.id, body: { status: "resolved" } })}>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Mark Resolved
                        </Button>
                      )}
                      {a.status === "resolved" && (
                        <Button size="sm" variant="outline" className="text-xs text-gray-600" onClick={() => updateAccident({ accidentId: a.id, body: { status: "closed" } })}>
                          Close
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
