export type RoutingStatus =
  | 'ready_to_post'
  | 'private_queue'
  | 'escalated'
  | 'needs_review'

export type AlertStatus = 'none' | 'open' | 'acted_on'

export type ConfidenceLevel = 'high' | 'low'

export type Location = {
  id: string
  name: string
  created_at: string
}

export type Customer = {
  id: string
  name: string
  phone: string
  email: string
  created_at: string
}

export type Feedback = {
  id: string
  customer_id: string
  location_id: string
  job: string | null
  message: string
  sentiment_score: number
  severity_score: number
  sentiment_label: string
  reason: string | null
  confidence: ConfidenceLevel
  routing_status: RoutingStatus
  is_repeat_negative: boolean
  ai_draft_response: string | null
  draft_sent: boolean
  alert_status: AlertStatus
  created_at: string
}

export type FeedbackWithRelations = Feedback & {
  customers: Customer
  locations: Location
}

type Tables = {
  locations: {
    Row: Location
    Insert: {
      id?: string
      name: string
      created_at?: string
    }
    Update: {
      id?: string
      name?: string
      created_at?: string
    }
    Relationships: []
  }
  customers: {
    Row: Customer
    Insert: {
      id?: string
      name: string
      phone: string
      email: string
      created_at?: string
    }
    Update: {
      id?: string
      name?: string
      phone?: string
      email?: string
      created_at?: string
    }
    Relationships: []
  }
  feedback: {
    Row: Feedback
    Insert: {
      id?: string
      customer_id: string
      location_id: string
      job?: string | null
      message: string
      sentiment_score: number
      severity_score: number
      sentiment_label: string
      reason?: string | null
      confidence?: ConfidenceLevel
      routing_status: RoutingStatus
      is_repeat_negative?: boolean
      ai_draft_response?: string | null
      draft_sent?: boolean
      alert_status?: AlertStatus
      created_at?: string
    }
    Update: {
      id?: string
      customer_id?: string
      location_id?: string
      job?: string | null
      message?: string
      sentiment_score?: number
      severity_score?: number
      sentiment_label?: string
      reason?: string | null
      confidence?: ConfidenceLevel
      routing_status?: RoutingStatus
      is_repeat_negative?: boolean
      ai_draft_response?: string | null
      draft_sent?: boolean
      alert_status?: AlertStatus
      created_at?: string
    }
    Relationships: [
      {
        foreignKeyName: 'feedback_customer_id_fkey'
        columns: ['customer_id']
        isOneToOne: false
        referencedRelation: 'customers'
        referencedColumns: ['id']
      },
      {
        foreignKeyName: 'feedback_location_id_fkey'
        columns: ['location_id']
        isOneToOne: false
        referencedRelation: 'locations'
        referencedColumns: ['id']
      },
    ]
  }
}

export type Database = {
  public: {
    Tables: Tables
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      routing_status: RoutingStatus
      alert_status: AlertStatus
      confidence_level: ConfidenceLevel
    }
    CompositeTypes: Record<string, never>
  }
}

export const ROUTING_LABELS: Record<RoutingStatus, string> = {
  ready_to_post: 'Ready to post',
  private_queue: 'Private queue',
  escalated: 'Escalated',
  needs_review: 'Needs review',
}

export const ALERT_LABELS: Record<AlertStatus, string> = {
  none: 'None',
  open: 'Open',
  acted_on: 'Acted on',
}
