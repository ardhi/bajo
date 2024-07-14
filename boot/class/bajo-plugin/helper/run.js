import { camelCase, map } from 'lodash-es'

async function run () {
  const me = this
  const { runHook, eachPlugins, join } = me.bajo
  const methods = ['init']
  if (!me.bajo.toolMode) methods.push('start')
  for (const method of methods) {
    await runHook(`bajo:${camelCase(`before ${method} all plugins`)}`)
    await eachPlugins(async function ({ ns }) {
      await me[ns][method]()
    })
    await runHook(`bajo:${camelCase(`after ${method} all plugins`)}`)
  }
  me.bajo.log.debug('Loaded plugins: %s', join(map(me.bajo.config.plugins, b => camelCase(b))))
}

export default run
