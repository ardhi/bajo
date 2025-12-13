import deepFreezeStrict from 'deep-freeze-strict'

/**
 * Freeze object
 *
 * @method
 * @memberof module:Lib
 * @param {Object} obj - Object to freeze
 * @param {boolean} [shallow=false] - If ```false``` (default), deep freeze object
 */
function freeze (obj, shallow = false) {
  if (shallow) Object.freeze(obj)
  else deepFreezeStrict(obj)
}

export default freeze
