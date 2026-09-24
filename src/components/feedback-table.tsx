import { formatDistanceToNow } from 'date-fns'
import {
  AlertBadge,
  RoutingBadge,
  SentimentScore,
  SeverityScore,
} from '@/components/status-badges'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { FeedbackWithRelations } from '@/lib/types'

type Props = {
  rows: FeedbackWithRelations[]
  loading?: boolean
  onSelect: (row: FeedbackWithRelations) => void
  emptyTitle?: string
  emptyDescription?: string
}

export function FeedbackTable({
  rows,
  loading,
  onSelect,
  emptyTitle = 'No feedback yet',
  emptyDescription = 'When n8n saves scored replies to Supabase, they will show up here.',
}: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Sentiment</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Alert</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() => onSelect(row)}
            >
              <TableCell className="font-medium">{row.customers.name}</TableCell>
              <TableCell>{row.locations.name}</TableCell>
              <TableCell>
                <SentimentScore score={row.sentiment_score} />
              </TableCell>
              <TableCell>
                <SeverityScore score={row.severity_score} />
              </TableCell>
              <TableCell>
                <RoutingBadge status={row.routing_status} />
              </TableCell>
              <TableCell>
                <AlertBadge status={row.alert_status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
