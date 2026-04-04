import AdminLayout from "@/components/admin-layout";
import { useListInsuranceClaims, useUpdateInsuranceClaim, getListInsuranceClaimsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  paid: "bg-purple-100 text-purple-800",
};

export default function AdminInsurance() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [approveAmount, setApproveAmount] = useState("");
  const [notes, setNotes] = useState("");

  const { data: claims, isLoading } = useListInsuranceClaims(statusFilter !== "all" ? { status: statusFilter as "submitted" | "reviewing" | "approved" | "rejected" | "paid" } : {});
  const selectedClaim = claims?.find((c) => c.id === selected);

  const { mutate: updateClaim, isPending } = useUpdateInsuranceClaim({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListInsuranceClaimsQueryKey() });
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
          <h1 className="text-2xl font-bold">Insurance Claims</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : claims?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No insurance claims</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {claims?.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{c.workerName ?? "Worker #" + c.workerId}</p>
                        <Badge className={statusColors[c.status] ?? ""}>{c.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(c.submittedAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Claim</p>
                      <p className="font-bold text-primary">₹{c.claimAmount.toLocaleString()}</p>
                      {c.approvedAmount != null && <p className="text-xs text-green-700 font-bold">Approved: ₹{c.approvedAmount.toLocaleString()}</p>}
                    </div>
                  </div>

                  {(c.status === "submitted" || c.status === "reviewing") && (
                    <div className="flex gap-2 mt-3">
                      {c.status === "submitted" && (
                        <Button size="sm" variant="outline" className="text-xs text-yellow-700" onClick={() => updateClaim({ claimId: c.id, body: { status: "reviewing" } })}>
                          Start Review
                        </Button>
                      )}
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => { setSelected(c.id); setApproveAmount(String(c.claimAmount)); }}>
                        Decide
                      </Button>
                    </div>
                  )}

                  {c.status === "approved" && (
                    <Button size="sm" variant="outline" className="mt-2 text-xs text-purple-700" onClick={() => updateClaim({ claimId: c.id, body: { status: "paid" } })}>
                      Mark Paid
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Insurance Claim</DialogTitle>
            </DialogHeader>
            {selectedClaim && (
              <div className="space-y-4">
                <div className="bg-secondary p-3 rounded text-sm">
                  <p><span className="text-muted-foreground">Worker:</span> {selectedClaim.workerName}</p>
                  <p><span className="text-muted-foreground">Claim:</span> ₹{selectedClaim.claimAmount.toLocaleString()}</p>
                  <p className="mt-1 text-muted-foreground text-xs">{selectedClaim.description}</p>
                </div>
                <div><Label>Approved Amount (₹)</Label><Input type="number" value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)} /></div>
                <div><Label>Notes</Label><Textarea placeholder="Admin notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
                <div className="flex gap-3">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={isPending} onClick={() => updateClaim({ claimId: selectedClaim.id, body: { status: "approved", approvedAmount: parseFloat(approveAmount), adminNotes: notes || undefined } })}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />Approve
                  </Button>
                  <Button variant="outline" className="flex-1 text-red-600" disabled={isPending} onClick={() => updateClaim({ claimId: selectedClaim.id, body: { status: "rejected", adminNotes: notes || undefined } })}>
                    <XCircle className="h-4 w-4 mr-1" />Reject
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
