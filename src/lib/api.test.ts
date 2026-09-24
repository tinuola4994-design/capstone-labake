import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSupabase = vi.hoisted(() => {
  const maybeSingle = vi.fn()
  const customerSingle = vi.fn()
  const jobSingle = vi.fn()
  const feedbackSingle = vi.fn()
  const emailMatch = vi.fn()

  const from = vi.fn((table: string) => {
    if (table === 'customers') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((field: string, value: string) => {
            const responder = vi.fn(async () => ({
              data:
                field === 'email' && value === 'jane@example.com'
                  ? [{ id: 'existing-customer-1' }]
                  : field === 'phone' && value === '08012345678'
                    ? [{ id: 'existing-customer-1' }]
                    : [],
              error: null,
            }))

            return { limit: responder, maybeSingle }
          }),
          limit: vi.fn(() => ({ maybeSingle })),
        })),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: customerSingle,
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: customerSingle,
          })),
        })),
      }
    }

    if (table === 'job_completions') {
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: jobSingle,
          })),
        })),
      }
    }

    if (table === 'feedback') {
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: feedbackSingle,
          })),
        })),
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  })

  return { from, maybeSingle, customerSingle, jobSingle, feedbackSingle, emailMatch }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockSupabase.from,
  },
}))

describe('saveJobCompletion', () => {
  beforeEach(() => {
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockSupabase.customerSingle.mockResolvedValue({
      data: { id: 'customer-123' },
      error: null,
    })
    mockSupabase.jobSingle.mockResolvedValue({
      data: { id: 'job-456' },
      error: null,
    })
    mockSupabase.feedbackSingle.mockResolvedValue({
      data: { id: 'feedback-789' },
      error: null,
    })
  })

  it('creates a new customer and persists the completed job in Supabase', async () => {
    const { saveJobCompletion } = await import('./api')

    const result = await saveJobCompletion({
      customer_id: null,
      customer_name: 'Jane Doe',
      customer_email: 'new-customer@example.com',
      customer_phone: '08011110001',
      location_id: 'location-1',
      location_name: 'Ibadan',
      job: 'Full service & oil change',
    })

    expect(result.id).toBe('job-456')
    expect(mockSupabase.customerSingle).toHaveBeenCalledTimes(1)
    expect(mockSupabase.jobSingle).toHaveBeenCalledTimes(1)
  })

  it('stores a customer feedback submission directly in Supabase', async () => {
    const { saveFeedbackSubmission } = await import('./api')

    const result = await saveFeedbackSubmission({
      customer_id: null,
      customer_name: 'Jane Doe',
      customer_email: 'jane@example.com',
      customer_phone: '08011110001',
      location_id: 'location-1',
      location_name: 'Ibadan',
      job: 'Oil change',
      message: 'The service was excellent.',
    })

    expect(result.id).toBe('feedback-789')
    expect(mockSupabase.feedbackSingle).toHaveBeenCalledTimes(1)
  })

  it('reuses the existing customer when the email already exists', async () => {
    const { saveFeedbackSubmission } = await import('./api')

    const result = await saveFeedbackSubmission({
      customer_id: null,
      customer_name: 'Jane Doe',
      customer_email: 'jane@example.com',
      customer_phone: '08012345678',
      location_id: 'location-1',
      location_name: 'Ibadan',
      job: 'Oil change',
      message: 'The service was okay.',
    })

    expect(result.id).toBe('feedback-789')
    expect(mockSupabase.feedbackSingle).toHaveBeenCalledTimes(1)
  })
})
