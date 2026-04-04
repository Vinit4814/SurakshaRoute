import { useParams } from "wouter";
import { useState } from "react";
import WorkerLayout from "@/components/worker-layout";
import { useSendSafetyAlert, useGetWorkerSafetyAlerts, getGetWorkerSafetyAlertsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, Radio, Car, HeartPulse, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const alertTypes = [
  { type: "sos", label: "SOS Emergency", icon: ShieldAlert, color: "bg-red-600 hover:bg-red-700 text-white" },
  { type: "unsafe_route", label: "Unsafe Route", icon: AlertTriangle, color: "bg-orange-500 hover:bg-orange-600 text-white" },
  { type: "accident", label: "Accident", icon: Car, color: "bg-amber-600 hover:bg-amber-700 text-white" },
  { type: "medical", label: "Medical Help", icon: HeartPulse, color: "bg-pink-600 hover:bg-pink-700 text-white" },
  { type: "other", label: "Other", icon: Radio, color: "bg-slate-600 hover:bg-slate-700 text-white" },
] as const;

const statusColors: Record<string, string> = {
  active: "bg-red-100 text-red-800",
  acknowledged: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
};

export default function SafetyAlertPage() {
  const { workerId } = useParams();
  const id = parseInt(workerId ?? "1");
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>("sos");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const { data: alerts, isLoading } = useGetWorkerSafetyAlerts(id);
  const { mutate: sendAlert, isPending } = useSendSafetyAlert({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetWorkerSafetyAlertsQueryKey(id) });
        setSent(true);
        setMessage("");
        setTimeout(() => setSent(false), 4000);
      }
    }
  });

  return (
    <WorkerLayout workerId={workerId ?? "1"}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Safety Alert</h1>
          <p className="text-sm text-muted-foreground">Send an emergency signal to your support team immediately</p>
        </div>

        {sent && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium text-center">
            Alert sent successfully! Help is on the way.
          </div>
        )}

        {/* Alert Type Selection */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Select Alert Type</p>
          <div className="grid grid-cols-1 gap-2">
            {alertTypes.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex items-center gap-3 p-4 rounded-xl font-medium transition-all ${
                  selectedType === type
                    ? color + " ring-2 ring-offset-2 ring-orange-400 scale-[1.01]"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Additional Information (optional)</p>
          <Textarea
            placeholder="Describe your situation briefly..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-card"
            rows={3}
          />
        </div>

        {/* Send Button */}
        <Button
          size="lg"
          className="w-full bg-red-600 hover:bg-red-700 text-white text-lg font-bold py-6 rounded-2xl"
          disabled={isPending}
          onClick={() => sendAlert({ workerId: id, body: { alertType: selectedType as "sos" | "unsafe_route" | "accident" | "medical" | "other", message: message || undefined } })}
        >
          {isPending ? "Sending Alert..." : "SEND EMERGENCY ALERT"}
        </Button>

        {/* Past Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Past Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {isLoading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : alerts?.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No alerts sent yet</p>
            ) : (
              alerts?.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <p className="text-sm font-medium capitalize">{a.alertType.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <Badge className={statusColors[a.status] ?? ""}>{a.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </WorkerLayout>
  );
}
