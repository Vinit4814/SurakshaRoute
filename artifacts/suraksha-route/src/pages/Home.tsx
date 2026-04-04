import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-4 bg-orange-100 text-orange-600 rounded-full mb-4">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-800">Suraksha Route</h1>
          <p className="text-slate-500 text-lg">Delivery Worker Safety & Income Protection</p>
        </div>

        <div className="grid gap-6 mt-12">
          <Card className="border-orange-200 shadow-sm hover:border-orange-400 transition-colors">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-orange-500" />
                I'm a Delivery Worker
              </CardTitle>
              <CardDescription>
                Access your safety dashboard, check alerts, or request compensation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/worker/1/dashboard">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium" size="lg">
                  Worker Login
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Admin Panel</CardTitle>
              <CardDescription>
                Manage zones, emergencies, and worker compensation requests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/dashboard">
                <Button variant="outline" className="w-full text-slate-700" size="lg">
                  Admin Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}