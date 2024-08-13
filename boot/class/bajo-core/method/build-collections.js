import { filter, isArray, pullAt, camelCase, has, find, set, get, isFunction } from 'lodash-es'

async function buildCollections (options = {}) {
  const { runHook, join } = this.app.bajo
  let { ns, handler, dupChecks = [], container = 'connections', useDefaultName } = options
  useDefaultName = useDefaultName ?? true
  if (!ns) ns = this.name
  const cfg = this.app[ns].getConfig()
  let items = get(cfg, container, [])
  if (!isArray(items)) items = [items]
  this.app[ns].log.trace('Collecting %s', this.app[ns].print.write(container))
  await runHook(`${ns}:${camelCase('beforeBuildCollection')}`, container)
  const deleted = []
  for (const index in items) {
    const item = items[index]
    if (useDefaultName) {
      if (!has(item, 'name')) {
        if (find(items, { name: 'default' })) throw this.app[ns].error('Collection \'default\' already exists')
        else item.name = 'default'
      }
    }
    this.app[ns].log.trace('- %s', item.name)
    const result = await handler.call(this.app[ns], { item, index, cfg })
    if (result) items[index] = result
    else if (result === false) deleted.push(index)
    if (this.app.bajo.applet && item.skipOnTool && !deleted.includes(index)) deleted.push(index)
  }
  if (deleted.length > 0) pullAt(items, deleted)

  // check for duplicity
  for (const c of items) {
    for (const d of dupChecks) {
      if (isFunction(d)) await d.call(this.app[ns], c, items)
      else {
        const checker = set({}, d, c[d])
        const match = filter(items, checker)
        if (match.length > 1) this.app[ns].fatal('One or more %s shared the same \'%s\'', container, join(dupChecks.filter(i => !isFunction(i))))
      }
    }
  }
  await runHook(`${ns}:${camelCase('afterBuildCollection')}`, container)
  this.app[ns].log.debug('%s collected: %d', this.app[ns].print.write(container), items.length)
  return items
}

export default buildCollections
