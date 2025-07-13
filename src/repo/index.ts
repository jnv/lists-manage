import { getRepoInfo } from './repoInfo.ts'
import type { RepoDetail, RepoCheck } from './types.ts'
import { fetchRemoteRepo } from './remote/github.ts'
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
  if (!repoUrl.startsWith('http')) {
    return result
  }

  try {
    const response = await got.head(repoUrl)
    if (response.url !== repoUrl) {
      result.redirect = true
      result.url = response.url
    }
    return result
  } catch (e: unknown) {
    if (e instanceof got.HTTPError) {
      const {
        response: { statusCode },
      } = e
      if (statusCode === 404 || statusCode === 451) {
        result.exists = false
        return result
      }
    }

    throw e
  }
}
