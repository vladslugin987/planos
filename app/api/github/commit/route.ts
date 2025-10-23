import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('gh_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  try {
    const { owner, repo, path, content, message, sha } = await req.json()
    const octokit = new Octokit({ auth: token })

    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: message || 'Update from Planos',
      content: Buffer.from(content).toString('base64'),
      sha, // required for updates
    })

    return NextResponse.json({ success: true, commit: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

