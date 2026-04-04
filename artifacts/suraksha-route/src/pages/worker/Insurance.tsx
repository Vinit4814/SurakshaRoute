import { useParams } from "wouter";
import { useState } from "react";
import WorkerLayout from "@/components/worker-layout";
import { useCheckInsuranceEligibility, useListInsuranceClaims, useCreateInsuranceClaim, getListInsuranceClaimsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldCheck, CheckCircle2, XCircle, Plus, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  paid: "bg-purple-100 text-purple-800",
};

export default function WorkerInsurance() {
  const { workerId } = useParams();
  const id = parseInt(workerId ?? "1");
  const qc = useQueryClient();
  const [checked, setChecked] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({ claimAmount: "", description: "" });

  const { mutate: checkEligibility, isPending: checking, data: eligibility } = useCheckInsuranceEligibility();
  const { data: claims, isLoading: claimsLoading } = useListInsuranceClaims({ workerId: id });
  const { mutate: createClaim, isPending: claiming } = useCreateInsuranceClaim({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListInsuranceClaimsQueryKey({ workerId: id }) });
        setClaimOpen(false);
        setClaimForm({ claimAmount: "", description: "" });
      }
    }
  });

  return (
    <WorkerLayout workerId={workerId ?? "1"}>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Insurance</h1>

        {/* Eligibility Check */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Check Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!eligibility ? (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Find out if you qualify for insurance coverage based on your work history.</p>
                <Button className="w-full" disabled={checking} onClick={() => { setChecked(true); checkEligibility({ body: { workerId: id } }); }}>
                  {checking ? "Checking..." : "Check My Eligibility"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-xl ${eligibility.eligible ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  {eligibility.eligible ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 shrink-0" />
                  )}
                  <div>
                    <p className={`font-bold text-sm ${eligibility.eligible ? "text-green-800" : "text-red-800"}`}>
                      {eligibility.eligible ? "You are Eligible!" : "Not Yet Eligible"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{eligibility.reason}</p>
                  </div>
                </div>

                {eligibility.eligible && (eligibility.coverageAmount ?? 0) > 0 && (
                  <div className="bg-secondary p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Max Coverage Amount</p>
                    <p className="text-2xl font-bold text-primary">₹{Math.round(eligibility.coverageAmount ?? 0).toLocaleString()}</p>
                  </div>
                )}

                {(eligibility.eligibilityFactors?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">Eligibility Factors:</p>
                    {eligibility.eligibilityFactors?.map((f, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{f}</p>
                    ))}
                  </div>
                )}

                {(eligibility.requiredDocuments?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">Required Documents:</p>
                    {eligibility.requiredDocuments?.map((d, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3 text-muted-foreground" />{d}</p>
                    ))}
                  </div>
                )}

                <Button variant="outline" size="sm" className="w-full" onClick={() => checkEligibility({ body: { workerId: id } })}>
                  Re-check
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claims */}
        <div className="flex items-center justify-between">
          <p className="font-semibold">My Claims</p>
          <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary">
                <Plus className="h-4 w-4 mr-1" />
                New Claim
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Insurance Claim</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Claim Amount (₹)</Label>
                  <Input type="number" placeholder="e.g. 5000" value={claimForm.claimAmount} onChange={(e) => setClaimForm({ ...claimForm, claimAmount: e.target.value })} />
                </div>
                <div>
                  <Label>Reason for Claim</Label>
                  <Textarea placeholder="Describe the incident and why you need this claim..." value={claimForm.description} onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })} rows={4} />
                </div>
                <Button
                  className="w-full"
                  disabled={claiming || !claimForm.claimAmount || !claimForm.description}
                  onClick={() => createClaim({ body: { workerId: id, claimAmount: parseFloat(claimForm.claimAmount), description: claimForm.description } })}
                >
                  {claiming ? "Submitting..." : "Submit Claim"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {claimsLoading ? (
          [1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : claims?.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground text-sm">No insurance claims yet</p>
            </CardContent>
          </Card>
        ) : (
          claims?.map((claim) => (
            <Card key={claim.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm line-clamp-2">{claim.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(claim.submittedAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <Badge className={statusColors[claim.status] ?? ""}>{claim.status}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-secondary p-2 rounded">
                    <p className="text-muted-foreground">Claimed</p>
                    <p className="font-bold">₹{claim.claimAmount.toLocaleString()}</p>
                  </div>
                  {claim.approvedAmount != null && (
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-muted-foreground">Approved</p>
                      <p className="font-bold text-green-700">₹{claim.approvedAmount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </WorkerLayout>
  );
}
