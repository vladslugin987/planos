import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Helper function to calculate next date
function calculateNextDate(frequency: string, startDate: Date, dayOfMonth?: number | null, dayOfWeek?: number | null): Date {
  const next = new Date(startDate)
  
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'monthly':
      if (dayOfMonth) {
        next.setMonth(next.getMonth() + 1)
        next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
      } else {
        next.setMonth(next.getMonth() + 1)
      }
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1)
      break
  }
  
  return next
}

// GET - get all recurring transactions for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recurring = await prisma.recurringTransaction.findMany({
      where: { userId: session.user.id },
      include: {
        category: true,
      },
      orderBy: { nextDate: 'asc' }
    })

    return NextResponse.json(recurring)
  } catch (error) {
    console.error('GET /api/user/recurring error:', error)
    return NextResponse.json({ error: 'Failed to fetch recurring transactions' }, { status: 500 })
  }
}

// POST - create new recurring transaction
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, amount, description, categoryId, frequency, dayOfMonth, dayOfWeek, startDate, endDate } = await req.json()

    if (!type || !amount || amount <= 0 || !frequency) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const start = startDate ? new Date(startDate) : new Date()
    const nextDate = calculateNextDate(frequency, start, dayOfMonth, dayOfWeek)

    const recurring = await prisma.recurringTransaction.create({
      data: {
        userId: session.user.id,
        type,
        amount: parseFloat(amount),
        description: description || null,
        categoryId: categoryId || null,
        frequency,
        dayOfMonth: dayOfMonth || null,
        dayOfWeek: dayOfWeek || null,
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        nextDate,
        active: true,
      },
      include: {
        category: true,
      }
    })

    return NextResponse.json(recurring)
  } catch (error) {
    console.error('POST /api/user/recurring error:', error)
    return NextResponse.json({ error: 'Failed to create recurring transaction' }, { status: 500 })
  }
}

// PUT - update recurring transaction
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, type, amount, description, categoryId, frequency, dayOfMonth, dayOfWeek, startDate, endDate, active } = await req.json()

    // Verify recurring transaction belongs to user
    const existing = await prisma.recurringTransaction.findUnique({
      where: { id }
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 })
    }

    const start = startDate ? new Date(startDate) : existing.startDate
    const nextDate = frequency ? calculateNextDate(frequency, start, dayOfMonth, dayOfWeek) : existing.nextDate

    const recurring = await prisma.recurringTransaction.update({
      where: { id },
      data: {
        type,
        amount: parseFloat(amount),
        description: description || null,
        categoryId: categoryId || null,
        frequency,
        dayOfMonth: dayOfMonth || null,
        dayOfWeek: dayOfWeek || null,
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        nextDate,
        active: active !== undefined ? active : undefined,
      },
      include: {
        category: true,
      }
    })

    return NextResponse.json(recurring)
  } catch (error) {
    console.error('PUT /api/user/recurring error:', error)
    return NextResponse.json({ error: 'Failed to update recurring transaction' }, { status: 500 })
  }
}

// DELETE - delete recurring transaction
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Recurring transaction ID required' }, { status: 400 })
    }

    // Verify recurring transaction belongs to user
    const recurring = await prisma.recurringTransaction.findUnique({ where: { id } })
    if (!recurring || recurring.userId !== session.user.id) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 })
    }

    await prisma.recurringTransaction.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/user/recurring error:', error)
    return NextResponse.json({ error: 'Failed to delete recurring transaction' }, { status: 500 })
  }
}

