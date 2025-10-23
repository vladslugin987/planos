import { NextResponse } from 'next/server'

// CoinGecko API - FREE, no API key needed
// Docs: https://www.coingecko.com/en/api/documentation

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbols = searchParams.get('symbols') // comma-separated: BTC,ETH,BNB
  
  if (!symbols) {
    return NextResponse.json({ error: 'Symbols parameter required' }, { status: 400 })
  }

  try {
    // CoinGecko uses lowercase IDs
    const ids = symbols.toLowerCase().split(',').map(s => {
      // Map common symbols to CoinGecko IDs
      const symbolMap: Record<string, string> = {
        'btc': 'bitcoin',
        'eth': 'ethereum',
        'bnb': 'binancecoin',
        'usdt': 'tether',
        'usdc': 'usd-coin',
        'xrp': 'ripple',
        'ada': 'cardano',
        'doge': 'dogecoin',
        'sol': 'solana',
        'dot': 'polkadot',
        'matic': 'matic-network',
        'ltc': 'litecoin',
        'avax': 'avalanche-2',
        'link': 'chainlink',
        'atom': 'cosmos',
      }
      return symbolMap[s.trim()] || s.trim()
    }).join(',')

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform response to more convenient format
    const prices: Record<string, { price: number; change24h: number }> = {}
    
    Object.entries(data).forEach(([id, value]: [string, any]) => {
      // Map CoinGecko ID back to symbol
      const reverseMap: Record<string, string> = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'binancecoin': 'BNB',
        'tether': 'USDT',
        'usd-coin': 'USDC',
        'ripple': 'XRP',
        'cardano': 'ADA',
        'dogecoin': 'DOGE',
        'solana': 'SOL',
        'polkadot': 'DOT',
        'matic-network': 'MATIC',
        'litecoin': 'LTC',
        'avalanche-2': 'AVAX',
        'chainlink': 'LINK',
        'cosmos': 'ATOM',
      }
      
      const symbol = reverseMap[id] || id.toUpperCase()
      prices[symbol] = {
        price: value.usd,
        change24h: value.usd_24h_change || 0,
      }
    })

    return NextResponse.json(prices)
  } catch (error) {
    console.error('Error fetching crypto prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crypto prices' },
      { status: 500 }
    )
  }
}

// POST - search for crypto by name/symbol
export async function POST(request: Request) {
  const body = await request.json()
  const { query } = body

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()

    // Return top 10 results
    const results = data.coins.slice(0, 10).map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      thumb: coin.thumb,
    }))

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching crypto:', error)
    return NextResponse.json(
      { error: 'Failed to search crypto' },
      { status: 500 }
    )
  }
}

