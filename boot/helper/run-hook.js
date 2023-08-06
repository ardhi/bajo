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
  const { log } = this.bajo.helper
  log.trace('Run hook: %s', hookName)
  const [ns, path] = (hookName || '').split(':')
  let fns = filter(this.bajo.hooks, { ns, path })
  if (isEmpty(fns)) return
  fns = orderBy(fns, ['level'])
  const results = []
  for (const i in fns) {
    const fn = fns[i]
    /*
    if (config.log.report.includes(id)) {
      log.trace({ args }, 'Call hook: %s', id)
    }
    */
    const res = await fn.handler.call(this, ...args)
    results.push({
      hook: hookName,
      tag: fn.tag,
      resp: res
    })
  }
  return results
}

export default runHook
