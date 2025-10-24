import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - fetch all user's holdings
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const holdings = await prisma.holding.findMany({
    where: { userId: user.id },
    include: {
      asset: true,
    },
    orderBy: { purchaseDate: 'desc' },
  })

  return NextResponse.json(holdings)
}

// POST - create new holding (buy asset)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const body = await request.json()
  const { assetId, quantity, purchasePrice, purchaseDate, notes } = body

  if (!assetId || !quantity || !purchasePrice) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const holding = await prisma.holding.create({
    data: {
      userId: user.id,
      assetId,
      quantity: parseFloat(quantity),
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      notes,
    },
    include: {
      asset: true,
    },
  })

  return NextResponse.json(holding)
}

// PUT - update holding
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const body = await request.json()
  const { id, quantity, purchasePrice, purchaseDate, notes, currentPrice } = body

  if (!id) {
    return NextResponse.json({ error: 'Holding ID required' }, { status: 400 })
  }

  const updateData: any = {}
  if (quantity !== undefined) updateData.quantity = parseFloat(quantity)
  if (purchasePrice !== undefined) updateData.purchasePrice = parseFloat(purchasePrice)
  if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate)
  if (notes !== undefined) updateData.notes = notes
  if (currentPrice !== undefined) {
    updateData.currentPrice = parseFloat(currentPrice)
    updateData.lastUpdated = new Date()
  }

  const holding = await prisma.holding.update({
    where: {
      id,
      userId: user.id,
    },
    data: updateData,
    include: {
      asset: true,
    },
  })

  return NextResponse.json(holding)
}

// DELETE - delete holding (sell asset)
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Holding ID required' }, { status: 400 })
  }

  await prisma.holding.delete({
    where: {
      id,
      userId: user.id,
    },
  })

  return NextResponse.json({ success: true })
}

