import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const clientId = req.nextUrl.searchParams.get('client_id') || process.env.GITHUB_CLIENT_ID
  const clientSecret = req.nextUrl.searchParams.get('client_secret') || process.env.GITHUB_CLIENT_SECRET
  
  if (!clientId) {
    return NextResponse.json({ 
      error: 'GitHub Client ID not configured. Please set it in Settings.' 
    }, { status: 400 })
  }
  
  if (!code) {
    // Redirect to GitHub OAuth with client_id and client_secret preserved in state
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'repo',
      state: clientSecret || '', // temporarily store secret in state
    })
    return NextResponse.redirect(
      `https://github.com/login/oauth/authorize?${params.toString()}`
    )
  }

  // exchange code for token
  try {
    const state = req.nextUrl.searchParams.get('state') // retrieve secret from state
    const secret = state || clientSecret

    if (!secret) {
      return NextResponse.json({ 
        error: 'GitHub Client Secret not configured. Please set it in Settings.' 
      }, { status: 400 })
    }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: secret,
        code,
      }),
    })

    const data = await tokenRes.json()
    
    if (data.access_token) {
      const response = NextResponse.redirect(new URL('/homework', req.url))
      response.cookies.set('gh_token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
      return response
    }
    
    return NextResponse.json({ error: 'auth failed', details: data }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}

