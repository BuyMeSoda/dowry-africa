import { Navbar } from "@/components/layout/Navbar";
import { useCreateCheckout, useGetPaymentStatus, useCreatePortal } from "@workspace/api-client-react";
import { Check, Shield, Loader2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

export default function Premium() {
  const checkoutMutation = useCreateCheckout();
  const portalMutation = useCreatePortal();
  const { data: status, refetch } = useGetPaymentStatus();
  const { toast } = useToast();
  const polled = useRef(false);

  // Handle post-Stripe redirect (?success=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" && !polled.current) {
      polled.current = true;
      const tier = params.get("tier") || "core";
      toast({
        title: "Payment successful!",
        description: `Welcome to ${tier === "badge" ? "Serious Badge" : "Core"}. Your profile is now upgraded.`,
      });
      // Poll a few times to catch the webhook update
      const poll = setInterval(() => refetch(), 2000);
      setTimeout(() => clearInterval(poll), 10000);
      // Clean up URL
      window.history.replaceState({}, "", "/premium");
    }
  }, []);

  const handlePortal = () => {
    portalMutation.mutate(undefined, {
      onSuccess: (res) => {
        window.open(res.url, '_blank');
      },
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
             <h3 className="text-2xl font-display font-bold mb-2 text-primary">Core</h3>
             <p className="text-muted-foreground"><span className="text-3xl font-bold text-foreground">$7</span> / month</p>
           </div>
           <ul className="space-y-4 mb-8 flex-1">
             <li className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-primary shrink-0" /> Unlimited profiles</li>
             <li className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-primary shrink-0" /> See who liked you</li>
             <li className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-primary shrink-0" /> Unlimited messaging</li>
             <li className="flex gap-3 text-foreground"><Check className="w-5 h-5 text-primary shrink-0" /> Advanced country filters</li>
           </ul>
           <button 
             onClick={() => handleCheckout('core')}
             disabled={checkoutMutation.isPending || currentTier === 'core' || currentTier === 'badge'}
             className="w-full py-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
           >
             {currentTier === 'core' ? 'Current Plan' : 'Select Core'}
           </button>
        </div>

        {/* Badge Tier */}
        <div className="bg-foreground rounded-[2rem] p-8 border border-gray-800 shadow-2xl flex flex-col text-white">
           <div className="mb-8">
             <div className="flex items-center gap-2 mb-2">
               <Shield className="w-6 h-6 text-yellow-400" />
               <h3 className="text-2xl font-display font-bold">Serious Badge</h3>
             </div>
             <p className="text-white/70"><span className="text-3xl font-bold text-white">$15</span> / month</p>
           </div>
           <ul className="space-y-4 mb-8 flex-1">
             <li className="flex gap-3 text-white"><Check className="w-5 h-5 text-yellow-400 shrink-0" /> Everything in Core</li>
             <li className="flex gap-3 text-white items-start">
                <Check className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" /> 
                <span><strong className="text-yellow-400">Serious Badge</strong> on your profile</span>
             </li>
             <li className="flex gap-3 text-white"><Check className="w-5 h-5 text-yellow-400 shrink-0" /> Ranked highest in feeds</li>
             <li className="flex gap-3 text-white"><Check className="w-5 h-5 text-yellow-400 shrink-0" /> Access to Badge-only pool</li>
           </ul>
           <button 
             onClick={() => handleCheckout('badge')}
             disabled={checkoutMutation.isPending || currentTier === 'badge'}
             className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-950 shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
           >
             {checkoutMutation.isPending && currentTier !== 'badge' ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : currentTier === 'badge' ? 'Current Plan' : 'Get The Badge'}
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
  )
}
