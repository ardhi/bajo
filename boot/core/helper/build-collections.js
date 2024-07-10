import { filter, isArray, each, pullAt, camelCase, has, find, set, get, cloneDeep, upperFirst } from 'lodash-es'
import pluralize from 'pluralize'

async function buildCollections (options = {}) {
  const { fatal, runHook, error, join } = this.app.bajo.helper
  let { ns, handler, dupChecks = [], container = 'connections', useDefaultName } = options
  useDefaultName = useDefaultName ?? true
  if (!ns) ns = this.name
  const cfg = this.app[ns].config
  let items = cloneDeep(get(cfg, container))
  if (!items) return []
  if (!isArray(items)) items = [items]
  this.app[ns].log.trace('Collecting %s...', container)
  await runHook(`${ns}:${camelCase(`before build ${container}`)}`)
  const deleted = []
  const data = []
  for (const index in items) {
    const item = items[index]
    if (useDefaultName) {
      if (!has(item, 'name')) {
        if (find(data, { name: 'default' })) throw error('Collection \'default\' already exists')
        else item.name = 'default'
      }
    }
    this.app[ns].log.trace(`- Collect ${pluralize.singular(container)}: '%s'`, item.name)
    const result = await handler.call(this.app[ns], { item, index, cfg })
    if (result) data[index] = result
    else if (result === false) deleted.push(index)
    if (this.app.bajo.config.tool && item.skipOnTool && !deleted.includes(index)) deleted.push(index)
    data.push(item)
  }
  if (deleted.length > 0) pullAt(data, deleted)

  // check for duplicity
  each(data, c => {
    each(dupChecks, d => {
      const checker = set({}, d, c[d])
      const match = filter(data, checker)
      if (match.length > 1) fatal('One or more %s shared the same \'%s\'', container, join(dupChecks))
    })
  })
  await runHook(`${ns}:${camelCase(`after build ${container}`)}`)
  this.app[ns].log.debug(`${upperFirst(container)} collected: %d`, data.length)
  return cloneDeep(data)
}

export default buildCollections
