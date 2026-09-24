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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocations } from "@/hooks/use-feedback";
import { saveFeedbackSubmission } from "@/lib/api";
import { cn } from "@/lib/utils";

export function GiveFeedbackPage() {
  const { data: locations = [], isLoading: loadingLocations } = useLocations();
  const [params] = useSearchParams();
  const customerId = params.get("customer_id") ?? "";
  const locationId = params.get("location_id") ?? "";
  const job = params.get("job") ?? "";
  const customerNameFromUrl = params.get("customer_name") ?? "";
  const locationNameFromUrl = params.get("location_name") ?? "";
  const customerEmailFromUrl = params.get("customer_email") ?? "";
  const customerPhoneFromUrl = params.get("customer_phone") ?? "";

  const prefilledCustomerName = useMemo(
    () => customerNameFromUrl.trim(),
    [customerNameFromUrl],
  );
  const prefilledLocationName = useMemo(
    () => locationNameFromUrl.trim(),
    [locationNameFromUrl],
  );
  const prefilledLocationId = useMemo(() => locationId.trim(), [locationId]);
  const prefilledJob = useMemo(() => job.trim(), [job]);

  const [customerName, setCustomerName] = useState(prefilledCustomerName);
  const [customerEmail, setCustomerEmail] = useState(customerEmailFromUrl);
  const [customerPhone, setCustomerPhone] = useState(customerPhoneFromUrl);
  const [locationName, setLocationName] = useState(prefilledLocationName);
  const [location, setLocation] = useState(prefilledLocationId);
  const [service, setService] = useState(prefilledJob);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const missingRequired = useMemo(
    () =>
      !customerName.trim() ||
      (!customerEmail.trim() && !customerPhone.trim()) ||
      (!location.trim() && !locationName.trim()) ||
      (!service.trim() && !prefilledJob),
    [customerEmail, customerName, customerPhone, location, locationName, service, prefilledJob],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please write your feedback before submitting.");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!customerEmail.trim() && !customerPhone.trim()) {
      toast.error("Please enter your email or phone number.");
      return;
    }

    const resolvedLocationId = location.trim() || customerId || "";
    const resolvedLocationName = locationName.trim() || locationId || "";
    const resolvedJob = service.trim() || prefilledJob || "";

    if (!resolvedLocationId || !resolvedLocationName || !resolvedJob) {
      toast.error("Please fill in the location and service before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await saveFeedbackSubmission({
        customer_id: customerId || null,
        location_id: resolvedLocationId || null,
        location_name: resolvedLocationName || null,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || null,
        customer_phone: customerPhone.trim() || null,
        job: resolvedJob || null,
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
          {done ? (
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
                {customerNameFromUrl ? (
                  <p>
                    <span className="text-muted-foreground">Customer: </span>
                    {customerNameFromUrl}
                  </p>
                ) : null}
                {locationNameFromUrl || locationId ? (
                  <p>
                    <span className="text-muted-foreground">Branch: </span>
                    {locationNameFromUrl || locationId}
                  </p>
                ) : null}
                {job ? (
                  <p>
                    <span className="text-muted-foreground">Service: </span>
                    {job}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="080..."
                  />
                </div>
              </div>

              {!prefilledLocationId && !prefilledLocationName ? (
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={location || undefined}
                    onValueChange={(value) => {
                      setLocation(value);
                      const selectedLocation = locations.find((loc) => loc.id === value);
                      setLocationName(selectedLocation?.name ?? "");
                    }}
                    disabled={loadingLocations}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch…" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {!prefilledJob ? (
                <div className="space-y-2">
                  <Label htmlFor="job">Service / job</Label>
                  <Input
                    id="job"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="e.g. Oil change"
                  />
                </div>
              ) : null}

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

              {missingRequired ? (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
                  If the email link did not include your details, fill in your name,
                  at least one contact method, location, and service before sending.
                </p>
              ) : null}

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
