import { fetchRemoteRepo } from '../github'
import nock from 'nock'
import responseBody from './github.fixture.json'

// const ghGotMock = ghGot as jest.Mock<typeof ghGot>
beforeAll(() => {
  nock.disableNetConnect()
})

afterAll(() => {
  nock.enableNetConnect()
})

const responseHeaders = {
  'X-RateLimit-Remaining': '4999',
  'X-RateLimit-Limit': '5000',
  'X-RateLimit-Reset': '1372700873',
}

describe('.fetchRepoDetails', () => {
  it('calls GitHub API to fetch repo details', async () => {
    const scope = nock('https://api.github.com')
      .get('/repos/jnv/lists')
      .reply(200, responseBody, responseHeaders)
    const repoInfo = {
      type: 'github',
      name: 'lists',
      author: 'jnv',
      url: 'https://github.com/jnv/lists',
    }
    const result = await fetchRemoteRepo(repoInfo)
    expect(result).toEqual({
      ...repoInfo,
      desc: 'The definitive list of lists (of lists) curated on GitHub',
      homepage: 'https://jnv.github.com/lists',
    })
  })

  it('throws error if the repository does not exist', async () => {
    const scope = nock('https://api.github.com')
      .get('/repos/jnv/this-does-not-exist')
      .reply(
        404,
        {
          message: 'Not Found',
        },
        responseHeaders
      )
    const repoInfo = {
      type: 'github',
      name: 'this-does-not-exist',
      author: 'jnv',
      url: 'https://github.com/jnv/this-does-not-exist',
    }
    expect(fetchRemoteRepo(repoInfo)).rejects.toThrow(
      "GitHub repository 'jnv/this-does-not-exist' not found"
    )
  })
})
