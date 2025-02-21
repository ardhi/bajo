import lodash from 'lodash'

const { camelCase } = lodash

async function buildConfig () {
  this.bajo.log.debug('readConfigs')
  for (const pkg of this.bajo.pluginPkgs) {
    const plugin = this[camelCase(pkg)]
    await plugin.loadConfig()
    plugin.initPrint()
    plugin.initLog()
  }
}

export default buildConfig
