import { Badge } from '@/components/ui/badge'
import { ALERT_LABELS, ROUTING_LABELS, type AlertStatus, type RoutingStatus } from '@/lib/types'

export function RoutingBadge({ status }: { status: RoutingStatus }) {
  const variant =
    status === 'ready_to_post'
      ? 'success'
      : status === 'escalated'
        ? 'danger'
        : status === 'needs_review'
          ? 'warning'
          : 'muted'

  return <Badge variant={variant}>{ROUTING_LABELS[status]}</Badge>
}

export function AlertBadge({ status }: { status: AlertStatus }) {
  if (status === 'none') return <Badge variant="muted">No alert</Badge>
  if (status === 'open') return <Badge variant="danger">Open alert</Badge>
  return <Badge variant="success">{ALERT_LABELS[status]}</Badge>
}

export function SentimentScore({ score }: { score: number }) {
  const color =
    score > 20
      ? 'text-emerald-400'
      : score < -20
        ? 'text-red-400'
        : 'text-amber-400'

  const sign = score > 0 ? '+' : ''
  return (
    <span className={`font-semibold tabular-nums ${color}`}>
      {sign}
      {score}
    </span>
  )
}

export function SeverityScore({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-red-400' : score >= 30 ? 'text-amber-400' : 'text-muted-foreground'

  return <span className={`tabular-nums ${color}`}>{score}</span>
}
