import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types for Moralis API responses
export interface MoralisTokenData {
  address: string
  address_label: string | null
  name: string
  symbol: string
  decimals: string
  logo: string | null
  logo_hash: string | null
  thumbnail: string | null
  total_supply: string
  total_supply_formatted: string
  fully_diluted_valuation: string
  block_number: string
  validated: number
  created_at: string
  possible_spam: boolean
  verified_contract: boolean
  categories: string[]
  links: Record<string, any>
  security_score: number | null
  description: string | null
  circulating_supply: string
  market_cap: string
}

export interface MoralisTransaction {
  hash: string
  nonce: string
  transaction_index: string
  from_address: string
  to_address: string
  value: string
  gas: string
  gas_price: string
  input: string
  receipt_cumulative_gas_used: string
  receipt_gas_used: string
  receipt_contract_address: string | null
  receipt_root: string | null
  receipt_status: string
  block_timestamp: string
  block_number: string
  block_hash: string
  transfer_index: number[]
}

export interface MoralisTransfer {
  transaction_hash: string
  address: string
  block_timestamp: string
  block_number: string
  block_hash: string
  to_address: string
  from_address: string
  value: string
  transaction_type: string
  token_address: string
  token_name: string
  token_symbol: string
  token_decimals: string
  token_logo: string | null
  token_thumbnail: string | null
  token_logo_hash: string | null
  token_thumbnail_hash: string | null
  method_label: string | null
  method_name: string | null
  block_truncated: boolean
  category: string
  verified: number
  verified_method: string | null
  verified_method_signature: string | null
  verified_method_signature_hash: string | null
  verified_contract: boolean
  verified_contract_name: string | null
  verified_contract_symbol: string | null
  verified_contract_decimals: number | null
  verified_contract_logo: string | null
  verified_contract_thumbnail: string | null
  verified_contract_logo_hash: string | null
  verified_contract_thumbnail_hash: string | null
  collection_logo: string | null
  collection_thumbnail: string | null
  collection_logo_hash: string | null
  collection_thumbnail_hash: string | null
  possible_spam: boolean
  verified_collection: boolean
  verified_collection_name: string | null
  verified_collection_symbol: string | null
  verified_collection_logo: string | null
  verified_collection_thumbnail: string | null
  verified_collection_logo_hash: string | null
  verified_collection_thumbnail_hash: string | null
  nft_token_id: string | null
  nft_metadata_name: string | null
  nft_metadata_symbol: string | null
  nft_metadata_contract_type: string | null
  nft_metadata_token_hash: string | null
  nft_metadata_last_token_uri_sync: string | null
  nft_metadata_last_metadata_sync: string | null
  amount: string
  amount_decimal: string
  block_decimal: string
  log_index: number
  value_decimal: string
  value_quote: number
  pretty_value_quote: string
  gas_offered: string
  gas_spent: string
  gas_price: string
  fees_paid: string
  gas_quote: number
  pretty_gas_quote: string
  gas_quote_rate: number
  log_offset: number
  raw_log_data: string
  decoded_log: {
    name: string
    signature: string
    params: Array<{
      name: string
      type: string
      indexed: boolean
      decoded: boolean
      value: string
    }>
  } | null
}

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
const fetchTokenHolders = async (contractAddress: string, methodId: string): Promise<any> => {
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
    queryFn: () => fetchMoralisTokenData(contractAddress),
    enabled: !!contractAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useMoralisTransactions = (contractAddress: string, limit: number = 100) => {
  return useQuery({
    queryKey: ['moralis', 'transactions', contractAddress, limit],
    queryFn: () => fetchMoralisTransactions(contractAddress, limit),
    enabled: !!contractAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useMoralisTransfers = (contractAddress: string, limit: number = 100) => {
  return useQuery({
    queryKey: ['moralis', 'transfers', contractAddress, limit],
    queryFn: () => fetchMoralisTransfers(contractAddress, limit),
    enabled: !!contractAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCumulativeGrowth = (contractAddress: string) => {
  return useQuery({
    queryKey: ['moralis', 'cumulative-growth', contractAddress],
    queryFn: () => fetchCumulativeGrowth(contractAddress),
    enabled: !!contractAddress,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useUniqueWallets = (contractAddress: string) => {
  return useQuery({
    queryKey: ['moralis', 'unique-wallets', contractAddress],
    queryFn: () => fetchUniqueWallets(contractAddress),
    enabled: !!contractAddress,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useWeeklyPayments = (contractAddress: string, methodId: string) => {
  return useQuery({
    queryKey: ['moralis', 'weekly-payments', contractAddress, methodId],
    queryFn: () => fetchWeeklyPayments(contractAddress, methodId),
    enabled: !!contractAddress && !!methodId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}
export const useMoralisTokenHolders = (contractAddress: string, methodId: string) => {
  return useQuery({
    queryKey: ['moralis', 'token-holders', contractAddress, methodId],
    queryFn: () => fetchTokenHolders(contractAddress, methodId),
    enabled: !!contractAddress && !!methodId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// New hook for fetching token metadata from Moralis
export const useTokenMetadata = (contractAddress: string) => {
  return useQuery({
    queryKey: ['tokenMetadata', contractAddress],
    queryFn: async (): Promise<MoralisTokenData> => {
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
    },
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
  const COOLDOWN_MS = 5 * 60 * 1000
  const lastRunKey = 'cooldown:cumulative-growth'
  
  return useMutation({
    mutationFn: async ({ contractAddress }: { contractAddress: string }) => {
      const lastRun = Number(localStorage.getItem(lastRunKey) || 0)
      if (Date.now() - lastRun < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastRun)) / 1000)
        throw new Error(`Please wait ${remaining}s before running again`)
      }
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
  const COOLDOWN_MS = 5 * 60 * 1000
  const lastRunKey = 'cooldown:unique-wallets'
  
  return useMutation({
    mutationFn: async ({ contractAddress }: { contractAddress: string }) => {
      const lastRun = Number(localStorage.getItem(lastRunKey) || 0)
      if (Date.now() - lastRun < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastRun)) / 1000)
        throw new Error(`Please wait ${remaining}s before running again`)
      }
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
  const COOLDOWN_MS = 5 * 60 * 1000
  const lastRunKey = 'cooldown:weekly-payments'
  
  return useMutation({
    mutationFn: async ({ contractAddress, methodId }: { contractAddress: string; methodId: string }) => {
      const lastRun = Number(localStorage.getItem(lastRunKey) || 0)
      if (Date.now() - lastRun < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastRun)) / 1000)
        throw new Error(`Please wait ${remaining}s before running again`)
      }
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
  const COOLDOWN_MS = 5 * 60 * 1000
  const lastRunKey = 'cooldown:token-holders'
  
  return useMutation({
    mutationFn: async ({ contractAddress }: { contractAddress: string }) => {
      const lastRun = Number(localStorage.getItem(lastRunKey) || 0)
      if (Date.now() - lastRun < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastRun)) / 1000)
        throw new Error(`Please wait ${remaining}s before running again`)
      }
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
