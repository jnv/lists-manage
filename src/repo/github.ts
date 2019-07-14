import ghGot from 'gh-got'
import { Response } from 'got'
import { RepoUrlInfo, RepoDetail } from './types'

type GHResponse = {
  description: string
  homepage: string
}

export async function fetchRepoDetails(
  repoInfo: Readonly<RepoUrlInfo>
): Promise<RepoDetail> {
  const repoApiPath = `repos/${repoInfo.user}/${repoInfo.project}`
  const { body } = (await ghGot(repoApiPath)) as Response<GHResponse>
  return {
    ...repoInfo,
    description: body.description || '',
    homepage: body.homepage || '',
  }
}
