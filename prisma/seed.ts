import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'Food', icon: 'utensils', color: '#10b981', type: 'transaction' },
  { name: 'Transport', icon: 'car', color: '#3b82f6', type: 'transaction' },
  { name: 'Housing', icon: 'home', color: '#8b5cf6', type: 'transaction' },
  { name: 'Entertainment', icon: 'film', color: '#ec4899', type: 'transaction' },
  { name: 'Health', icon: 'heart', color: '#ef4444', type: 'transaction' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#f59e0b', type: 'transaction' },
  { name: 'Education', icon: 'book', color: '#06b6d4', type: 'transaction' },
  { name: 'Bills', icon: 'file-text', color: '#64748b', type: 'transaction' },
  { name: 'Other', icon: 'more-horizontal', color: '#6b7280', type: 'transaction' },
  
  // Income categories
  { name: 'Salary', icon: 'dollar-sign', color: '#10b981', type: 'transaction' },
  { name: 'Freelance', icon: 'briefcase', color: '#3b82f6', type: 'transaction' },
  { name: 'Investment', icon: 'trending-up', color: '#8b5cf6', type: 'transaction' },
  { name: 'Gift', icon: 'gift', color: '#ec4899', type: 'transaction' },
]

async function main() {
  console.log('Start seeding default categories...')
  
  for (const category of DEFAULT_CATEGORIES) {
    // Check if category already exists by name
    const existing = await prisma.category.findFirst({
      where: { 
        name: category.name,
        isDefault: true,
      },
    })
    
    if (!existing) {
      await prisma.category.create({
        data: {
          ...category,
          isDefault: true,
          userId: null,
        },
      })
      console.log(`Created category: ${category.name}`)
    } else {
      console.log(`Category already exists: ${category.name}`)
    }
  }
  
  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

