import timers from 'node:timers/promises'
import { fetchRemoteRepo } from './remote/github.ts'
import { getRepoInfo } from './repoInfo.ts'
import { isThrottled, RequestScheduler, SchedulingError } from './scheduler.ts'
import type { RepoCheck, RepoDetail } from './types.ts'

const transientStatuses = new Set([408, 500, 502, 503, 504])
const redirectStatuses = new Set([301, 302, 303, 307, 308])
const missingStatuses = new Set([404, 451])

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

export async function checkRepo(
  repoUrl: string,
  scheduler = new RequestScheduler()
): Promise<RepoCheck> {
  if (!/^https?:\/\//i.test(repoUrl)) {
    return { exists: true, url: repoUrl, redirect: false }
  }
  let url = repoUrl
  let redirects = 0
  let retries = 0
  for (;;) {
    let response: Response
    try {
      response = await scheduler.request(url)
    } catch (error) {
      // Scheduler failures are terminal; only fetch failures can be retried.
      if (error instanceof SchedulingError) {
        throw error
      }
      if (retries++ >= scheduler.options.retries) {
        throw error
      }
      await timers.setTimeout(Math.min(8000, 250 * 2 ** retries))
      continue
    }
    if (isThrottled(response)) {
      continue
    }
    if (
      transientStatuses.has(response.status) &&
      retries++ < scheduler.options.retries
    ) {
      await timers.setTimeout(Math.min(8000, 250 * 2 ** retries))
      continue
    }
    if (redirectStatuses.has(response.status)) {
      if (redirects++ >= 10) {
        throw new Error('Redirect limit exceeded')
      }
      const location = response.headers.get('location')
      if (!location) {
        throw new Error('Redirect has no Location header')
      }
      const destination = new URL(location, url)
      if (!['http:', 'https:'].includes(destination.protocol)) {
        throw new Error('Non-HTTP redirect')
      }
      url = destination.href
      continue
    }
    if (missingStatuses.has(response.status)) {
      return { exists: false, url: repoUrl, redirect: false }
    }
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Unexpected HTTP ${response.status} at ${url}`)
    }
    return { exists: true, url, redirect: url !== repoUrl }
  }
}
