import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gh_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  try {
    const octokit = new Octokit({ auth: token })
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 50,
    })

    return NextResponse.json({ repos: data })
  } catch (err: any) {
    return NextResponse.json({ error: 'failed to fetch repos', details: err.message }, { status: 500 })
  }
}

