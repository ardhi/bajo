import { map, uniq, isArray, each } from 'lodash-es'

async function buildCollections ({ name, handler, dupChecks, container = 'connections' } = {}) {
  const { getConfig, getPluginName, fatal } = this.bajo.helper
  if (!name) name = getPluginName(4)
  const options = getConfig(name, { full: true })
  if (!options[container]) return []
  if (!isArray(options[container])) options[container] = [options[container]]
  for (const index in options[container]) {
    const item = options[container][index]
    const result = await handler.call(this, { item, index, options })
    if (result) options[container][index] = result
  }
  // check for duplicity
  each(dupChecks, item => {
    const items = map(options[container], item)
    const uItems = uniq(items)
    if (items.length !== uItems.length) fatal('One or more %s shared the same \'%s\'', container, item, { code: 'BAJOMQTT_CONNECTION_NOT_UNIQUE' })
  })
  return options[container]
}

export default buildCollections
