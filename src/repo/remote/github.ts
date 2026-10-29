import type { RepoDetail, RepoUrlInfo } from '../types.ts'

type GHResponse = {
  description: string
  homepage: string
}

async function githubApiRequest<T>(endpoint: string): Promise<T> {
  const githubToken = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': '@jnv/lists-manage',
  }
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`
  }
  const url = endpoint.startsWith('http')
    ? endpoint
    : `https://api.github.com/${endpoint}`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    let message = `GitHub API request failed with status ${res.status}`
    try {
      const body: unknown = await res.json()
      if (
        typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        typeof body.message === 'string' &&
        body.message
      ) {
        message = body.message
      }
    } catch {}
    throw Object.assign(new Error(message), { statusCode: res.status })
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
  } catch (error) {
    if (
      error instanceof Error &&
      'statusCode' in error &&
      error.statusCode === 404
    ) {
      error.message = `GitHub repository '${repoPath}' not found`
    }
    throw error
  }
}
