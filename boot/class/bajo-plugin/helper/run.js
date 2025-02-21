import lodash from 'lodash'
const { camelCase, map } = lodash

async function run () {
  const me = this
  const { runHook, eachPlugins, join } = me.bajo
  const methods = ['init']
  if (!me.bajo.applet) methods.push('start')
  for (const method of methods) {
    await runHook(`bajo:${camelCase(`before ${method} all plugins`)}`)
    await eachPlugins(async function ({ ns }) {
      await runHook(`${ns}:${camelCase(`before ${method}`)}`)
      await me[ns][method]()
      await runHook(`${ns}:${camelCase(`after ${method}`)}`)
    })
    await runHook(`bajo:${camelCase(`after ${method} all plugins`)}`)
  }
  me.bajo.log.debug('loadedPlugins%s', join(map(me.bajo.pluginPkgs, b => camelCase(b))))
}

export default run
