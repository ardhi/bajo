import { filter, isEmpty, orderBy } from 'lodash-es'

/**
 * @module helper/runHook
 */

/**
 * Set hook defined by parameter ```hookName```. Hook name should be in this following format:
 * ```<namespace>:<identifier>``` - where namespace is a valid Bajo name and
 * identifier is a unique string set by Bajo developer to identify a hook inside a Bajo
 *
 * @instance
 * @async
 * @param {string} hookName - Hook's name
 *
 * @example
 * const { runHook } = this.bajo.helper
 * await runHook('myBajo:afterStartApp')
 */

async function runHook (hookName, ...args) {
  const { log, getConfig } = this.bajo.helper
  const config = getConfig()
  const [ns, path] = (hookName || '').split(':')
  let fns = filter(this.bajo.hooks, { ns, path })
  if (isEmpty(fns)) return
  const id = `hook:${ns}:${path}`
  fns = orderBy(fns, ['level'])
  for (const fn of fns) {
    if (config.log.report.includes(id)) {
      log.trace({ args }, 'Call hook \'%s\'', id)
    }
    await fn.handler.call(this, ...args)
  }
}

export default runHook
