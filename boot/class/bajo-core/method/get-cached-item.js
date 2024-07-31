import crypto from 'crypto'
import { find, findIndex, pullAt } from 'lodash-es'

async function getCachedItem ({ store, content, handler, handlerOpts = {}, maxAge = 300 } = {}) {
  const item = handler ? (await handler(content, handlerOpts)) : content

  const id = crypto.createHash('md5').update(content).digest('hex')
  let storeItem = find(store, { id })
  if (storeItem && Date.now() > (storeItem.ts + (maxAge * 1000))) {
    const idx = findIndex(store, { id: storeItem.id })
    pullAt(store, idx)
    storeItem = undefined
  }
  if (!storeItem) {
    storeItem = {
      ts: Date.now(),
      item
    }
    store.push(storeItem)
  }
  return storeItem
}

export default getCachedItem
