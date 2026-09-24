import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FeedbackDetailSheet } from '@/components/feedback-detail-sheet'
import { FeedbackTable } from '@/components/feedback-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { applyClientFilters, useFeedback } from '@/hooks/use-feedback'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import type { FeedbackWithRelations } from '@/lib/types'
import { cn } from '@/lib/utils'

export function OverviewPage() {
  const navigate = useNavigate()
  const { filters, setSentimentBucket, setAlertStatus, setRoutingStatus } =
    useDashboardFilters()
  const { data = [], isLoading, error } = useFeedback(filters)
  const [selected, setSelected] = useState<FeedbackWithRelations | null>(null)

  const scoped = useMemo(() => applyClientFilters(data, filters), [data, filters])

  const stats = useMemo(() => {
    const total = scoped.length
    const positive = scoped.filter((r) => r.sentiment_score > 0).length
    const negative = scoped.filter((r) => r.sentiment_score < 0).length
    const openAlerts = scoped.filter((r) => r.alert_status === 'open').length
    return { total, positive, negative, openAlerts }
  }, [scoped])

  const byLocation = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of scoped) {
      map.set(row.locations.name, (map.get(row.locations.name) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
  }, [scoped])

  const recent = scoped.slice(0, 8)

  function buildSearch(overrides: Record<string, string | null>) {
    const next = new URLSearchParams(window.location.search)
    for (const [key, value] of Object.entries(overrides)) {
      if (!value) next.delete(key)
      else next.set(key, value)
    }
    const s = next.toString()
    return s ? `?${s}` : ''
  }

  function goWithSentiment(bucket: string | null) {
    setSentimentBucket(bucket)
    setRoutingStatus(null)
    setAlertStatus(null)
    navigate({
      pathname: '/feedback',
      search: buildSearch({
        sentiment: bucket,
        routing: null,
        alert: null,
      }),
    })
  }

  function goOpenAlerts() {
    setAlertStatus('open')
    setSentimentBucket(null)
    setRoutingStatus(null)
    navigate({
      pathname: '/alerts',
      search: buildSearch({
        alert: 'open',
        sentiment: null,
        routing: null,
      }),
    })
  }

  const kpis = [
    {
      label: 'Total feedback',
      value: stats.total,
      onClick: () => goWithSentiment(null),
    },
    {
      label: 'Positive',
      value: stats.positive,
      accent: 'text-emerald-400',
      onClick: () => goWithSentiment('positive'),
    },
    {
      label: 'Negative',
      value: stats.negative,
      accent: 'text-red-400',
      onClick: () => goWithSentiment('negative'),
    },
    {
      label: 'Open alerts',
      value: stats.openAlerts,
      accent: 'text-amber-400',
      onClick: goOpenAlerts,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          One place for feedback, routing, drafts, and manager alerts across locations.
        </p>
      </div>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="pt-5 text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to load feedback'}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={kpi.onClick}
            className="text-left"
          >
            <Card className="transition-colors hover:border-primary/40">
              <CardHeader className="pb-2">
                <CardDescription>{kpi.label}</CardDescription>
                <CardTitle
                  className={cn('text-3xl tabular-nums', kpi.accent)}
                >
                  {isLoading ? '—' : kpi.value}
                </CardTitle>
              </CardHeader>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Feedback by location</CardTitle>
            <CardDescription>Counts in the current filter scope</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            {byLocation.length === 0 && !isLoading ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byLocation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
                  <XAxis dataKey="name" tick={{ fill: 'oklch(0.68 0 0)', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: 'oklch(0.68 0 0)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'oklch(0.18 0.01 260)',
                      border: '1px solid oklch(1 0 0 / 10%)',
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" fill="oklch(0.78 0.14 75)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Recent feedback</CardTitle>
            <CardDescription>Click a row for scores, drafts, and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackTable
              rows={recent}
              loading={isLoading}
              onSelect={setSelected}
            />
          </CardContent>
        </Card>
      </div>

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
