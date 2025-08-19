import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient()

export interface TokenData {
  name: string
  symbol: string
  contractAddress: string
  decimals?: number
  totalSupply?: number
  totalSupplyFormatted?: string
  circulatingSupply?: string
  marketCap?: number
  blockNumber?: number
  validated?: number
  verifiedContract?: boolean
  possibleSpam?: boolean
}

export interface CumulativeMetricsData {
  date: string
  cumulativeTxCount: number
  cumulativeTxAmount: number
  dailyTxCount?: number
  dailyTxAmount?: number
}

export interface WalletData {
  date: string
  uniqueWalletCount: number
  newWallets?: number
  activeWallets?: number
}

export interface PaymentData {
  weekStartDate: string
  totalPaymentsAmount: number
  paymentCount?: number
  averagePayment?: number
}

export interface PriceData {
  timestamp: string
  price: number
  volume?: number
  marketCap?: number
  change24h?: number
}

export interface TransactionData {
  timestamp: string
  transactionHash?: string
  fromAddress: string
  toAddress: string
  amount: number
  gasUsed?: number
  gasPrice?: number
  blockNumber?: number
  isSuccess?: boolean
}

export interface HourlyActivityData {
  date: string
  hour: number
  transactionCount: number
  totalVolume: number
  uniqueWallets: number
}

export class TokenDataService {
  // Token Management
  static async createToken(tokenData: TokenData) {
    return await prisma.token.create({
      data: {
        name: tokenData.name,
        symbol: tokenData.symbol,
        contractAddress: tokenData.contractAddress,
        decimals: tokenData.decimals || 18,
        totalSupply: tokenData.totalSupply || 0,
        totalSupplyFormatted: tokenData.totalSupplyFormatted,
        circulatingSupply: tokenData.circulatingSupply,
        marketCap: tokenData.marketCap || 0,
        blockNumber: tokenData.blockNumber,
        validated: tokenData.validated || 1,
        verifiedContract: tokenData.verifiedContract || false,
        possibleSpam: tokenData.possibleSpam || false,
        isActive: true
      }
    })
  }

  static async getToken(tokenId: string) {
    return await prisma.token.findUnique({
      where: { id: tokenId }
    })
  }

  static async getTokenBySymbol(symbol: string) {
    return await prisma.token.findUnique({
      where: { symbol }
    })
  }

  static async getAllTokens() {
    return await prisma.token.findMany({
      where: { isActive: true }
    })
  }

  // Cumulative Metrics
  static async upsertCumulativeMetrics(tokenId: string, data: CumulativeMetricsData) {
    return await prisma.dailyCumulativeMetrics.upsert({
      where: {
        tokenId_date: {
          tokenId,
          date: new Date(data.date)
        }
      },
      update: {
        cumulativeTxCount: data.cumulativeTxCount,
        cumulativeTxAmount: data.cumulativeTxAmount,
        dailyTxCount: data.dailyTxCount ?? 0,
        dailyTxAmount: data.dailyTxAmount ?? 0
      },
      create: {
        tokenId,
        date: new Date(data.date),
        cumulativeTxCount: data.cumulativeTxCount,
        cumulativeTxAmount: data.cumulativeTxAmount,
        dailyTxCount: data.dailyTxCount ?? 0,
        dailyTxAmount: data.dailyTxAmount ?? 0
      }
    })
  }

  static async getCumulativeMetrics(tokenId: string, days: number = 30) {
    return await prisma.dailyCumulativeMetrics.findMany({
      where: { tokenId },
      orderBy: { date: 'asc' },
      take: days
    })
  }

  static async getAllCumulativeMetrics(tokenId: string) {
    return await prisma.dailyCumulativeMetrics.findMany({
      where: { tokenId },
      orderBy: { date: 'asc' }
    })
  }

  // Wallet Data
  static async upsertWalletData(tokenId: string, data: WalletData) {
    return await prisma.dailyUniqueWallets.upsert({
      where: {
        tokenId_date: {
          tokenId,
          date: new Date(data.date)
        }
      },
      update: {
        uniqueWalletCount: data.uniqueWalletCount,
        newWallets: data.newWallets || 0,
        activeWallets: data.activeWallets || 0
      },
      create: {
        tokenId,
        date: new Date(data.date),
        uniqueWalletCount: data.uniqueWalletCount,
        newWallets: data.newWallets || 0,
        activeWallets: data.activeWallets || 0
      }
    })
  }

  static async getWalletData(tokenId: string, days: number = 30) {
    return await prisma.dailyUniqueWallets.findMany({
      where: { tokenId },
      orderBy: { date: 'asc' },
    })
  }

  static async getAllWalletData(tokenId: string) {
    return await prisma.dailyUniqueWallets.findMany({
      where: { tokenId },
      orderBy: { date: 'asc' }
    })
  }

  // Payment Data
  static async upsertPaymentData(tokenId: string, data: PaymentData) {
    return await prisma.weeklyPayments.upsert({
      where: {
        tokenId_weekStartDate: {
          tokenId,
          weekStartDate: new Date(data.weekStartDate)
        }
      },
      update: {
        totalPaymentsAmount: data.totalPaymentsAmount,
        paymentCount: data.paymentCount || 0,
        averagePayment: data.averagePayment || 0
      },
      create: {
        tokenId,
        weekStartDate: new Date(data.weekStartDate),
        totalPaymentsAmount: data.totalPaymentsAmount,
        paymentCount: data.paymentCount || 0,
        averagePayment: data.averagePayment || 0
      }
    })
  }

  static async getPaymentData(tokenId: string, weeks: number = 12) {
    return await prisma.weeklyPayments.findMany({
      where: { tokenId },
      orderBy: { weekStartDate: 'asc' },
      take: weeks
    })
  }

