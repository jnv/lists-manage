import { getRepoInfo } from '../repoInfo'

describe('.getRepoInfo', () => {
  it('provides repo info for given URL', () => {
    const result = getRepoInfo('https://github.com/jnv/lists')
    expect(result).toEqual({
      type: 'github',
      project: 'lists',
      user: 'jnv',
      url: 'https://github.com/jnv/lists',
    })
  })

  it('normalizes URL', () => {
    const result = getRepoInfo('https://github.com/sinker/tacofancy/')
    expect(result).toEqual({
      type: 'github',
      project: 'tacofancy',
      user: 'sinker',
      url: 'https://github.com/sinker/tacofancy',
    })
  })

  it('ignores committish parts of URL', () => {
    const result = getRepoInfo('git@github.com:npm/hosted-git-info.git#v1.0.0')
    expect(result).toEqual({
      type: 'github',
      project: 'hosted-git-info',
      user: 'npm',
      url: 'https://github.com/npm/hosted-git-info',
    })
  })

  it('attempts to parse unknown repo type', () => {
    const result = getRepoInfo('https://notabug.org/themusicgod1/food')
    expect(result).toEqual({
      type: 'unknown',
      project: 'food',
      user: 'themusicgod1',
      url: 'https://notabug.org/themusicgod1/food',
    })
  })

  it('throws with incompatible URL', () => {
    expect(() => getRepoInfo('http://example.com')).toThrow()
  })
})
