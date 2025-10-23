import { NextResponse } from 'next/server'

// Yahoo Finance API (via finnhub.io or alternative)
// Alternative: Alpha Vantage, Financial Modeling Prep, or yfinance proxy

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbols = searchParams.get('symbols') // comma-separated: AAPL,TSLA,GOOGL
  
  if (!symbols) {
    return NextResponse.json({ error: 'Symbols parameter required' }, { status: 400 })
  }

  try {
    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase())
    const prices: Record<string, { price: number; change24h: number; name: string }> = {}

    // Using finnhub.io (free tier: 60 calls/minute, requires API key)
    // Alternative: use yfinance-proxy or scraping service
    // For demo purposes, we'll use a simple fetch approach
    
    // Note: In production, you should use a proper API with authentication
    // This is a simplified example using Yahoo Finance quote endpoint
    
    for (const symbol of symbolList) {
      try {
        // Using a public Yahoo Finance proxy (example)
        // In production, use a proper financial API service
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0',
            },
            next: { revalidate: 300 }, // Cache for 5 minutes
          }
        )

        if (response.ok) {
          const data = await response.json()
          const meta = data.chart.result[0].meta
          const currentPrice = meta.regularMarketPrice
          const previousClose = meta.chartPreviousClose
          const change = ((currentPrice - previousClose) / previousClose) * 100

          prices[symbol] = {
            price: currentPrice,
            change24h: change,
            name: meta.symbol,
          }
        }
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err)
        // Continue with other symbols
      }
    }

    return NextResponse.json(prices)
  } catch (error) {
    console.error('Error fetching stock prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock prices' },
      { status: 500 }
    )
  }
}

// POST - search for stocks by name/symbol
export async function POST(request: Request) {
  const body = await request.json()
  const { query } = body

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
  }

  try {
    // Using Yahoo Finance search endpoint
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }

    const data = await response.json()

    const results = data.quotes
      .filter((quote: any) => quote.quoteType === 'EQUITY')
      .slice(0, 10)
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname,
        exchange: quote.exchDisp,
      }))

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching stocks:', error)
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    )
  }
}

