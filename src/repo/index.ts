import { getRepoInfo } from './repoInfo.ts'
import type { RepoDetail, RepoCheck } from './types.ts'
import { fetchRemoteRepo } from './remote/github.ts'

export { getRepoInfo }

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

export async function checkRepo(repoUrl: string): Promise<RepoCheck> {
  const result = {
    exists: true,
    url: repoUrl,
    redirect: false,
  }
  if (!repoUrl.startsWith('http')) {
    return result
  }

  const response = await fetch(repoUrl, { method: 'HEAD', redirect: 'follow' })
  if (response.url !== repoUrl) {
    result.redirect = true
    result.url = response.url
  }
  if (response.status === 404 || response.status === 451) {
    result.exists = false
  }
  return result
}
