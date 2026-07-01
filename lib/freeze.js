import _ from 'lodash'
const { cloneDeep } = _

/**
 * Freeze object.
 *
 * @method
 * @memberof module:Lib
 * @param {Object} obj Object to freeze.
 * @param {boolean} [shallow=false] If ```false``` (default), deep freeze object.
 */
function freeze (obj, options = {}) {
  const { shallow = false, clone = false } = options
  if (shallow) Object.freeze(obj)
  else deepFreeze(obj, clone)
}

// take from https://github.com/3imed-jaberi/deepfreeze/blob/master/index.js
function deepFreeze (object, clone = false) {
  function _deepFreeze (_object) {
    if (Object.isFrozen(_object)) return _object
    if (_object instanceof Map) {
      _object.set = _object.clear = _object.delete = function () {
        throw new Error('Map is read-only')
      }
      return _object
    }
    if (_object instanceof Set) {
      _object.add = _object.clear = _object.delete = function () {
        throw new Error('Set is read-only')
      }
      return _object
    }

    Object.freeze(_object)
    Object.getOwnPropertyNames(_object).forEach(function (key) {
      if (Object.hasOwn(_object, key) && _object[key] !== null &&
        (typeof _object[key] === 'object' || typeof _object[key] === 'function') &&
        !Object.isFrozen(_object[key])
      ) _deepFreeze(_object[key])
    })

    return _object
  }

  if (!Object.isFrozen(object)) Object.defineProperty(object, 'isDeepFrozen', { value: () => true })
  object = clone ? cloneDeep(object) : object
  return _deepFreeze(object)
}

export default freeze
