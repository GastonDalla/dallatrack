import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { SharedRoutine, RoutineUsage, toClientFormat } from '@/lib/mongosee'
import { requireAuth } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()

    const sharedRoutines = await db.collection<SharedRoutine>('sharedRoutines')
      .find({ userId })
      .toArray()

    const sharedRoutineIds = sharedRoutines.map(sr => sr._id!.toString())

    const usages = await db.collection<RoutineUsage>('routineUsages')
      .find({ sharedRoutineId: { $in: sharedRoutineIds } })
      .sort({ usedAt: -1 })
      .toArray()

    const totalSharedRoutines = sharedRoutines.length
    const totalUses = usages.length

    const usagesByRoutine = new Map<string, number>()
    const routineNames = new Map<string, { title: string; shareCode: string }>()

    sharedRoutines.forEach(sr => {
      usagesByRoutine.set(sr._id!.toString(), sr.currentUses)
      routineNames.set(sr._id!.toString(), {
        title: sr.title,
        shareCode: sr.shareCode
      })
    })

    let mostUsedRoutine = null
    let maxUses = 0

    for (const [routineId, uses] of usagesByRoutine.entries()) {
      if (uses > maxUses) {
        maxUses = uses
        const routineInfo = routineNames.get(routineId)
        if (routineInfo) {
          mostUsedRoutine = {
            title: routineInfo.title,
            uses: uses,
            shareCode: routineInfo.shareCode
          }
        }
      }
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentUsages = usages.filter(usage => 
      new Date(usage.usedAt) >= thirtyDaysAgo
    )

    const usagesByDay = new Map<string, number>()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      usagesByDay.set(dateStr, 0)
    }
    
    recentUsages.forEach(usage => {
      const date = new Date(usage.usedAt).toISOString().split('T')[0]
      if (usagesByDay.has(date)) {
        usagesByDay.set(date, (usagesByDay.get(date) || 0) + 1)
      }
    })

    const usageByDay = Array.from(usagesByDay.entries())
      .map(([date, uses]) => ({ date, uses }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const recentUses = await db.collection('routineUsages')
      .aggregate([
        { $match: { sharedRoutineId: { $in: sharedRoutineIds } } },
        { $sort: { usedAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: 'usedById',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $project: {
            _id: 1,
            sharedRoutineId: 1,
            shareCode: 1,
            usedById: 1,
            usedByName: { $ifNull: ['$usedByName', { $arrayElemAt: ['$user.name', 0] }] },
            routineTitle: 1,
            usedAt: 1,
            addedToRoutines: 1
          }
        }
      ])
      .toArray()

    const recentUsesWithId = recentUses.map(usage => toClientFormat(usage))

    const statistics = {
      totalSharedRoutines,
      totalUses,
      mostUsedRoutine,
      recentUses: recentUsesWithId,
      usageByDay: usageByDay,
      sharedRoutines: sharedRoutines.map(sr => ({
        id: sr._id!.toString(),
        title: sr.title,
        shareCode: sr.shareCode,
        currentUses: sr.currentUses,
        maxUses: sr.maxUses,
        isActive: sr.isActive,
        createdAt: sr.createdAt.toISOString(),
        expiresAt: sr.expiresAt?.toISOString()
      }))
    }

    return NextResponse.json({ statistics })

  } catch (error) {
    console.error('Error fetching share statistics:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 