import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Update current prices for all user's holdings
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

  try {
    // Get all user's assets
    const assets = await prisma.asset.findMany({
      where: { userId: user.id },
      include: {
        holdings: true,
      },
    })

    if (assets.length === 0) {
      return NextResponse.json({ updated: 0 })
    }

    // Group assets by type
    const cryptoAssets = assets.filter(a => a.type === 'crypto')
    const stockAssets = assets.filter(a => a.type === 'stock')

    let updated = 0

    // Fetch crypto prices
    if (cryptoAssets.length > 0) {
      const cryptoSymbols = cryptoAssets.map(a => a.symbol).join(',')
      const cryptoResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/prices/crypto?symbols=${cryptoSymbols}`
      )
      
      if (cryptoResponse.ok) {
        const cryptoPrices = await cryptoResponse.json()
        
        for (const asset of cryptoAssets) {
          const priceData = cryptoPrices[asset.symbol]
          if (priceData && asset.holdings.length > 0) {
            // Update all holdings for this asset
            await prisma.holding.updateMany({
              where: {
                assetId: asset.id,
                userId: user.id,
              },
              data: {
                currentPrice: priceData.price,
                lastUpdated: new Date(),
              },
            })
            updated += asset.holdings.length
          }
        }
      }
    }

    // Fetch stock prices
    if (stockAssets.length > 0) {
      const stockSymbols = stockAssets.map(a => a.symbol).join(',')
      const stockResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/prices/stocks?symbols=${stockSymbols}`
      )
      
      if (stockResponse.ok) {
        const stockPrices = await stockResponse.json()
        
        for (const asset of stockAssets) {
          const priceData = stockPrices[asset.symbol]
          if (priceData && asset.holdings.length > 0) {
            // Update all holdings for this asset
            await prisma.holding.updateMany({
              where: {
                assetId: asset.id,
                userId: user.id,
              },
              data: {
                currentPrice: priceData.price,
                lastUpdated: new Date(),
              },
            })
            updated += asset.holdings.length
          }
        }
      }
    }

    return NextResponse.json({ updated })
  } catch (error) {
    console.error('Error updating portfolio prices:', error)
    return NextResponse.json(
      { error: 'Failed to update prices' },
      { status: 500 }
    )
  }
}

