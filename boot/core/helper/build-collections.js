import { filter, isArray, each, pullAt, camelCase, has, find, set, get, cloneDeep } from 'lodash-es'

async function buildCollections (options = {}) {
  const { fatal, runHook, error, join } = this.app.bajo.helper
  let { ns, handler, dupChecks = [], container = 'connections', useDefaultName } = options
  useDefaultName = useDefaultName ?? true
  if (!ns) ns = this.name
  const cfg = this.app[ns].config
  let data = get(cfg, container)
  if (!data) return []
  if (!isArray(data)) data = [data]
  await runHook(`${ns}:${camelCase(`before build ${container}`)}`)
  const deleted = []
  for (const index in data) {
    const item = data[index]
    if (useDefaultName) {
      if (!has(item, 'name')) {
        if (find(data, { name: 'default' })) throw error('Collection \'default\' already exists')
        else item.name = 'default'
      }
    }
    const result = await handler.call(this.app[ns], { item, index, cfg })
    this.app[ns].log.trace('Build \'%s\' collections', container)
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
  return cloneDeep(data)
}

export default buildCollections
