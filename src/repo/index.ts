import { getRepoInfo } from './repoInfo'
import { RepoDetail } from './types'
import { fetchRemoteRepo } from './remote/github'

export async function fetchRepoDetails(repoUrl: string): Promise<RepoDetail> {
  const repoInfo = getRepoInfo(repoUrl)
  let repoDetails
  switch (repoInfo.type) {
    case 'github':
      repoDetails = await fetchRemoteRepo(repoInfo)
      break
    default:
      repoDetails = { ...repoInfo, desc: '', homepage: '' }
      break
  }
  return repoDetails
}
