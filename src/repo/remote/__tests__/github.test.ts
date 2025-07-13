import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { fetchRemoteRepo } from '../github.ts';
import nock from 'nock';
import responseBody from './github.fixture.json' with { type: 'json' };

before(() => {
  nock.disableNetConnect();
});

after(() => {
  nock.enableNetConnect();
});

const responseHeaders = {
  'X-RateLimit-Remaining': '4999',
  'X-RateLimit-Limit': '5000',
  'X-RateLimit-Reset': '1372700873',
};

describe('.fetchRemoteRepo', () => {
  it('calls GitHub API to fetch repo details', async () => {
    const scope = nock('https://api.github.com')
      .get('/repos/jnv/lists')
      .reply(200, responseBody, responseHeaders);
    const repoInfo = {
      type: 'github',
      name: 'lists',
      author: 'jnv',
      url: 'https://github.com/jnv/lists',
    };
    const result = await fetchRemoteRepo(repoInfo);
    const expected = {
      type: 'github',
      name: 'lists',
      author: 'jnv',
      url: 'https://github.com/jnv/lists',
      desc: 'The definitive list of lists (of lists) curated on GitHub and elsewhere',
      homepage: '',
    };
    assert.deepStrictEqual(result, expected);
  });

  it('throws error if the repository does not exist', async () => {
    const scope = nock('https://api.github.com')
      .get('/repos/jnv/this-does-not-exist')
      .reply(
        404,
        {
          message: 'Not Found',
        },
        responseHeaders
      );
    const repoInfo = {
      type: 'github',
      name: 'this-does-not-exist',
      author: 'jnv',
      url: 'https://github.com/jnv/this-does-not-exist',
    };
    await assert.rejects(
      fetchRemoteRepo(repoInfo),
      new Error("GitHub repository 'jnv/this-does-not-exist' not found")
    );
  });
});
