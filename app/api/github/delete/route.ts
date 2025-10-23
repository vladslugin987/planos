import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('gh_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  try {
    const { owner, repo, path, message, sha } = await req.json()
    
    if (!sha) {
      return NextResponse.json({ error: 'sha is required for deletion' }, { status: 400 })
    }

    const octokit = new Octokit({ auth: token })

    const { data } = await octokit.repos.deleteFile({
      owner,
      repo,
      path,
      message: message || 'Delete file from Planos',
      sha,
    })

    return NextResponse.json({ success: true, commit: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

