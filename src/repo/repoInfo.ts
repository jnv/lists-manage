import hostedGitInfo from 'hosted-git-info'
import { URL } from 'url'
import type { RepoUrlInfo } from './types.ts'

const OPTIONS: hostedGitInfo.Options = {
  noCommittish: true,
  noGitPlus: true,
}

function fallbackRepoInfo(repoUrl: string): RepoUrlInfo {
  const parsed = new URL(repoUrl)
  const [, user, project] = parsed.pathname.split('/')
  if (!user || !project) {
    throw new Error(`Unsupported or invalid URL: ${repoUrl}`)
  }
  return {
    type: 'unknown',
    name: project,
    author: user,
    url: repoUrl,
  }
}

export function getRepoInfo(repoUrl: string): RepoUrlInfo {
  const info = hostedGitInfo.fromUrl(repoUrl, OPTIONS)
  if (!info || !info.project || !info.user || !info.type) {
    return fallbackRepoInfo(repoUrl)
  }
  return {
    type: info.type,
    name: info.project,
    author: info.user,
    url: info.browse(),
  }
}
