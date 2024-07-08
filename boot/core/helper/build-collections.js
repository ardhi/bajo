import { filter, isArray, each, pullAt, camelCase, has, find, set, get, cloneDeep, upperFirst } from 'lodash-es'
import pluralize from 'pluralize'

async function buildCollections (options = {}) {
  const { fatal, runHook, error, join } = this.app.bajo.helper
  let { ns, handler, dupChecks = [], container = 'connections', useDefaultName } = options
  useDefaultName = useDefaultName ?? true
  if (!ns) ns = this.name
  const cfg = this.app[ns].config
  let data = get(cfg, container)
  if (!data) return []
  if (!isArray(data)) data = [data]
  this.app[ns].log.trace('Collecting %s...', container)
  await runHook(`${ns}:${camelCase(`before build ${container}`)}`)
  const deleted = []
  for (const index in data) {
    const item = cloneDeep(data[index])
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
  set(cfg, container, data)
  this.app[ns].log.debug(`${upperFirst(container)} collected: %d`, data.length)
  return cloneDeep(data)
}

export default buildCollections
