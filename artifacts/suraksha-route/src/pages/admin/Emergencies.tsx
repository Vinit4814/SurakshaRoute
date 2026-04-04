import AdminLayout from "@/components/admin-layout";
import { useListEmergencies, useCreateEmergency, useUpdateEmergency, getListEmergenciesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  active: "bg-red-100 text-red-800",
  monitoring: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
};

const emergencyTypes = ["flood", "earthquake", "heavy_rain", "social_unrest", "road_blockage", "curfew", "other"];

export default function AdminEmergencies() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "flood", title: "", description: "", severity: "medium" });
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: emergencies, isLoading } = useListEmergencies(statusFilter !== "all" ? { status: statusFilter as "active" | "resolved" | "monitoring" } : {});
  const { mutate: createEmergency, isPending } = useCreateEmergency({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEmergenciesQueryKey() });
        setOpen(false);
        setForm({ type: "flood", title: "", description: "", severity: "medium" });
      }
    }
  });
  const { mutate: updateEmergency } = useUpdateEmergency({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListEmergenciesQueryKey() }) }
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Emergencies</h1>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary">
                  <Plus className="h-4 w-4 mr-1" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Emergency Alert</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Emergency Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {emergencyTypes.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Title</Label><Input placeholder="e.g. Flash Flood Warning" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div><Label>Description</Label><Textarea placeholder="Describe the emergency..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                  <div>
                    <Label>Severity</Label>
                    <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" disabled={isPending || !form.title} onClick={() => createEmergency({ body: { type: form.type as "flood" | "earthquake" | "heavy_rain" | "social_unrest" | "road_blockage" | "curfew" | "other", title: form.title, severity: form.severity as "low" | "medium" | "high" | "critical", description: form.description || undefined } })}>
                    {isPending ? "Creating..." : "Create Emergency Alert"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : emergencies?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No emergencies found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {emergencies?.map((e) => (
              <Card key={e.id} className={e.status === "active" ? "border-red-200" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{e.title}</p>
                        <Badge className={`text-xs ${severityColors[e.severity] ?? ""}`}>{e.severity}</Badge>
                        <Badge className={`text-xs ${statusColors[e.status] ?? ""}`}>{e.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{e.type.replace(/_/g, " ")} · Zone: {e.zoneName ?? "All zones"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.reportedAt).toLocaleDateString("en-IN")} · {e.affectedWorkers ?? 0} affected workers</p>
                      {e.description && <p className="text-xs text-foreground mt-1 line-clamp-2">{e.description}</p>}
                    </div>
                  </div>
                  {e.status !== "resolved" && (
                    <div className="flex gap-2 mt-3">
                      {e.status === "active" && (
                        <Button size="sm" variant="outline" className="text-xs text-yellow-700" onClick={() => updateEmergency({ emergencyId: e.id, body: { status: "monitoring" } })}>
                          Set Monitoring
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-xs text-green-700" onClick={() => updateEmergency({ emergencyId: e.id, body: { status: "resolved" } })}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
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
