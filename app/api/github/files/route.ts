import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Octokit } from '@octokit/rest'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  try {
    const { owner, repo, path } = await req.json()
    const octokit = new Octokit({ auth: session.accessToken })

    // get repo contents
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: path || '',
    })

    return NextResponse.json({ contents: data })
  } catch (err) {
    return NextResponse.json({ error: 'failed to fetch files' }, { status: 500 })
  }
}

