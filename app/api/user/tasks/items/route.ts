import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT - update task item (toggle completed)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId, itemId, completed } = await req.json()

    // Verify task belongs to user
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const item = await prisma.taskItem.update({
      where: { id: itemId },
      data: { completed }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('PUT /api/user/tasks/items error:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

