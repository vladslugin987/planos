import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - get all budgets for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const budgets = await prisma.budget.findMany({
      where: { userId: session.user.id },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(budgets)
  } catch (error) {
    console.error('GET /api/user/budgets error:', error)
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

// POST - create new budget
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categoryId, amount, period, startDate, endDate } = await req.json()

    if (!categoryId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const budget = await prisma.budget.create({
      data: {
        userId: session.user.id,
        categoryId,
        amount: parseFloat(amount),
        period: period || 'monthly',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        category: true,
      }
    })

    return NextResponse.json(budget)
  } catch (error: any) {
    console.error('POST /api/user/budgets error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Budget for this category and period already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
  }
}

// PUT - update budget
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, amount, period, startDate, endDate } = await req.json()

    // Verify budget belongs to user
    const existingBudget = await prisma.budget.findUnique({
      where: { id }
    })

    if (!existingBudget || existingBudget.userId !== session.user.id) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        period,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        category: true,
      }
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error('PUT /api/user/budgets error:', error)
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 })
  }
}

// DELETE - delete budget
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Budget ID required' }, { status: 400 })
    }

    // Verify budget belongs to user
    const budget = await prisma.budget.findUnique({ where: { id } })
    if (!budget || budget.userId !== session.user.id) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    await prisma.budget.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/user/budgets error:', error)
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}

