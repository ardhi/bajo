import {} from 'lodash-es'

async function collectExitHandlers () {
  const { importModule, eachPlugins, print, join } = this.bajo.helper
  if (!this.bajo.config.exitHandler) return
  this.bajo.exitHandler = this.bajo.exitHandler ?? {}
  const names = []
  await eachPlugins(async function ({ plugin, dir }) {
    const mod = await importModule(`${dir}/bajo/exit.js`)
    if (!mod) return undefined
    this.bajo.exitHandler[plugin] = mod
    names.push(plugin)
  })
  this.bajo.log.trace('Exit handlers: %s', names.length === 0 ? print.__('none') : join(names))
}

export default collectExitHandlers
