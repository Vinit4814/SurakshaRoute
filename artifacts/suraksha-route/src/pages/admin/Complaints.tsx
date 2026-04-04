import AdminLayout from "@/components/admin-layout";
import { useListComplaints, useUpdateComplaint, getListComplaintsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  investigating: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  dismissed: "bg-gray-100 text-gray-600",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export default function AdminComplaints() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [resolution, setResolution] = useState("");

  const { data: complaints, isLoading } = useListComplaints(statusFilter !== "all" ? { status: statusFilter as "open" | "investigating" | "resolved" | "dismissed" } : {});
  const selectedComplaint = complaints?.find((c) => c.id === selected);

  const { mutate: updateComplaint, isPending } = useUpdateComplaint({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListComplaintsQueryKey() });
        setSelected(null);
        setNotes("");
        setResolution("");
      }
    }
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Complaints</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : complaints?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No complaints found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints?.map((c) => (
              <Card key={c.id} className={c.priority === "urgent" ? "border-red-200" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{c.workerName ?? "Worker #" + c.workerId}</p>
                        <Badge className={`text-xs ${priorityColors[c.priority] ?? ""}`}>{c.priority}</Badge>
                        <Badge className={`text-xs ${statusColors[c.status] ?? ""}`}>{c.status}</Badge>
                      </div>
                      <p className="text-xs text-primary font-medium mt-1">{c.subject}</p>
                      <p className="text-xs text-muted-foreground">{c.type.replace(/_/g, " ")} · {new Date(c.submittedAt).toLocaleDateString("en-IN")}</p>
                      <p className="text-xs text-foreground mt-1 line-clamp-2">{c.description}</p>
                    </div>
                  </div>

                  {c.resolution && (
                    <div className="bg-green-50 border border-green-100 rounded p-2 mt-2">
                      <p className="text-xs text-green-800">{c.resolution}</p>
                    </div>
                  )}

                  {(c.status === "open" || c.status === "investigating") && (
                    <div className="flex gap-2 mt-3">
                      {c.status === "open" && (
                        <Button size="sm" variant="outline" className="text-xs text-yellow-700" onClick={() => updateComplaint({ complaintId: c.id, body: { status: "investigating" } })}>
                          Investigate
                        </Button>
                      )}
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => setSelected(c.id)}>
                        Resolve
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs text-gray-600" onClick={() => updateComplaint({ complaintId: c.id, body: { status: "dismissed" } })}>
                        Dismiss
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Complaint</DialogTitle>
            </DialogHeader>
            {selectedComplaint && (
              <div className="space-y-4">
                <div className="bg-secondary p-3 rounded text-sm">
                  <p><span className="text-muted-foreground">Worker:</span> {selectedComplaint.workerName}</p>
                  <p><span className="text-muted-foreground">Subject:</span> {selectedComplaint.subject}</p>
                  <p className="mt-1 text-muted-foreground text-xs">{selectedComplaint.description}</p>
                </div>
                <div><Label>Resolution</Label><Textarea placeholder="Describe how this is being resolved..." value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} /></div>
                <div><Label>Admin Notes (internal)</Label><Textarea placeholder="Internal notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isPending || !resolution}
                  onClick={() => updateComplaint({ complaintId: selectedComplaint.id, body: { status: "resolved", resolution, adminNotes: notes || undefined } })}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Mark as Resolved
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
