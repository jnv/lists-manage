import { updateItem } from '../listItem'
describe('.updateItem', () => {
  it('changes item name when URL is updated', () => {
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
    expect(updateItem(input, updatedProps)).toEqual(expected)
  })
})
