import { useParams, Link } from "wouter";
import { useState } from "react";
import WorkerLayout from "@/components/worker-layout";
import { useGetWorkerEarnings, useGetWorkerEarningsSummary, useAddEarning } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { IndianRupee, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetWorkerEarningsQueryKey, getGetWorkerEarningsSummaryQueryKey } from "@workspace/api-client-react";

export default function WorkerEarnings() {
  const { workerId } = useParams();
  const id = parseInt(workerId ?? "1");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], amount: "", deliveries: "", hoursWorked: "" });

  const { data: earnings, isLoading: el } = useGetWorkerEarnings(id);
  const { data: summary, isLoading: sl } = useGetWorkerEarningsSummary(id);
  const { mutate: addEarning, isPending } = useAddEarning({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetWorkerEarningsQueryKey(id) });
        qc.invalidateQueries({ queryKey: getGetWorkerEarningsSummaryQueryKey(id) });
        setOpen(false);
        setForm({ date: new Date().toISOString().split("T")[0], amount: "", deliveries: "", hoursWorked: "" });
      }
    }
  });

  const chartData = (earnings ?? []).slice(0, 14).reverse().map((e) => ({
    date: new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    amount: e.amount,
  }));

  return (
    <WorkerLayout workerId={workerId ?? "1"}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Earnings</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Earning Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input type="number" placeholder="e.g. 850" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <Label>Number of Deliveries</Label>
                  <Input type="number" placeholder="e.g. 12" value={form.deliveries} onChange={(e) => setForm({ ...form, deliveries: e.target.value })} />
                </div>
                <div>
                  <Label>Hours Worked</Label>
                  <Input type="number" placeholder="e.g. 8" value={form.hoursWorked} onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })} />
                </div>
                <Button
                  className="w-full"
                  disabled={isPending || !form.amount || !form.deliveries}
                  onClick={() => addEarning({ workerId: id, body: { date: form.date, amount: parseFloat(form.amount), deliveries: parseInt(form.deliveries), hoursWorked: form.hoursWorked ? parseFloat(form.hoursWorked) : undefined } })}
                >
                  {isPending ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        {sl ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4">
                <p className="text-xs opacity-80">Daily Average</p>
                <p className="text-2xl font-bold">₹{Math.round(summary?.averageDailyEarning ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">₹{Math.round(summary?.earningsThisMonth ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-600" /> Highest Day</p>
                <p className="text-xl font-bold text-green-700">₹{Math.round(summary?.highestEarningDay ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3 text-red-500" /> Lowest Day</p>
                <p className="text-xl font-bold text-red-600">₹{Math.round(summary?.lowestEarningDay ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Last 14 Days</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="earningGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`₹${v}`, "Earned"]} />
                  <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2} fill="url(#earningGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Earnings List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {el ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : earnings?.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No earnings recorded yet. Tap Add to start.</p>
            ) : (
              earnings?.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{new Date(e.date).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}</p>
                    <p className="text-xs text-muted-foreground">{e.deliveries} deliveries{e.hoursWorked ? ` · ${e.hoursWorked}h` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">₹{e.amount.toLocaleString()}</p>
                    {e.deliveries > 0 && <p className="text-xs text-muted-foreground">₹{Math.round(e.amount / e.deliveries)}/del</p>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </WorkerLayout>
  );
}
