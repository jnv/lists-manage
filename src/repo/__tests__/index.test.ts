import { fetchRepoDetails } from '..'
import { RepoDetail } from '../types'

describe('.fetchRepoDetails', () => {
  it('provides empty description & homepage with non-GitHub URL', async () => {
    const input = 'https://gitlab.com/rosarior/django-must-watch'
    expect(fetchRepoDetails(input)).resolves.toEqual({
      url: input,
      type: 'gitlab',
      name: 'django-must-watch',
      author: 'rosarior',
      homepage: '',
      desc: '',
    })
  })
})
