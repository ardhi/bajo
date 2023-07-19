import {} from 'lodash-es'
import fs from 'fs-extra'

async function collectExitHandlers () {
  const { importModule, log, eachPlugins, getConfig, print } = this.bajo.helper
  const config = getConfig()
  if (!config.exitHandler) return
  this.bajo.exitHandler = this.bajo.exitHandler || {}
  const names = []
  await eachPlugins(async function ({ plugin, dir }) {
    const file = `${dir}/bajo/exit.js`
    if (!fs.existsSync(file)) return undefined
    try {
      const mod = await importModule(file)
      this.bajo.exitHandler[plugin] = mod
      names.push(plugin)
    } catch (err) {
    }
  })
  log.trace('Exit handlers: %s', names.length === 0 ? print.__('none') : names.join(', '))
}

export default collectExitHandlers
