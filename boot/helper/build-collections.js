import { filter, isArray, each, pullAt, camelCase } from 'lodash-es'

async function buildCollections (options = {}) {
  const { getConfig, getPluginName, fatal, runHook } = this.bajo.helper
  let { plugin, handler, dupChecks = [], container = 'connections' } = options
  if (!plugin) plugin = getPluginName(4)
  const cfg = getConfig(plugin, { full: true })
  if (!cfg[container]) return []
  if (!isArray(cfg[container])) cfg[container] = [cfg[container]]
  cfg[container] = cfg[container] ?? []
  await runHook(`${plugin}:${camelCase(`before build ${container}`)}`)
  const deleted = []
  for (const index in cfg[container]) {
    const item = cfg[container][index]
    const result = await handler.call(this, { item, index, cfg })
    if (result) cfg[container][index] = result
    else if (result === false) deleted.push(index)
  }
  if (deleted.length > 0) pullAt(cfg[container], deleted)

  // check for duplicity
  each(cfg[container], c => {
    const checker = {}
    each(dupChecks, d => {
      checker[d] = c[d]
    })
    const match = filter(cfg[container], checker)
    if (match.length > 1) fatal('One or more %s shared the same \'%s\'', container, dupChecks.join(', '), { code: 'BAJOMQTT_CONNECTION_NOT_UNIQUE' })
  })
  await runHook(`${plugin}:${camelCase(`after build ${container}`)}`)
  return cfg[container]
}

export default buildCollections
