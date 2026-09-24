import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { AuthProvider } from "@/contexts/auth-context";
import { AlertsPage } from "@/pages/alerts-page";
import { CompleteJobPage } from "@/pages/complete-job-page";
import { FeedbackPage } from "@/pages/feedback-page";
import { GiveFeedbackPage } from "@/pages/give-feedback-page";
import { LoginPage } from "@/pages/login-page";
import { OverviewPage } from "@/pages/overview-page";
import { QueuePage } from "@/pages/queue-page";
import { ReadyToPostPage } from "@/pages/ready-to-post-page";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/give-feedback" element={<GiveFeedbackPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<OverviewPage />} />
                <Route path="complete-job" element={<CompleteJobPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
                <Route path="ready-to-post" element={<ReadyToPostPage />} />
                <Route path="queue" element={<QueuePage />} />
                <Route path="alerts" element={<AlertsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster theme="dark" richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
