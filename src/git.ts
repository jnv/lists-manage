import simplegit, { CommitSummary } from 'simple-git/promise'

type GitDir = {
  commit(file: string, message: string): Promise<CommitSummary>
}

export function gitDir(workingDir: string): GitDir {
  const git = simplegit(workingDir)

  return {
    commit(file: string, message: string): Promise<CommitSummary> {
      return git.commit(message, [file])
    },
  }
}
