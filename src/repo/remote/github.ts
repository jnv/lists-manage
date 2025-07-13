import { RepoUrlInfo, RepoDetail } from '../types'

type GHResponse = {
  description: string
  homepage: string
}

async function githubApiRequest<T = any>(endpoint: string): Promise<T> {
  const githubToken = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  }
  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`
  }
  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com/${endpoint}`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    let errorBody: any = {}
    try {
      errorBody = await res.json()
    } catch { }
    const error: any = new Error(
      errorBody.message || `GitHub API request failed with status ${res.status}`
    )
    error.statusCode = res.status
    throw error
  }
  return res.json()
}

export async function fetchRemoteRepo(
  repoInfo: Readonly<RepoUrlInfo>
): Promise<RepoDetail> {
  const repoPath = `${repoInfo.author}/${repoInfo.name}`
  try {
    const body = await githubApiRequest<GHResponse>(`repos/${repoPath}`)
    return {
      ...repoInfo,
      desc: body.description || '',
      homepage: body.homepage || '',
    }
  } catch (error: any) {
    if (error.statusCode === 404) {
      error.message = `GitHub repository '${repoPath}' not found`
    }
    throw error
  }
}
