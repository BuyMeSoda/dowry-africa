import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { API_BASE } from "@/lib/api-url";

export default function Unsubscribe() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");

    if (!emailParam) {
      setStatus("error");
      return;
    }

    setEmail(emailParam);

    fetch(`${API_BASE}/api/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailParam }),
    })
      .then(res => {
        if (res.ok) setStatus("success");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Processing your request…</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">
                You've been unsubscribed
              </h1>
              {email && (
                <p className="text-muted-foreground mt-1 text-sm">
                  <span className="font-medium">{email}</span> will no longer receive marketing emails from Dowry.Africa.
                </p>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              You'll still receive important account emails (such as password resets and security alerts).
            </p>
            <Link
              href="/"
              className="inline-block mt-2 text-sm text-primary hover:underline"
            >
              Back to Dowry.Africa
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="w-14 h-14 text-destructive mx-auto" />
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                We couldn't process your unsubscribe request. The link may be invalid or expired.
              </p>
            </div>
            <p className="text-muted-foreground text-sm">
              If you'd like to unsubscribe, please email us at{" "}
              <a href="mailto:hello@dowry.africa" className="text-primary hover:underline">
                hello@dowry.africa
              </a>
              .
            </p>
            <Link href="/" className="inline-block mt-2 text-sm text-primary hover:underline">
              Back to Dowry.Africa
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
