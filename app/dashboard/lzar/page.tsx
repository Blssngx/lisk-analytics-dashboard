"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { MetricCard } from "@/components/metric-card"
import { ChartCard } from "@/components/chart-card"
import { Button } from "@/components/ui/button"
import { ChartAreaInteractive } from "@/components/charts/cumulative-growth-chart"
import { WeeklyPaymentsChart } from "@/components/charts/weekly-payments-chart"
import { UniqueWalletsDisplay } from "@/components/unique-wallets-display"
import { TokenHoldersPieChart } from "@/components/charts/holders-pie-chart"
import { PlayCircle, TrendingUp, Copy, Check } from "lucide-react"
import { useTokenBySymbol, useCumulativeMetrics, useWalletData, useWeeklyPayments, useTokenHolders } from "@/hooks/use-token-data"
import { useCumulativeGrowth, useUniqueWallets, useWeeklyPayments as useMoralisWeeklyPayments, useRefreshCumulativeGrowth, useRefreshUniqueWallets, useRefreshWeeklyPayments, useRefreshTokenHolders, useMoralisTokenHolders } from "@/hooks/use-moralis-queries"

export default function LZARPage() {
  const LZAR_CONTRACT = '0x7b7047c49eaf68b8514a20624773ca620e2cd4a3'
  const METHOD_ID = '0xa9059cbb'

  // REST API cached data
  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useTokenBySymbol('LZAR')
  const tokenId = tokenData?.id || ''
  
  // Only run these queries when we have a valid tokenId
  const { data: gqlCum, isLoading: gqlCumLoading, error: gqlCumError } = useCumulativeMetrics(tokenId)
  const { data: gqlWallets, isLoading: gqlWalletsLoading, error: gqlWalletsError } = useWalletData(tokenId)
  const { data: gqlWeekly, isLoading: gqlWeeklyLoading, error: gqlWeeklyError } = useWeeklyPayments(tokenId)
  const { data: gqlHolders, isLoading: gqlHoldersLoading, error: gqlHoldersError } = useTokenHolders(tokenId)
  
  // Moralis fresh data
  const { data: cumulativeGrowthData, isLoading: cumulativeGrowthLoading } = useCumulativeGrowth(LZAR_CONTRACT)
  const { data: uniqueWalletsData, isLoading: uniqueWalletsLoading } = useUniqueWallets(LZAR_CONTRACT)
  const { data: weeklyPaymentsData, isLoading: weeklyPaymentsLoading } = useMoralisWeeklyPayments(LZAR_CONTRACT, METHOD_ID)
  const {data: tokenHoldersData, isLoading: tokenHoldersLoading} = useMoralisTokenHolders(LZAR_CONTRACT, METHOD_ID)

  // Mutations
  const refreshCumulativeGrowth = useRefreshCumulativeGrowth()
  const refreshUniqueWallets = useRefreshUniqueWallets()
  const refreshWeeklyPayments = useRefreshWeeklyPayments()
  const refreshTokenHolders = useRefreshTokenHolders()

  const [loadingStates, setLoadingStates] = useState({
    cumulativeGrowth: false,
    uniqueWallets: false,
    weeklyPayments: false,
    tokenHolders: false,
    allQueries: false,
  })

  // Test function to manually trigger REST API query
  // const testRestAPI = async () => {
  //   try {
  //     const response = await fetch('/api/symbol/LZAR')
  //     const result = await response.json()
  //     console.log('Manual REST API test result:', result)
  //   } catch (error) {
  //     console.error('Manual REST API test error:', error)
  //   }
  // }

  const runQuery = async (queryType: keyof typeof loadingStates) => {
    setLoadingStates((prev) => ({ ...prev, [queryType]: true }))
    try {
      switch (queryType) {
        case "cumulativeGrowth":
          await refreshCumulativeGrowth.mutateAsync({ contractAddress: LZAR_CONTRACT })
          break
        case "uniqueWallets":
          await refreshUniqueWallets.mutateAsync({ contractAddress: LZAR_CONTRACT })
          break
        case "weeklyPayments":
          await refreshWeeklyPayments.mutateAsync({ contractAddress: LZAR_CONTRACT, methodId: METHOD_ID })
          break
        case "tokenHolders":
          await refreshTokenHolders.mutateAsync({ contractAddress: LZAR_CONTRACT })
          break
      }
    } finally {
      setLoadingStates((prev) => ({ ...prev, [queryType]: false }))
    }
  }

  const runAllQueries = async () => {
    setLoadingStates((prev) => ({ ...prev, allQueries: true }))
    try {
      await Promise.all([
        refreshCumulativeGrowth.mutateAsync({ contractAddress: LZAR_CONTRACT }),
        refreshUniqueWallets.mutateAsync({ contractAddress: LZAR_CONTRACT }),
        refreshWeeklyPayments.mutateAsync({ contractAddress: LZAR_CONTRACT, methodId: METHOD_ID }),
        refreshTokenHolders.mutateAsync({ contractAddress: LZAR_CONTRACT })
      ])
    } finally {
      setLoadingStates((prev) => ({ ...prev, allQueries: false }))
    }
  }

  const [copied, setCopied] = useState(false)
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  // Build fallbacks from REST API data
  const cumFallback = (gqlCum || []).map(m => ({
    date: m.date,
    cumulativeTxCount: Number(m.cumulativeTxCount),
    dailyTxCount: Number(m.dailyTxCount),
    cumulativeTxAmount: Number(m.cumulativeTxAmount),
    dailyTxAmount: Number(m.dailyTxAmount)
  }))
  const walletsFallback = (gqlWallets || []).map(w => ({
    date: w.date,
    uniqueWalletCount: Number(w.uniqueWalletCount),
    newWallets: Number(w.newWallets),
    activeWallets: Number(w.activeWallets)
  }))
  const weeklyFallback = (gqlWeekly || []).map(w => ({
    weekStartDate: w.weekStartDate,
    totalPaymentsAmount: Number(w.totalPaymentsAmount),
    paymentCount: Number(w.paymentCount),
    averagePayment: Number(w.averagePayment)
  }))
  const holdersFallback = gqlHolders

  const cumulativeDisplay = (Array.isArray(cumulativeGrowthData) && cumulativeGrowthData.length > 0) ? cumulativeGrowthData : cumFallback
  const walletsDisplay = (Array.isArray(uniqueWalletsData) && uniqueWalletsData.length > 0) ? uniqueWalletsData : walletsFallback
  const weeklyDisplay = (Array.isArray(weeklyPaymentsData) && weeklyPaymentsData.length > 0) ? weeklyPaymentsData : weeklyFallback
  const holdersDisplay = (Array.isArray(tokenHoldersData) && tokenHoldersData.length > 0) ? tokenHoldersData : holdersFallback
  // Debug logging
  // useEffect(() => {
  //   console.log('LZAR Page Debug Info:', {
  //     tokenData,
  //     tokenId,
  //     tokenLoading,
  //     tokenError,
  //     gqlCum,
  //     gqlWallets,
  //     gqlWeekly,
  //     gqlCumError,
  //     gqlWalletsError,
  //     gqlWeeklyError,
  //     cumulativeDisplay,
  //     walletsDisplay,
  //     weeklyDisplay
  //   })
  // }, [tokenData, tokenId, tokenLoading, tokenError, gqlCum, gqlWallets, gqlWeekly, gqlCumError, gqlWalletsError, gqlWeeklyError, cumulativeDisplay, walletsDisplay, weeklyDisplay])

  const currentTotalWallets = walletsDisplay.length > 0 ? walletsDisplay[walletsDisplay.length-1].uniqueWalletCount : 0

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">LZAR Token Analytics</h1>
                </div>
                <p className="text-gray-400 mt-1">Comprehensive analytics for LZAR token on the Lisk network</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={runAllQueries} disabled={loadingStates.allQueries} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
                  <PlayCircle className="h-4 w-4 mr-2" />{loadingStates.allQueries ? "Running All Queries..." : "Run All Queries"}
                </Button>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          {/* {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-800 p-4 rounded-lg text-sm">
              <h3 className="text-white font-semibold mb-2">Debug Info:</h3>
              <div className="text-gray-300 space-y-1">
                <div>Token ID: {tokenId || 'Not found'}</div>
                <div>Token Loading: {tokenLoading ? 'Yes' : 'No'}</div>
                <div>Token Error: {tokenError ? 'Yes' : 'No'}</div>
                <div>Cumulative Data: {gqlCum?.length || 0} records</div>
                <div>Wallet Data: {gqlWallets?.length || 0} records</div>
                <div>Weekly Data: {gqlWeekly?.length || 0} records</div>
                <div>Final Cumulative Display: {cumulativeDisplay.length} records</div>
                <div>Final Wallets Display: {walletsDisplay.length} records</div>
                <div>Final Weekly Display: {weeklyDisplay.length} records</div>
                {tokenError && <div className="text-red-400">Token Error: {tokenError.message}</div>}
                {gqlCumError && <div className="text-red-400">Cumulative Error: {gqlCumError.message}</div>}
                {gqlWalletsError && <div className="text-red-400">Wallets Error: {gqlWalletsError.message}</div>}
                {gqlWeeklyError && <div className="text-red-400">Weekly Error: {gqlWeeklyError.message}</div>}
              </div>
            </div>
          )} */}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard title="Total Supply" value={tokenLoading ? "Loading..." : `${Number(tokenData?.totalSupplyFormatted).toLocaleString() || 'N/A'} LZAR`} subtitle={tokenError ? "Error loading data" : "Fixed supply"} />
            <MetricCard title="Contract Address" value={tokenLoading ? "Loading..." : `${tokenData?.contractAddress?.slice(0,8)}...${tokenData?.contractAddress?.slice(-6)}`} subtitle={tokenError ? "Error loading data" : "Token Contract address"}>
              <Button onClick={() => copyToClipboard(tokenData?.contractAddress || '')} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </MetricCard>
          </div>

          {/* Charts */}
          <div className="space-y-6">
            <ChartCard title="Cumulative Growth" description="Cumulative transaction count and total volume for LZAR over time." isLoading={loadingStates.cumulativeGrowth || cumulativeGrowthLoading} onRunQuery={() => runQuery("cumulativeGrowth")} cooldownKey="cooldown:cumulative-growth">
              {/* <CumulativeGrowthChart data={cumulativeDisplay} /> */}
              <ChartAreaInteractive data={cumulativeDisplay} isLoading={loadingStates.cumulativeGrowth || cumulativeGrowthLoading} symbol="LZAR"/>
            </ChartCard>
            <ChartCard title="Unique Wallets" description="Unique wallets and new wallets over time for LZAR." isLoading={loadingStates.uniqueWallets || uniqueWalletsLoading} onRunQuery={() => runQuery("uniqueWallets")} cooldownKey="cooldown:unique-wallets">
<UniqueWalletsDisplay data={walletsDisplay} currentTotal={currentTotalWallets} />
</ChartCard>

                <ChartCard title="Weekly Interest Payments" description="Weekly interest payments: toggle between payment count, total amount paid and average payments per week." isLoading={loadingStates.weeklyPayments || weeklyPaymentsLoading} onRunQuery={() => runQuery("weeklyPayments")} cooldownKey="cooldown:weekly-payments">
                  <WeeklyPaymentsChart data={weeklyDisplay} symbol="LZAR"/>
                </ChartCard>
                
                <ChartCard title="Token Holders Distribution" description="Distribution of token holders by balance size categories." isLoading={loadingStates.tokenHolders} onRunQuery={() => runQuery("tokenHolders")} cooldownKey="cooldown:token-holders">
                  <TokenHoldersPieChart data={holdersDisplay} symbol="LZAR" isLoading={tokenHoldersLoading} />
                </ChartCard>
           
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
