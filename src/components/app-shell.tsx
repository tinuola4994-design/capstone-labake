import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";
import { useFeedbackRealtime, useLocations } from "@/hooks/use-feedback";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/complete-job", label: "Complete job", icon: ClipboardCheck },
  { to: "/feedback", label: "All feedback", icon: MessageSquare },
  { to: "/ready-to-post", label: "Ready to post", icon: Sparkles },
  { to: "/queue", label: "Negative queue", icon: ShieldAlert },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
];

export function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: locations = [] } = useLocations();
  const { filters, setLocationId, setSearch } = useDashboardFilters();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(filters.search);

  useFeedbackRealtime();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Reputation</p>
          <p className="text-xs text-muted-foreground">Feedback Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <p className="truncate px-2 text-xs text-muted-foreground">
          {user?.email}
        </p>
        <Button
          variant="ghost"
          className="mt-1 w-full justify-start"
          onClick={() => void handleSignOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 h-full w-72 border-r border-border bg-background">
            <button
              type="button"
              className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold sm:text-base">
              Management dashboard
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={filters.locationId ?? "all"}
              onValueChange={(v) => setLocationId(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[140px] sm:w-[160px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <form
              className="hidden sm:block"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchDraft);
              }}
            >
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search feedback…"
                className="w-48 lg:w-64"
              />
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
