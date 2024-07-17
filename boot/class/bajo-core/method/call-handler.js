import { isString, isFunction, isPlainObject, find } from 'lodash-es'
import BajoPlugin from '../../bajo-plugin.js'

async function callHandler (item, ...args) {
  let result
  let scope = this
  if (item instanceof BajoPlugin) {
    scope = item
    item = args.shift()
  }
  const bajo = scope.app.bajo
  if (isString(item)) {
    if (item.startsWith('applet:') && bajo.applets.length > 0) {
      const [, ns, path] = item.split(':')
      const applet = find(bajo.applets, a => (a.ns === ns || a.alias === ns))
      if (applet) result = await bajo.runApplet(applet, path, ...args)
    } else {
      const method = bajo.getMethod(item)
      if (method) result = await method(...args)
    }
  } else if (isFunction(item)) {
    result = await item.call(scope, ...args)
  } else if (isPlainObject(item) && item.handler) {
    result = await item.handler.call(scope, ...args)
  }
  return result
}

export default callHandler
