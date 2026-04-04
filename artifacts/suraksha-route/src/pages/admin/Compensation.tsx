import AdminLayout from "@/components/admin-layout";
import { useListCompensationRequests, useUpdateCompensationRequest, getListCompensationRequestsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, CheckCircle2, XCircle, IndianRupee } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  paid: "bg-blue-100 text-blue-800",
};

export default function AdminCompensation() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [approveAmount, setApproveAmount] = useState("");
  const [notes, setNotes] = useState("");

  const { data: requests, isLoading } = useListCompensationRequests(statusFilter !== "all" ? { status: statusFilter as "pending" | "approved" | "rejected" | "paid" } : {});
  const selectedReq = requests?.find((r) => r.id === selected);

  const { mutate: updateRequest, isPending } = useUpdateCompensationRequest({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListCompensationRequestsQueryKey() });
        setSelected(null);
        setApproveAmount("");
        setNotes("");
      }
    }
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Compensation Requests</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : requests?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No compensation requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests?.map((r) => (
              <Card key={r.id} className={r.status === "pending" ? "border-orange-200" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{r.workerName ?? "Worker #" + r.workerId}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">{r.daysAffected} days · Submitted {new Date(r.submittedAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <Badge className={statusColors[r.status] ?? ""}>{r.status}</Badge>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="bg-secondary rounded p-2 text-xs">
                      <p className="text-muted-foreground">Requested</p>
                      <p className="font-bold text-sm">₹{Math.round(r.requestedAmount).toLocaleString()}</p>
                    </div>
                    {r.approvedAmount != null && (
                      <div className="bg-green-50 rounded p-2 text-xs">
                        <p className="text-muted-foreground">Approved</p>
                        <p className="font-bold text-sm text-green-700">₹{Math.round(r.approvedAmount).toLocaleString()}</p>
                      </div>
                    )}
                    <div className="bg-secondary rounded p-2 text-xs">
                      <p className="text-muted-foreground">Daily Avg</p>
                      <p className="font-bold text-sm">₹{Math.round(r.averageDailyEarning ?? 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {r.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1" onClick={() => { setSelected(r.id); setApproveAmount(String(Math.round(r.requestedAmount))); }}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </div>
                  )}
                  {r.adminNotes && <p className="text-xs text-muted-foreground mt-2 italic">{r.adminNotes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Compensation Request</DialogTitle>
            </DialogHeader>
            {selectedReq && (
              <div className="space-y-4">
                <div className="bg-secondary p-3 rounded-lg text-sm">
                  <p><span className="text-muted-foreground">Worker:</span> {selectedReq.workerName}</p>
                  <p><span className="text-muted-foreground">Reason:</span> {selectedReq.reason}</p>
                  <p><span className="text-muted-foreground">Days:</span> {selectedReq.daysAffected}</p>
                  <p><span className="text-muted-foreground">Requested:</span> ₹{Math.round(selectedReq.requestedAmount).toLocaleString()}</p>
                  <p><span className="text-muted-foreground">Daily Average:</span> ₹{Math.round(selectedReq.averageDailyEarning ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Approved Amount (₹)</Label>
                  <Input type="number" value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)} />
                </div>
                <div>
                  <Label>Admin Notes</Label>
                  <Textarea placeholder="Add notes for the worker..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={isPending || !approveAmount}
                    onClick={() => updateRequest({ requestId: selectedReq.id, body: { status: "approved", approvedAmount: parseFloat(approveAmount), adminNotes: notes || undefined } })}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200"
                    disabled={isPending}
                    onClick={() => updateRequest({ requestId: selectedReq.id, body: { status: "rejected", adminNotes: notes || undefined } })}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
