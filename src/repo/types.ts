type HostType = 'github' | 'bitbucket' | 'gitlab' | 'gist'

export type RepoInfo = {
  url: string
  type: HostType
  project: string
  user: string
}
