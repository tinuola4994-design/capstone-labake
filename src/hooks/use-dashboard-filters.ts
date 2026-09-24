import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export type DashboardFilters = {
  locationId: string | null
  routingStatus: string | null
  alertStatus: string | null
  search: string
  sentimentBucket: string | null
}

export function useDashboardFilters() {
  const [params, setParams] = useSearchParams()

  const filters: DashboardFilters = useMemo(
    () => ({
      locationId: params.get('location'),
      routingStatus: params.get('routing'),
      alertStatus: params.get('alert'),
      search: params.get('q') ?? '',
      sentimentBucket: params.get('sentiment'),
    }),
    [params],
  )

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (!value) next.delete(key)
          else next.set(key, value)
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const setLocationId = useCallback(
    (id: string | null) => setFilter('location', id),
    [setFilter],
  )

  const setRoutingStatus = useCallback(
    (status: string | null) => setFilter('routing', status),
    [setFilter],
  )

  const setAlertStatus = useCallback(
    (status: string | null) => {
      // Persist "all" explicitly so Alerts can distinguish default-open vs show-all
      setFilter('alert', status)
    },
    [setFilter],
  )

  const setSearch = useCallback(
    (q: string) => setFilter('q', q || null),
    [setFilter],
  )

  const setSentimentBucket = useCallback(
    (bucket: string | null) => setFilter('sentiment', bucket),
    [setFilter],
  )

  const clearFilters = useCallback(() => {
    setParams({}, { replace: true })
  }, [setParams])

  return {
    filters,
    setLocationId,
    setRoutingStatus,
    setAlertStatus,
    setSearch,
    setSentimentBucket,
    clearFilters,
  }
}
