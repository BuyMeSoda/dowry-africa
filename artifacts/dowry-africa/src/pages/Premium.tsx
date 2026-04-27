import { Navbar } from "@/components/layout/Navbar";
import {
  useCreateCheckout,
  useCreatePortal,
  usePaymentStatusFull,
  useSubmitUpgradeInterest,
  useGetUpgradeInterestCount,
} from "@workspace/api-client-react";
import { Check, Shield, Loader2, Settings, Heart, Sparkles } from "lucide-react";
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
  core_price_yearly: string;
  core_price_label_yearly: string;
  serious_price_yearly: string;
  serious_price_label_yearly: string;
}

const DEFAULT_PRICING: PricingConfig = {
  core_price: "12.99",
  core_price_label: "$12.99/month",
  core_price_yearly: "9.99",
  core_price_label_yearly: "$9.99/month billed annually",
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
  serious_price_yearly: "15.99",
  serious_price_label_yearly: "$15.99/month billed annually",
  serious_name: "Serious Badge",
  serious_description: "For people serious about commitment.",
  serious_features: JSON.stringify([
    "Everything in Core",
    "Serious Badge displayed on your profile",
    "Seen first by serious members",
    "Connect only with verified serious members",
  ]),
};

export default function Premium() {
  const checkoutMutation = useCreateCheckout();
  const portalMutation = useCreatePortal();
  const upgradeInterestMutation = useSubmitUpgradeInterest();
  const { data: status, refetch } = usePaymentStatusFull();
  const { data: interestCounts, refetch: refetchInterestCounts } = useGetUpgradeInterestCount();
  const { toast } = useToast();
  const polled = useRef(false);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [registeredPlans, setRegisteredPlans] = useState<Set<'core' | 'badge'>>(new Set());

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

  const handleJoinWaitlist = (plan: 'core' | 'badge') => {
    upgradeInterestMutation.mutate(plan, {
      onSuccess: (res) => {
        setRegisteredPlans(prev => new Set(prev).add(plan));
        refetchInterestCounts();
        if (res.alreadyRegistered) {
          toast({
            title: "You're already on the list",
            description: "We'll email you the moment payments open up.",
          });
        } else {
          toast({
            title: "You're on the list",
            description: "We'll email you the moment payments open up.",
          });
        }
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Could not save", description: err.message });
      },
    });
  };

  const currentTier = status?.tier || 'free';
  const paymentsLive = status?.paymentsLive ?? false;

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

  const displayedCorePrice = billing === 'yearly' ? pricing.core_price_yearly : pricing.core_price;
  const displayedBadgePrice = billing === 'yearly' ? pricing.serious_price_yearly : pricing.serious_price;

  const coreInterestCount = interestCounts?.counts?.core ?? 0;
  const badgeInterestCount = interestCounts?.counts?.badge ?? 0;

  function PlanButton({ plan, label, current, className }: {
    plan: 'core' | 'badge'; label: string; current: boolean; className: string;
  }) {
    if (current) {
      return <button disabled className={className}>Current Plan</button>;
    }
    if (paymentsLive) {
      const isLoading = checkoutMutation.isPending && checkoutMutation.variables?.data?.tier === plan;
      return (
        <button onClick={() => handleCheckout(plan)} disabled={checkoutMutation.isPending} className={className}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : label}
        </button>
      );
    }
    // Waitlist mode
    const registered = registeredPlans.has(plan);
    const isLoading = upgradeInterestMutation.isPending && upgradeInterestMutation.variables === plan;
    if (registered) {
      return (
        <button disabled className={className + " !cursor-default"}>
          <span className="inline-flex items-center justify-center gap-2"><Check className="w-4 h-4" /> You're on the list</span>
        </button>
      );
    }
    return (
      <button onClick={() => handleJoinWaitlist(plan)} disabled={upgradeInterestMutation.isPending} className={className}>
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Notify me when it launches"}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 mt-16 text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          Find someone who is actually ready.
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Dowry.Africa is built for people serious about commitment. Upgrade to show up that way.
        </p>

        {/* Coming-soon banner — shown only while payments aren't live yet */}
        {!paymentsLive && currentTier === 'free' && (
          <div className="mb-10 inline-flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4 text-left">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-sm">Paid plans launch in days, not weeks.</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Payments aren't open yet. Pick the plan you want and we'll email you the moment it opens — no credit card needed.
              </p>
            </div>
          </div>
        )}

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
            <li className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-green-500 shrink-0" /> Send up to 3 messages a day</li>
            <li className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-green-500 shrink-0" /> Like up to 10 profiles a day</li>
            <li className="flex gap-3 text-foreground/40"><XIcon /> Unlimited messaging</li>
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
          <ul className="space-y-4 mb-6 flex-1 mt-6">
            {CORE_FEATURES.map(f => (
              <li key={f} className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-[#B5264E] shrink-0" /> {f}</li>
            ))}
          </ul>
          {!paymentsLive && coreInterestCount > 0 && currentTier === 'free' && (
            <p className="text-xs text-muted-foreground text-center mb-3 inline-flex items-center justify-center gap-1.5">
              <Heart className="w-3 h-3 text-[#B5264E] fill-[#B5264E]" />
              {coreInterestCount} {coreInterestCount === 1 ? "person is" : "people are"} on the list
            </p>
          )}
          <PlanButton
            plan="core"
            label="Select Core"
            current={currentTier === 'core'}
            className="w-full py-4 rounded-xl font-bold bg-[#B5264E] text-white shadow-lg shadow-[#B5264E]/30 hover:bg-[#9e1f42] hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:hover:translate-y-0 disabled:hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-90"
          />
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
          <p className="text-white/30 text-sm italic mb-3">Not for games.</p>
          {!paymentsLive && badgeInterestCount > 0 && currentTier !== 'badge' && (
            <p className="text-xs text-white/60 text-center mb-3 inline-flex items-center justify-center gap-1.5">
              <Heart className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              {badgeInterestCount} {badgeInterestCount === 1 ? "person is" : "people are"} on the list
            </p>
          )}
          <PlanButton
            plan="badge"
            label="Get The Badge"
            current={currentTier === 'badge'}
            className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-950 shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-90 disabled:cursor-not-allowed"
          />
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
