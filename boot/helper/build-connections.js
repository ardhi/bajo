import { map, uniq, isArray, each } from 'lodash-es'

async function buildConnections (name, handler, dupChecks) {
  const { getConfig } = this.bajo.helper
  const config = getConfig(name)
  if (!config.connections) return
  if (!isArray(config.connections)) config.connections = [config.connections]
  for (let c of config.connections) {
    await handler.call(this, c, config)
  }
  // check for duplicity
  each(dupChecks, item => {
    const items = map(config.connections, item)
    const uItems = uniq(items)
    if (items.length !== uItems.length) throw error(`One or more connections shared the same '%s'`, item, { code: 'BAJOMQTT_CONNECTION_NOT_UNIQUE' })
  })
}

export default buildConnections
