import { isString, isFunction } from 'lodash-es'
import getHelper from './get-helper.js'

async function callHelperOrHandler (nameOrFn, ...args) {
  let result
  if (isString(nameOrFn)) {
    const helper = getHelper.call(nameOrFn, false)
    if (isFunction(helper)) result = await helper(...args)
  } else if (isFunction(nameOrFn)) {
    result = await nameOrFn.call(this, ...args)
  }
  return result
}

export default callHelperOrHandler
