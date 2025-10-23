import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - fetch all user's assets with holdings
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

  const assets = await prisma.asset.findMany({
    where: { userId: user.id },
    include: {
      holdings: {
        orderBy: { purchaseDate: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(assets)
}

// POST - create new asset
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
  const { type, symbol, name } = body

  if (!type || !symbol || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check if asset already exists for this user
  const existing = await prisma.asset.findUnique({
    where: {
      userId_symbol: {
        userId: user.id,
        symbol: symbol.toUpperCase(),
      },
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'Asset already exists' }, { status: 400 })
  }

  const asset = await prisma.asset.create({
    data: {
      userId: user.id,
      type,
      symbol: symbol.toUpperCase(),
      name,
    },
    include: {
      holdings: true,
    },
  })

  return NextResponse.json(asset)
}

// PUT - update asset (mainly for name changes)
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
  const { id, name } = body

  if (!id || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const asset = await prisma.asset.update({
    where: {
      id,
      userId: user.id,
    },
    data: { name },
    include: {
      holdings: true,
    },
  })

  return NextResponse.json(asset)
}

// DELETE - delete asset and all its holdings
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
    return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })
  }

  await prisma.asset.delete({
    where: {
      id,
      userId: user.id,
    },
  })

  return NextResponse.json({ success: true })
}

