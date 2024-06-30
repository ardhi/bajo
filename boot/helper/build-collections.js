import { filter, isArray, each, pullAt, camelCase, has, find, set, get, cloneDeep } from 'lodash-es'

async function buildCollections (options = {}) {
  const { getConfig, getPluginName, fatal, runHook, error, join } = this.bajo.helper
  let { plugin, handler, dupChecks = [], container = 'connections', useDefaultName } = options
  useDefaultName = useDefaultName ?? true
  if (!plugin) plugin = getPluginName(4)
  const config = getConfig()
  const cfg = getConfig(plugin, { full: true })
  let data = get(cfg, container)
  if (!data) return []
  if (!isArray(data)) data = [data]
  await runHook(`${plugin}:${camelCase(`before build ${container}`)}`)
  const deleted = []
  for (const index in data) {
    const item = data[index]
    if (config.tool && item.skipOnTool) continue
    if (useDefaultName) {
      if (!has(item, 'name')) {
        if (find(data, { name: 'default' })) throw error('Collection \'default\' already exists')
        else item.name = 'default'
      }
    }
    const result = await handler.call(this, { item, index, cfg })
    if (result) data[index] = result
    else if (result === false) deleted.push(index)
    if (config.tool && item.skipOnTool && !deleted.includes(index)) deleted.push(index)
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
  await runHook(`${plugin}:${camelCase(`after build ${container}`)}`)
  set(cfg, container, data)
  return cloneDeep(data)
}

export default buildCollections
