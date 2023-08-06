import { filter, isArray, each, pullAt, camelCase } from 'lodash-es'

async function buildCollections ({ name, handler, dupChecks, container = 'connections' } = {}) {
  const { getConfig, getPluginName, fatal, runHook } = this.bajo.helper
  if (!name) name = getPluginName(4)
  const options = getConfig(name, { full: true })
  if (!options[container]) return []
  if (!isArray(options[container])) options[container] = [options[container]]
  options[container] = options[container] || []
  await runHook(`${name}:${camelCase(`before build ${container}`)}`)
  const deleted = []
  for (const index in options[container]) {
    const item = options[container][index]
    const result = await handler.call(this, { item, index, options })
    if (result) options[container][index] = result
    else if (result === false) deleted.push(index)
  }
  if (deleted.length > 0) pullAt(options[container], deleted)

  // check for duplicity
  each(options[container], c => {
    const checker = {}
    each(dupChecks, d => {
      checker[d] = c[d]
    })
    const match = filter(options[container], checker)
    if (match.length > 1) fatal('One or more %s shared the same \'%s\'', container, dupChecks.join(', '), { code: 'BAJOMQTT_CONNECTION_NOT_UNIQUE' })
  })
  /*
  each(dupChecks, item => {
    const items = map(options[container], item)
    const uItems = uniq(items)
    if (items.length !== uItems.length) fatal('One or more %s shared the same \'%s\'', container, item, { code: 'BAJOMQTT_CONNECTION_NOT_UNIQUE' })
  })
  */
  await runHook(`${name}:${camelCase(`after build ${container}`)}`)
  return options[container]
}

export default buildCollections
