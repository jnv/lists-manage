type HostType = 'github' | 'bitbucket' | 'gitlab' | 'gist'

export type RepoUrlInfo = {
  url: string
  type: HostType
  project: string
  user: string
}

export type RepoDetail = RepoUrlInfo & {
  description: string
  homepage: string
}
