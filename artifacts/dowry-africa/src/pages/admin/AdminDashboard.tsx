import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "@/lib/admin";
import { Users, ListChecks, CreditCard, MessageSquare, Heart, TrendingUp, UserCheck, DollarSign } from "lucide-react";

interface DashboardData {
  totalUsers: number;
  totalWaitlist: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeSubscriptions: { core: number; badge: number; total: number };
  mrr: number;
  totalMessages: number;
  totalMatches: number;
  waitlistConversionRate: number;
}

function Stat({ label, value, icon: Icon, sub, color = "amber" }: {
  label: string; value: string | number; icon: any; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    amber: "text-amber-400 bg-amber-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-green-400 bg-green-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    rose: "text-rose-400 bg-rose-500/10",
  };
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-start justify-between mb-4">
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-white text-3xl font-bold">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/dashboard")
      .then(r => r.json())
      .then(setData)
      .catch(() => setError("Failed to load dashboard data"));
  }, []);

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-white text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400 text-sm mb-8">Platform overview at a glance</p>

        {error && <p className="text-red-400 mb-6">{error}</p>}

        {data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <Stat label="Total Users" value={data.totalUsers} icon={Users} sub={`+${data.newUsersToday} today · +${data.newUsersThisWeek} this week`} color="blue" />
              <Stat label="Waitlist Applicants" value={data.totalWaitlist} icon={ListChecks} sub={`${data.waitlistConversionRate}% converted to members`} color="purple" />
              <Stat label="Active Subscriptions" value={data.activeSubscriptions.total} icon={UserCheck} sub={`${data.activeSubscriptions.core} Core · ${data.activeSubscriptions.badge} Badge`} color="green" />
              <Stat label="Monthly Revenue" value={`$${data.mrr}`} icon={DollarSign} sub="Estimated MRR" color="amber" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Stat label="Total Matches" value={data.totalMatches} icon={Heart} color="rose" />
              <Stat label="Total Messages" value={data.totalMessages} icon={MessageSquare} color="blue" />
              <Stat label="Waitlist → Member Rate" value={`${data.waitlistConversionRate}%`} icon={TrendingUp} color="green" />
            </div>
          </>
        ) : (
          !error && (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 animate-pulse h-32" />
              ))}
            </div>
          )
        )}
      </div>
    </AdminLayout>
  );
}
