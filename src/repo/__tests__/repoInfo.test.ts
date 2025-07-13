import test from 'node:test';
import assert from 'node:assert';
import { getRepoInfo } from '../repoInfo.ts'

test('.getRepoInfo', () => {
  test('provides repo info for given URL', () => {
    const result = getRepoInfo('https://github.com/jnv/lists')
    assert.deepStrictEqual(result, {
      type: 'github',
      name: 'lists',
      author: 'jnv',
      url: 'https://github.com/jnv/lists',
    })
  })

  test('normalizes URL', () => {
    const result = getRepoInfo('https://github.com/sinker/tacofancy/')
    assert.deepStrictEqual(result, {
      type: 'github',
      name: 'tacofancy',
      author: 'sinker',
      url: 'https://github.com/sinker/tacofancy',
    })
  })

  test('ignores committish parts of URL', () => {
    const result = getRepoInfo('git@github.com:npm/hosted-git-info.git#v1.0.0')
    assert.deepStrictEqual(result, {
      type: 'github',
      name: 'hosted-git-info',
      author: 'npm',
      url: 'https://github.com/npm/hosted-git-info',
    })
  })

  test('attempts to parse unknown repo type', () => {
    const result = getRepoInfo('https://notabug.org/themusicgod1/food')
    assert.deepStrictEqual(result, {
      type: 'unknown',
      name: 'food',
      author: 'themusicgod1',
      url: 'https://notabug.org/themusicgod1/food',
    })
  })

  test('throws with incompatible URL', () => {
    assert.throws(
      () => getRepoInfo('http://example.com'),
      {
        name: 'Error',
        message: 'Unsupported or invalid URL: http://example.com',
      }
    );
  });
})
