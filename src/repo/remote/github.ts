import ghGot from 'gh-got'
import { Response } from 'got'
import { RepoUrlInfo, RepoDetail } from '../types'

type GHResponse = {
  description: string
  homepage: string
}

export async function fetchRemoteRepo(
  repoInfo: Readonly<RepoUrlInfo>
): Promise<RepoDetail> {
  const repoPath = `${repoInfo.author}/${repoInfo.name}`
  try {
    const { body } = (await ghGot(`repos/${repoPath}`)) as Response<GHResponse>
    return {
      ...repoInfo,
      desc: body.description || '',
      homepage: body.homepage || '',
    }
  } catch (error) {
    if (error.statusCode === 404) {
      error.message = `GitHub repository '${repoPath}' not found`
    }
    throw error
  }
}
