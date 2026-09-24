import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { FeedbackDetailSheet } from '@/components/feedback-detail-sheet'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { markAlertHandled } from '@/lib/api'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { feedbackKeys, useFeedback } from '@/hooks/use-feedback'
import type { FeedbackWithRelations } from '@/lib/types'

export function AlertsPage() {
  const [params] = useSearchParams()
  const { filters, setAlertStatus } = useDashboardFilters()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<FeedbackWithRelations | null>(null)

  // Default to open alerts when no ?alert= param; "all" means open + acted_on
  const alertView = params.has('alert') ? (filters.alertStatus ?? 'all') : 'open'

  const listFilters = useMemo(
    () => ({
      ...filters,
      alertStatus: alertView === 'all' ? null : alertView,
    }),
    [filters, alertView],
  )

  const { data = [], isLoading } = useFeedback(listFilters)

  const rows = useMemo(
    () => data.filter((r) => r.alert_status === 'open' || r.alert_status === 'acted_on'),
    [data],
  )

  const alertMutation = useMutation({
    mutationFn: markAlertHandled,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.all })
      toast.success('Alert marked as handled')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manager alerts</h1>
          <p className="text-sm text-muted-foreground">
            Severe and repeat-negative cases that need immediate attention.
          </p>
        </div>
        <Select
          value={alertView}
          onValueChange={(v) => setAlertStatus(v === 'all' ? 'all' : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Alert status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="acted_on">Acted on</SelectItem>
            <SelectItem value="all">Open + acted on</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No alerts in this view"
          description="Escalated and repeat-negative feedback will open alerts here."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <Card
              key={row.id}
              className={
                row.alert_status === 'open' ? 'border-red-500/30 bg-red-500/5' : undefined
              }
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">{row.customers.name}</CardTitle>
                  <CardDescription>
                    {row.locations.name} · severity {row.severity_score} · sentiment{' '}
                    {row.sentiment_score}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {row.is_repeat_negative ? <Badge variant="danger">Repeat</Badge> : null}
                  {row.alert_status === 'open' ? (
                    <Badge variant="danger">Open</Badge>
                  ) : (
                    <Badge variant="success">Acted on</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{row.message}</p>
                <div className="flex flex-wrap gap-2">
                  {row.alert_status === 'open' ? (
                    <Button
                      size="sm"
                      disabled={alertMutation.isPending}
                      onClick={() => alertMutation.mutate(row.id)}
                    >
                      <CheckCircle2 />
                      Mark as handled
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
