import {} from 'lodash-es'

async function collectExitHandlers () {
  const { importModule, eachPlugins, print, join } = this.bajo
  if (!this.bajo.config.exitHandler) return
  this.bajo.exitHandler = this.bajo.exitHandler ?? {}
  const names = []
  await eachPlugins(async function ({ ns, dir }) {
    const mod = await importModule(`${dir}/bajo/exit.js`)
    if (!mod) return undefined
    this.app.bajo.exitHandler[ns] = mod
    names.push(ns)
  })
  this.bajo.log.trace('Exit handlers: %s', names.length === 0 ? print.__('none') : join(names))
}

export default collectExitHandlers
