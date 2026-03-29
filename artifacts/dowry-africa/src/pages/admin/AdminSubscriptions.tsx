import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "@/lib/admin";
import { DollarSign, Users, TrendingUp } from "lucide-react";

interface SubData {
  tiers: { free: number; core: number; badge: number };
  mrr: number; coreMrr: number; badgeMrr: number;
}

export default function AdminSubscriptions() {
  const [data, setData] = useState<SubData | null>(null);

  useEffect(() => {
    adminFetch("/subscriptions").then(r => r.json()).then(setData);
  }, []);

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-white text-2xl font-bold mb-2">Subscriptions</h1>
        <p className="text-gray-400 text-sm mb-8">Revenue and subscription breakdown</p>

        {data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-gray-400 text-sm">Monthly Revenue (MRR)</p>
                  <div className="p-2 rounded-xl bg-amber-500/10"><DollarSign className="w-4 h-4 text-amber-400" /></div>
                </div>
                <p className="text-white text-3xl font-bold">${data.mrr}</p>
                <p className="text-gray-500 text-xs mt-1">Estimated from active subscriptions</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-gray-400 text-sm">Paid Subscribers</p>
                  <div className="p-2 rounded-xl bg-blue-500/10"><Users className="w-4 h-4 text-blue-400" /></div>
                </div>
                <p className="text-white text-3xl font-bold">{data.tiers.core + data.tiers.badge}</p>
                <p className="text-gray-500 text-xs mt-1">{data.tiers.core} Core + {data.tiers.badge} Badge</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-gray-400 text-sm">Free Members</p>
                  <div className="p-2 rounded-xl bg-green-500/10"><TrendingUp className="w-4 h-4 text-green-400" /></div>
                </div>
                <p className="text-white text-3xl font-bold">{data.tiers.free}</p>
                <p className="text-gray-500 text-xs mt-1">Conversion opportunity</p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-white font-bold">Tier Breakdown</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {[
                  { label: "Free", count: data.tiers.free, price: 0, mrr: 0, color: "bg-gray-500" },
                  { label: "Core ($7/mo)", count: data.tiers.core, price: 7, mrr: data.coreMrr, color: "bg-blue-500" },
                  { label: "Serious Badge ($15/mo)", count: data.tiers.badge, price: 15, mrr: data.badgeMrr, color: "bg-amber-500" },
                ].map(tier => (
                  <div key={tier.label} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                      <div>
                        <p className="text-white font-medium">{tier.label}</p>
                        <p className="text-gray-400 text-sm">{tier.count} members</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">${tier.mrr}/mo</p>
                      <p className="text-gray-500 text-xs">{tier.price === 0 ? "Free tier" : `$${tier.price} × ${tier.count}`}</p>
                    </div>
                  </div>
                ))}
                <div className="p-6 flex items-center justify-between bg-gray-800/30">
                  <p className="text-white font-bold">Total MRR</p>
                  <p className="text-amber-400 font-bold text-xl">${data.mrr}/mo</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 animate-pulse h-32" />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
