import { simpleGit, CommitResult } from 'simple-git'

type GitDir = {
  commit(file: string, message: string): Promise<CommitResult>
}

export function gitDir(workingDir: string): GitDir {
  const git = simpleGit(workingDir)

  return {
    commit(file: string, message: string): Promise<CommitResult> {
      return git.commit(message, [file])
    },
  }
}
