import { useMemo, useState } from 'react'
import { FeedbackDetailSheet } from '@/components/feedback-detail-sheet'
import { FeedbackTable } from '@/components/feedback-table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { applyClientFilters, useFeedback } from '@/hooks/use-feedback'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import type { FeedbackWithRelations, RoutingStatus } from '@/lib/types'
import { ROUTING_LABELS } from '@/lib/types'

export function FeedbackPage() {
  const {
    filters,
    setRoutingStatus,
    setAlertStatus,
    setSentimentBucket,
    clearFilters,
  } = useDashboardFilters()
  const { data = [], isLoading } = useFeedback(filters)
  const [selected, setSelected] = useState<FeedbackWithRelations | null>(null)

  const rows = useMemo(() => applyClientFilters(data, filters), [data, filters])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All feedback</h1>
          <p className="text-sm text-muted-foreground">
            Every reply with location, scores, and routing status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.routingStatus ?? 'all'}
            onValueChange={(v) =>
              setRoutingStatus(v === 'all' ? null : (v as RoutingStatus))
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Routing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(ROUTING_LABELS) as RoutingStatus[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {ROUTING_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.alertStatus ?? 'all'}
            onValueChange={(v) => setAlertStatus(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Alert" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All alerts</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="acted_on">Acted on</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sentimentBucket ?? 'all'}
            onValueChange={(v) => setSentimentBucket(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sentiment</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </div>

      <FeedbackTable rows={rows} loading={isLoading} onSelect={setSelected} />

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
