// Type definitions for hosted-git-info 2.7
// Project: https://github.com/npm/hosted-git-info
// Definitions by: Jason <https://github.com/OiyouYeahYou>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare class HostedGitInfo {
  type: HostedGitInfo.hosts
  user: string | null
  auth: string | null
  project: string | null
  committish: string | null
  default: string
  opts: HostedGitInfo.Options

  constructor(
    host: HostedGitInfo.hosts,
    user: string | null,
    auth: string | null,
    project: string | null,
    committish: string | null,
    defaultRepresentation: string,
    opts?: HostedGitInfo.Options
  )

  // From git-host-info

  // defaults
  sshtemplate: string
  sshurltemplate: string
  browsetemplate: string
  docstemplate: string
  filetemplate: string
  shortcuttemplate: string
  pathtemplate: string

  pathmatch: RegExp
  protocols_re: RegExp
  hashformat(fragment: string): string

  // special
  protocols: string[]
  domain: string
  bugstemplate: string
  gittemplate: string
  browsefiletemplate: string
  httpstemplate: string
  treepath: string
  tarballtemplate: string

  // /From git-host-info

  hash(): string
  ssh(opts?: HostedGitInfo.FillOptions): string
  sshurl(opts?: HostedGitInfo.FillOptions): string
  browse(
    path: string,
    fragment: string,
    opts?: HostedGitInfo.FillOptions
  ): string | undefined
  browse(path: string, opts?: HostedGitInfo.FillOptions): string
  browse(opts?: HostedGitInfo.FillOptions): string
  docs(opts?: HostedGitInfo.FillOptions): string
  bugs(opts?: HostedGitInfo.FillOptions): string
  https(opts?: HostedGitInfo.FillOptions): string
  git(opts?: HostedGitInfo.FillOptions): string
  shortcut(opts?: HostedGitInfo.FillOptions): string
  path(opts?: HostedGitInfo.FillOptions): string
  tarball(opts?: HostedGitInfo.FillOptions): string
  file(path: string, opts?: HostedGitInfo.FillOptions): string
  getDefaultRepresentation(): string
  toString(opts?: HostedGitInfo.FillOptions): string

  static fromUrl(gitUrl: string, options?: HostedGitInfo.Options): HostedGitInfo
}

declare namespace HostedGitInfo {
  type Options = {
    noCommittish?: boolean
    noGitPlus?: boolean
  }

  type FillOptions = Options & {
    path?: string
    auth?: string
    fragment?: string
    committish?: string
    treepath?: string
  }

  type hosts = 'github' | 'bitbucket' | 'gitlab' | 'gist'
}

export = HostedGitInfo
