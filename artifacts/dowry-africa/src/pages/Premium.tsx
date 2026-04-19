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
  core_description: "Where real conversations begin.",
  core_features: JSON.stringify([
    "Talk without limits",
    "Know who's serious about you",
    "Browse without restrictions",
    "Filter by country and values",
  ]),
  serious_price: "19.99",
  serious_price_label: "$19.99/month",
  serious_name: "Serious Badge",
  serious_description: "For people serious about commitment.",
  serious_features: JSON.stringify([
    "Everything in Core",
    "Serious Badge displayed on your profile",
    "Seen first by serious members",
    "Connect only with verified serious members",
  ]),
};

const YEARLY_CORE_PRICE = "9.99";
const YEARLY_BADGE_PRICE = "15.99";

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
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

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
      const stopPoll = setTimeout(() => clearInterval(poll), 10000);
      window.history.replaceState({}, "", "/premium");
      return () => { clearInterval(poll); clearTimeout(stopPoll); };
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

  const CORE_SUBTITLE = "Where real conversations begin.";
  const CORE_FEATURES = [
    "Talk without limits",
    "Know who's serious about you",
    "Browse without restrictions",
    "Filter by country and values",
  ];
  const BADGE_SUBTITLE = "For people serious about commitment.";
  const BADGE_FEATURES = [
    "Everything in Core",
    "Serious Badge displayed on your profile",
    "Seen first by serious members",
    "Connect only with verified serious members",
  ];

  const displayedCorePrice = billing === 'yearly' ? YEARLY_CORE_PRICE : pricing.core_price;
  const displayedBadgePrice = billing === 'yearly' ? YEARLY_BADGE_PRICE : pricing.serious_price;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 mt-16 text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          Find someone who is actually ready.
        </h1>
        <p className="text-xl text-muted-foreground mb-10">
          Dowry.Africa is built for people serious about commitment. Upgrade to show up that way.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 bg-secondary rounded-full p-1 mb-14">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              billing === 'monthly'
                ? 'bg-[#B5264E] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              billing === 'yearly'
                ? 'bg-[#B5264E] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly <span className={billing === 'yearly' ? 'text-white/80' : 'text-[#B5264E]'}>· Save 20%</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-6xl grid md:grid-cols-3 gap-8">

        {/* Free Tier */}
        <div className="bg-white rounded-[2rem] p-8 border border-border shadow-sm flex flex-col">
          <div className="mb-8">
            <h3 className="text-2xl font-display font-bold mb-2">Free</h3>
            <p className="text-muted-foreground">$0 / forever</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-green-500 shrink-0" /> Browse profiles</li>
            <li className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-green-500 shrink-0" /> Like or pass</li>
            <li className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-green-500 shrink-0" /> Receive messages</li>
            <li className="flex gap-3 text-foreground/40"><XIcon /> Send messages</li>
            <li className="flex gap-3 text-foreground/40"><XIcon /> See who liked you</li>
          </ul>
          <button disabled className="w-full py-4 rounded-xl font-bold bg-secondary text-muted-foreground">
            {currentTier === 'free' ? 'Current Plan' : 'Included'}
          </button>
        </div>

        {/* Core Tier */}
        <div className="bg-white rounded-[2rem] p-8 border-2 border-[#B5264E] relative shadow-xl transform md:-translate-y-4 flex flex-col">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#B5264E] text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">MOST POPULAR</div>
          <div className="mb-2">
            <h3 className="text-2xl font-display font-bold mb-1 text-[#B5264E]">Core</h3>
            <p className="text-sm text-muted-foreground mb-3 italic">{CORE_SUBTITLE}</p>
            <p className="text-muted-foreground">
              <span className="text-3xl font-bold text-foreground">${displayedCorePrice}</span>
              <span className="text-sm"> / month</span>
              {billing === 'yearly' && <span className="block text-xs text-muted-foreground mt-0.5">billed annually</span>}
            </p>
          </div>
          <ul className="space-y-4 mb-8 flex-1 mt-6">
            {CORE_FEATURES.map(f => (
              <li key={f} className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-[#B5264E] shrink-0" /> {f}</li>
            ))}
          </ul>
          <button
            onClick={() => handleCheckout('core')}
            disabled={checkoutMutation.isPending || currentTier === 'core'}
            className="w-full py-4 rounded-xl font-bold bg-[#B5264E] text-white shadow-lg shadow-[#B5264E]/30 hover:bg-[#9e1f42] hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:hover:translate-y-0 disabled:hover:shadow-lg disabled:cursor-not-allowed"
          >
            {checkoutMutation.isPending && currentTier !== 'core'
              ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              : currentTier === 'core' ? 'Current Plan' : 'Select Core'}
          </button>
        </div>

        {/* Badge Tier */}
        <div className="bg-foreground rounded-[2rem] p-8 border border-gray-800 shadow-2xl flex flex-col text-white">
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-6 h-6 text-yellow-400" />
              <h3 className="text-2xl font-display font-bold">Serious Badge</h3>
            </div>
            <p className="text-sm text-white/50 mb-3 italic">{BADGE_SUBTITLE}</p>
            <p className="text-white/70">
              <span className="text-3xl font-bold text-white">${displayedBadgePrice}</span>
              <span className="text-sm"> / month</span>
              {billing === 'yearly' && <span className="block text-xs text-white/50 mt-0.5">billed annually</span>}
            </p>
          </div>
          <ul className="space-y-4 mt-6 mb-4 flex-1">
            {BADGE_FEATURES.map((f, i) => (
              <li key={f} className="flex gap-3 text-white items-start">
                <Check className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                {i === 1
                  ? <span><strong className="text-yellow-400">Serious Badge</strong> displayed on your profile</span>
                  : <span>{f}</span>
                }
              </li>
            ))}
          </ul>
          <p className="text-white/30 text-sm italic mb-6">Not for games.</p>
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-foreground/30">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
