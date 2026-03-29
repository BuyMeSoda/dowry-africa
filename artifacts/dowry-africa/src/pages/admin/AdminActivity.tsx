import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "@/lib/admin";
import { Heart, MessageSquare, Globe } from "lucide-react";

interface ActivityData {
  likes: { today: number; week: number; allTime: number };
  messages: { today: number; week: number; allTime: number };
  matches: { allTime: number };
  topUsers: { id: string; name: string; email: string; msg_count: number }[];
  geoBreakdown: { country: string; count: number }[];
}

function MetricRow({ label, today, week, allTime, icon: Icon, color }: {
  label: string; today: number; week: number; allTime: number; icon: any; color: string;
}) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className={`inline-flex p-2.5 rounded-xl mb-4 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-gray-400 text-sm font-medium mb-3">{label}</p>
      <div className="grid grid-cols-3 gap-3">
        {[["Today", today], ["This Week", week], ["All Time", allTime]].map(([l, v]) => (
          <div key={String(l)}>
            <p className="text-white text-xl font-bold">{v}</p>
            <p className="text-gray-500 text-xs">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminActivity() {
  const [data, setData] = useState<ActivityData | null>(null);

  useEffect(() => {
    adminFetch("/activity").then(r => r.json()).then(setData);
  }, []);

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-white text-2xl font-bold mb-2">Activity</h1>
        <p className="text-gray-400 text-sm mb-8">Matches, messages, and engagement</p>

        {data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <MetricRow label="Likes Given" today={data.likes.today} week={data.likes.week} allTime={data.likes.allTime} icon={Heart} color="bg-rose-500/10 text-rose-400" />
              <MetricRow label="Messages Sent" today={data.messages.today} week={data.messages.week} allTime={data.messages.allTime} icon={MessageSquare} color="bg-blue-500/10 text-blue-400" />
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <div className="inline-flex p-2.5 rounded-xl mb-4 bg-green-500/10 text-green-400">
                  <Heart className="w-5 h-5" />
                </div>
                <p className="text-gray-400 text-sm font-medium mb-3">Mutual Matches</p>
                <p className="text-white text-3xl font-bold">{data.matches.allTime}</p>
                <p className="text-gray-500 text-xs mt-1">All time</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Users */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                  <h2 className="text-white font-bold">Most Active Members</h2>
                  <p className="text-gray-400 text-xs mt-1">By messages sent</p>
                </div>
                <div className="divide-y divide-gray-800">
                  {data.topUsers.slice(0, 10).map((u, i) => (
                    <div key={u.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-sm w-5">{i + 1}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{u.name}</p>
                          <p className="text-gray-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                      <span className="text-amber-400 font-medium text-sm">{u.msg_count} msgs</span>
                    </div>
                  ))}
                  {data.topUsers.length === 0 && (
                    <div className="p-6 text-gray-500 text-sm text-center">No activity yet</div>
                  )}
                </div>
              </div>

              {/* Geo Breakdown */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <h2 className="text-white font-bold">Geographic Breakdown</h2>
                </div>
                <div className="divide-y divide-gray-800">
                  {data.geoBreakdown.slice(0, 15).map(g => (
                    <div key={g.country} className="p-4 flex items-center justify-between">
                      <p className="text-gray-300 text-sm">{g.country}</p>
                      <span className="text-white font-medium text-sm">{g.count}</span>
                    </div>
                  ))}
                  {data.geoBreakdown.length === 0 && (
                    <div className="p-6 text-gray-500 text-sm text-center">No location data yet</div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 h-40" />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
