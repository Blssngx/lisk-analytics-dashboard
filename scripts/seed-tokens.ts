import { PrismaClient } from '../lib/generated/prisma'
import { TokenDataService } from '../lib/services/token-data-service'

const prisma = new PrismaClient()

async function seedTokens() {
  try {
    console.log('🌱 Starting token seeding...')

    // Create LZAR token with actual data from Moralis
    const lzarToken = await TokenDataService.createToken({
      name: 'L ZAR Coin',
      symbol: 'LZAR',
      contractAddress: '0x7b7047c49eaf68b8514a20624773ca620e2cd4a3',
      decimals: 18,
      totalSupply: BigInt('10576000000000000000000000'),
      totalSupplyFormatted: '10576000',
      circulatingSupply: '10576000',
      marketCap: 0,
      blockNumber: BigInt('13707424'),
      validated: 1,
      verifiedContract: false,
      possibleSpam: false
    })

    console.log('✅ Created LZAR token:', lzarToken.id)

    // Create LUSD token with actual data from Moralis
    const lusdToken = await TokenDataService.createToken({
      name: 'L USD Coin',
      symbol: 'LUSD',
      contractAddress: '0x2a0fa5d670deb472c1a72977b75ba53d1e6fab72',
      decimals: 18,
      totalSupply: BigInt('165000000000000000000000'),
      totalSupplyFormatted: '165000',
      circulatingSupply: '165000',
      marketCap: 0,
      blockNumber: BigInt('13707094'),
      validated: 1,
      verifiedContract: false,
      possibleSpam: false
    })

    console.log('✅ Created LUSD token:', lusdToken.id)

    // Seed sample cumulative metrics data for LZAR
    const lzarCumulativeData = [
      { date: '2024-01-01', cumulativeTxCount: 1000, cumulativeTxAmount: 50000, dailyTxCount: 50, dailyTxAmount: 2500 },
      { date: '2024-01-02', cumulativeTxCount: 1200, cumulativeTxAmount: 60000, dailyTxCount: 200, dailyTxAmount: 10000 },
      { date: '2024-01-03', cumulativeTxCount: 1500, cumulativeTxAmount: 75000, dailyTxCount: 300, dailyTxAmount: 15000 },
      { date: '2024-01-04', cumulativeTxCount: 1900, cumulativeTxAmount: 95000, dailyTxCount: 400, dailyTxAmount: 20000 },
      { date: '2024-01-05', cumulativeTxCount: 2400, cumulativeTxAmount: 120000, dailyTxCount: 500, dailyTxAmount: 25000 },
      { date: '2024-01-06', cumulativeTxCount: 3000, cumulativeTxAmount: 150000, dailyTxCount: 600, dailyTxAmount: 30000 },
      { date: '2024-01-07', cumulativeTxCount: 3700, cumulativeTxAmount: 185000, dailyTxCount: 700, dailyTxAmount: 35000 },
    ]

    await TokenDataService.bulkUpsertCumulativeMetrics(lzarToken.id, lzarCumulativeData)
    console.log('✅ Seeded LZAR cumulative metrics')

    // Seed sample wallet data for LZAR
    const lzarWalletData = [
      { date: '2024-01-01', uniqueWalletCount: 500, newWallets: 50, activeWallets: 200 },
      { date: '2024-01-02', uniqueWalletCount: 600, newWallets: 100, activeWallets: 250 },
      { date: '2024-01-03', uniqueWalletCount: 750, newWallets: 150, activeWallets: 300 },
      { date: '2024-01-04', uniqueWalletCount: 900, newWallets: 150, activeWallets: 350 },
      { date: '2024-01-05', uniqueWalletCount: 1100, newWallets: 200, activeWallets: 400 },
      { date: '2024-01-06', uniqueWalletCount: 1300, newWallets: 200, activeWallets: 450 },
      { date: '2024-01-07', uniqueWalletCount: 1500, newWallets: 200, activeWallets: 500 },
    ]

    await TokenDataService.bulkUpsertWalletData(lzarToken.id, lzarWalletData)
    console.log('✅ Seeded LZAR wallet data')

    // Seed sample payment data for LZAR
    const lzarPaymentData = [
      { weekStartDate: '2024-01-01', totalPaymentsAmount: 5000, paymentCount: 100, averagePayment: 50 },
      { weekStartDate: '2024-01-08', totalPaymentsAmount: 7500, paymentCount: 150, averagePayment: 50 },
      { weekStartDate: '2024-01-15', totalPaymentsAmount: 10000, paymentCount: 200, averagePayment: 50 },
      { weekStartDate: '2024-01-22', totalPaymentsAmount: 12500, paymentCount: 250, averagePayment: 50 },
      { weekStartDate: '2024-01-29', totalPaymentsAmount: 15000, paymentCount: 300, averagePayment: 50 },
    ]

    for (const payment of lzarPaymentData) {
      await TokenDataService.upsertPaymentData(lzarToken.id, payment)
    }
    console.log('✅ Seeded LZAR payment data')

    // Seed sample price data for LZAR
    const lzarPriceData = [
      { timestamp: '2024-01-01T00:00:00Z', price: 1.00, volume: 100000, marketCap: 1000000000, change24h: 0 },
      { timestamp: '2024-01-01T06:00:00Z', price: 1.02, volume: 120000, marketCap: 1020000000, change24h: 2.0 },
      { timestamp: '2024-01-01T12:00:00Z', price: 1.05, volume: 150000, marketCap: 1050000000, change24h: 5.0 },
      { timestamp: '2024-01-01T18:00:00Z', price: 1.03, volume: 130000, marketCap: 1030000000, change24h: 3.0 },
      { timestamp: '2024-01-02T00:00:00Z', price: 1.08, volume: 180000, marketCap: 1080000000, change24h: 8.0 },
    ]

    await TokenDataService.bulkCreatePriceData(lzarToken.id, lzarPriceData)
    console.log('✅ Seeded LZAR price data')

    // Seed sample cumulative metrics data for LUSD
    const lusdCumulativeData = [
      { date: '2024-01-01', cumulativeTxCount: 800, cumulativeTxAmount: 40000, dailyTxCount: 40, dailyTxAmount: 2000 },
      { date: '2024-01-02', cumulativeTxCount: 1000, cumulativeTxAmount: 50000, dailyTxCount: 200, dailyTxAmount: 10000 },
      { date: '2024-01-03', cumulativeTxCount: 1300, cumulativeTxAmount: 65000, dailyTxCount: 300, dailyTxAmount: 15000 },
      { date: '2024-01-04', cumulativeTxCount: 1700, cumulativeTxAmount: 85000, dailyTxCount: 400, dailyTxAmount: 20000 },
      { date: '2024-01-05', cumulativeTxCount: 2200, cumulativeTxAmount: 110000, dailyTxCount: 500, dailyTxAmount: 25000 },
      { date: '2024-01-06', cumulativeTxCount: 2800, cumulativeTxAmount: 140000, dailyTxCount: 600, dailyTxAmount: 30000 },
      { date: '2024-01-07', cumulativeTxCount: 3500, cumulativeTxAmount: 175000, dailyTxCount: 700, dailyTxAmount: 35000 },
    ]

    await TokenDataService.bulkUpsertCumulativeMetrics(lusdToken.id, lusdCumulativeData)
    console.log('✅ Seeded LUSD cumulative metrics')

    // Seed sample wallet data for LUSD
    const lusdWalletData = [
      { date: '2024-01-01', uniqueWalletCount: 400, newWallets: 40, activeWallets: 160 },
      { date: '2024-01-02', uniqueWalletCount: 500, newWallets: 100, activeWallets: 200 },
      { date: '2024-01-03', uniqueWalletCount: 650, newWallets: 150, activeWallets: 250 },
      { date: '2024-01-04', uniqueWalletCount: 800, newWallets: 150, activeWallets: 300 },
      { date: '2024-01-05', uniqueWalletCount: 1000, newWallets: 200, activeWallets: 350 },
      { date: '2024-01-06', uniqueWalletCount: 1200, newWallets: 200, activeWallets: 400 },
      { date: '2024-01-07', uniqueWalletCount: 1400, newWallets: 200, activeWallets: 450 },
    ]

    await TokenDataService.bulkUpsertWalletData(lusdToken.id, lusdWalletData)
    console.log('✅ Seeded LUSD wallet data')

    // Seed sample payment data for LUSD
    const lusdPaymentData = [
      { weekStartDate: '2024-01-01', totalPaymentsAmount: 4000, paymentCount: 80, averagePayment: 50 },
      { weekStartDate: '2024-01-08', totalPaymentsAmount: 6000, paymentCount: 120, averagePayment: 50 },
      { weekStartDate: '2024-01-15', totalPaymentsAmount: 8000, paymentCount: 160, averagePayment: 50 },
      { weekStartDate: '2024-01-22', totalPaymentsAmount: 10000, paymentCount: 200, averagePayment: 50 },
      { weekStartDate: '2024-01-29', totalPaymentsAmount: 12000, paymentCount: 240, averagePayment: 50 },
    ]

    for (const payment of lusdPaymentData) {
      await TokenDataService.upsertPaymentData(lusdToken.id, payment)
    }
    console.log('✅ Seeded LUSD payment data')

    // Seed sample price data for LUSD
    const lusdPriceData = [
      { timestamp: '2024-01-01T00:00:00Z', price: 1.00, volume: 80000, marketCap: 1000000000, change24h: 0 },
      { timestamp: '2024-01-01T06:00:00Z', price: 1.01, volume: 90000, marketCap: 1010000000, change24h: 1.0 },
      { timestamp: '2024-01-01T12:00:00Z', price: 1.03, volume: 110000, marketCap: 1030000000, change24h: 3.0 },
      { timestamp: '2024-01-01T18:00:00Z', price: 1.02, volume: 100000, marketCap: 1020000000, change24h: 2.0 },
      { timestamp: '2024-01-02T00:00:00Z', price: 1.05, volume: 130000, marketCap: 1050000000, change24h: 5.0 },
    ]

    await TokenDataService.bulkCreatePriceData(lusdToken.id, lusdPriceData)
    console.log('✅ Seeded LUSD price data')

    console.log('🎉 Token seeding completed successfully!')
    console.log('📊 Created tokens:')
    console.log(`   - LZAR: ${lzarToken.id}`)
    console.log(`   - LUSD: ${lusdToken.id}`)

  } catch (error) {
    console.error('❌ Error seeding tokens:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding function
seedTokens()
  .then(() => {
    console.log('✅ Seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
