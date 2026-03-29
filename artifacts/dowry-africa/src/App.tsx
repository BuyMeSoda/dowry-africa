import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { WaitlistProvider } from "@/contexts/WaitlistContext";
import { useEffect } from "react";

// Pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Onboarding from "@/pages/Onboarding";
import Discover from "@/pages/Discover";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Premium from "@/pages/Premium";
import Apply from "@/pages/Apply";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminWaitlist from "@/pages/admin/AdminWaitlist";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSubscriptions from "@/pages/admin/AdminSubscriptions";
import AdminActivity from "@/pages/admin/AdminActivity";
import AdminModeration from "@/pages/admin/AdminModeration";
import AdminSettings from "@/pages/admin/AdminSettings";

import { API_BASE } from "@/lib/api-url";

// Global Fetch Interceptor for JWT token.
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem('da_token');
  if (token && typeof input === 'string') {
    const isRelativeApi = input.startsWith('/api');
    const isAbsoluteApi = API_BASE !== "" && input.startsWith(`${API_BASE}/api`);
    if (isRelativeApi || isAbsoluteApi) {
      init = init || {};
      init.headers = {
        ...init.headers,
        Authorization: `Bearer ${token}`
      };
    }
  }
  return originalFetch(input, init);
};

// Protected Route Wrapper
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) {
    return <div className="h-screen flex items-center justify-center text-primary">Loading...</div>;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/apply" component={Apply} />

      {/* Admin routes — use their own auth */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/waitlist" component={AdminWaitlist} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/subscriptions" component={AdminSubscriptions} />
      <Route path="/admin/activity" component={AdminActivity} />
      <Route path="/admin/moderation" component={AdminModeration} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin" component={AdminDashboard} />

      {/* Protected Routes */}
      <Route path="/onboarding">
        {() => <ProtectedRoute component={Onboarding} />}
      </Route>
      <Route path="/discover">
        {() => <ProtectedRoute component={Discover} />}
      </Route>
      <Route path="/messages">
        {() => <ProtectedRoute component={Messages} />}
      </Route>
      <Route path="/messages/:id">
        {() => <ProtectedRoute component={Messages} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route path="/premium">
        {() => <ProtectedRoute component={Premium} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <WaitlistProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </WaitlistProvider>
    </AuthProvider>
  );
}

export default App;
