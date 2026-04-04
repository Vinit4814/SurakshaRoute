import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import WorkerDashboard from "@/pages/worker/Dashboard";
import WorkerEarnings from "@/pages/worker/Earnings";
import SafetyAlertPage from "@/pages/worker/SafetyAlert";
import WorkerCompensation from "@/pages/worker/Compensation";
import WorkerAccidents from "@/pages/worker/Accidents";
import WorkerInsurance from "@/pages/worker/Insurance";
import WorkerComplaints from "@/pages/worker/Complaints";
import WorkerNotifications from "@/pages/worker/Notifications";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminWorkers from "@/pages/admin/Workers";
import AdminZones from "@/pages/admin/Zones";
import AdminEmergencies from "@/pages/admin/Emergencies";
import AdminCompensation from "@/pages/admin/Compensation";
import AdminAccidents from "@/pages/admin/Accidents";
import AdminInsurance from "@/pages/admin/Insurance";
import AdminComplaints from "@/pages/admin/Complaints";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/worker/:workerId/dashboard" component={WorkerDashboard} />
      <Route path="/worker/:workerId/earnings" component={WorkerEarnings} />
      <Route path="/worker/:workerId/safety-alert" component={SafetyAlertPage} />
      <Route path="/worker/:workerId/compensation" component={WorkerCompensation} />
      <Route path="/worker/:workerId/accidents" component={WorkerAccidents} />
      <Route path="/worker/:workerId/insurance" component={WorkerInsurance} />
      <Route path="/worker/:workerId/complaints" component={WorkerComplaints} />
      <Route path="/worker/:workerId/notifications" component={WorkerNotifications} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/workers" component={AdminWorkers} />
      <Route path="/admin/zones" component={AdminZones} />
      <Route path="/admin/emergencies" component={AdminEmergencies} />
      <Route path="/admin/compensation" component={AdminCompensation} />
      <Route path="/admin/accidents" component={AdminAccidents} />
      <Route path="/admin/insurance" component={AdminInsurance} />
      <Route path="/admin/complaints" component={AdminComplaints} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
