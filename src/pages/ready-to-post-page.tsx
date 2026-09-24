import { useMemo, useState } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { FeedbackDetailSheet } from '@/components/feedback-detail-sheet'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { useFeedback } from '@/hooks/use-feedback'
import type { FeedbackWithRelations } from '@/lib/types'

export function ReadyToPostPage() {
  const { filters } = useDashboardFilters()
  const listFilters = useMemo(
    () => ({ ...filters, routingStatus: 'ready_to_post' }),
    [filters],
  )
  const { data = [], isLoading } = useFeedback(listFilters)
  const [selected, setSelected] = useState<FeedbackWithRelations | null>(null)

  async function copyReview(row: FeedbackWithRelations) {
    await navigator.clipboard.writeText(row.message)
    toast.success(`Copied review from ${row.customers.name}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ready to post</h1>
        <p className="text-sm text-muted-foreground">
          Positive feedback queued for a human to publish. Nothing posts automatically.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          title="No reviews ready to post"
          description="Positive replies routed here will appear for copy-and-publish."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((row) => (
            <Card key={row.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{row.customers.name}</CardTitle>
                <CardDescription>
                  {row.locations.name}
                  {row.job ? ` · ${row.job}` : ''} · sentiment{' '}
                  {row.sentiment_score > 0 ? '+' : ''}
                  {row.sentiment_score}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  “{row.message}”
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => void copyReview(row)}>
                    <Copy />
                    Copy review
                  </Button>
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
