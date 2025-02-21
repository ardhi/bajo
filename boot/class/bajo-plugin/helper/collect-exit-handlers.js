async function collectExitHandlers () {
  const { importModule, eachPlugins, print, join } = this.bajo
  if (!this.bajo.config.exitHandler) return
  const nss = []
  await eachPlugins(async function ({ ns, dir }) {
    const mod = await importModule(`${dir}/bajo/exit.js`)
    if (!mod) return undefined
    this.app[ns].exitHandler = mod
    nss.push(ns)
  })
  this.bajo.log.trace('exitHandlers%s', nss.length === 0 ? print.write('none') : join(nss))
}

export default collectExitHandlers
