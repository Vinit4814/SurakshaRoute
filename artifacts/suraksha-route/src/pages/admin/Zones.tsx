import AdminLayout from "@/components/admin-layout";
import { useListZones, useUpdateZone, useCreateZone, getListZonesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Map, Plus, Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const riskColors: Record<string, string> = {
  safe: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const riskBg: Record<string, string> = {
  safe: "border-l-green-500",
  moderate: "border-l-yellow-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500",
};

export default function AdminZones() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newZone, setNewZone] = useState({ name: "", city: "" });
  const [editScores, setEditScores] = useState<Record<number, number>>({});

  const { data: zones, isLoading } = useListZones();
  const { mutate: updateZone } = useUpdateZone({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListZonesQueryKey() }) }
  });
  const { mutate: createZone, isPending } = useCreateZone({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListZonesQueryKey() });
        setOpen(false);
        setNewZone({ name: "", city: "" });
      }
    }
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Zone Management</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary">
                <Plus className="h-4 w-4 mr-1" />
                Add Zone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Zone</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Zone Name</Label><Input placeholder="e.g. Central Mumbai" value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} /></div>
                <div><Label>City</Label><Input placeholder="e.g. Mumbai" value={newZone.city} onChange={(e) => setNewZone({ ...newZone, city: e.target.value })} /></div>
                <Button className="w-full" disabled={isPending || !newZone.name || !newZone.city} onClick={() => createZone({ body: { name: newZone.name, city: newZone.city } })}>
                  {isPending ? "Creating..." : "Create Zone"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          <div className="space-y-4">
            {zones?.map((z) => {
              const score = editScores[z.id] ?? z.riskScore;
              return (
                <Card key={z.id} className={`border-l-4 ${riskBg[z.riskLevel] ?? ""}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{z.name}</p>
                        <p className="text-xs text-muted-foreground">{z.city ?? ""} · {z.workerCount ?? 0} workers · {z.activeEmergencies ?? 0} emergencies</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {z.isBlocked && <Badge className="bg-red-100 text-red-800">Blocked</Badge>}
                        <Badge className={riskColors[z.riskLevel] ?? ""}>{z.riskLevel}</Badge>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Risk Score</span>
                        <span className="font-bold">{score}/100</span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[score]}
                        onValueChange={([v]) => setEditScores({ ...editScores, [z.id]: v })}
                        className="w-full"
                      />
                    </div>

                    <div className="flex gap-2">
                      {score !== z.riskScore && (
                        <Button size="sm" className="flex-1 text-xs bg-primary" onClick={() => updateZone({ zoneId: z.id, body: { riskScore: score } })}>
                          Update Score
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className={`flex-1 text-xs ${z.isBlocked ? "text-green-700" : "text-red-700"}`}
                        onClick={() => updateZone({ zoneId: z.id, body: { isBlocked: !z.isBlocked } })}
                      >
                        {z.isBlocked ? <><Unlock className="h-3 w-3 mr-1" />Unblock</> : <><Lock className="h-3 w-3 mr-1" />Block Zone</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
