import _ from 'lodash'

async function buildConnections (name, handler, dupChecks) {
  const { getConfig } = this.bajo.helper
  const config = getConfig(name)
  if (!config.connections) return
  if (!_.isArray(config.connections)) config.connections = [config.connections]
  for (let c of config.connections) {
    await handler.call(this, c, config)
  }
  // check for duplicity
  _.each(dupChecks, item => {
    const items = _.map(config.connections, item)
    const uItems = _.uniq(items)
    if (items.length !== uItems.length) throw error(`One or more connections shared the same '%s'`, item, { code: 'BAJOMQTT_CONNECTION_NOT_UNIQUE' })
  })
}

export default buildConnections
