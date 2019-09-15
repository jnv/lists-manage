import simplegit, { CommitSummary } from 'simple-git/promise'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function gitDir(workingDir: string) {
  const git = simplegit(workingDir)

  return {
    commit(file: string, message: string): Promise<CommitSummary> {
      return git.commit(message, [file])
    },
  }
}
