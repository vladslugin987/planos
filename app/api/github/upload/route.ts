import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('gh_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  try {
    const { owner, repo, path, content, message } = await req.json()
    const octokit = new Octokit({ auth: token })

    // Check if file already exists
    let sha: string | undefined
    try {
      const { data: existing } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      })
      if ('sha' in existing) {
        sha = existing.sha
      }
    } catch (err) {
      // File doesn't exist, that's fine
    }

    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: message || 'Upload file from Planos',
      content,
      sha, // if file exists, we need sha for update
    })

    return NextResponse.json({ success: true, commit: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

