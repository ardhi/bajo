async function buildModuleCollector (file) {
  const { _, importModule } = this.bajo.helper
  let mod = await importModule(file)
  if (_.isFunction(mod)) mod = { level: 999, handler: mod }
  if (!_.isPlainObject(mod)) return
  if (mod.handler.constructor.name !== 'AsyncFunction') {
    const oldHandler = mod.handler
    mod.handler = async function (...args) {
      oldHandler.call(this, ...args)
    }
  }
  return mod
}

export default buildModuleCollector