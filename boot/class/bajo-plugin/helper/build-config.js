import { camelCase } from 'lodash-es'

async function buildConfig () {
  this.bajo.log.debug('Read configurations')
  for (const pkg of this.bajo.pluginPkgs) {
    await this[camelCase(pkg)].readConfig()
  }
}

export default buildConfig
