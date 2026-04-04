import { useParams } from "wouter";
import { useState } from "react";
import WorkerLayout from "@/components/worker-layout";
import { useListComplaints, useCreateComplaint, getListComplaintsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus } from "lucide-react";
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

const complaintTypes = [
  { value: "unfair_deduction", label: "Unfair Deduction" },
  { value: "forced_unsafe_work", label: "Forced to Work Unsafely" },
  { value: "harassment", label: "Harassment" },
  { value: "payment_delay", label: "Payment Delay" },
  { value: "other", label: "Other" },
];

export default function WorkerComplaints() {
  const { workerId } = useParams();
  const id = parseInt(workerId ?? "1");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "", subject: "", description: "", priority: "medium" });

  const { data: complaints, isLoading } = useListComplaints({ workerId: id });
  const { mutate: createComplaint, isPending } = useCreateComplaint({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListComplaintsQueryKey({ workerId: id }) });
        setOpen(false);
        setForm({ type: "", subject: "", description: "", priority: "medium" });
      }
    }
  });

  return (
    <WorkerLayout workerId={workerId ?? "1"}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Complaints</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary">
                <Plus className="h-4 w-4 mr-1" />
                Raise
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Raise a Complaint</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type of Complaint *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {complaintTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject *</Label>
                  <Input placeholder="Brief summary of the issue" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div>
                  <Label>Describe the Problem *</Label>
                  <Textarea placeholder="Please explain what happened in detail..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={isPending || !form.type || !form.subject || !form.description}
                  onClick={() => createComplaint({ body: { workerId: id, type: form.type as "unfair_deduction" | "forced_unsafe_work" | "harassment" | "payment_delay" | "other", subject: form.subject, description: form.description, priority: form.priority as "low" | "medium" | "high" | "urgent" } })}
                >
                  {isPending ? "Submitting..." : "Submit Complaint"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : complaints?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No complaints raised</p>
              <p className="text-sm text-muted-foreground mt-1">Your rights matter. Report unfair deductions or unsafe conditions.</p>
            </CardContent>
          </Card>
        ) : (
          complaints?.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{c.subject}</p>
                    <p className="text-xs text-muted-foreground">{c.type.replace(/_/g, " ")} · {new Date(c.submittedAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Badge className={statusColors[c.status] ?? ""}>{c.status}</Badge>
                    <Badge className={priorityColors[c.priority] ?? ""}>{c.priority}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                {c.resolution && (
                  <div className="bg-green-50 border border-green-100 rounded p-2">
                    <p className="text-xs text-green-800">{c.resolution}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </WorkerLayout>
  );
}
