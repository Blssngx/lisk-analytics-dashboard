import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types for REST API responses
export interface Token {
  id: string
  name: string
  symbol: string
  contractAddress: string
  decimals: number
  totalSupply: string
  totalSupplyFormatted?: string
  circulatingSupply?: string
  marketCap: string
  blockNumber?: number
  validated: number
  verifiedContract: boolean
  possibleSpam: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DailyCumulativeMetrics {
  id: string
  date: string
  cumulativeTxCount: number
  cumulativeTxAmount: string
  dailyTxCount: number
  dailyTxAmount: string
  tokenId: string
}

export interface DailyUniqueWallets {
  id: string
  date: string
  uniqueWalletCount: number
  newWallets: number
  activeWallets: number
  tokenId: string
}

export interface WeeklyPayments {
  id: string
  weekStartDate: string
  totalPaymentsAmount: string
  paymentCount: number
  averagePayment: string
  tokenId: string
}

export interface TokenHolders {
  id: string
  date: string
  totalHolders: number
  totalSupply: string
  whaleCount: number
  largeCount: number
  mediumCount: number
  smallCount: number
  holdersData: any
  tokenId: string
}

// API functions
const fetchTokens = async (): Promise<Token[]> => {
  const response = await fetch('/api/tokens')
  if (!response.ok) {
    throw new Error('Failed to fetch tokens')
  }
  return response.json()
}

const fetchTokenBySymbol = async (symbol: string): Promise<Token> => {
  const response = await fetch(`/api/symbol/${symbol}`)
  if (!response.ok) {
    throw new Error('Failed to fetch token')
  }
  return response.json()
}

const fetchCumulativeMetrics = async (tokenId: string, days: number = 30): Promise<DailyCumulativeMetrics[]> => {
  const response = await fetch(`/api/tokens/${tokenId}/metrics`)
  if (!response.ok) {
    throw new Error('Failed to fetch cumulative metrics')
  }
  return response.json()
}

const fetchWalletData = async (tokenId: string, days: number = 30): Promise<DailyUniqueWallets[]> => {
  const response = await fetch(`/api/tokens/${tokenId}/wallets`)
  if (!response.ok) {
    throw new Error('Failed to fetch wallet data')
  }
  return response.json()
}

const fetchWeeklyPayments = async (tokenId: string, weeks: number = 12): Promise<WeeklyPayments[]> => {
  const response = await fetch(`/api/tokens/${tokenId}/payments`)
  if (!response.ok) {
    throw new Error('Failed to fetch weekly payments')
  }
  return response.json()
}

const fetchTokenHolders = async (tokenId: string): Promise<TokenHolders> => {
  const response = await fetch(`/api/tokens/${tokenId}/holders`)
  if (!response.ok) {
    throw new Error('Failed to fetch token holders')
  }
  return response.json()
}

// React Query hooks
export const useTokens = () => {
  return useQuery({
    queryKey: ['tokens'],
    queryFn: fetchTokens,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useTokenBySymbol = (symbol: string) => {
  return useQuery({
    queryKey: ['token', symbol],
    queryFn: () => fetchTokenBySymbol(symbol),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useCumulativeMetrics = (tokenId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['cumulativeMetrics', tokenId, days],
    queryFn: () => fetchCumulativeMetrics(tokenId, days),
    enabled: !!tokenId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useWalletData = (tokenId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['walletData', tokenId, days],
    queryFn: () => fetchWalletData(tokenId, days),
    enabled: !!tokenId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useWeeklyPayments = (tokenId: string, weeks: number = 12) => {
  return useQuery({
    queryKey: ['weeklyPayments', tokenId, weeks],
    queryFn: () => fetchWeeklyPayments(tokenId, weeks),
    enabled: !!tokenId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useTokenHolders = (tokenId: string) => {
  return useQuery({
    queryKey: ['tokenHolders', tokenId],
    queryFn: () => fetchTokenHolders(tokenId),
    enabled: !!tokenId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
