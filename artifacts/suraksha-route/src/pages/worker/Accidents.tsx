import { useParams } from "wouter";
import { useState } from "react";
import WorkerLayout from "@/components/worker-layout";
import { useListAccidents, useReportAccident, getListAccidentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartHandshake, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const severityColors: Record<string, string> = {
  minor: "bg-yellow-100 text-yellow-800",
  moderate: "bg-orange-100 text-orange-800",
  severe: "bg-red-100 text-red-800",
  critical: "bg-red-200 text-red-900 font-bold",
};

const statusColors: Record<string, string> = {
  reported: "bg-blue-100 text-blue-800",
  investigating: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

export default function WorkerAccidents() {
  const { workerId } = useParams();
  const id = parseInt(workerId ?? "1");
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ description: "", location: "", severity: "minor" as "minor" | "moderate" | "severe" | "critical", injuryType: "" });

  const { data: accidents, isLoading } = useListAccidents({ workerId: id });
  const { mutate: reportAccident, isPending, isSuccess, data: newAccident, reset } = useReportAccident({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAccidentsQueryKey({ workerId: id }) });
      }
    }
  });

  if (isSuccess && newAccident) {
    return (
      <WorkerLayout workerId={workerId ?? "1"}>
        <div className="space-y-4">
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Accident Reported</h2>
            <p className="text-muted-foreground text-sm">Your report has been filed. Stay safe.</p>
          </div>
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle className="text-base text-orange-700">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{newAccident.nextStep}</p>
            </CardContent>
          </Card>
          <Button className="w-full" variant="outline" onClick={() => { reset(); setStep(0); setForm({ description: "", location: "", severity: "minor", injuryType: "" }); }}>
            Report Another
          </Button>
        </div>
      </WorkerLayout>
    );
  }

  return (
    <WorkerLayout workerId={workerId ?? "1"}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Accident Support</h1>

        {step === 0 && (
          <div className="space-y-4">
            <Card className="border-red-100 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800 text-sm">Had an Accident?</p>
                    <p className="text-xs text-red-700 mt-1">We'll guide you through reporting and getting help. This report will be reviewed immediately.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div>
                <Label>What happened? *</Label>
                <Textarea
                  placeholder="Describe the accident in detail..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                />
              </div>
              <Button className="w-full" disabled={!form.description} onClick={() => setStep(1)}>
                Next: Severity and Location
              </Button>
            </div>

            {/* Past Accidents */}
            {(accidents?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Past Reports</p>
                {isLoading ? (
                  [1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : (
                  accidents?.map((a) => (
                    <Card key={a.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm line-clamp-1">{a.description}</p>
                            <p className="text-xs text-muted-foreground">{new Date(a.reportedAt).toLocaleDateString("en-IN")}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Badge className={severityColors[a.severity] ?? ""}>{a.severity}</Badge>
                            <Badge className={statusColors[a.status] ?? ""}>{a.status}</Badge>
                          </div>
                        </div>
                        {a.nextStep && <p className="text-xs text-primary mt-2">{a.nextStep}</p>}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(0)}>Back</Button>
              <p className="text-sm font-semibold text-muted-foreground">Step 2: Details</p>
            </div>
            <div>
              <Label>Severity *</Label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v as "minor" | "moderate" | "severe" | "critical" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor (small scrape, no medical help needed)</SelectItem>
                  <SelectItem value="moderate">Moderate (needs medical attention)</SelectItem>
                  <SelectItem value="severe">Severe (hospital required)</SelectItem>
                  <SelectItem value="critical">Critical (emergency services needed)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input placeholder="e.g. MG Road, near HDFC ATM" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label>Type of Injury</Label>
              <Input placeholder="e.g. knee injury, fractured arm" value={form.injuryType} onChange={(e) => setForm({ ...form, injuryType: e.target.value })} />
            </div>
            <Button
              className="w-full"
              disabled={isPending}
              onClick={() => reportAccident({ body: { workerId: id, description: form.description, severity: form.severity, location: form.location || undefined, injuryType: form.injuryType || undefined } })}
            >
              {isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        )}
      </div>
    </WorkerLayout>
  );
}
