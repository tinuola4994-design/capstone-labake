import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { CheckCircle2, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { FeedbackDetailSheet } from '@/components/feedback-detail-sheet'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { markDraftSent } from '@/lib/api'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { feedbackKeys, useFeedback } from '@/hooks/use-feedback'
import type { FeedbackWithRelations } from '@/lib/types'

export function QueuePage() {
  const { filters } = useDashboardFilters()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<FeedbackWithRelations | null>(null)

  // Fetch private queue + escalated (both have drafts); filter client-side for negatives with drafts
  const { data = [], isLoading } = useFeedback({
    ...filters,
    routingStatus: null,
  })

  const rows = useMemo(
    () =>
      data.filter(
        (r) =>
          (r.routing_status === 'private_queue' || r.routing_status === 'escalated') &&
          Boolean(r.ai_draft_response),
      ),
    [data],
  )

  const draftMutation = useMutation({
    mutationFn: markDraftSent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.all })
      toast.success('Draft marked as sent')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  async function copyDraft(row: FeedbackWithRelations) {
    if (!row.ai_draft_response) return
    await navigator.clipboard.writeText(row.ai_draft_response)
    toast.success('Draft copied')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Negative queue</h1>
        <p className="text-sm text-muted-foreground">
          Private and escalated complaints with AI draft replies for your team to review and
          send.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="Negative queue is empty"
          description="First-time and escalated negatives with drafts will land here."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">{row.customers.name}</CardTitle>
                  <CardDescription>
                    {row.locations.name}
                    {row.job ? ` · ${row.job}` : ''} · sentiment {row.sentiment_score} ·
                    severity {row.severity_score}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.is_repeat_negative ? <Badge variant="danger">Repeat</Badge> : null}
                  {row.routing_status === 'escalated' ? (
                    <Badge variant="danger">Escalated</Badge>
                  ) : (
                    <Badge variant="muted">Private queue</Badge>
                  )}
                  {row.draft_sent ? <Badge variant="success">Draft sent</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Complaint
                  </p>
                  <p className="rounded-lg border bg-muted/30 p-3 text-sm">{row.message}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    AI draft response
                  </p>
                  <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
                    {row.ai_draft_response}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => void copyDraft(row)}>
                    <Copy />
                    Copy draft
                  </Button>
                  {!row.draft_sent ? (
                    <Button
                      size="sm"
                      disabled={draftMutation.isPending}
                      onClick={() => draftMutation.mutate(row.id)}
                    >
                      <CheckCircle2 />
                      Mark draft as sent
                    </Button>
                  ) : null}
                  <Button variant="secondary" size="sm" onClick={() => setSelected(row)}>
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FeedbackDetailSheet
        feedback={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
