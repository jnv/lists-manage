import { fetchRepoDetails, checkRepo } from '..'
import nock from 'nock'

beforeAll(() => {
  nock.disableNetConnect()
})

afterAll(() => {
  nock.enableNetConnect()
})

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

describe('.checkRepo', () => {
  it("doesn't try to check anchor URLs", () => {
    const input = '#lists-of-lists'
    expect(checkRepo(input)).resolves.toEqual({
      url: input,
      exists: true,
      redirect: false,
    })
  })
})
