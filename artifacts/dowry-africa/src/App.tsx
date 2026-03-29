import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
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

// Global Fetch Interceptor for JWT token
const _apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem('da_token');
  if (token && typeof input === 'string') {
    const isRelativeApi = input.startsWith('/api');
    const isAbsoluteApi = _apiBase !== "" && input.startsWith(`${_apiBase}/api`);
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
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
