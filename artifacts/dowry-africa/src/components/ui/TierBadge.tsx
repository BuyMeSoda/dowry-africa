import { SeriousBadgeIcon } from "./SeriousBadgeIcon";
import { Link } from "wouter";
import { Star } from "lucide-react";

interface TierBadgeProps {
  tier: string;
  hasBadge?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

/**
 * Unified tier badge component.
 * - hasBadge / tier="badge" → gold shield (Serious Badge)
 * - tier="core"             → silver/blue star (Core Member)
 * - tier="free"             → nothing
 */
export function TierBadge({ tier, hasBadge, size = "md", showLabel = false, className = "" }: TierBadgeProps) {
  const isBadge = hasBadge || tier === "badge";
  const isCore  = !isBadge && tier === "core";

  if (isBadge) {
    const iconSize = size === "sm" ? 20 : size === "lg" ? 40 : 28;
    if (!showLabel) return <SeriousBadgeIcon size={iconSize} className={className} title="Serious Badge" />;
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <SeriousBadgeIcon size={iconSize} title="Serious Badge" />
        <span className="text-amber-800 font-semibold text-sm">Serious Badge</span>
      </div>
    );
  }

  if (isCore) {
    const starSize = size === "sm" ? 12 : size === "lg" ? 20 : 15;
    if (!showLabel) {
      return (
        <span
          className={`inline-flex items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-blue-600 ${size === "sm" ? "w-5 h-5" : size === "lg" ? "w-9 h-9" : "w-7 h-7"} ${className}`}
          title="Core Member"
          aria-label="Core Member"
        >
          <Star className="fill-blue-400 stroke-blue-500" style={{ width: starSize, height: starSize }} />
        </span>
      );
    }
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span
          className={`inline-flex items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-blue-600 ${size === "sm" ? "w-5 h-5" : size === "lg" ? "w-9 h-9" : "w-7 h-7"}`}
          title="Core Member"
        >
          <Star className="fill-blue-400 stroke-blue-500" style={{ width: starSize, height: starSize }} />
        </span>
        <span className="text-blue-700 font-semibold text-sm">Core Member</span>
      </div>
    );
  }

  return null;
}

/**
 * Own-profile tier indicator shown under the user's name.
 * Free → "Free Member" + Upgrade link
 * Core → "⭐ Core Member" silver/blue
 * Badge → "🛡️ Serious Badge" gold
 */
export function OwnTierLabel({ tier, hasBadge }: { tier: string; hasBadge?: boolean }) {
  const isBadge = hasBadge || tier === "badge";
  const isCore  = !isBadge && tier === "core";

  if (isBadge) {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold text-sm">
        <SeriousBadgeIcon size={16} />
        Serious Badge
      </span>
    );
  }
  if (isCore) {
    return (
      <span className="inline-flex items-center gap-1.5 text-blue-700 font-semibold text-sm">
        <Star className="w-3.5 h-3.5 fill-blue-400 stroke-blue-500" />
        Core Member
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground text-sm">
      Free Member
      <Link href="/premium" className="text-primary font-semibold hover:underline transition-colors">
        Upgrade
      </Link>
    </span>
  );
}
