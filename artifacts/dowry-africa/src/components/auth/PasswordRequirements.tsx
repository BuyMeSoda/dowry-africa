import { Check } from "lucide-react";

export interface PasswordCheck {
  label: string;
  met: boolean;
}

export function evaluatePassword(pw: string): { checks: PasswordCheck[]; score: number; allMet: boolean } {
  const checks: PasswordCheck[] = [
    { label: "At least 8 characters", met: pw.length >= 8 },
    { label: "Uppercase letter (A–Z)", met: /[A-Z]/.test(pw) },
    { label: "Lowercase letter (a–z)", met: /[a-z]/.test(pw) },
    { label: "Number (0–9)", met: /[0-9]/.test(pw) },
    { label: "Special character (!@#$%…)", met: /[!@#$%^&*()\-_=+\[\]{}|;:,.<>?]/.test(pw) },
  ];
  const score = checks.filter(c => c.met).length;
  return { checks, score, allMet: score === 5 };
}

export function getStrengthInfo(score: number): { label: string; barColor: string; textColor: string; width: string } {
  if (score < 3) return { label: "Weak",   barColor: "bg-red-500",    textColor: "text-red-600",    width: `${Math.max(score, 1) * 20}%` };
  if (score === 3) return { label: "Fair",  barColor: "bg-orange-400", textColor: "text-orange-600", width: "60%" };
  if (score === 4) return { label: "Good",  barColor: "bg-yellow-400", textColor: "text-yellow-600", width: "80%" };
  return              { label: "Strong", barColor: "bg-emerald-500", textColor: "text-emerald-600", width: "100%" };
}

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const { checks, score } = evaluatePassword(password);
  const { label, barColor, textColor, width } = getStrengthInfo(score);

  if (password.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="space-y-1">
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width }}
          />
        </div>
        <p className={`text-xs font-semibold ${textColor}`}>{label}</p>
      </div>

      <ul className="space-y-1">
        {checks.map(({ label, met }) => (
          <li key={label} className="flex items-center gap-1.5 text-xs">
            <span className={`flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${met ? "bg-emerald-500" : "bg-muted-foreground/20"}`}>
              {met && <Check className="w-2 h-2 text-white stroke-[3]" />}
            </span>
            <span className={`transition-colors ${met ? "text-emerald-700" : "text-muted-foreground"}`}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
