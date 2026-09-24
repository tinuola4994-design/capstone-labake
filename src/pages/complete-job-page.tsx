import { useState, type FormEvent } from "react";
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
import { useCustomers, useLocations } from "@/hooks/use-feedback";
import { saveJobCompletion } from "@/lib/api";

const NEW_CUSTOMER = "__new__";

export function CompleteJobPage() {
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: locations = [], isLoading: loadingLocations } = useLocations();

  const [customerMode, setCustomerMode] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [locationId, setLocationId] = useState("");
  const [job, setJob] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isNew = customerMode === NEW_CUSTOMER;

  function onCustomerChange(value: string) {
    setCustomerMode(value);
    setSuccess(false);
    if (value === NEW_CUSTOMER) {
      setName("");
      setEmail("");
      setPhone("");
      return;
    }
    const customer = customers.find((c) => c.id === value);
    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(false);

    if (!customerMode) {
      toast.error("Select a customer or create a new one");
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Name, email, and phone are required");
      return;
    }
    if (!locationId) {
      toast.error("Select a location");
      return;
    }
    if (!job.trim()) {
      toast.error("Enter the job / service");
      return;
    }

    const location = locations.find((l) => l.id === locationId);
    if (!location) {
      toast.error("Invalid location");
      return;
    }

    setSubmitting(true);
    try {
      await saveJobCompletion({
        customer_id: isNew ? null : customerMode,
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        location_id: location.id,
        location_name: location.name,
        job: job.trim(),
      });
      setSuccess(true);
      toast.success("Job saved to Supabase.");
      setJob("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save job completion",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Complete job</h1>
        <p className="text-sm text-muted-foreground">
          Simulate a visit finishing at the front desk. This notifies n8n so it
          can email the customer a feedback link. Optional — automation can use
          an n8n Form instead (see docs/N8N_HANDOFF.md).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mark job complete</CardTitle>
          <CardDescription>
            Saves the completed visit directly to Supabase so n8n can react to it
            outside this app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select
                value={customerMode || undefined}
                onValueChange={onCustomerChange}
                disabled={loadingCustomers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NEW_CUSTOMER}>New customer…</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isNew && Boolean(customerMode)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isNew && Boolean(customerMode)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isNew && Boolean(customerMode)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={locationId || undefined}
                onValueChange={setLocationId}
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

            <div className="space-y-2">
              <Label htmlFor="job">Job / service</Label>
              <Input
                id="job"
                value={job}
                onChange={(e) => setJob(e.target.value)}
                placeholder="e.g. Full service & oil change"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending…" : "Mark job complete"}
            </Button>

            {success ? (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                Job saved to Supabase.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
