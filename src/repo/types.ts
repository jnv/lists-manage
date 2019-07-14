export type RepoUrlInfo = {
  url: string
  type: string
  name: string
  author: string
}

export type RepoDetail = RepoUrlInfo & {
  desc: string
  homepage: string
}
