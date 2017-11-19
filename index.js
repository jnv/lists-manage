// Based on https://github.com/sindresorhus/awesome-electron/blob/npm-module/build.js
const fs = require('fs')
const readline = require('readline')

const patternHeader = /^##/
const patternItemMatch = /^\* \[/
const patternSubitem = /^\s+(.*)/

const patternItemLine = /^\* \[(.*)\]\((\S*)\)(.*)$/
// ^\* \[(.*)\]\((\S*)\)( by (\S+))?\s*[-–—](.*)
function parseItem(line) {
  const parts = line.match(patternItemLine)

  const fullName = parts[1]
  const url = parts[2]
  const desc = parts[3]
}


function Item(line) {
  return {
    id: itemSortKey(line),
    line,
    extras: []
  }
}

function ItemsStore() {
  const categories = new Map()

  function getCategory(cat) {
    if (categories.has(cat)) {
      return categories.get(cat)
    }
    console.log(cat)
    const newCat = new Map()
    categories.set(cat, newCat)
    return newCat
  }

  return {
    addItem(category, item) {
      getCategory(category).set(item.id, item)
    },
    dump() {
      categories.forEach((items, cat) => {
        console.log(cat)
        items.forEach((item, key) => {
          console.log(key)
        })
      })
    },
  }

}

const items = ItemsStore()
let currentCategory
let lastItem


readline.createInterface({
  input: fs.createReadStream('README.md', 'utf8')
})
.on('line', line => {
  if(line.match(patternHeader)) {
    currentCategory = line
    lastItem = null
    return
  }

  if(lastItem && line.match(patternSubitem)) {
    lastItem.extras.push(line)
    return
  }

  if(line.match(patternItem) && currentCategory) {
    lastItem = Item(line)
    items.addItem(currentCategory, lastItem)
    return
  }

})
.on('close', () => {
  items.dump()
})
