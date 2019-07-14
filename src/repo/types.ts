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

export type RepoCheck = {
  url: string
  exists: boolean
  redirect: boolean
}
