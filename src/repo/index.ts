import { fetchRemoteRepo } from './remote/github.ts'
import { getRepoInfo } from './repoInfo.ts'
import type { RepoCheck, RepoDetail } from './types.ts'

export { getRepoInfo }

export async function fetchRepoDetails(repoUrl: string): Promise<RepoDetail> {
  const repoInfo = getRepoInfo(repoUrl)
  switch (repoInfo.type) {
    case 'github':
      return fetchRemoteRepo(repoInfo)
    default:
      return { ...repoInfo, desc: '', homepage: '' }
  }
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
