import { PrismaClient } from '../lib/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedUsers() {
  try {
    console.log('👤 Starting user seeding...')

    // Hash the password
    const hashedPassword = await bcrypt.hash('lisk2024', 12)

    // Create admin user matching the hardcoded values in the app
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword
      }
    })

    console.log('✅ Admin user created:', adminUser.id)
    console.log('🎉 User seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding function
seedUsers()
  .then(() => {
    console.log('✅ User seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ User seeding failed:', error)
    process.exit(1)
  })
