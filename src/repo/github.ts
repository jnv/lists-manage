import ghGot from 'gh-got'
import { RepoUrlInfo, RepoDetail } from './types'

type GHResponse = {
  description: string
  homepage: string
}

export async function fetchRepoDetails(
  repoInfo: Readonly<RepoUrlInfo>
): RepoDetail {
  const repoApiPath = `repos/${repoInfo.user}/${repoInfo.project}`
  const response = await ghGot(repoApiPath)
  const body = response.body as GHResponse
  return {
    ...repoInfo,
    description: body.description || '',
  }
}
