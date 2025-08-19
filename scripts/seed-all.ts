import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function seedAll() {
  try {
    console.log('🚀 Starting complete database seeding...')

    // Seed users first
    console.log('👤 Seeding users...')
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash('lisk2024', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword
      }
    })
    console.log('✅ Admin user created:', adminUser.id)

    // Then seed tokens
    console.log('🌱 Seeding tokens...')
    const { TokenDataService } = await import('../lib/services/token-data-service')

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
    console.log('✅ LZAR token created:', lzarToken.id)

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
    console.log('✅ LUSD token created:', lusdToken.id)

    console.log('🎉 Complete seeding finished successfully!')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the complete seeding function
seedAll()
  .then(() => {
    console.log('✅ Complete seeding finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Complete seeding failed:', error)
    process.exit(1)
  })
