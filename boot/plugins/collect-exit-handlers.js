import _ from 'lodash'
import fs from 'fs-extra'

async function collectExitHandlers () {
  const { importModule, log, eachPlugins, getConfig } = this.bajo.helper
  const config = getConfig()
  if (!config.exitHandler) return
  this.bajo.exitHandler = this.bajo.exitHandler || {}
  const names = []
  await eachPlugins(async function ({ name, dir }) {
    const file = `${dir}/bajo/exit.js`
    if (!fs.existsSync(file)) return undefined
    try {
      let mod = await importModule(file)
      this.bajo.exitHandler[name] = mod
      names.push(name)
    } catch (err) {
    }
  })
  log.trace('Exit handlers: %s', names.length === 0 ? 'none' : names.join(', '))
}

export default collectExitHandlers