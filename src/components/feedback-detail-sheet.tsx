import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CheckCircle2, Copy } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertBadge,
  RoutingBadge,
  SentimentScore,
  SeverityScore,
} from '@/components/status-badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { markAlertHandled, markDraftSent } from '@/lib/api'
import { feedbackKeys } from '@/hooks/use-feedback'
import type { FeedbackWithRelations } from '@/lib/types'

type Props = {
  feedback: FeedbackWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDetailSheet({ feedback, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()

  const draftMutation = useMutation({
    mutationFn: markDraftSent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.all })
      toast.success('Draft marked as sent')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const alertMutation = useMutation({
    mutationFn: markAlertHandled,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.all })
      toast.success('Alert marked as handled')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  async function copyMessage() {
    if (!feedback) return
    await navigator.clipboard.writeText(feedback.message)
    toast.success('Review text copied to clipboard')
  }

  async function copyDraft() {
    if (!feedback?.ai_draft_response) return
    await navigator.clipboard.writeText(feedback.ai_draft_response)
    toast.success('Draft response copied')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-lg">
        {feedback ? (
          <>
            <SheetHeader>
              <SheetTitle>{feedback.customers.name}</SheetTitle>
              <SheetDescription>
                {feedback.locations.name}
                {feedback.job ? ` · ${feedback.job}` : ''}
                {' · '}
                {format(new Date(feedback.created_at), 'MMM d, yyyy · h:mm a')}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 flex flex-wrap gap-2">
              <RoutingBadge status={feedback.routing_status} />
              <AlertBadge status={feedback.alert_status} />
              {feedback.is_repeat_negative ? (
                <Badge variant="danger">Repeat negative</Badge>
              ) : null}
              {feedback.confidence === 'low' ? (
                <Badge variant="warning">Low confidence</Badge>
              ) : null}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Sentiment</p>
                <p className="mt-1 text-lg">
                  <SentimentScore score={feedback.sentiment_score} />
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {feedback.sentiment_label}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Severity</p>
                <p className="mt-1 text-lg">
                  <SeverityScore score={feedback.severity_score} />
                </p>
              </div>
            </div>

            {feedback.reason ? (
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Reason: </span>
                {feedback.reason}
              </p>
            ) : null}

            <Separator className="my-5" />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Customer message</h4>
                {feedback.routing_status === 'ready_to_post' ? (
                  <Button variant="outline" size="sm" onClick={() => void copyMessage()}>
                    <Copy />
                    Copy review
                  </Button>
                ) : null}
              </div>
              <p className="rounded-lg border bg-card p-3 text-sm leading-relaxed">
                {feedback.message}
              </p>
            </div>

            {feedback.ai_draft_response ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold">AI draft response</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => void copyDraft()}>
                      <Copy />
                      Copy
                    </Button>
                    {!feedback.draft_sent ? (
                      <Button
                        size="sm"
                        disabled={draftMutation.isPending}
                        onClick={() => draftMutation.mutate(feedback.id)}
                      >
                        <CheckCircle2 />
                        Mark as sent
                      </Button>
                    ) : (
                      <Badge variant="success">Sent</Badge>
                    )}
                  </div>
                </div>
                <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm leading-relaxed">
                  {feedback.ai_draft_response}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Humans send this — the app never emails the customer automatically.
                </p>
              </div>
            ) : null}

            {feedback.alert_status === 'open' ? (
              <div className="mt-6">
                <Button
                  className="w-full"
                  disabled={alertMutation.isPending}
                  onClick={() => alertMutation.mutate(feedback.id)}
                >
                  Mark alert as handled
                </Button>
              </div>
            ) : null}

            {feedback.alert_status === 'acted_on' ? (
              <p className="mt-4 text-sm text-emerald-400">This alert has been acted on.</p>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
