import test from 'node:test';
import assert from 'node:assert';
import { updateItem } from '../listItem.ts';
test('.updateItem', () => {
  test('changes item name when URL is updated', () => {
    const updatedProps = {
      url: 'https://github.com/RichardLitt/low-resource-languages',
    }
    const input = {
      url: 'https://github.com/RichardLitt/endangered-languages',
      name: 'endangered-languages',
      author: 'RichardLitt',
    }
    const expected = {
      url: updatedProps.url,
      name: 'low-resource-languages',
      author: '',
    }
    assert.deepStrictEqual(updateItem(input, updatedProps), expected)
  })
})
