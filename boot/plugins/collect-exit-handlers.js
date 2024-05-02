import {} from 'lodash-es'

async function collectExitHandlers () {
  const { importModule, log, eachPlugins, getConfig, print, join } = this.bajo.helper
  const config = getConfig()
  if (!config.exitHandler) return
  this.bajo.exitHandler = this.bajo.exitHandler ?? {}
  const names = []
  await eachPlugins(async function ({ plugin, dir }) {
    const mod = await importModule(`${dir}/bajo/exit.js`)
    if (!mod) return undefined
    this.bajo.exitHandler[plugin] = mod
    names.push(plugin)
  })
  log.trace('Exit handlers: %s', names.length === 0 ? print.__('none') : join(names))
}

export default collectExitHandlers
