import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeDesc } from '../normalize.ts';

describe('.normalizeDesc', () => {
  const cases = [
    [
      'A curated list of awesome activeadmin resources, extensions, posts and utilities.',
      'Activeadmin resources, extensions, posts and utilities.',
    ],
    [
      'Awesome list of ActivityPub based projects',
      'ActivityPub based projects',
    ],
    ['收集Android studio 常用的插件', '收集Android studio 常用的插件'],
    [
      ':octocat: A great list of open sourced UI Motion Library produced by Animatious Group.',
      'Open sourced UI Motion Library produced by Animatious Group.',
    ],
    [
      'A curated list of amazingly awesome Hadoop and Hadoop ecosystem resources',
      'Hadoop and Hadoop ecosystem resources',
    ],
    [
      'A collection of modules, tools and resources for play1',
      'Modules, tools and resources for play1',
    ],
    [
      'A curation of awesome PureScript libraries, resources and shiny things.',
      'PureScript libraries, resources and shiny things.',
    ],
    [
      'A curated list of amazingly awesome open source rails related resources inspired by Awesome PHP.',
      'Open source rails related resources',
    ],
  ];
  cases.forEach(([input, expected]) => {
    it(`${input} -> ${expected}`, () => {
      assert.strictEqual(normalizeDesc(input), expected);
    });
  });
});
