import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { postFeedbackSubmitted } from "@/lib/n8n";
import { cn } from "@/lib/utils";

export function GiveFeedbackPage() {
  const [params] = useSearchParams();
  const customerId = params.get("customer_id") ?? "";
  const locationId = params.get("location_id") ?? "";
  const job = params.get("job") ?? "";
  const customerName = params.get("customer_name");
  const locationName = params.get("location_name");

  const missing = useMemo(
    () => !customerId || !locationId || !job,
    [customerId, locationId, job],
  );

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (missing) {
      toast.error("This feedback link is missing required details.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please write your feedback before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await postFeedbackSubmitted({
        customer_id: customerId,
        location_id: locationId,
        job,
        message: message.trim(),
      });
      setDone(true);
      toast.success("Thank you. Your feedback has been received.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit feedback",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>How was your experience?</CardTitle>
          <CardDescription>
            Your feedback helps our team improve — it is reviewed by a person,
            never posted automatically. Automation may collect this via an n8n
            Form instead of this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {missing ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              This feedback link is incomplete. Please use the link from your
              email (it needs customer, location, and job).
            </p>
          ) : done ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <p className="text-base font-semibold text-emerald-400">
                Thank you. Your feedback has been received.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                You can close this page.
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                {customerName ? (
                  <p>
                    <span className="text-muted-foreground">Customer: </span>
                    {customerName}
                  </p>
                ) : null}
                <p>
                  <span className="text-muted-foreground">Branch: </span>
                  {locationName ?? locationId}
                </p>
                <p>
                  <span className="text-muted-foreground">Service: </span>
                  {job}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Your feedback</Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  required
                  placeholder="Tell us how the visit went…"
                  className={cn(
                    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
                    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit feedback"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
