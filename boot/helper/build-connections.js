import { map, uniq, isArray, each } from 'lodash-es'
import fatal from './fatal.js'

async function buildConnections (name, handler, dupChecks) {
  const { getConfig } = this.bajo.helper
  const config = getConfig(name, { full: true })
  if (!config.connections) return []
  if (!isArray(config.connections)) config.connections = [config.connections]
  for (const c of config.connections) {
    await handler.call(this, c, config)
  }
  // check for duplicity
  each(dupChecks, item => {
    const items = map(config.connections, item)
    const uItems = uniq(items)
    if (items.length !== uItems.length) fatal('One or more connections shared the same \'%s\'', item, { code: 'BAJOMQTT_CONNECTION_NOT_UNIQUE' })
  })
  return config.connections
}

export default buildConnections