  static async getAllPaymentData(tokenId: string) {
    return await prisma.weeklyPayments.findMany({
      where: { tokenId },
      orderBy: { weekStartDate: 'asc' }
    })
  }

  // Price Data
  static async createPriceData(tokenId: string, data: PriceData) {
    return await prisma.tokenPriceData.create({
      data: {
        tokenId,
        timestamp: new Date(data.timestamp),
        price: data.price,
        volume: data.volume || 0,
        marketCap: data.marketCap || 0,
        change24h: data.change24h || 0
      }
    })
  }

  static async getPriceData(tokenId: string, hours: number = 24) {
    const startTime = new Date()
    startTime.setHours(startTime.getHours() - hours)

    return await prisma.tokenPriceData.findMany({
      where: {
        tokenId,
        timestamp: {
          gte: startTime
        }
      },
      orderBy: { timestamp: 'asc' }
    })
  }

  static async getAllPriceData(tokenId: string) {
    return await prisma.tokenPriceData.findMany({
      where: { tokenId },
      orderBy: { timestamp: 'asc' }
    })
  }

  // Transaction Activity
  static async createTransaction(tokenId: string, data: TransactionData) {
    return await prisma.transactionActivity.create({
      data: {
        tokenId,
        timestamp: new Date(data.timestamp),
        transactionHash: data.transactionHash,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        amount: data.amount,
        gasUsed: data.gasUsed || 0,
        gasPrice: data.gasPrice || 0,
        blockNumber: data.blockNumber,
        isSuccess: data.isSuccess !== false
      }
    })
  }

  static async getTransactions(tokenId: string, limit: number = 100) {
    return await prisma.transactionActivity.findMany({
      where: { tokenId },
      orderBy: { timestamp: 'desc' },
      take: limit
    })
  }

  // Hourly Activity
  static async upsertHourlyActivity(tokenId: string, data: HourlyActivityData) {
    return await prisma.hourlyActivity.upsert({
      where: {
        tokenId_date_hour: {
          tokenId,
          date: new Date(data.date),
          hour: data.hour
        }
      },
      update: {
        transactionCount: data.transactionCount,
        totalVolume: data.totalVolume,
        uniqueWallets: data.uniqueWallets
      },
      create: {
        tokenId,
        date: new Date(data.date),
        hour: data.hour,
        transactionCount: data.transactionCount,
        totalVolume: data.totalVolume,
        uniqueWallets: data.uniqueWallets
      }
    })
  }

  static async getHourlyActivity(tokenId: string, days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return await prisma.hourlyActivity.findMany({
      where: {
        tokenId,
        date: {
          gte: startDate
        }
      },
      orderBy: [
        { date: 'asc' },
        { hour: 'asc' }
      ]
    })
  }

  // Bulk Operations
  static async bulkUpsertCumulativeMetrics(tokenId: string, dataArray: CumulativeMetricsData[]) {
    const operations = dataArray.map(data => 
      this.upsertCumulativeMetrics(tokenId, data)
    )
    return await Promise.all(operations)
  }

  static async bulkUpsertWalletData(tokenId: string, dataArray: WalletData[]) {
    const operations = dataArray.map(data => 
      this.upsertWalletData(tokenId, data)
    )
    return await Promise.all(operations)
  }

  static async bulkCreatePriceData(tokenId: string, dataArray: PriceData[]) {
    const operations = dataArray.map(data => 
      this.createPriceData(tokenId, data)
    )
    return await Promise.all(operations)
  }

  // Analytics and Aggregations
  static async getTokenSummary(tokenId: string) {
    const [latestMetrics, latestWallets, latestPrice] = await Promise.all([
      prisma.dailyCumulativeMetrics.findFirst({
        where: { tokenId },
        orderBy: { date: 'desc' }
      }),
      prisma.dailyUniqueWallets.findFirst({
        where: { tokenId },
        orderBy: { date: 'desc' }
      }),
      prisma.tokenPriceData.findFirst({
        where: { tokenId },
        orderBy: { timestamp: 'desc' }
      })
    ])

    return {
      latestMetrics,
      latestWallets,
      latestPrice
    }
  }

  static async getTokenGrowthRate(tokenId: string, days: number = 7) {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [startMetrics, endMetrics] = await Promise.all([
      prisma.dailyCumulativeMetrics.findFirst({
        where: { tokenId },
        orderBy: { date: 'asc' }
      }),
      prisma.dailyCumulativeMetrics.findFirst({
        where: { tokenId },
        orderBy: { date: 'desc' }
      })
    ])

    if (!startMetrics || !endMetrics) {
      return null
    }

    const txGrowth = Number(endMetrics.cumulativeTxCount) - Number(startMetrics.cumulativeTxCount)
    const amountGrowth = Number(endMetrics.cumulativeTxAmount) - Number(startMetrics.cumulativeTxAmount)

    return {
      transactionGrowth: txGrowth,
      amountGrowth,
      transactionGrowthRate: (txGrowth / Number(startMetrics.cumulativeTxCount)) * 100,
      amountGrowthRate: (amountGrowth / Number(startMetrics.cumulativeTxAmount)) * 100
    }
  }

static async getTokenByContractAddress(contractAddress: string) {
  return await prisma.token.findUnique({
    where: { contractAddress }
  });
}

static async getTransactionsInDateRange(
  tokenId: string, 
  startDate: Date, 
  endDate: Date
) {
  return await prisma.transactionActivity.findMany({
    where: {
      tokenId,
      timestamp: {
        gte: startDate,
        lt: endDate
      }
    },
    orderBy: { timestamp: 'asc' }
  });
}}
