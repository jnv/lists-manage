import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { fetchRepoDetails, checkRepo } from '../index.ts';
import nock from 'nock';

before(() => {
  nock.disableNetConnect();
});

after(() => {
  nock.enableNetConnect();
});

describe('repo', () => {
  it('.fetchRepoDetails', async () => {
    assert.deepStrictEqual(await fetchRepoDetails('https://gitlab.com/rosarior/django-must-watch'), {
      url: 'https://gitlab.com/rosarior/django-must-watch',
      type: 'gitlab',
      name: 'django-must-watch',
      author: 'rosarior',
      homepage: '',
      desc: '',
    });
  });

  it('.checkRepo', async () => {
    assert.deepStrictEqual(await checkRepo('#lists-of-lists'), {
      url: '#lists-of-lists',
      exists: true,
      redirect: false,
    });
  });
});
