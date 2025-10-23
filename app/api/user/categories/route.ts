import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - get all categories (default + user's custom)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // task, transaction, both

    // Get default categories
    let whereClause: any = { isDefault: true }
    if (type && type !== 'both') {
      whereClause.type = type
    }

    const defaultCategories = await prisma.category.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    })

    // Get user's custom categories if authenticated
    let userCategories: any[] = []
    if (session?.user?.id) {
      userCategories = await prisma.category.findMany({
        where: {
          userId: session.user.id,
          ...(type && type !== 'both' ? { type } : {})
        },
        orderBy: { name: 'asc' }
      })
    }

    return NextResponse.json([...defaultCategories, ...userCategories])
  } catch (error) {
    console.error('GET /api/user/categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST - create new custom category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, color, icon, type } = await req.json()

    if (!name || !color || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        userId: session.user.id,
        name,
        color,
        icon: icon || null,
        type,
        isDefault: false,
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('POST /api/user/categories error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PUT - update custom category
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, name, color, icon, type } = await req.json()

    // Verify category belongs to user and is not default
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (existingCategory.isDefault) {
      return NextResponse.json({ error: 'Cannot edit default categories' }, { status: 403 })
    }

    if (existingCategory.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        color,
        icon: icon || null,
        type,
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('PUT /api/user/categories error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE - delete custom category
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID required' }, { status: 400 })
    }

    // Verify category belongs to user and is not default
    const category = await prisma.category.findUnique({ where: { id } })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (category.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default categories' }, { status: 403 })
    }

    if (category.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.category.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/user/categories error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}

