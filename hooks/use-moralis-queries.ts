import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MoralisTokenData, MoralisTransaction, MoralisTransfer } from '@/types'
// Request deduplication utility
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    const promise = requestFn()
    this.pendingRequests.set(key, promise)

    try {
      const result = await promise
      return result
    } finally {
      this.pendingRequests.delete(key)
    }
  }
}

const requestDeduplicator = new RequestDeduplicator()

// API functions
const fetchMoralisTokenData = async (contractAddress: string): Promise<MoralisTokenData> => {
  const response = await fetch(`/api/queries/token-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contractAddress }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch token data')
  }
  
  return response.json()
}

const fetchMoralisTransactions = async (contractAddress: string, limit: number = 100): Promise<MoralisTransaction[]> => {
  const response = await fetch(`/api/queries/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contractAddress, limit }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch transactions')
  }
  
  return response.json()
}

const fetchMoralisTransfers = async (contractAddress: string, limit: number = 100): Promise<MoralisTransfer[]> => {
  const response = await fetch(`/api/queries/transfers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contractAddress, limit }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch transfers')
  }
  
  return response.json()
}

const fetchCumulativeGrowth = async (contractAddress: string): Promise<any> => {
  const response = await fetch(`/api/queries/cumulative-growth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contractAddress }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch cumulative growth data (${response.status})`)
  }
  
  const result = await response.json()
  return result.data || result // Return data property if it exists, otherwise return the whole result
}

const fetchUniqueWallets = async (contractAddress: string): Promise<any> => {
  const response = await fetch(`/api/queries/unique-wallets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contractAddress }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch unique wallets data (${response.status})`)
  }
  
  const result = await response.json()
  return result.data || result // Return data property if it exists, otherwise return the whole result
}

const fetchWeeklyPayments = async (contractAddress: string, methodId: string): Promise<any> => {
  const response = await fetch(`/api/queries/weekly-payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contractAddress, methodId }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch weekly payments data (${response.status})`)
  }
  
  const result = await response.json()
  return result.data || result // Return data property if it exists, otherwise return the whole result
}
const fetchTokenHolders = async (contractAddress: string): Promise<any> => {
  const response = await fetch(`/api/queries/holders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contractAddress }), // Only send contractAddress, methodId not needed
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch token holders data (${response.status})`)
  }
  
  const result = await response.json()
  return result.data || result // Return data property if it exists, otherwise return the whole result
}

// React Query hooks
export const useMoralisTokenData = (contractAddress: string) => {
  return useQuery({
    queryKey: ['moralis', 'token', contractAddress],
    queryFn: () => requestDeduplicator.deduplicate(`moralis:token:data:${contractAddress}`, () => fetchMoralisTokenData(contractAddress)),
    enabled: !!contractAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useMoralisTransactions = (contractAddress: string, limit: number = 100) => {
  return useQuery({
    queryKey: ['moralis', 'transactions', contractAddress, limit],
    queryFn: () => requestDeduplicator.deduplicate(`moralis:transactions:${contractAddress}:${limit}`, () => fetchMoralisTransactions(contractAddress, limit)),
    enabled: !!contractAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useMoralisTransfers = (contractAddress: string, limit: number = 100) => {
  return useQuery({
    queryKey: ['moralis', 'transfers', contractAddress, limit],
    queryFn: () => requestDeduplicator.deduplicate(`moralis:transfers:${contractAddress}:${limit}`, () => fetchMoralisTransfers(contractAddress, limit)),
    enabled: !!contractAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCumulativeGrowth = (contractAddress: string) => {
  return useQuery({
    queryKey: ['moralis', 'cumulative-growth', contractAddress],
    queryFn: () => requestDeduplicator.deduplicate(`moralis:cumulative-growth:${contractAddress}`, () => fetchCumulativeGrowth(contractAddress)),
    enabled: !!contractAddress,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useUniqueWallets = (contractAddress: string) => {
  return useQuery({
    queryKey: ['moralis', 'unique-wallets', contractAddress],
    queryFn: () => requestDeduplicator.deduplicate(`moralis:unique-wallets:${contractAddress}`, () => fetchUniqueWallets(contractAddress)),
    enabled: !!contractAddress,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useWeeklyPayments = (contractAddress: string, methodId: string) => {
  return useQuery({
    queryKey: ['moralis', 'weekly-payments', contractAddress, methodId],
    queryFn: () => requestDeduplicator.deduplicate(`moralis:weekly-payments:${contractAddress}:${methodId}`, () => fetchWeeklyPayments(contractAddress, methodId)),
    enabled: !!contractAddress && !!methodId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}
export const useMoralisTokenHolders = (contractAddress: string) => {
  return useQuery({
    queryKey: ['moralis', 'token-holders', contractAddress],
    queryFn: () => requestDeduplicator.deduplicate(`moralis:token-holders:${contractAddress}`, () => fetchTokenHolders(contractAddress)),
    enabled: !!contractAddress,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// New hook for fetching token metadata from Moralis
export const useTokenMetadata = (contractAddress: string) => {
  return useQuery({
    queryKey: ['tokenMetadata', contractAddress],
    queryFn: () => requestDeduplicator.deduplicate(`token-metadata:${contractAddress}`, async (): Promise<MoralisTokenData> => {
      const response = await fetch('/api/moralis/token-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractAddress }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch token metadata')
      }
      
      const res = await response.json()
      return res.data
    }),
    enabled: !!contractAddress,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutation hooks for triggering data updates
export const useRefreshTokenData = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ contractAddress }: { contractAddress: string }) => {
      return requestDeduplicator.deduplicate(`refresh-token-data:${contractAddress}`, async () => {
        const response = await fetch(`/api/queries/token-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contractAddress }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to refresh token data')
        }
        
        return response.json()
      })
    },
    onSuccess: (data, { contractAddress }) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['moralis', 'token', contractAddress] })
      queryClient.invalidateQueries({ queryKey: ['graphql', 'tokens'] })
    },
  })
}

