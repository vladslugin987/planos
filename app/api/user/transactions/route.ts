import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - get all transactions for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      include: {
        category: true,
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('GET /api/user/transactions error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

// POST - create new transaction
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, amount, description, categoryId, date } = await req.json()

    if (!type || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type,
        amount: parseFloat(amount),
        description: description || null,
        categoryId: categoryId || null,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        category: true,
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('POST /api/user/transactions error:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

// PUT - update transaction
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, type, amount, description, categoryId, date } = await req.json()

    // Verify transaction belongs to user
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    })

    if (!existingTransaction || existingTransaction.userId !== session.user.id) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        amount: parseFloat(amount),
        description: description || null,
        categoryId: categoryId || null,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        category: true,
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('PUT /api/user/transactions error:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

// DELETE - delete transaction
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findUnique({ where: { id } })
    if (!transaction || transaction.userId !== session.user.id) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    await prisma.transaction.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/user/transactions error:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}

