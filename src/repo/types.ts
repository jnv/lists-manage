export type RepoUrlInfo = {
  url: string
  type: string
  project: string
  user: string
}

export type RepoDetail = RepoUrlInfo & {
  description: string
  homepage: string
}
