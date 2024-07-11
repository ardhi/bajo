import { isString, isFunction } from 'lodash-es'
import getMethod from './get-method.js'

export default async function (nameOrFn, ...args) {
  let result
  if (isString(nameOrFn)) {
    const helper = getMethod.call(this.app.bajo, nameOrFn)
    if (isFunction(helper)) result = await helper(...args)
  } else if (isFunction(nameOrFn)) {
    result = await nameOrFn(...args)
  }
  return result
}