export const useRefreshCumulativeGrowth = () => {
  const queryClient = useQueryClient()
  const COOLDOWN_MS = 10 * 1000
  const lastRunKey = 'cooldown:cumulative-growth'
  
  return useMutation({
    mutationFn: async ({ contractAddress }: { contractAddress: string }) => {
      const lastRun = Number(localStorage.getItem(lastRunKey) || 0)
      if (Date.now() - lastRun < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastRun)) / 1000)
        throw new Error(`Please wait ${remaining}s before running again`)
      }
      
      return requestDeduplicator.deduplicate(`refresh-cumulative-growth:${contractAddress}`, async () => {
        const response = await fetch(`/api/queries/cumulative-growth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contractAddress }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to refresh cumulative growth data')
        }
        
        localStorage.setItem(lastRunKey, String(Date.now()))
        return response.json()
      })
    },
    onSuccess: (data, { contractAddress }) => {
      // Push fresh results into cache so charts update immediately
      const payload = (data as any)?.data ?? data
      queryClient.setQueryData(['moralis', 'cumulative-growth', contractAddress], payload)
      queryClient.invalidateQueries({ queryKey: ['graphql', 'cumulativeMetrics'] })
    },
    onError: (error) => {
      console.error('Cumulative growth refresh error:', error)
    },
  })
}

export const useRefreshUniqueWallets = () => {
  const queryClient = useQueryClient()
  const COOLDOWN_MS = 10 * 1000
  const lastRunKey = 'cooldown:unique-wallets'
  
  return useMutation({
    mutationFn: async ({ contractAddress }: { contractAddress: string }) => {
      const lastRun = Number(localStorage.getItem(lastRunKey) || 0)
      if (Date.now() - lastRun < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastRun)) / 1000)
        throw new Error(`Please wait ${remaining}s before running again`)
      }
      
      return requestDeduplicator.deduplicate(`refresh-unique-wallets:${contractAddress}`, async () => {
        const response = await fetch(`/api/queries/unique-wallets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contractAddress }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to refresh unique wallets data')
        }
        
        localStorage.setItem(lastRunKey, String(Date.now()))
        return response.json()
      })
    },
    onSuccess: (data, { contractAddress }) => {
      const payload = (data as any)?.data ?? data
      queryClient.setQueryData(['moralis', 'unique-wallets', contractAddress], payload)
      queryClient.invalidateQueries({ queryKey: ['graphql', 'walletData'] })
    },
    onError: (error) => {
      console.error('Unique wallets refresh error:', error)
    },
  })
}

export const useRefreshWeeklyPayments = () => {
  const queryClient = useQueryClient()
  const COOLDOWN_MS = 10 * 1000
  const lastRunKey = 'cooldown:weekly-payments'
  
  return useMutation({
    mutationFn: async ({ contractAddress, methodId }: { contractAddress: string; methodId: string }) => {
      const lastRun = Number(localStorage.getItem(lastRunKey) || 0)
      if (Date.now() - lastRun < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastRun)) / 1000)
        throw new Error(`Please wait ${remaining}s before running again`)
      }
      
      return requestDeduplicator.deduplicate(`refresh-weekly-payments:${contractAddress}:${methodId}`, async () => {
        const response = await fetch(`/api/queries/weekly-payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contractAddress, methodId }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to refresh weekly payments data')
        }
        
        localStorage.setItem(lastRunKey, String(Date.now()))
        return response.json()
      })
    },
    onSuccess: (data, { contractAddress, methodId }) => {
      const payload = (data as any)?.data ?? data
      queryClient.setQueryData(['moralis', 'weekly-payments', contractAddress, methodId], payload)
      queryClient.invalidateQueries({ queryKey: ['graphql', 'weeklyPayments'] })
    },
    onError: (error) => {
      console.error('Weekly payments refresh error:', error)
    },
  })
}

export const useRefreshTokenHolders = () => {
  const queryClient = useQueryClient()
  const COOLDOWN_MS = 10 * 1000
  const lastRunKey = 'cooldown:token-holders'
  
  return useMutation({
    mutationFn: async ({ contractAddress }: { contractAddress: string }) => {
      const lastRun = Number(localStorage.getItem(lastRunKey) || 0)
      if (Date.now() - lastRun < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastRun)) / 1000)
        throw new Error(`Please wait ${remaining}s before running again`)
      }
      
      return requestDeduplicator.deduplicate(`refresh-token-holders:${contractAddress}`, async () => {
        const response = await fetch(`/api/queries/holders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contractAddress }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to refresh token holders data')
        }
        
        localStorage.setItem(lastRunKey, String(Date.now()))
        return response.json()
      })
    },
    onSuccess: (data, { contractAddress }) => {
      const payload = (data as any)?.data ?? data
      queryClient.setQueryData(['moralis', 'token-holders', contractAddress], payload)
      queryClient.invalidateQueries({ queryKey: ['graphql', 'tokenHolders'] })
    },
    onError: (error) => {
      console.error('Token holders refresh error:', error)
    },
  })
}
