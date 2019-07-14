import { fetchRepoDetails } from '..'

describe('.fetchRepoDetails', () => {
  it('provides empty description & homepage with non-GitHub URL', async () => {
    const input = 'https://gitlab.com/rosarior/django-must-watch'
    expect(fetchRepoDetails(input)).resolves.toEqual({
      url: input,
      type: 'gitlab',
      project: 'django-must-watch',
      user: 'rosarior',
      homepage: '',
      description: '',
    })
  })
})
