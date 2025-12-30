import { useState, useEffect, useCallback } from 'react'

export function useQuery<T>(url: string, enabled: boolean = true) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    if (!enabled) return

    try {
      setIsLoading(true)
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [url, enabled])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, isLoading, error, refetch }
}

export function useMutation<TData, TVariables>(
  fetcher: (variables: TVariables) => Promise<Response>
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetcher(variables)
        if (!response.ok) throw new Error('Mutation failed')
        const data = await response.json()
        return data
      } catch (err) {
        setError(err as Error)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [fetcher]
  )

  return { mutate, isLoading, error }
}
