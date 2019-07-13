type HostType = 'github' | 'bitbucket' | 'gitlab' | 'gist'

export type RepoUrlInfo = {
  url: string
  type: HostType
  project: string
  user: string
}

