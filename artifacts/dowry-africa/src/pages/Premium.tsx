import { Navbar } from "@/components/layout/Navbar";
import { useCreateCheckout, useGetPaymentStatus, useCreatePortal } from "@workspace/api-client-react";
import { Check, Shield, Loader2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/api-url";

interface PricingConfig {
  core_price: string;
  core_price_label: string;
  core_name: string;
  core_description: string;
  core_features: string;
  serious_price: string;
  serious_price_label: string;
  serious_name: string;
  serious_description: string;
  serious_features: string;
}

const DEFAULT_PRICING: PricingConfig = {
  core_price: "12.99",
  core_price_label: "$12.99/month",
  core_name: "Core",
  core_description: "For members who are serious about finding a committed partner.",
  core_features: JSON.stringify(["Unlimited profiles", "See who liked you", "Unlimited messaging", "Advanced country filters"]),
  serious_price: "19.99",
  serious_price_label: "$19.99/month",
  serious_name: "Serious Badge",
  serious_description: "For members who want to demonstrate the highest level of intent.",
  serious_features: JSON.stringify(["Everything in Core", "Serious Badge on your profile", "Ranked highest in feeds", "Badge Members pool — connect with other Serious Badge holders"]),
};

function parseFeatures(json: string): string[] {
  try { return JSON.parse(json); } catch { return []; }
}

export default function Premium() {
  const checkoutMutation = useCreateCheckout();
  const portalMutation = useCreatePortal();
  const { data: status, refetch } = useGetPaymentStatus();
  const { toast } = useToast();
  const polled = useRef(false);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/pricing`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPricing(p => ({ ...p, ...data })); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" && !polled.current) {
      polled.current = true;
      const tier = params.get("tier") || "core";
      toast({
        title: "Payment successful!",
        description: `Welcome to ${tier === "badge" ? "Serious Badge" : "Core"}. Your profile is now upgraded.`,
      });
      const poll = setInterval(() => refetch(), 2000);
      setTimeout(() => clearInterval(poll), 10000);
      window.history.replaceState({}, "", "/premium");
    }
  }, []);

  const handlePortal = () => {
    portalMutation.mutate(undefined, {
      onSuccess: (res) => { window.open(res.url, '_blank'); },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    });
  };

  const handleCheckout = (tier: 'core' | 'badge') => {
    checkoutMutation.mutate({ data: { tier } }, {
      onSuccess: (res) => {
        if (res.demo) {
          toast({
            title: "Demo Mode Active",
            description: `Successfully upgraded to ${tier} tier instantly!`,
          });
          refetch();
        } else if (res.url) {
          window.open(res.url, '_blank');
        }
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    });
  };

  const currentTier = status?.tier || 'free';
  const coreFeatures = parseFeatures(pricing.core_features);
  const seriousFeatures = parseFeatures(pricing.serious_features);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 mt-16 text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Invest in your future.</h1>
        <p className="text-xl text-muted-foreground mb-16">
          Dowry.Africa is free for basic usage, but serious commitment requires serious intent. Upgrade to stand out.
        </p>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-6xl grid md:grid-cols-3 gap-8">

        {/* Free Tier */}
        <div className="bg-white rounded-[2rem] p-8 border border-border shadow-sm flex flex-col">
          <div className="mb-8">
            <h3 className="text-2xl font-display font-bold mb-2">Free</h3>
            <p className="text-muted-foreground">$0 / forever</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-green-500 shrink-0" /> 5 profile views per day</li>
            <li className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-green-500 shrink-0" /> Like or pass</li>
            <li className="flex gap-3 text-foreground/50"><XIcon /> See who liked you</li>
            <li className="flex gap-3 text-foreground/50"><XIcon /> Send messages</li>
          </ul>
          <button disabled className="w-full py-4 rounded-xl font-bold bg-secondary text-muted-foreground">
            {currentTier === 'free' ? 'Current Plan' : 'Included'}
          </button>
        </div>

        {/* Core Tier */}
        <div className="bg-white rounded-[2rem] p-8 border-2 border-primary relative shadow-xl transform md:-translate-y-4 flex flex-col">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">MOST POPULAR</div>
          <div className="mb-8">
            <h3 className="text-2xl font-display font-bold mb-2 text-primary">{pricing.core_name}</h3>
            <p className="text-muted-foreground">
              <span className="text-3xl font-bold text-foreground">${pricing.core_price}</span> / month
            </p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            {coreFeatures.map(f => (
              <li key={f} className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-primary shrink-0" /> {f}</li>
            ))}
          </ul>
          <button
            onClick={() => handleCheckout('core')}
            disabled={checkoutMutation.isPending || currentTier === 'core' || currentTier === 'badge'}
            className="w-full py-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {currentTier === 'core' ? 'Current Plan' : `Select ${pricing.core_name}`}
          </button>
        </div>

        {/* Badge Tier */}
        <div className="bg-foreground rounded-[2rem] p-8 border border-gray-800 shadow-2xl flex flex-col text-white">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-yellow-400" />
              <h3 className="text-2xl font-display font-bold">{pricing.serious_name}</h3>
            </div>
            <p className="text-white/70">
              <span className="text-3xl font-bold text-white">${pricing.serious_price}</span> / month
            </p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            {seriousFeatures.map((f, i) => (
              <li key={f} className="flex gap-3 text-white items-start">
                <Check className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                {i === 1
                  ? <span><strong className="text-yellow-400">{pricing.serious_name}</strong> on your profile</span>
                  : <span>{f}</span>
                }
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleCheckout('badge')}
            disabled={checkoutMutation.isPending || currentTier === 'badge'}
            className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-950 shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {checkoutMutation.isPending && currentTier !== 'badge'
              ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              : currentTier === 'badge' ? 'Current Plan' : 'Get The Badge'}
          </button>
        </div>

      </div>

      {/* Manage subscription — only shown for paid users */}
      {currentTier !== 'free' && (
        <div className="container mx-auto px-4 md:px-8 max-w-6xl mt-12 text-center">
          <div className="inline-flex flex-col items-center gap-3 bg-white border border-border rounded-2xl px-8 py-6 shadow-sm">
            <p className="text-muted-foreground text-sm">
              Need to cancel, switch plans, or update your payment method?
            </p>
            <button
              onClick={handlePortal}
              disabled={portalMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {portalMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Settings className="w-4 h-4" />}
              Manage Subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
