import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - get all tasks for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        category: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('GET /api/user/tasks error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST - create new task
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, priority, status, dueDate, categoryId, items } = await req.json()

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title,
        description: description || null,
        priority: priority || 'medium',
        status: status || 'todo',
        dueDate: dueDate ? new Date(dueDate) : null,
        categoryId: categoryId || null,
        items: items && items.length > 0 ? {
          create: items.map((item: any, index: number) => ({
            text: item.text,
            completed: item.completed || false,
            order: item.order !== undefined ? item.order : index,
          }))
        } : undefined,
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        category: true,
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('POST /api/user/tasks error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

// PUT - update task
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, title, description, priority, status, dueDate, categoryId, items } = await req.json()

    // Verify task belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!existingTask || existingTask.userId !== session.user.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Delete old items and create new ones
    if (items !== undefined) {
      await prisma.taskItem.deleteMany({
        where: { taskId: id }
      })
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description: description || null,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        categoryId: categoryId || null,
        items: items && items.length > 0 ? {
          create: items.map((item: any, index: number) => ({
            text: item.text,
            completed: item.completed || false,
            order: item.order !== undefined ? item.order : index,
          }))
        } : undefined,
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        category: true,
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('PUT /api/user/tasks error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE - delete task
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    // Verify task belongs to user
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await prisma.task.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/user/tasks error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}

