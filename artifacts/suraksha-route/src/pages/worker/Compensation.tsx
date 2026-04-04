import { useParams } from "wouter";
import { useState } from "react";
import WorkerLayout from "@/components/worker-layout";
import { useListCompensationRequests, useCreateCompensationRequest, getListCompensationRequestsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, IndianRupee } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  paid: "bg-blue-100 text-blue-800",
};

const emergencyReasons = [
  "Flood - Unable to access delivery area",
  "Earthquake - Roads damaged",
  "Heavy Rain - Unsafe riding conditions",
  "Social Unrest - Curfew or blockage",
  "Road Blockage - Route closed",
  "Other emergency situation",
];

export default function WorkerCompensation() {
  const { workerId } = useParams();
  const id = parseInt(workerId ?? "1");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ reason: "", daysAffected: "1", description: "" });

  const { data: requests, isLoading } = useListCompensationRequests({ workerId: id });
  const { mutate: createRequest, isPending } = useCreateCompensationRequest({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListCompensationRequestsQueryKey({ workerId: id }) });
        setOpen(false);
        setForm({ reason: "", daysAffected: "1", description: "" });
      }
    }
  });

  return (
    <WorkerLayout workerId={workerId ?? "1"}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Compensation</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary">
                <Plus className="h-4 w-4 mr-1" />
                Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Compensation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Reason</Label>
                  <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {emergencyReasons.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Days Affected</Label>
                  <Input type="number" min="1" max="30" value={form.daysAffected} onChange={(e) => setForm({ ...form, daysAffected: e.target.value })} />
                </div>
                <div>
                  <Label>Additional Details</Label>
                  <Textarea placeholder="Describe what happened..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <p className="text-xs text-muted-foreground bg-secondary p-3 rounded-lg">
                  Compensation will be calculated based on your average daily earnings multiplied by days affected.
                </p>
                <Button
                  className="w-full"
                  disabled={isPending || !form.reason}
                  onClick={() => createRequest({ body: { workerId: id, reason: form.reason, daysAffected: parseInt(form.daysAffected), description: form.description || undefined } })}
                >
                  {isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : requests?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <IndianRupee className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No compensation requests yet</p>
              <p className="text-sm text-muted-foreground mt-1">If an emergency stops you from working, you can request fair compensation</p>
            </CardContent>
          </Card>
        ) : (
          requests?.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{req.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">{req.daysAffected} days · {new Date(req.submittedAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <Badge className={statusColors[req.status] ?? ""}>{req.status}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-secondary rounded p-2">
                    <p className="text-muted-foreground">Requested</p>
                    <p className="font-bold text-sm">₹{Math.round(req.requestedAmount).toLocaleString()}</p>
                  </div>
                  {req.approvedAmount != null && (
                    <div className="bg-green-50 rounded p-2">
                      <p className="text-muted-foreground">Approved</p>
                      <p className="font-bold text-sm text-green-700">₹{Math.round(req.approvedAmount).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {req.adminNotes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{req.adminNotes}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </WorkerLayout>
  );
}
