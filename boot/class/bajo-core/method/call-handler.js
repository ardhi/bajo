import { isString, isFunction, isPlainObject } from 'lodash-es'
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
    const method = bajo.getMethod(item)
    if (method) result = await method(...args)
    // else if (item.startsWith('tool:') && bajo.applets.length > 0) {}
  } else if (isFunction(item)) {
    result = await item.call(scope, ...args)
  } else if (isPlainObject(item) && item.handler) {
    result = await item.handler.call(scope, ...args)
  }
  return result
}

export default callHandler
