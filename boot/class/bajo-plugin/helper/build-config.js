import { camelCase } from 'lodash-es'

async function buildConfig () {
  this.bajo.log.debug('Read configurations')
  for (const pkg of this.bajo.pluginPkgs) {
    await this[camelCase(pkg)].loadConfig()
  }
}

export default buildConfig
