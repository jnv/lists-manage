import { getRepoInfo } from './repoInfo'
import { RepoDetail, RepoCheck } from './types'
import { fetchRemoteRepo } from './remote/github'
import got from 'got'

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

  try {
    const response = await got.head(repoUrl)
    if (response.url !== repoUrl) {
      result.redirect = true
      result.url = response.url
    }
    return result
  } catch (e) {
    if (e.statusCode === 404) {
      result.exists = false
      return result
    }
    throw e
  }
}
