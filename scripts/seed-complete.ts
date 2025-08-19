import { PrismaClient } from '../lib/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedComplete() {
  try {
    console.log('🚀 Starting complete database seeding...')

    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await prisma.weeklyPayments.deleteMany()
    await prisma.dailyUniqueWallets.deleteMany()
    await prisma.dailyCumulativeMetrics.deleteMany()
    await prisma.tokenPriceData.deleteMany()
    await prisma.transactionActivity.deleteMany()
    await prisma.hourlyActivity.deleteMany()
    await prisma.token.deleteMany()
    await prisma.user.deleteMany()

    // Seed users first
    console.log('👤 Seeding users...')
    const hashedPassword = await bcrypt.hash('lisk2024', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword
      }
    })
    console.log('✅ Admin user created:', adminUser.id)

    // Create LZAR token
    console.log('🌱 Creating LZAR token...')
    const lzarToken = await prisma.token.create({
      data: {
        name: 'L ZAR Coin',
        symbol: 'LZAR',
        contractAddress: '0x7b7047c49eaf68b8514a20624773ca620e2cd4a3',
        decimals: 18,
        totalSupply: '10576000000000000000000000',
        totalSupplyFormatted: '10576000',
        circulatingSupply: '10576000',
        marketCap: '0',
                 blockNumber: BigInt('13707424'),
        validated: 1,
        verifiedContract: false,
        possibleSpam: false,
        isActive: true
      }
    })
    console.log('✅ LZAR token created:', lzarToken.id)

    // Create LUSD token
    console.log('🌱 Creating LUSD token...')
    const lusdToken = await prisma.token.create({
      data: {
        name: 'L USD Coin',
        symbol: 'LUSD',
        contractAddress: '0x2a0fa5d670deb472c1a72977b75ba53d1e6fab72',
        decimals: 18,
        totalSupply: '165000000000000000000000',
        totalSupplyFormatted: '165000',
        circulatingSupply: '165000',
        marketCap: '0',
                 blockNumber: BigInt('13707094'),
        validated: 1,
        verifiedContract: false,
        possibleSpam: false,
        isActive: true
      }
    })
    console.log('✅ LUSD token created:', lusdToken.id)

    // Generate sample data for the last 30 days
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000))

    // Seed cumulative metrics for both tokens
    console.log('📊 Seeding cumulative metrics...')
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + (i * 24 * 60 * 60 * 1000))
      const baseTxCount = 1000 + (i * 50) // Growing trend
      const baseAmount = 50000 + (i * 2500) // Growing trend

      // LZAR metrics
      await prisma.dailyCumulativeMetrics.create({
        data: {
          date: date,
                     cumulativeTxCount: BigInt((baseTxCount * 1.5)),
           cumulativeTxAmount: (baseAmount * 1.5),
           dailyTxCount: BigInt((Math.floor(Math.random() * 100) + 50)),
           dailyTxAmount: (Math.floor(Math.random() * 5000) + 2000),
          tokenId: lzarToken.id
        }
      })

      // LUSD metrics
      await prisma.dailyCumulativeMetrics.create({
        data: {
          date: date,
                     cumulativeTxCount: BigInt(baseTxCount),
           cumulativeTxAmount: baseAmount,
           dailyTxCount: BigInt((Math.floor(Math.random() * 80) + 40)),
           dailyTxAmount: (Math.floor(Math.random() * 4000) + 1500),
          tokenId: lusdToken.id
        }
      })
    }

    // Seed wallet data for both tokens
    console.log('👥 Seeding wallet data...')
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + (i * 24 * 60 * 60 * 1000))
      const baseWallets = 500 + (i * 10) // Growing trend

      // LZAR wallets
      await prisma.dailyUniqueWallets.create({
        data: {
          date: date,
                     uniqueWalletCount: BigInt((baseWallets * 1.2)),
           newWallets: BigInt((Math.floor(Math.random() * 20) + 5)),
           activeWallets: BigInt((Math.floor(Math.random() * 100) + 50)),
          tokenId: lzarToken.id
        }
      })

      // LUSD wallets
      await prisma.dailyUniqueWallets.create({
        data: {
          date: date,
                     uniqueWalletCount: BigInt(baseWallets),
           newWallets: BigInt((Math.floor(Math.random() * 15) + 3)),
           activeWallets: BigInt((Math.floor(Math.random() * 80) + 40)),
          tokenId: lusdToken.id
        }
      })
    }

    // Seed weekly payments for both tokens (last 12 weeks)
    console.log('💰 Seeding weekly payments...')
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(today.getTime() - ((11 - i) * 7 * 24 * 60 * 60 * 1000))
      // Set to Monday of the week
      const dayOfWeek = weekStart.getDay()
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(weekStart.getTime() - (mondayOffset * 24 * 60 * 60 * 1000))

      const basePayment = 10000 + (i * 1000) // Growing trend

      // LZAR payments
      await prisma.weeklyPayments.create({
        data: {
          weekStartDate: monday,
          totalPaymentsAmount: (basePayment * 1.3).toString(),
                     paymentCount: BigInt((Math.floor(Math.random() * 50) + 20)),
           averagePayment: (Math.floor(Math.random() * 500) + 200),
          tokenId: lzarToken.id
        }
      })

      // LUSD payments
      await prisma.weeklyPayments.create({
        data: {
          weekStartDate: monday,
          totalPaymentsAmount: basePayment.toString(),
                     paymentCount: BigInt((Math.floor(Math.random() * 40) + 15)),
           averagePayment: (Math.floor(Math.random() * 400) + 150),
          tokenId: lusdToken.id
        }
      })
    }

    // Seed price data for both tokens (last 24 hours)
    console.log('📈 Seeding price data...')
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(today.getTime() - ((23 - i) * 60 * 60 * 1000))
      const basePrice = 1.0 + (Math.sin(i * 0.5) * 0.1) // Sinusoidal price movement

      // LZAR price
      await prisma.tokenPriceData.create({
        data: {
          timestamp: timestamp,
          price: (basePrice * 1.2).toString(),
          volume: (Math.floor(Math.random() * 100000) + 50000).toString(),
          marketCap: (Math.floor(Math.random() * 1000000) + 500000).toString(),
          change24h: (Math.floor(Math.random() * 20) - 10).toString(), // -10% to +10%
          tokenId: lzarToken.id
        }
      })

      // LUSD price
      await prisma.tokenPriceData.create({
        data: {
          timestamp: timestamp,
          price: basePrice.toString(),
          volume: (Math.floor(Math.random() * 80000) + 40000).toString(),
          marketCap: (Math.floor(Math.random() * 800000) + 400000).toString(),
          change24h: (Math.floor(Math.random() * 15) - 7).toString(), // -7% to +8%
          tokenId: lusdToken.id
        }
      })
    }

    // Seed some transaction activity
    console.log('🔄 Seeding transaction activity...')
    const sampleAddresses = [
      '0x1234567890123456789012345678901234567890',
      '0x2345678901234567890123456789012345678901',
      '0x3456789012345678901234567890123456789012',
      '0x4567890123456789012345678901234567890123',
      '0x5678901234567890123456789012345678901234'
    ]

    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(today.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000))
      const fromAddress = sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)]
      const toAddress = sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)]

      // LZAR transactions
      await prisma.transactionActivity.create({
        data: {
          timestamp: timestamp,
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          fromAddress: fromAddress,
          toAddress: toAddress,
                     amount: (Math.floor(Math.random() * 1000) + 100),
           gasUsed: BigInt((Math.floor(Math.random() * 100000) + 50000)),
           gasPrice: BigInt((Math.floor(Math.random() * 50) + 20)),
           blockNumber: BigInt((Math.floor(Math.random() * 1000000) + 13700000)),
          isSuccess: Math.random() > 0.1, // 90% success rate
          tokenId: lzarToken.id
        }
      })

      // LUSD transactions
      await prisma.transactionActivity.create({
        data: {
          timestamp: timestamp,
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          fromAddress: fromAddress,
          toAddress: toAddress,
                     amount: (Math.floor(Math.random() * 800) + 80),
           gasUsed: BigInt((Math.floor(Math.random() * 90000) + 45000)),
           gasPrice: BigInt((Math.floor(Math.random() * 45) + 18)),
           blockNumber: BigInt((Math.floor(Math.random() * 1000000) + 13700000)),
          isSuccess: Math.random() > 0.1, // 90% success rate
          tokenId: lusdToken.id
        }
      })
    }

    console.log('🎉 Complete seeding finished successfully!')
    console.log('📋 Summary:')
    console.log(`   - Users: 1`)
    console.log(`   - Tokens: 2 (LZAR, LUSD)`)
    console.log(`   - Cumulative Metrics: 60 records (30 days × 2 tokens)`)
    console.log(`   - Wallet Data: 60 records (30 days × 2 tokens)`)
    console.log(`   - Weekly Payments: 24 records (12 weeks × 2 tokens)`)
    console.log(`   - Price Data: 48 records (24 hours × 2 tokens)`)
    console.log(`   - Transactions: 100 records (50 × 2 tokens)`)

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the complete seeding function
seedComplete()
  .then(() => {
    console.log('✅ Complete seeding finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Complete seeding failed:', error)
    process.exit(1)
  })
